import { App as Cdk8sApp, Chart } from 'cdk8s';
import { defaultConfig, type HyperDXConfig } from './config';
import { Namespace } from './namespace';
import { Database } from './db';
import { ClickHouse } from './ch-server';
import { OtelCollector } from './otel-collector';
import { App } from './app';

export class HyperDXStack extends Chart {
  constructor(scope: Cdk8sApp, id: string, config: HyperDXConfig = defaultConfig) {
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
        timestampValueExpression: 'TimestampTime',
        name: 'Logs',
        displayedTimestampValueExpression: 'Timestamp',
        implicitColumnExpression: 'Body',
        serviceNameExpression: 'ServiceName',
        bodyExpression: 'Body',
        eventAttributesExpression: 'LogAttributes',
        resourceAttributesExpression: 'ResourceAttributes',
        defaultTableSelectExpression: 'Timestamp,ServiceName,SeverityText,Body',
        severityTextExpression: 'SeverityText',
        traceIdExpression: 'TraceId',
        spanIdExpression: 'SpanId',
        connection: 'Local ClickHouse',
        traceSourceId: 'Traces',
        sessionSourceId: 'Sessions',
        metricSourceId: 'Metrics',
      },
      {
        from: { databaseName: 'default', tableName: 'otel_traces' },
        kind: 'trace',
        timestampValueExpression: 'Timestamp',
        name: 'Traces',
        displayedTimestampValueExpression: 'Timestamp',
        implicitColumnExpression: 'SpanName',
        serviceNameExpression: 'ServiceName',
        eventAttributesExpression: 'SpanAttributes',
        resourceAttributesExpression: 'ResourceAttributes',
        defaultTableSelectExpression: 'Timestamp,ServiceName,StatusCode,round(Duration/1e6),SpanName',
        traceIdExpression: 'TraceId',
        spanIdExpression: 'SpanId',
        durationExpression: 'Duration',
        durationPrecision: 9,
        parentSpanIdExpression: 'ParentSpanId',
        spanNameExpression: 'SpanName',
        spanKindExpression: 'SpanKind',
        statusCodeExpression: 'StatusCode',
        statusMessageExpression: 'StatusMessage',
        connection: 'Local ClickHouse',
        logSourceId: 'Logs',
        sessionSourceId: 'Sessions',
        metricSourceId: 'Metrics',
      },
      {
        from: { databaseName: 'default', tableName: '' },
        kind: 'metric',
        timestampValueExpression: 'TimeUnix',
        name: 'Metrics',
        resourceAttributesExpression: 'ResourceAttributes',
        metricTables: {
          gauge: 'otel_metrics_gauge',
          histogram: 'otel_metrics_histogram',
          sum: 'otel_metrics_sum',
          _id: '682586a8b1f81924e628e808',
          id: '682586a8b1f81924e628e808',
        },
        connection: 'Local ClickHouse',
        logSourceId: 'Logs',
        traceSourceId: 'Traces',
        sessionSourceId: 'Sessions',
      },
      {
        from: { databaseName: 'default', tableName: 'hyperdx_sessions' },
        kind: 'session',
        timestampValueExpression: 'TimestampTime',
        name: 'Sessions',
        displayedTimestampValueExpression: 'Timestamp',
        implicitColumnExpression: 'Body',
        serviceNameExpression: 'ServiceName',
        bodyExpression: 'Body',
        eventAttributesExpression: 'LogAttributes',
        resourceAttributesExpression: 'ResourceAttributes',
        defaultTableSelectExpression: 'Timestamp,ServiceName,SeverityText,Body',
        severityTextExpression: 'SeverityText',
        traceIdExpression: 'TraceId',
        spanIdExpression: 'SpanId',
        connection: 'Local ClickHouse',
        logSourceId: 'Logs',
        traceSourceId: 'Traces',
        metricSourceId: 'Metrics',
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
    });
  }
}

const app = new Cdk8sApp();
new HyperDXStack(app, 'hyperdx');
app.synth();
