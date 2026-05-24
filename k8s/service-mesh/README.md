# YAS Service Mesh với Istio + Kiali cho `dev` và `staging`

Thư mục này chứa cấu hình service mesh cho **hai namespace triển khai chính** của YAS:

- `dev`: nhận thay đổi liên tục từ `main`.
- `staging`: nhận bản release từ tag dạng `vMAJOR.MINOR.PATCH`, ví dụ `v1.2.3`.

Cấu hình cung cấp:

- **mTLS STRICT** cho traffic nội bộ trong từng namespace.
- **Retry policy** bằng `VirtualService`: retry khi upstream trả `5xx`/lỗi kết nối.
- **AuthorizationPolicy allow-list**: chỉ service account được khai báo mới gọi được service đích.
- **Kiali topology**: cấu hình Kiali và sơ đồ flow tham chiếu.
- **Test clients** để kiểm tra allow/deny bằng `curl` trong `dev` hoặc `staging`.

Lưu ý triển khai hiện tại: public ingress của cluster đang đi qua `ingress-nginx`, vì vậy `istio-ingressgateway` được cấu hình dạng `ClusterIP` để tránh xung đột cổng `80/443` với K3s ServiceLB.

## File manifest

| File | Mục đích |
|---|---|
| `00-istio-install-values.yaml` | Cấu hình cài Istio bằng `istioctl install -f` |
| `01-namespaces-injection.yaml` | Bật sidecar injection cho `dev` và `staging` |
| `02-mtls-dev.yaml`, `02-mtls-staging.yaml` | `PeerAuthentication STRICT` + `DestinationRule ISTIO_MUTUAL` |
| `03-retry-virtualservices-dev.yaml`, `03-retry-virtualservices-staging.yaml` | Retry `5xx`/connection failures cho service HTTP |
| `04-authorization-policies-dev.yaml`, `04-authorization-policies-staging.yaml` | Default deny + allow-list service-to-service |
| `05-test-clients-dev.yaml`, `05-test-clients-staging.yaml` | Pod curl allowed/blocked để test policy |
| `06-istio-gateway-dev.yaml`, `06-istio-gateway-staging.yaml` | Gateway/VirtualService public qua Istio ingress |
| `kiali-values.yaml` | Values cài Kiali bằng Helm, dùng Prometheus hiện có trong namespace `observability` |
| `topology.mmd` | Mermaid flow chart tham chiếu theo codebase |
| `screenshots/` | Lưu screenshot Kiali topology sau khi chạy cluster |

## Cơ sở phân tích codebase

- AppSet `k8s/dev/*` deploy vào namespace `dev` và hiện theo `targetRevision: main`.
- AppSet `k8s/staging/*` deploy vào namespace `staging` và dùng `values-staging.yaml`.
- Helm chart backend tạo `Service`, `Deployment`, `ServiceAccount` cùng tên `fullnameOverride`; label selector chính là `app.kubernetes.io/name`.
- Các route BFF và URL service nội bộ nằm trong `k8s/charts/yas-configuration/values.yaml`.

## Triển khai từng bước

### 1. Cài Istio

```bash
kubectl create namespace service-mesh --dry-run=client -o yaml | kubectl apply -f -
istioctl install -i service-mesh -f k8s/service-mesh/00-istio-install-values.yaml -y
kubectl get pods -n service-mesh
```

### 2. Bật sidecar injection cho `dev` và `staging`

```bash
kubectl apply -f k8s/service-mesh/01-namespaces-injection.yaml
```

Nếu workload đã chạy trước khi label namespace, restart để pod mới có sidecar:

```bash
kubectl rollout restart deployment -n dev
kubectl rollout restart deployment -n staging
```

Kiểm tra pod đã có `istio-proxy`:

