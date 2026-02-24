package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
  ...
}

#AppLabels: #BaseLabels & {
  "app.kubernetes.io/name": "app"
}

#OtelLabels: #BaseLabels & {
  "app.kubernetes.io/name": "otel-collector"
}

#DefaultConnections: "[{\"name\":\"Local ClickHouse\",\"host\":\"http://ch-server:8123\",\"username\":\"default\",\"password\":\"\"}]"
#DefaultSources: "[{\"from\":{\"databaseName\":\"default\",\"tableName\":\"otel_logs\"},\"kind\":\"log\",\"timestampValueExpression\":\"TimestampTime\",\"name\":\"Logs\",\"displayedTimestampValueExpression\":\"Timestamp\",\"implicitColumnExpression\":\"Body\",\"serviceNameExpression\":\"ServiceName\",\"bodyExpression\":\"Body\",\"eventAttributesExpression\":\"LogAttributes\",\"resourceAttributesExpression\":\"ResourceAttributes\",\"defaultTableSelectExpression\":\"Timestamp,ServiceName,SeverityText,Body\",\"severityTextExpression\":\"SeverityText\",\"traceIdExpression\":\"TraceId\",\"spanIdExpression\":\"SpanId\",\"connection\":\"Local ClickHouse\"}]"

#AppSecret: {
  #config: #Config
  apiVersion: "v1"
  kind:       "Secret"
  metadata: {
    name:      "app-secrets"
    namespace: #config.metadata.namespace
    labels:    #AppLabels
  }
  type: "Opaque"
  stringData: {
    HYPERDX_API_KEY: #config.app.apiKey
  }
}

#AppConfigMap: {
  #config: #Config
  apiVersion: "v1"
  kind:       "ConfigMap"
  metadata: {
    name:      "app-config"
    namespace: #config.metadata.namespace
    labels:    #AppLabels
  }
  data: {
    FRONTEND_URL:                #config.app.frontendUrl
    HYPERDX_API_PORT:            "\(#config.app.apiPort)"
    HYPERDX_APP_PORT:            "\(#config.app.appPort)"
    HYPERDX_APP_URL:             #config.app.appUrl
    HYPERDX_LOG_LEVEL:           #config.app.logLevel
    MINER_API_URL:               "http://miner:5123"
    MONGO_URI:                   #config.app.mongoUri
    SERVER_URL:                  "http://127.0.0.1:\(#config.app.apiPort)"
    OPAMP_PORT:                  "\(#config.app.opampPort)"
    OTEL_EXPORTER_OTLP_ENDPOINT: #config.app.otelEndpoint
    OTEL_SERVICE_NAME:           "hdx-oss-app"
    USAGE_STATS_ENABLED:         "true"
    DEFAULT_CONNECTIONS:         #DefaultConnections
    DEFAULT_SOURCES:             #DefaultSources
  }
}

#AppDeployment: {
  #config: #Config
  apiVersion: "apps/v1"
  kind:       "Deployment"
  metadata: {
    name:      "app"
    namespace: #config.metadata.namespace
    labels:    #AppLabels
  }
  spec: {
    replicas: 1
    selector: matchLabels: #AppLabels
    template: {
      metadata: labels: #AppLabels
      spec: {
        containers: [{
          name:            "app"
          image:           #config.app.image
          imagePullPolicy: "IfNotPresent"
          envFrom: [{
            configMapRef: {
              name: "app-config"
            }
          }]
          env: [{
            name: "HYPERDX_API_KEY"
            valueFrom: {
              secretKeyRef: {
                name: "app-secrets"
                key:  "HYPERDX_API_KEY"
              }
            }
          }]
          ports: [
            {
              name:          "api"
              containerPort: #config.app.apiPort
            },
            {
              name:          "app"
              containerPort: #config.app.appPort
            },
            {
              name:          "opamp"
              containerPort: #config.app.opampPort
            },
          ]
        }]
      }
    }
  }
}

#AppService: {
  #config: #Config
  apiVersion: "v1"
  kind:       "Service"
  metadata: {
    name:      "app"
    namespace: #config.metadata.namespace
    labels:    #AppLabels
  }
  spec: {
    type:     #config.app.serviceType
    selector: #AppLabels
    ports: [
      {
        name:       "api"
        port:       #config.app.apiPort
        targetPort: #config.app.apiPort
      },
      {
        name:       "app"
        port:       #config.app.appPort
        targetPort: #config.app.appPort
      },
      {
        name:       "opamp"
        port:       #config.app.opampPort
        targetPort: #config.app.opampPort
      },
    ]
  }
}

#OtelDeployment: {
  #config: #Config
  apiVersion: "apps/v1"
  kind:       "Deployment"
  metadata: {
    name:      "otel-collector"
    namespace: #config.metadata.namespace
    labels:    #OtelLabels
  }
  spec: {
    replicas: 1
    selector: matchLabels: #OtelLabels
    template: {
      metadata: labels: #OtelLabels
      spec: {
        containers: [{
          name:            "otel-collector"
          image:           #config.otel.image
          imagePullPolicy: "IfNotPresent"
          env: [
            {
              name:  "CLICKHOUSE_ENDPOINT"
              value: #config.otel.clickhouse
            },
            {
              name:  "HYPERDX_OTEL_EXPORTER_CLICKHOUSE_DATABASE"
              value: #config.otel.database
            },
            {
              name:  "HYPERDX_LOG_LEVEL"
              value: #config.otel.logLevel
            },
            {
              name:  "OPAMP_SERVER_URL"
              value: #config.otel.opampServer
            },
            {
              name:  "HYPERDX_OTEL_EXPORTER_CREATE_LEGACY_SCHEMA"
              value: "true"
            },
          ]
          ports: [
            {
              name:          "health"
              containerPort: #config.otel.healthPort
            },
            {
              name:          "fluentd"
              containerPort: #config.otel.fluentdPort
            },
            {
              name:          "otlp-grpc"
              containerPort: #config.otel.otlpGrpcPort
            },
            {
              name:          "otlp-http"
              containerPort: #config.otel.otlpHttpPort
            },
            {
              name:          "metrics"
              containerPort: #config.otel.metricsPort
            },
          ]
        }]
      }
    }
  }
}

#OtelService: {
  #config: #Config
  apiVersion: "v1"
  kind:       "Service"
  metadata: {
    name:      "otel-collector"
    namespace: #config.metadata.namespace
    labels:    #OtelLabels
  }
  spec: {
    type:     "ClusterIP"
    selector: #OtelLabels
    ports: [
      {
        name:       "health"
        port:       #config.otel.healthPort
        targetPort: #config.otel.healthPort
      },
      {
        name:       "fluentd"
        port:       #config.otel.fluentdPort
        targetPort: #config.otel.fluentdPort
      },
      {
        name:       "otlp-grpc"
        port:       #config.otel.otlpGrpcPort
        targetPort: #config.otel.otlpGrpcPort
      },
      {
        name:       "otlp-http"
        port:       #config.otel.otlpHttpPort
        targetPort: #config.otel.otlpHttpPort
      },
      {
        name:       "metrics"
        port:       #config.otel.metricsPort
        targetPort: #config.otel.metricsPort
      },
    ]
  }
}
