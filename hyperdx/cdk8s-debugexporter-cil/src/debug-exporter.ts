import { ApiObject, Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';
import type { DebugExporterPorts, NodePortConfig } from './config.js';

export interface DebugExporterProps extends ChartProps {
  readonly namespace: string;
  readonly image: string;
  readonly replicas: number;
  readonly logLevel: string;
  readonly ports: DebugExporterPorts;
  readonly nodePort: NodePortConfig;
}

export class DebugExporter extends Chart {
  constructor(scope: Construct, id: string, props: DebugExporterProps) {
    super(scope, id, props);

    const labels = {
      app: 'otel-debug-exporter',
    };

    const collectorConfig = `extensions:
  health_check:
    endpoint: 0.0.0.0:${props.ports.health}
  pprof:
    endpoint: 0.0.0.0:${props.ports.pprof}
  zpages:
    endpoint: 0.0.0.0:${props.ports.zpages}

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:${props.ports.otlpGrpc}
        max_recv_msg_size_mib: 32
      http:
        endpoint: 0.0.0.0:${props.ports.otlpHttp}
        cors:
          allowed_origins:
            - http://*
            - https://*
          allowed_headers:
            - "*"
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu: {}
      memory: {}
      disk: {}
      filesystem: {}
      network: {}

processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128
  batch:
    send_batch_size: 1024
    send_batch_max_size: 8192
    timeout: 2s
  attributes/sanitize:
    actions:
      - key: http.request.header.authorization
        action: delete
      - key: db.statement
        action: delete
      - key: deployment.environment
        value: cilium-nodeport
        action: upsert
  resource/enrich:
    attributes:
      - key: service.namespace
        value: ${props.namespace}
        action: upsert
      - key: service.instance.id
        from_attribute: k8s.pod.uid
        action: upsert
  transform/span_sanitization:
    trace_statements:
      - context: span
        statements:
          - replace_pattern(name, "(?i)password=.*", "password=REDACTED")
  filter/noisy_healthchecks:
    error_mode: ignore
    traces:
      span:
        - attributes["http.target"] == "/healthz"
    logs:
      log_record:
        - attributes["http.target"] == "/healthz"

exporters:
  debug/default:
    verbosity: normal
    sampling_initial: 10
    sampling_thereafter: 200
  debug/detailed:
    verbosity: detailed
    sampling_initial: 50
    sampling_thereafter: 500
  prometheus:
    endpoint: 0.0.0.0:${props.ports.metrics}
    namespace: oteldebug

connectors:
  spanmetrics:
    histogram:
      explicit:
        buckets: ["2ms", "4ms", "10ms", "50ms", "100ms", "250ms", "500ms", "1s"]
    dimensions:
      - name: service.name
      - name: span.name
      - name: status.code

service:
  telemetry:
    logs:
      level: ${props.logLevel}
  extensions: [health_check, pprof, zpages]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, attributes/sanitize, resource/enrich, transform/span_sanitization, filter/noisy_healthchecks, batch]
      exporters: [debug/default, debug/detailed, spanmetrics]
    metrics:
      receivers: [otlp, hostmetrics, spanmetrics]
      processors: [memory_limiter, resource/enrich, batch]
      exporters: [debug/default, prometheus]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, attributes/sanitize, resource/enrich, filter/noisy_healthchecks, batch]
      exporters: [debug/detailed]
`;

    new ApiObject(this, 'collector-config', {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'otel-debug-exporter-config',
        namespace: props.namespace,
      },
      data: {
        'collector.yaml': collectorConfig,
      },
    });

    new ApiObject(this, 'deployment', {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'otel-debug-exporter',
        namespace: props.namespace,
      },
      spec: {
        replicas: props.replicas,
        selector: {
          matchLabels: labels,
        },
        template: {
          metadata: {
            labels,
          },
          spec: {
            containers: [
              {
                name: 'otel-debug-exporter',
                image: props.image,
                args: ['--config=/conf/collector.yaml'],
                ports: [
                  { name: 'health', containerPort: props.ports.health },
                  { name: 'pprof', containerPort: props.ports.pprof },
                  { name: 'zpages', containerPort: props.ports.zpages },
                  { name: 'otlp-grpc', containerPort: props.ports.otlpGrpc },
                  { name: 'otlp-http', containerPort: props.ports.otlpHttp },
                  { name: 'metrics', containerPort: props.ports.metrics },
                ],
                env: [
                  {
                    name: 'OTEL_RESOURCE_ATTRIBUTES',
                    value: `service.namespace=${props.namespace}`,
                  },
                ],
                volumeMounts: [
                  {
                    name: 'collector-config',
                    mountPath: '/conf/collector.yaml',
                    subPath: 'collector.yaml',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'collector-config',
                configMap: {
                  name: 'otel-debug-exporter-config',
                },
              },
            ],
          },
        },
      },
    });

    new ApiObject(this, 'service', {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: 'otel-debug-exporter',
        namespace: props.namespace,
      },
      spec: {
        type: props.nodePort.enabled ? 'NodePort' : 'ClusterIP',
        externalTrafficPolicy: props.nodePort.enabled ? 'Local' : undefined,
        selector: labels,
        ports: [
          {
            name: 'health',
            port: props.ports.health,
            targetPort: props.ports.health,
            nodePort: props.nodePort.enabled ? props.nodePort.healthPort : undefined,
          },
          {
            name: 'otlp-grpc',
            port: props.ports.otlpGrpc,
            targetPort: props.ports.otlpGrpc,
            nodePort: props.nodePort.enabled ? props.nodePort.otlpGrpcPort : undefined,
          },
          {
            name: 'otlp-http',
            port: props.ports.otlpHttp,
            targetPort: props.ports.otlpHttp,
            nodePort: props.nodePort.enabled ? props.nodePort.otlpHttpPort : undefined,
          },
          {
            name: 'metrics',
            port: props.ports.metrics,
            targetPort: props.ports.metrics,
            nodePort: props.nodePort.enabled ? props.nodePort.metricsPort : undefined,
          },
        ],
      },
    });
  }
}
