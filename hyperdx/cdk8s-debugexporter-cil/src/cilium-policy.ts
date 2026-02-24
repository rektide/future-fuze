import { ApiObject, Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';

export interface CiliumLocalhostPolicyProps extends ChartProps {
  readonly nodePorts: {
    healthPort: number;
    otlpGrpcPort: number;
    otlpHttpPort: number;
    metricsPort: number;
  };
}

export class CiliumLocalhostPolicy extends Chart {
  constructor(scope: Construct, id: string, props: CiliumLocalhostPolicyProps) {
    super(scope, id, props);

    new ApiObject(this, 'cilium-network-policy', {
      apiVersion: 'cilium.io/v2',
      kind: 'CiliumClusterwideNetworkPolicy',
      metadata: {
        name: 'otel-debug-exporter-nodeport-localhost-only',
      },
      spec: {
        nodeSelector: {},
        ingressDeny: [
          {
            fromEntities: ['world'],
            toPorts: [
              {
                ports: [
                  { port: props.nodePorts.healthPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.otlpGrpcPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.otlpHttpPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.metricsPort.toString(), protocol: 'TCP' },
                ],
              },
            ],
          },
        ],
        ingress: [
          {
            fromEntities: ['cluster', 'host'],
            toPorts: [
              {
                ports: [
                  { port: props.nodePorts.healthPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.otlpGrpcPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.otlpHttpPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.metricsPort.toString(), protocol: 'TCP' },
                ],
              },
            ],
          },
        ],
      },
    });
  }
}
