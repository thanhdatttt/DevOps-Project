# YAS Unified K8s Deployment Guide (K3s + Tailscale + ArgoCD + Istio)

This guide provides a consolidated workflow for setting up the YAS ecosystem on a **K3s multi-node cluster over Tailscale**, using **ArgoCD** for GitOps deployment and **Istio** for the service mesh.

---

## 1. Infrastructure Setup (K3s over Tailscale)

Run these commands on your nodes to ensure they communicate over the Tailscale private network.

### Master Node
```bash
# Set hostname
sudo hostnamectl set-hostname master

# Install K3s with Traefik disabled (using Istio/Nginx instead)
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server \
  --node-ip <MASTER_TAILSCALE_IP> \
  --bind-address <MASTER_TAILSCALE_IP> \
  --advertise-address <MASTER_TAILSCALE_IP> \
  --disable traefik \
  --flannel-iface tailscale0" sh -

# Get the token for worker nodes
sudo cat /var/lib/rancher/k3s/server/node-token
```

### Worker Node
```bash
curl -sfL https://get.k3s.io | K3S_URL="https://<MASTER_TAILSCALE_IP>:6443" \
  K3S_TOKEN="<NODE_TOKEN>" INSTALL_K3S_EXEC="agent \
  --node-ip <WORKER_TAILSCALE_IP> \
  --flannel-iface tailscale0" sh -
```
### Both Node
```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
```


---

## 2. CLI Tooling Installation

Ensure you have the required CLIs on your management machine:

- Install helm
  https://helm.sh/
- Install yq (the tool read, update yaml file)
  https://github.com/mikefarah/yq
- Intstall istio
  https://istio.io/downloadIstio
---

## 3. Core Middleware & ArgoCD Setup
### Install Ingress-Nginx
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
     --namespace ingress-nginx --create-namespace \
     --set controller.watchIngressWithoutClass=true
```
### Install Middleware Operators
Execute the manual setup scripts for the databases and identity providers:
```bash
cd k8s/deploy
chmod +x *.sh
./setup-keycloak.sh
./setup-redis.sh
./setup-cluster.sh
```
---

## 4. Service Mesh Installation (Istio)

Using `istioctl` to install the mesh layer before deploying applications.

```bash
# 1. Create the service-mesh namespace
kubectl create namespace service-mesh --dry-run=client -o yaml | kubectl apply -f -

# 2. Install Istio using the configuration file in the repo
istioctl install -i service-mesh -f k8s/service-mesh/00-istio-install-values.yaml -y

# 3. Label namespaces for Istio Sidecar Injection
kubectl label namespace dev istio-injection=enabled --overwrite
kubectl label namespace staging istio-injection=enabled --overwrite
```

---

## 5. GitOps Application Deployment

### CoreDNS setup
```bash
kubectl apply -f k8s/deploy/coredns-custom.yaml
kubectl rollout restart deployment coredns -n kube-system
```

Instead of manual shell scripts for the apps, trigger the **ArgoCD AppSets**.

### Deploy YAS Configuration & Applications
Apply your ArgoCD Root App or AppSets found in the `k8s/` folder:
```bash
# Deploy the configuration and applications via ArgoCD
kubectl apply -f k8s/dev/backend-appset.yaml
kubectl apply -f k8s/dev/frontend-appset.yaml
kubectl apply -f k8s/staging/backend-appset.yaml
kubectl apply -f k8s/staging/frontend-appset.yaml
```

### Apply Service Mesh Policies
Apply mTLS, retries, and authorization policies via kubectl (these can also be added to ArgoCD):
```bash
kubectl apply -k k8s/service-mesh
```

---

## 6. Networking & Observability

### Update Hosts File
Since you are using Tailscale, use your **Master Node Tailscale IP** (e.g., `100.x.x.x`) in your local `/etc/hosts`:

```text
# YAS Local DNS Mapping (Tailscale IP)
100.71.220.45 identity.yas.local.com
100.71.220.45 dev.storefront.yas.local.com
100.71.220.45 dev.backoffice.yas.local.com
100.71.220.45 dev.api.yas.local.com
100.71.220.45 staging.storefront.yas.local.com
100.71.220.45 staging.backoffice.yas.local.com
100.71.220.45 staging.api.yas.local.com
100.71.220.45 kibana.yas.local.com
100.71.220.45 akhq.yas.local.com
100.71.220.45 grafana.yas.local.com
100.71.220.45 prometheus.yas.local.com
100.71.220.45 kiali.yas.local.com
100.71.220.45 argocd.yas.local.com
100.71.220.45 pgadmin.yas.local.com
```

### Setup Kiali (Mesh Visualization)
```bash
helm repo add kiali https://kiali.org/helm-charts
helm repo update
helm upgrade --install kiali-server kiali/kiali-server \
  --namespace service-mesh \
  -f k8s/service-mesh/kiali-values.yaml
```

---

## 7. Verification

1.  **Check ArgoCD Sync:** Access `argocd.yas.local.com` and ensure all microservices in the `dev` namespace are "Healthy" and "Synced".
2.  **Verify Istio Injection:**
    ```bash
    kubectl get pods -n dev
    # Each pod should show 2/2 containers (App + Istio Proxy)
    ```
3.  **Check mTLS:**
    ```bash
    istioctl analyze -n dev
    ```
4.  **Keycloak Credentials:**
    ```bash
    kubectl get secret keycloak-credentials -n keycloak -o jsonpath="{.data.password}" | base64 --decode
    ```
