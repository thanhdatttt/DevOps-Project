#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="staging"
CONTAINER="curl"
CONNECT_TIMEOUT_SECONDS="${CONNECT_TIMEOUT_SECONDS:-3}"
MAX_TIME_SECONDS="${MAX_TIME_SECONDS:-10}"

# Counts a curl as successful when the request gets an HTTP response below 500
# that is not an Istio AuthorizationPolicy RBAC denial. This keeps app-level
# 401/404 responses visible as successful mesh reachability, matching the
# service-mesh README expectation that reachable services may return different
# app statuses.

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required command '$1' was not found" >&2
    exit 1
  fi
}

get_mesh_curl_pod() {
  local app_name="$1"
  local selector="app.kubernetes.io/name=${app_name}"

  kubectl wait --for=condition=Ready pod -n "$NAMESPACE" -l "$selector" --timeout=120s >/dev/null
  kubectl get pod -n "$NAMESPACE" -l "$selector" \
    -o jsonpath='{.items[0].metadata.name}'
}

load_service_targets() {
  kubectl get svc -n "$NAMESPACE" \
    -o jsonpath='{range .items[*]}{.metadata.name}{"|"}{range .spec.ports[*]}{.port}{","}{end}{"\n"}{end}' \
    | sed '/^|/d' \
    | awk -F'|' '$1 !~ /gateway/' \
    | sort
}

run_one_curl() {
  local pod_name="$1"
  local service_name="$2"
  local service_port="$3"
  local url="http://${service_name}.${NAMESPACE}.svc.cluster.local:${service_port}/"
  local result status classification detail

  if ! result=$(kubectl exec -n "$NAMESPACE" "$pod_name" -c "$CONTAINER" -- sh -c '
body_file="$(mktemp)"
err_file="$(mktemp)"
status="$(curl -sS -o "$body_file" -w "%{http_code}" --connect-timeout "$1" --max-time "$2" "$3" 2>"$err_file" || true)"

if [ "$status" = "000" ]; then
  detail="$(tr "\n" " " < "$err_file" | sed "s/[[:space:]][[:space:]]*/ /g" | cut -c1-160)"
  printf "000|curl-error|%s\n" "$detail"
elif grep -qi "RBAC: access denied" "$body_file"; then
  printf "%s|rbac-denied|RBAC: access denied\n" "$status"
elif [ "$status" -ge 500 ] 2>/dev/null; then
  printf "%s|server-error|HTTP 5xx response\n" "$status"
else
  printf "%s|ok|http-response\n" "$status"
fi

rm -f "$body_file" "$err_file"
' sh "$CONNECT_TIMEOUT_SECONDS" "$MAX_TIME_SECONDS" "$url"); then
    result="000|kubectl-error|kubectl exec failed"
  fi

  IFS='|' read -r status classification detail <<<"$result"

  if [[ "$classification" == "ok" ]]; then
    printf '  OK   %-42s HTTP %s (%s)\n' "${service_name}:${service_port}" "$status" "$detail"
    return 0
  fi

  printf '  FAIL %-42s HTTP %s (%s)\n' "${service_name}:${service_port}" "$status" "$detail"
  return 1
}

run_from_mesh_pod() {
  local app_name="$1"
  local pod_name="$2"
  local successes=0
  local total=0
  local target service_name ports port
  local -a port_list

  echo
  echo "== ${app_name} (${pod_name}) =="

  for target in "${SERVICE_TARGETS[@]}"; do
    service_name="${target%%|*}"
    ports="${target#*|}"
    ports="${ports%,}"

    IFS=',' read -r -a port_list <<<"$ports"
    for port in "${port_list[@]}"; do
      [[ -z "$port" ]] && continue
      total=$((total + 1))
      if run_one_curl "$pod_name" "$service_name" "$port"; then
        successes=$((successes + 1))
      fi
    done
  done

  printf 'Summary %s: %d successful curls out of %d total curls\n' "$app_name" "$successes" "$total"
  SUMMARY_LINES+=("${app_name}: ${successes}/${total}")
}

main() {
  require_command kubectl

  mapfile -t SERVICE_TARGETS < <(load_service_targets)
  if [[ "${#SERVICE_TARGETS[@]}" -eq 0 ]]; then
    echo "error: no Services found in namespace '${NAMESPACE}'" >&2
    exit 1
  fi

  local allowed_pod blocked_pod
  allowed_pod="$(get_mesh_curl_pod mesh-curl-allowed)"
  blocked_pod="$(get_mesh_curl_pod mesh-curl-blocked)"

  echo "Namespace: ${NAMESPACE}"
  echo "Curl targets: ${#SERVICE_TARGETS[@]} service(s); each exposed service port is tested"

  SUMMARY_LINES=()
  run_from_mesh_pod mesh-curl-allowed "$allowed_pod"
  run_from_mesh_pod mesh-curl-blocked "$blocked_pod"

  echo
  echo "== Final summary (${NAMESPACE}) =="
  printf '  %s\n' "${SUMMARY_LINES[@]}"
}

main "$@"
