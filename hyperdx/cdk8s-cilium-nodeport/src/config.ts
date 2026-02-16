export interface NodePortConfig {
  enabled: boolean;
  appPort: number;
  apiPort: number;
  otlpGrpcPort: number;
  otlpHttpPort: number;
}

export interface CiliumConfig {
  localhostOnly: boolean;
}

export interface HyperDXCiliumConfig {
  namespace: string;
  
  db: {
    image: string;
    storageSize: string;
  };
  
  clickhouse: {
    image: string;
    httpPort: number;
    nativePort: number;
    dataStorageSize: string;
    logsStorageSize: string;
  };
  
  otelCollector: {
    image: string;
    ports: {
      health: number;
      fluentd: number;
      otlpGrpc: number;
      otlpHttp: number;
      metrics: number;
    };
  };
  
  app: {
    image: string;
    apiPort: number;
    appPort: number;
    opampPort: number;
    logLevel: string;
  };
  
  nodePort: NodePortConfig;
  
  cilium: CiliumConfig;
}

export const defaultConfig: HyperDXCiliumConfig = {
  namespace: 'hyperdx',
  
  db: {
    image: 'mongo:5.0.32-focal',
    storageSize: '20Gi',
  },
  
  clickhouse: {
    image: 'clickhouse/clickhouse-server:25.6-alpine',
    httpPort: 8123,
    nativePort: 9000,
    dataStorageSize: '100Gi',
    logsStorageSize: '10Gi',
  },
  
  otelCollector: {
    image: 'docker.clickhouse.com/clickstack-otel-collector:2',
    ports: {
      health: 13133,
      fluentd: 24225,
      otlpGrpc: 4317,
      otlpHttp: 4318,
      metrics: 8888,
    },
  },
  
  app: {
    image: 'docker.hyperdx.io/hyperdx/hyperdx:2',
    apiPort: 8000,
    appPort: 8080,
    opampPort: 4320,
    logLevel: 'debug',
  },
  
  nodePort: {
    enabled: true,
    appPort: 30080,
    apiPort: 30000,
    otlpGrpcPort: 30317,
    otlpHttpPort: 30318,
  },
  
  cilium: {
    localhostOnly: false,
  },
};
