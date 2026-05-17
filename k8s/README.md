sudo hostnamectl set-hostname master 

On master Node
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server \
  --node-ip <MASTER_IP> \
  --bind-address <MASTER_IP> \
  --advertise-address <MASTER_IP> \
  --disable traefik \
  --flannel-iface tailscale0" sh -

Disable traefik on masternode

sudo cat /var/lib/rancher/k3s/server/node-token


On worker Node
curl -sfL https://get.k3s.io | K3S_URL="https://<MASTER_IP>:6443" K3S_TOKEN="<NODE_TOKEN>" INSTALL_K3S_EXEC="agent \
  --node-ip <WORKER_IP> \
  --flannel-iface tailscale0" sh -



curl -sfL https://get.k3s.io | K3S_URL="https://<MASTER_IP>:6443" K3S_TOKEN="<NODE_TOKEN>" INSTALL_K3S_EXEC="agent \
  --node-ip <WORKER_IP> \
  --flannel-iface tailscale0" sh -

On master:

Instaling Ingress

curl -sfL https://get.k3s.io | sh -s - --disable traefik

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update


helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
     --create-namespace \
     --namespace ingress-nginx \
     --set controller.watchIngressWithoutClass=true

kubectl get svc -n ingress-nginx

kubectl edit configmap coredns -n kube-system

Add mapping ip to hosts

For any outsider machine want to connect to it, add
100.114.3.80 identity.yas.local.com
100.114.3.80 storefront.yas.local.com
100.114.3.80 kibana.yas.local.com
100.114.3.80 akhq.yas.local.com
100.114.3.80 grafana.yas.local.com
100.114.3.80 pgadmin.yas.local.com


The ip is from any machine in tailscale
100.71.220.45 identity.yas.local.com
100.71.220.45 storefront.yas.local.com
100.71.220.45 kibana.yas.local.com
100.71.220.45 akhq.yas.local.com
100.71.220.45 grafana.yas.local.com
100.71.220.45 pgadmin.yas.local.com
