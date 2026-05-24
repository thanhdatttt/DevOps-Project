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
RETRY_TEST_APP="${RETRY_TEST_APP:-mesh-retry-fault}"
RETRY_TEST_CONTAINER="${RETRY_TEST_CONTAINER:-server}"
RETRY_TEST_IMAGE="${RETRY_TEST_IMAGE:-python:3.12-alpine}"
RETRY_TEST_FAIL_FIRST="${RETRY_TEST_FAIL_FIRST:-1}"
RETRY_TEST_CLEANUP="${RETRY_TEST_CLEANUP:-true}"

# Runs three service-mesh probes:
# 1. storefront-bff -> allowed storefront-facing services; any non-403 HTTP
#    response means the request reached the target through mesh policy.
# 2. mesh-curl-blocked -> every non-gateway Service; HTTP 403/RBAC denial is the
#    expected success condition for the blocked client.
# 3. Retry behavior -> a temporary in-cluster fault target returns 503 for
#    the first request and 200 on retry; the caller should see final HTTP 200.
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

retry_fault_manifest() {
  cat <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${RETRY_TEST_APP}
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: ${RETRY_TEST_APP}
data:
  server.py: |
    import os
    from http.server import BaseHTTPRequestHandler, HTTPServer

    fail_first = int(os.environ.get("FAIL_FIRST", "1"))
    counts = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/healthz":
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"ok\n")
                return

            count = counts.get(self.path, 0) + 1
            counts[self.path] = count
            body = f"path={self.path} attempt={count} fail_first={fail_first}\n".encode()
            self.send_response(503 if count <= fail_first else 200)
            self.send_header("content-type", "text/plain")
            self.send_header("content-length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, fmt, *args):
            print(fmt % args, flush=True)

    HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${RETRY_TEST_APP}
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: ${RETRY_TEST_APP}
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: ${RETRY_TEST_APP}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${RETRY_TEST_APP}
    spec:
      containers:
        - name: ${RETRY_TEST_CONTAINER}
          image: ${RETRY_TEST_IMAGE}
          imagePullPolicy: IfNotPresent
          command: ["python", "/app/server.py"]
          env:
            - name: FAIL_FIRST
              value: "${RETRY_TEST_FAIL_FIRST}"
          ports:
            - containerPort: 8080
              name: http
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 1
            periodSeconds: 2
          volumeMounts:
            - name: server
              mountPath: /app
      volumes:
        - name: server
          configMap:
            name: ${RETRY_TEST_APP}
---
apiVersion: v1
kind: Service
metadata:
  name: ${RETRY_TEST_APP}
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: ${RETRY_TEST_APP}
spec:
  selector:
    app.kubernetes.io/name: ${RETRY_TEST_APP}
  ports:
    - name: http
      port: 80
      targetPort: 8080
---
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: allow-storefront-bff-to-${RETRY_TEST_APP}
  namespace: ${NAMESPACE}
spec:
  action: ALLOW
  selector:
    matchLabels:
      app.kubernetes.io/name: ${RETRY_TEST_APP}
  rules:
    - from:
        - source:
            principals:
              - cluster.local/ns/${NAMESPACE}/sa/${STOREFRONT_APP}
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: ${RETRY_TEST_APP}-istio-mutual
  namespace: ${NAMESPACE}
spec:
  host: ${RETRY_TEST_APP}.${NAMESPACE}.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
---
apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: ${RETRY_TEST_APP}-retry-on-5xx
  namespace: ${NAMESPACE}
spec:
  hosts:
    - ${RETRY_TEST_APP}.${NAMESPACE}.svc.cluster.local
  gateways:
    - mesh
  http:
    - timeout: 10s
      retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: 5xx,connect-failure,refused-stream,reset,gateway-error
      route:
        - destination:
            host: ${RETRY_TEST_APP}.${NAMESPACE}.svc.cluster.local
            port:
              number: 80
EOF
}

cleanup_retry_fault_injection() {
  if [[ "$RETRY_TEST_CLEANUP" == "true" ]]; then
    retry_fault_manifest | kubectl delete -f - --ignore-not-found=true >/dev/null 2>&1 || true
  fi
}

