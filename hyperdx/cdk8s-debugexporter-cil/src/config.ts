export interface DebugExporterPorts {
  health: number;
  pprof: number;
  zpages: number;
  otlpGrpc: number;
  otlpHttp: number;
  metrics: number;
}

export interface NodePortConfig {
  enabled: boolean;
  healthPort: number;
  otlpGrpcPort: number;
  otlpHttpPort: number;
  metricsPort: number;
}

export interface CiliumConfig {
  localhostOnly: boolean;
}

export interface DebugExporterCiliumConfig {
  namespace: string;
  collector: {
    image: string;
    replicas: number;
    logLevel: string;
  };
  ports: DebugExporterPorts;
  nodePort: NodePortConfig;
  cilium: CiliumConfig;
}

export const defaultConfig: DebugExporterCiliumConfig = {
  namespace: 'otel-debug-exporter',
  collector: {
    image: 'otel/opentelemetry-collector-contrib:0.102.1',
    replicas: 1,
    logLevel: 'debug',
  },
  ports: {
    health: 13133,
    pprof: 1777,
    zpages: 55679,
    otlpGrpc: 4317,
    otlpHttp: 4318,
    metrics: 8888,
  },
  nodePort: {
    enabled: true,
    healthPort: 30133,
    otlpGrpcPort: 30317,
    otlpHttpPort: 30318,
    metricsPort: 30888,
  },
  cilium: {
    localhostOnly: false,
  },
};
