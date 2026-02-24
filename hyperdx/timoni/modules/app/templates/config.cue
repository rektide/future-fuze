package templates

#Config: {
  metadata: {
    name:      string
    namespace: string
  }
  moduleVersion: string

  app: {
    image:       *"docker.hyperdx.io/hyperdx/hyperdx:2" | string
    apiPort:     *8000 | int
    appPort:     *8080 | int
    opampPort:   *4320 | int
    logLevel:    *"debug" | string
    serviceType: *"LoadBalancer" | "ClusterIP" | "NodePort"
    apiKey:      *"replace-with-hyperdx-api-key" | string
    frontendUrl: *"http://localhost:8080" | string
    appUrl:      *"http://localhost" | string
    mongoUri:    *"mongodb://db:27017/hyperdx" | string
    otelEndpoint: *"http://otel-collector:4318" | string
  }

  otel: {
    image:        *"docker.clickhouse.com/clickstack-otel-collector:2" | string
    clickhouse:   *"tcp://ch-server:9000?dial_timeout=10s" | string
    database:     *"default" | string
    logLevel:     *"debug" | string
    opampServer:  *"http://app:4320" | string
    healthPort:   *13133 | int
    fluentdPort:  *24225 | int
    otlpGrpcPort: *4317 | int
    otlpHttpPort: *4318 | int
    metricsPort:  *8888 | int
  }
}

#Instance: {
  config: #Config
  objects: {
    appSecret:        #AppSecret & {#config: config}
    appConfig:        #AppConfigMap & {#config: config}
    appDeployment:    #AppDeployment & {#config: config}
    appService:       #AppService & {#config: config}
    otelDeployment:   #OtelDeployment & {#config: config}
    otelService:      #OtelService & {#config: config}
  }
}