apply_retry_fault_injection() {
  echo
  echo "== retry-fault-injection setup (${NAMESPACE}) =="

  if ! retry_fault_manifest | kubectl apply -f - >/dev/null; then
    echo "  FAIL could not apply retry fault injection resources" >&2
    return 1
  fi

  if [[ "$RETRY_TEST_CLEANUP" == "true" ]]; then
    trap cleanup_retry_fault_injection EXIT
  fi

  if ! kubectl rollout status deployment/"$RETRY_TEST_APP" -n "$NAMESPACE" --timeout=120s >/dev/null; then
    echo "  FAIL ${RETRY_TEST_APP} deployment did not roll out" >&2
    return 1
  fi

  if ! kubectl wait --for=condition=Ready pod -n "$NAMESPACE" -l "app.kubernetes.io/name=${RETRY_TEST_APP}" --timeout=120s >/dev/null; then
    echo "  FAIL ${RETRY_TEST_APP} pod did not become Ready" >&2
    return 1
  fi

  echo "  OK   ${RETRY_TEST_APP} returns 503 for first ${RETRY_TEST_FAIL_FIRST} request(s), then 200"
}

run_retry_fault_injection_check() {
  local pod_name="$1"
  local nonce url result status classification detail body attempt

  nonce="$(date +%s)-$RANDOM"
  url="http://${RETRY_TEST_APP}.${NAMESPACE}.svc.cluster.local/retry-test?run=${nonce}"

  echo
  echo "== retry-fault-injection (${NAMESPACE}) =="

  if ! apply_retry_fault_injection; then
    SUMMARY_LINES+=("retry-fault-injection: 0/1")
    return 1
  fi

  if ! result=$(kubectl exec -n "$NAMESPACE" "$pod_name" -c "$STOREFRONT_CONTAINER" -- sh -c '
body_file="$(mktemp)"
err_file="$(mktemp)"
wget -S -O "$body_file" -T "$1" "$2" 2>"$err_file" >/dev/null || true
http_status="$(sed -n "s/^  HTTP\/[^ ]* \([0-9][0-9][0-9]\).*/\1/p" "$err_file" | tail -n 1)"
body="$(tr "\n" " " < "$body_file" | sed "s/[[:space:]][[:space:]]*/ /g" | cut -c1-200)"

if [ -z "$http_status" ]; then
  detail="$(tr "\n" " " < "$err_file" | sed "s/[[:space:]][[:space:]]*/ /g" | cut -c1-160)"
  printf "000|wget-error|%s|%s\n" "$detail" "$body"
elif [ "$http_status" = "200" ]; then
  printf "%s|ok|final HTTP 200 after injected upstream 503|%s\n" "$http_status" "$body"
else
  detail="$(tr "\n" " " < "$err_file" | sed "s/[[:space:]][[:space:]]*/ /g" | cut -c1-160)"
  printf "%s|unexpected-status|%s|%s\n" "$http_status" "$detail" "$body"
fi

rm -f "$body_file" "$err_file"
' sh "$TIMEOUT_SECONDS" "$url"); then
    result="000|kubectl-error|kubectl exec failed|"
  fi

  IFS='|' read -r status classification detail body <<<"$result"
  attempt=""
  if [[ "$body" =~ attempt=([0-9]+) ]]; then
    attempt="${BASH_REMATCH[1]}"
  fi

  if [[ "$classification" == "ok" && -n "$attempt" && "$attempt" -gt "$RETRY_TEST_FAIL_FIRST" ]]; then
    printf '  OK   %-42s HTTP %s (%s; %s)\n' "${RETRY_TEST_APP}:80" "$status" "$detail" "$body"
    SUMMARY_LINES+=("retry-fault-injection: 1/1")
    return 0
  fi

  printf '  FAIL %-42s HTTP %s (%s; %s)\n' "${RETRY_TEST_APP}:80" "$status" "$detail" "$body"
  SUMMARY_LINES+=("retry-fault-injection: 0/1")
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

  [[ "$successes" -eq "$total" ]]
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

  local failed=0

  SUMMARY_LINES=()
  run_targets "$STOREFRONT_APP" "$storefront_pod" run_storefront_wget "${STOREFRONT_TARGETS[@]}" || failed=1
  run_targets "$BLOCKED_APP" "$blocked_pod" run_blocked_curl "${BLOCKED_TARGETS[@]}" || failed=1
  run_retry_fault_injection_check "$storefront_pod" || failed=1

  echo
  echo "== Final summary (${NAMESPACE}) =="
  printf '  %s\n' "${SUMMARY_LINES[@]}"

  if [[ "$failed" -ne 0 ]]; then
    echo "One or more service-mesh checks failed for namespace '${NAMESPACE}'" >&2
    exit 1
  fi
}

main "$@"
