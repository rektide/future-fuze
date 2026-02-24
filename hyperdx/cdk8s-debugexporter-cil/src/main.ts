import { App as Cdk8sApp } from 'cdk8s';
import { Construct } from 'constructs';
import { CiliumLocalhostPolicy } from './cilium-policy.js';
import { defaultConfig, type DebugExporterCiliumConfig } from './config.js';
import { DebugExporter } from './debug-exporter.js';
import { Namespace } from './namespace.js';

export class DebugExporterCiliumStack extends Construct {
  constructor(scope: Construct, id: string, config: DebugExporterCiliumConfig = defaultConfig) {
    super(scope, id);

    new Namespace(this, 'namespace', { name: config.namespace });

    new DebugExporter(this, 'debug-exporter', {
      namespace: config.namespace,
      image: config.collector.image,
      replicas: config.collector.replicas,
      logLevel: config.collector.logLevel,
      ports: config.ports,
      nodePort: config.nodePort,
    });

    if (config.cilium.localhostOnly && config.nodePort.enabled) {
      new CiliumLocalhostPolicy(this, 'localhost-policy', {
        nodePorts: {
          healthPort: config.nodePort.healthPort,
          otlpGrpcPort: config.nodePort.otlpGrpcPort,
          otlpHttpPort: config.nodePort.otlpHttpPort,
          metricsPort: config.nodePort.metricsPort,
        },
      });
    }
  }
}

const app = new Cdk8sApp();
new DebugExporterCiliumStack(app, 'otel-debug-exporter-cilium-nodeport');
app.synth();
