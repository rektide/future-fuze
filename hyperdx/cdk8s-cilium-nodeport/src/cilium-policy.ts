import { Construct } from 'constructs';
import { ApiObject } from 'cdk8s';

export interface CiliumLocalhostPolicyProps {
  readonly namespace: string;
  readonly nodePorts: {
    appPort: number;
    apiPort: number;
    otlpGrpcPort: number;
    otlpHttpPort: number;
  };
}

export class CiliumLocalhostPolicy extends Construct {
  constructor(scope: Construct, id: string, props: CiliumLocalhostPolicyProps) {
    super(scope, id);
    
    new ApiObject(this, 'cilium-network-policy', {
      apiVersion: 'cilium.io/v2',
      kind: 'CiliumClusterwideNetworkPolicy',
      metadata: {
        name: 'hyperdx-nodeport-localhost-only',
      },
      spec: {
        nodeSelector: {},
        ingressDeny: [
          {
            fromEntities: ['world'],
            toPorts: [
              {
                ports: [
                  { port: props.nodePorts.appPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.apiPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.otlpGrpcPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.otlpHttpPort.toString(), protocol: 'TCP' },
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
                  { port: props.nodePorts.appPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.apiPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.otlpGrpcPort.toString(), protocol: 'TCP' },
                  { port: props.nodePorts.otlpHttpPort.toString(), protocol: 'TCP' },
                ],
              },
            ],
          },
        ],
      },
    });
  }
}
