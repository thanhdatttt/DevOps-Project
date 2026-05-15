On master Node
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server \
  --node-ip <MASTER_IP> \
  --bind-address <MASTER_IP> \
  --advertise-address <MASTER_IP> \
  --flannel-iface tailscale0" sh -

sudo cat /var/lib/rancher/k3s/server/node-token


On worker Node
curl -sfL https://get.k3s.io | K3S_URL="https://<MASTER_IP>:6443" K3S_TOKEN="<NODE_TOKEN>" INSTALL_K3S_EXEC="agent \
  --node-ip <WORKER_IP> \
  --flannel-iface tailscale0" sh -

mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
