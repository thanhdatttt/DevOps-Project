#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="dev"
REQUEST_PATH="${REQUEST_PATH:-/}"
STOREFRONT_APP="storefront-bff"
STOREFRONT_CONTAINER="storefront-bff"
BLOCKED_APP="mesh-curl-blocked"
BLOCKED_CONTAINER="curl"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-10}"
CONNECT_TIMEOUT_SECONDS="${CONNECT_TIMEOUT_SECONDS:-3}"
MAX_TIME_SECONDS="${MAX_TIME_SECONDS:-10}"

# Runs two service-mesh probes:
# 1. storefront-bff -> allowed storefront-facing services; any non-403 HTTP
#    response means the request reached the target through mesh policy.
# 2. mesh-curl-blocked -> every non-gateway Service; HTTP 403/RBAC denial is the
#    expected success condition for the blocked client.
# Gateway/backoffice/swagger-ui/self are skipped for the storefront-bff lane; gateway Services are skipped for the blocked lane because the namespace AuthorizationPolicies do not
# protect the ExternalName bridge workload.

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required command '$1' was not found" >&2
    exit 1
  fi
}

get_pod() {
  local app_name="$1"
  local selector="app.kubernetes.io/name=${app_name}"

  kubectl wait --for=condition=Ready pod -n "$NAMESPACE" -l "$selector" --timeout=120s >/dev/null
  kubectl get pod -n "$NAMESPACE" -l "$selector" \
    -o jsonpath='{.items[0].metadata.name}'
}

load_storefront_targets() {
  kubectl get svc -n "$NAMESPACE" \
    -o jsonpath='{range .items[*]}{.metadata.name}{"|"}{range .spec.ports[*]}{.port}{","}{end}{"\n"}{end}' \
    | sed '/^|/d' \
    | awk -F'|' '$1 !~ /gateway/ && $1 !~ /backoffice/ && $1 !~ /swagger-ui/ && $1 != "storefront-bff"' \
    | sort
}

load_blocked_targets() {
  kubectl get svc -n "$NAMESPACE" \
    -o jsonpath='{range .items[*]}{.metadata.name}{"|"}{range .spec.ports[*]}{.port}{","}{end}{"\n"}{end}' \
    | sed '/^|/d' \
    | awk -F'|' '$1 !~ /gateway/' \
    | sort
}

run_storefront_wget() {
  local pod_name="$1"
  local service_name="$2"
  local service_port="$3"
  local url="http://${service_name}.${NAMESPACE}.svc.cluster.local:${service_port}${REQUEST_PATH}"
  local result status classification detail

  if ! result=$(kubectl exec -n "$NAMESPACE" "$pod_name" -c "$STOREFRONT_CONTAINER" -- sh -c '
body_file="$(mktemp)"
err_file="$(mktemp)"
wget -S -O "$body_file" -T "$1" "$2" 2>"$err_file" >/dev/null || true
http_status="$(sed -n "s/^  HTTP\/[^ ]* \([0-9][0-9][0-9]\).*/\1/p" "$err_file" | tail -n 1)"

if [ -z "$http_status" ]; then
  detail="$(tr "\n" " " < "$err_file" | sed "s/[[:space:]][[:space:]]*/ /g" | cut -c1-160)"
  printf "000|wget-error|%s\n" "$detail"
elif [ "$http_status" = "403" ] || grep -qi "RBAC: access denied" "$body_file" "$err_file"; then
  printf "%s|forbidden|HTTP 403 or RBAC: access denied\n" "$http_status"
else
  printf "%s|ok|non-403-http-response\n" "$http_status"
fi

rm -f "$body_file" "$err_file"
' sh "$TIMEOUT_SECONDS" "$url"); then
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

run_blocked_curl() {
  local pod_name="$1"
  local service_name="$2"
  local service_port="$3"
  local url="http://${service_name}.${NAMESPACE}.svc.cluster.local:${service_port}${REQUEST_PATH}"
  local result status classification detail

  if ! result=$(kubectl exec -n "$NAMESPACE" "$pod_name" -c "$BLOCKED_CONTAINER" -- sh -c '
body_file="$(mktemp)"
err_file="$(mktemp)"
status="$(curl -sS -o "$body_file" -w "%{http_code}" --connect-timeout "$1" --max-time "$2" "$3" 2>"$err_file" || true)"

if [ "$status" = "000" ]; then
  detail="$(tr "\n" " " < "$err_file" | sed "s/[[:space:]][[:space:]]*/ /g" | cut -c1-160)"
  printf "000|curl-error|%s\n" "$detail"
elif [ "$status" = "403" ] || grep -qi "RBAC: access denied" "$body_file"; then
  printf "%s|ok|HTTP 403 or RBAC: access denied\n" "$status"
else
  printf "%s|unexpected-allow|expected HTTP 403/RBAC denial\n" "$status"
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

run_targets() {
  local label="$1"
  local pod_name="$2"
  local runner="$3"
  shift 3
  local targets=("$@")
  local successes=0
  local total=0
  local target service_name ports port
  local -a port_list

  echo
  echo "== ${label} (${pod_name}) =="

  for target in "${targets[@]}"; do
    service_name="${target%%|*}"
    ports="${target#*|}"
    ports="${ports%,}"

    IFS=',' read -r -a port_list <<<"$ports"
    for port in "${port_list[@]}"; do
      [[ -z "$port" ]] && continue
      total=$((total + 1))
      if "$runner" "$pod_name" "$service_name" "$port"; then
        successes=$((successes + 1))
      fi
    done
  done

  printf 'Summary %s: %d successful curls out of %d total curls\n' "$label" "$successes" "$total"
  SUMMARY_LINES+=("${label}: ${successes}/${total}")
}

main() {
  require_command kubectl

  mapfile -t STOREFRONT_TARGETS < <(load_storefront_targets)
  mapfile -t BLOCKED_TARGETS < <(load_blocked_targets)
  if [[ "${#STOREFRONT_TARGETS[@]}" -eq 0 || "${#BLOCKED_TARGETS[@]}" -eq 0 ]]; then
    echo "error: no eligible Services found in namespace '${NAMESPACE}'" >&2
    exit 1
  fi

  local storefront_pod blocked_pod
  storefront_pod="$(get_pod "$STOREFRONT_APP")"
  blocked_pod="$(get_pod "$BLOCKED_APP")"

  echo "Namespace: ${NAMESPACE}"
  echo "Request path: ${REQUEST_PATH}"
  echo "Storefront targets: ${#STOREFRONT_TARGETS[@]} service(s); gateway/backoffice/swagger-ui/self skipped"
  echo "Blocked targets: ${#BLOCKED_TARGETS[@]} service(s); gateway skipped"

  SUMMARY_LINES=()
  run_targets "$STOREFRONT_APP" "$storefront_pod" run_storefront_wget "${STOREFRONT_TARGETS[@]}"
  run_targets "$BLOCKED_APP" "$blocked_pod" run_blocked_curl "${BLOCKED_TARGETS[@]}"

  echo
  echo "== Final summary (${NAMESPACE}) =="
  printf '  %s\n' "${SUMMARY_LINES[@]}"
}

main "$@"
