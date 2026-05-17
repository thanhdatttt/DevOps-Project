# Debezium Kafka Connect image

This image extends the Strimzi Kafka Connect runtime used by the cluster and adds
the Debezium PostgreSQL connector plugin.

Build the image:

```bash
docker build \
  -t ghcr.io/thanhdatttt/debezium-connect-postgresql:strimzi-0.51.0-kafka-4.2.0-debezium-3.5.1 \
  k8s/deploy/kafka/kafka-cluster/debezium-connect-image
```

The GitHub Actions workflow at
`.github/workflows/debezium-connect-image-ci.yaml` builds and pushes this image
to GHCR using the same `docker/login-action` + `docker/build-push-action`
configuration used by the service CI workflows.

For a local K3S node without registry credentials, load the image into that
node's K3S containerd and constrain `KafkaConnect.spec.template.pod.affinity`
to the same node.
