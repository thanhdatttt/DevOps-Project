#!/bin/bash

helm repo add argo https://argoproj.github.io/argo-helm

## For studying reason
helm search repo argo

helm show values argo/argo-cd > values.yaml

# Change service in server from using ClusterIP to NodePort

helm upgrade --install argocd argo/argo-cd \
 --create-namespace --namespace argocd \
 -f ./values.yaml

# For now
kubectl port-forward service/argocd-server -n argocd 8080:443

# Later
# enable ingress in the values file `server.ingress.enabled` and either

# CoreDNS must be run before this, if not restart it first
kubectl rollout restart deployment coredns -n kube-system
kubectl rollout status deployment coredns -n kube-system

# ArgoCD observe the charts
kubectl apply -f applicationset-microservices.yaml -n argocd
kubectl apply -f appset-infra-external.yaml -n argocd
kubectl apply -f appset-infra-internal.yaml -n argocd
kubectl apply -f appset-obs-external.yaml -n argocd
kubectl apply -f appset-obs-internal.yaml -n argocd

# Turn on Ip in IP in Calico


#HELPFUL
 kubectl rollout restart deployment argocd-applicationset-controller -n argocd
 kubectl logs -n argocd -l app.kubernetes.io/name=argocd-applicationset-controller -f
