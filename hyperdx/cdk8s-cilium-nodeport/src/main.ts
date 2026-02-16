import { App as Cdk8sApp } from 'cdk8s';
import { Construct } from 'constructs';
import { defaultConfig, type HyperDXCiliumConfig } from './config.js';
import { Namespace } from './namespace.js';
import { Database } from './db.js';
import { ClickHouse } from './ch-server.js';
import { OtelCollector } from './otel-collector.js';
import { App } from './app.js';
import { CiliumLocalhostPolicy } from './cilium-policy.js';

export class HyperDXCiliumNodePortStack extends Construct {
  constructor(scope: Construct, id: string, config: HyperDXCiliumConfig = defaultConfig) {
    super(scope, id);
    
    new Namespace(this, 'namespace', { name: config.namespace });
    
    new Database(this, 'db', {
      namespace: config.namespace,
      image: config.db.image,
      storageSize: config.db.storageSize,
    });
    
    new ClickHouse(this, 'ch-server', {
      namespace: config.namespace,
      image: config.clickhouse.image,
      httpPort: config.clickhouse.httpPort,
      nativePort: config.clickhouse.nativePort,
      dataStorageSize: config.clickhouse.dataStorageSize,
      logsStorageSize: config.clickhouse.logsStorageSize,
    });
    
    new OtelCollector(this, 'otel-collector', {
      namespace: config.namespace,
      image: config.otelCollector.image,
      clickhouseHost: `ch-server:${config.clickhouse.nativePort}`,
      clickhouseDatabase: 'default',
      logLevel: config.app.logLevel,
      opampServerUrl: `http://app:${config.app.opampPort}`,
      ports: config.otelCollector.ports,
      nodePort: config.nodePort,
    });
    
    const defaultConnections = JSON.stringify([
      {
        name: 'Local ClickHouse',
        host: `http://ch-server:${config.clickhouse.httpPort}`,
        username: 'default',
        password: '',
      },
    ]);
    
    const defaultSources = JSON.stringify([
      {
        from: { databaseName: 'default', tableName: 'otel_logs' },
        kind: 'log',
        name: 'Logs',
        connection: 'Local ClickHouse',
      },
      {
        from: { databaseName: 'default', tableName: 'otel_traces' },
        kind: 'trace',
        name: 'Traces',
        connection: 'Local ClickHouse',
      },
      {
        from: { databaseName: 'default', tableName: '' },
        kind: 'metric',
        name: 'Metrics',
        connection: 'Local ClickHouse',
      },
      {
        from: { databaseName: 'default', tableName: 'hyperdx_sessions' },
        kind: 'session',
        name: 'Sessions',
        connection: 'Local ClickHouse',
      },
    ]);
    
    new App(this, 'app', {
      namespace: config.namespace,
      image: config.app.image,
      apiPort: config.app.apiPort,
      appPort: config.app.appPort,
      opampPort: config.app.opampPort,
      logLevel: config.app.logLevel,
      mongoUri: `mongodb://db:27017/hyperdx`,
      otelEndpoint: `http://otel-collector:${config.otelCollector.ports.otlpHttp}`,
      frontendUrl: 'http://localhost',
      appUrl: 'http://localhost',
      defaultConnections,
      defaultSources,
      nodePort: config.nodePort,
    });
    
    if (config.cilium.localhostOnly && config.nodePort.enabled) {
      new CiliumLocalhostPolicy(this, 'localhost-policy', {
        namespace: config.namespace,
        nodePorts: {
          appPort: config.nodePort.appPort,
          apiPort: config.nodePort.apiPort,
          otlpGrpcPort: config.nodePort.otlpGrpcPort,
          otlpHttpPort: config.nodePort.otlpHttpPort,
        },
      });
    }
  }
}

const app = new Cdk8sApp();
new HyperDXCiliumNodePortStack(app, 'hyperdx-cilium-nodeport');
app.synth();
