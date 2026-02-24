import { App as Cdk8sApp } from 'cdk8s';
import { Construct } from 'constructs';
import { defaultConfig, type DebugExporterConfig } from './config.js';
import { DebugExporter } from './debug-exporter.js';
import { Namespace } from './namespace.js';

export class DebugExporterStack extends Construct {
  constructor(scope: Construct, id: string, config: DebugExporterConfig = defaultConfig) {
    super(scope, id);

    new Namespace(this, 'namespace', { name: config.namespace });

    new DebugExporter(this, 'debug-exporter', {
      namespace: config.namespace,
      image: config.collector.image,
      replicas: config.collector.replicas,
      logLevel: config.collector.logLevel,
      ports: config.ports,
    });
  }
}

const app = new Cdk8sApp();
new DebugExporterStack(app, 'otel-debug-exporter');
app.synth();