```bash
kubectl get pod -n dev -o go-template='{{range .items}}{{.metadata.name}} init={{range .spec.initContainers}}{{.name}}{{if .restartPolicy}}(restart={{.restartPolicy}}){{end}} {{end}}containers={{range .spec.containers}}{{.name}} {{end}}{{"\n"}}{{end}}'
kubectl get pod -n staging -o go-template='{{range .items}}{{.metadata.name}} init={{range .spec.initContainers}}{{.name}}{{if .restartPolicy}}(restart={{.restartPolicy}}){{end}} {{end}}containers={{range .spec.containers}}{{.name}} {{end}}{{"\n"}}{{end}}'

# Kiểm tra trực tiếp sidecar ở cả .spec.containers và .spec.initContainers
kubectl get pod -n dev -o json | jq -r '.items[] | .metadata.name + " istio-proxy=" + (([.spec.containers[]?.name, .spec.initContainers[]?.name] | any(. == "istio-proxy")) | tostring)'
kubectl get pod -n staging -o json | jq -r '.items[] | .metadata.name + " istio-proxy=" + (([.spec.containers[]?.name, .spec.initContainers[]?.name] | any(. == "istio-proxy")) | tostring)'
```

### 3. Cài Kiali

```bash
helm repo add kiali https://kiali.org/helm-charts
helm repo update
kubectl create namespace service-mesh --dry-run=client -o yaml | kubectl apply -f -
helm upgrade --install kiali-server kiali/kiali-server \
  --namespace service-mesh \
  -f k8s/service-mesh/kiali-values.yaml

kubectl rollout status deployment/kiali -n service-mesh
kubectl port-forward svc/kiali 20001:20001 -n service-mesh
```

Mở Kiali: <https://localhost:20001/>.

Khi dùng `ingress-nginx`, Kiali cũng được publish tại:

```text
http://kiali.yas.local.com
```

### 4. Áp dụng service mesh policy

Áp dụng cho cả `dev` và `staging`:

```bash
kubectl apply -k k8s/service-mesh
```

Hoặc áp dụng riêng từng namespace, ví dụ `dev`:

```bash
kubectl apply -f k8s/service-mesh/02-mtls-dev.yaml
kubectl apply -f k8s/service-mesh/03-retry-virtualservices-dev.yaml
kubectl apply -f k8s/service-mesh/04-authorization-policies-dev.yaml
kubectl apply -f k8s/service-mesh/05-test-clients-dev.yaml
kubectl apply -f k8s/service-mesh/06-istio-gateway-dev.yaml
```

Kiểm tra:

```bash
istioctl analyze -n dev
istioctl analyze -n staging
kubectl get peerauthentication,destinationrule,virtualservice,authorizationpolicy -n dev
kubectl get peerauthentication,destinationrule,virtualservice,authorizationpolicy -n staging
```

## CI/CD namespace behavior

### Dev

`main` branch là nguồn triển khai dev. AppSet trong `k8s/dev` đã trỏ về `targetRevision: main`, destination namespace `dev`, và bật automated sync/self-heal.

> Nếu chỉ thay code service mà manifest Helm không đổi, cần bảo đảm pipeline cập nhật image tag hoặc dùng Argo CD Image Updater; nếu không, tag mutable `latest` có thể không tạo rollout mới.

### Staging

Workflow `.github/workflows/staging-release.yaml` chạy khi push tag dạng `v1.2.3`:

1. Kiểm tra tag nằm trên history của `main`.
2. Build image release.
3. Push image lên GHCR với tag `v1.2.3` và `staging`, cùng kiểu registry như các service CI (`ghcr.io/thanhdatttt/yas-*`).
4. Cập nhật `k8s/charts/*/values-staging.yaml` sang `ghcr.io/thanhdatttt/yas-*:v1.2.3`.
5. Commit thay đổi về `main`; Argo CD AppSet staging tự sync vào namespace `staging`.

Workflow dùng `GITHUB_TOKEN` để push GHCR, giống các service CI hiện có. Cần bảo đảm GitHub Actions có quyền `packages: write`.

Tạo release:

```bash
git checkout main
git pull
git tag v1.2.3
git push origin v1.2.3
```

## Kịch bản test

Thay `<ns>` bằng `dev` hoặc `staging`.

### A. Test mTLS STRICT

