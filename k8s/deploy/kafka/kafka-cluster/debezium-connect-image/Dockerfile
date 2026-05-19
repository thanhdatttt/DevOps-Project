ARG STRIMZI_VERSION=0.51.0
ARG KAFKA_VERSION=4.2.0
ARG DEBEZIUM_VERSION=3.5.1.Final

FROM quay.io/strimzi/kafka:${STRIMZI_VERSION}-kafka-${KAFKA_VERSION}

ARG DEBEZIUM_VERSION
ARG DEBEZIUM_POSTGRES_ARCHIVE=https://repo1.maven.org/maven2/io/debezium/debezium-connector-postgres/${DEBEZIUM_VERSION}/debezium-connector-postgres-${DEBEZIUM_VERSION}-plugin.tar.gz

USER root:root

RUN mkdir -p /opt/kafka/plugins/debezium-postgres \
    && curl -fsSL "${DEBEZIUM_POSTGRES_ARCHIVE}" -o /tmp/debezium-postgres.tar.gz \
    && tar -xzf /tmp/debezium-postgres.tar.gz -C /opt/kafka/plugins/debezium-postgres --strip-components=1 \
    && rm /tmp/debezium-postgres.tar.gz \
    && chmod -R g=u /opt/kafka/plugins/debezium-postgres

USER 1001
