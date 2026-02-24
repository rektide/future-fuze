export interface DebugExporterPorts {
  health: number;
  pprof: number;
  zpages: number;
  otlpGrpc: number;
  otlpHttp: number;
  metrics: number;
}

export interface DebugExporterConfig {
  namespace: string;
  collector: {
    image: string;
    replicas: number;
    logLevel: string;
  };
  ports: DebugExporterPorts;
}

export const defaultConfig: DebugExporterConfig = {
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
};