```bash
# Dev
kubectl get peerauthentication,destinationrule -n dev
istioctl experimental describe service product -n dev

# Staging
kubectl get peerauthentication,destinationrule -n staging
istioctl experimental describe service product -n staging
```

Kỳ vọng: traffic tới `product.<ns>.svc.cluster.local` dùng `mTLS`/`ISTIO_MUTUAL`.

### B. Test AuthorizationPolicy từ caller thật và blocked client

Chạy script theo namespace. Script dùng `storefront-bff` làm caller thật cho các service storefront-facing (bỏ qua backoffice, swagger-ui, gateway và self-call), và dùng `mesh-curl-blocked` để xác nhận blocked client bị deny trên các service workload trong namespace.

```bash
# Execute Permission
chmod +x  k8s/service-mesh/test-scripts/*

# Dev
k8s/service-mesh/test-scripts/curl-all-services-dev.sh

# Staging
k8s/service-mesh/test-scripts/curl-all-services-staging.sh
```

Kỳ vọng:

- `storefront-bff`: request tới các service storefront-facing không bị Istio RBAC deny; response có thể là `200`, `401`, `404`, hoặc app-level error tùy endpoint.
- `mesh-curl-blocked`: request tới mọi service workload non-gateway trả HTTP `403` hoặc nội dung `RBAC: access denied`.
- `retry-fault-injection`: script tạo tạm service `mesh-retry-fault`, service này trả `503` cho request đầu tiên rồi `200`; caller phải nhận final HTTP `200` để chứng minh sidecar đã retry.

Gateway bridge được bỏ qua vì đó là `ExternalName` trỏ sang ingress gateway, không phải workload app được bảo vệ bởi AuthorizationPolicy trong namespace `dev`/`staging`.

### C. Test retry evidence

Các script ở mục B tự tạo fault target tạm thời (`mesh-retry-fault`) để kiểm tra retry behavior end-to-end. Lưu ý: không dùng `VirtualService.fault` trên cùng route với retry vì Istio không hỗ trợ kết hợp fault injection với retry/timeout policy trên cùng `VirtualService`.

Có thể override một số tham số khi chạy script:

```bash
RETRY_TEST_FAIL_FIRST=1 RETRY_TEST_CLEANUP=true k8s/service-mesh/test-scripts/curl-all-services-dev.sh
```

Nếu cần xem metric retry tại caller sidecar:

```bash
NS=dev # hoặc staging
CALLER_POD=$(kubectl get pod -n "$NS" -l app.kubernetes.io/name=storefront-bff -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n "$NS" "$CALLER_POD" -c istio-proxy -- \
  curl -s localhost:15000/stats/prometheus \
  | grep 'envoy_cluster_upstream_rq_retry\|envoy_cluster_upstream_rq_5xx'
```

## Kiali topology / flow chart

1. Tạo traffic thật trong namespace cần quan sát:

```bash
NS=dev # hoặc staging
for i in $(seq 1 20); do
  kubectl exec -n "$NS" "$ALLOWED_POD" -c curl -- \
    curl -s -o /dev/null http://product.$NS.svc.cluster.local/product/v3/api-docs || true
done
```

2. Vào Kiali → **Graph**:
   - Namespace: `dev` hoặc `staging`
   - Graph type: `Versioned app graph` hoặc `App graph`
   - Display: bật `Traffic`, `Security`, `Response time`, `Service nodes`

## Rollback

```bash
kubectl delete -k k8s/service-mesh
kubectl label namespace dev istio-injection- --overwrite
kubectl label namespace staging istio-injection- --overwrite
kubectl rollout restart deployment -n dev
kubectl rollout restart deployment -n staging
helm uninstall kiali-server -n service-mesh
```

## Tài liệu tham khảo chính thức

- Istio PeerAuthentication / mTLS: <https://istio.io/latest/docs/reference/config/security/peer_authentication/>
- Istio AuthorizationPolicy: <https://istio.io/latest/docs/reference/config/security/authorization-policy/>
- Istio VirtualService retry: <https://istio.io/latest/docs/reference/config/networking/virtual-service/>
- Kiali quick start / Helm install: <https://kiali.io/docs/installation/quick-start/>
