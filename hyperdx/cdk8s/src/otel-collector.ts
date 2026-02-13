import { Construct } from 'constructs';
import { Chart, ChartProps } from 'cdk8s';
import * as kplus from 'cdk8s-plus-28';

export interface OtelCollectorProps extends ChartProps {
  readonly namespace: string;
  readonly image: string;
  readonly clickhouseHost: string;
  readonly clickhouseDatabase: string;
  readonly logLevel: string;
  readonly opampServerUrl: string;
  readonly ports: {
    health: number;
    fluentd: number;
    otlpGrpc: number;
    otlpHttp: number;
    metrics: number;
  };
}

export class OtelCollector extends Chart {
  constructor(scope: Construct, id: string, props: OtelCollectorProps) {
    super(scope, id, props);
    
    const deployment = new kplus.Deployment(this, 'deployment', {
      metadata: {
        name: 'otel-collector',
        namespace: props.namespace,
      },
      replicas: 1,
      containers: [
        {
          name: 'otel-collector',
          image: kplus.ContainerImage.fromRegistry(props.image),
          ports: [
            { containerPort: props.ports.health, name: 'health' },
            { containerPort: props.ports.fluentd, name: 'fluentd' },
            { containerPort: props.ports.otlpGrpc, name: 'otlp-grpc' },
            { containerPort: props.ports.otlpHttp, name: 'otlp-http' },
            { containerPort: props.ports.metrics, name: 'metrics' },
          ],
          envVariables: {
            CLICKHOUSE_ENDPOINT: kplus.EnvValue.fromValue(`tcp://${props.clickhouseHost}?dial_timeout=10s`),
            HYPERDX_OTEL_EXPORTER_CLICKHOUSE_DATABASE: kplus.EnvValue.fromValue(props.clickhouseDatabase),
            HYPERDX_LOG_LEVEL: kplus.EnvValue.fromValue(props.logLevel),
            OPAMP_SERVER_URL: kplus.EnvValue.fromValue(props.opampServerUrl),
            HYPERDX_OTEL_EXPORTER_CREATE_LEGACY_SCHEMA: kplus.EnvValue.fromValue('true'),
          },
          securityContext: {
            ensureNonRoot: false,
            readOnlyRootFilesystem: false,
          },
        },
      ],
    });

    new kplus.Service(this, 'service', {
      metadata: {
        name: 'otel-collector',
        namespace: props.namespace,
      },
      type: kplus.ServiceType.CLUSTER_IP,
      selector: deployment,
      ports: [
        { name: 'health', port: props.ports.health, targetPort: props.ports.health },
        { name: 'fluentd', port: props.ports.fluentd, targetPort: props.ports.fluentd },
        { name: 'otlp-grpc', port: props.ports.otlpGrpc, targetPort: props.ports.otlpGrpc },
        { name: 'otlp-http', port: props.ports.otlpHttp, targetPort: props.ports.otlpHttp },
        { name: 'metrics', port: props.ports.metrics, targetPort: props.ports.metrics },
      ],
    });
  }
}
