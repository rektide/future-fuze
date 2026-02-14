package hyperdx

import "encoding/json"

app: [{
	apiVersion: "v1"
	kind:       "Secret"
	metadata: {
		name:      "app-secrets"
		namespace: config.namespace
	}
	type: "Opaque"
	stringData: {
		HYPERDX_API_KEY: "replace-with-hyperdx-api-key"
	}
}, {
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: {
		name:      "app-config"
		namespace: config.namespace
	}
	data: {
		FRONTEND_URL:                "\(config.app.frontendUrl):\(config.app.appPort)"
		HYPERDX_API_PORT:            "\(config.app.apiPort)"
		HYPERDX_APP_PORT:            "\(config.app.appPort)"
		HYPERDX_APP_URL:             config.app.appUrl
		HYPERDX_LOG_LEVEL:           config.app.logLevel
		MINER_API_URL:               "http://miner:5123"
		MONGO_URI:                   "mongodb://db:27017/hyperdx"
		SERVER_URL:                  "http://127.0.0.1:\(config.app.apiPort)"
		OPAMP_PORT:                  "\(config.app.opampPort)"
		OTEL_EXPORTER_OTLP_ENDPOINT: "http://otel-collector:\(config.otelCollector.ports.otlpHttp)"
		OTEL_SERVICE_NAME:           "hdx-oss-app"
		USAGE_STATS_ENABLED:         "true"
		DEFAULT_CONNECTIONS:         json.Marshal([{
			name:     "Local ClickHouse"
			host:     "http://ch-server:\(config.clickhouse.httpPort)"
			username: "default"
			password: ""
		}])
		DEFAULT_SOURCES: json.Marshal([{
			from: {
				databaseName: "default"
				tableName:    "otel_logs"
			}
			kind:                        "log"
			timestampValueExpression:    "TimestampTime"
			name:                        "Logs"
			displayedTimestampValueExpression: "Timestamp"
			implicitColumnExpression:    "Body"
			serviceNameExpression:       "ServiceName"
			bodyExpression:              "Body"
			eventAttributesExpression:   "LogAttributes"
			resourceAttributesExpression: "ResourceAttributes"
			defaultTableSelectExpression: "Timestamp,ServiceName,SeverityText,Body"
			severityTextExpression:      "SeverityText"
			traceIdExpression:           "TraceId"
			spanIdExpression:            "SpanId"
			connection:                  "Local ClickHouse"
			traceSourceId:               "Traces"
			sessionSourceId:             "Sessions"
			metricSourceId:              "Metrics"
		}, {
			from: {
				databaseName: "default"
				tableName:    "otel_traces"
			}
			kind:                        "trace"
			timestampValueExpression:    "Timestamp"
			name:                        "Traces"
			displayedTimestampValueExpression: "Timestamp"
			implicitColumnExpression:    "SpanName"
			serviceNameExpression:       "ServiceName"
			eventAttributesExpression:   "SpanAttributes"
			resourceAttributesExpression: "ResourceAttributes"
			defaultTableSelectExpression: "Timestamp,ServiceName,StatusCode,round(Duration/1e6),SpanName"
			traceIdExpression:           "TraceId"
			spanIdExpression:            "SpanId"
			durationExpression:          "Duration"
			durationPrecision:           9
			parentSpanIdExpression:      "ParentSpanId"
			spanNameExpression:          "SpanName"
			spanKindExpression:          "SpanKind"
			statusCodeExpression:        "StatusCode"
			statusMessageExpression:     "StatusMessage"
			connection:                  "Local ClickHouse"
			logSourceId:                 "Logs"
			sessionSourceId:             "Sessions"
			metricSourceId:              "Metrics"
		}, {
			from: {
				databaseName: "default"
				tableName:    ""
			}
			kind:                        "metric"
			timestampValueExpression:    "TimeUnix"
			name:                        "Metrics"
			resourceAttributesExpression: "ResourceAttributes"
			metricTables: {
				gauge:     "otel_metrics_gauge"
				histogram: "otel_metrics_histogram"
				sum:       "otel_metrics_sum"
				_id:       "682586a8b1f81924e628e808"
				id:        "682586a8b1f81924e628e808"
			}
			connection:      "Local ClickHouse"
			logSourceId:     "Logs"
			traceSourceId:   "Traces"
			sessionSourceId: "Sessions"
		}, {
			from: {
				databaseName: "default"
				tableName:    "hyperdx_sessions"
			}
			kind:                        "session"
			timestampValueExpression:    "TimestampTime"
			name:                        "Sessions"
			displayedTimestampValueExpression: "Timestamp"
			implicitColumnExpression:    "Body"
			serviceNameExpression:       "ServiceName"
			bodyExpression:              "Body"
			eventAttributesExpression:   "LogAttributes"
			resourceAttributesExpression: "ResourceAttributes"
			defaultTableSelectExpression: "Timestamp,ServiceName,SeverityText,Body"
			severityTextExpression:      "SeverityText"
			traceIdExpression:           "TraceId"
			spanIdExpression:            "SpanId"
			connection:                  "Local ClickHouse"
			logSourceId:                 "Logs"
			traceSourceId:               "Traces"
			metricSourceId:              "Metrics"
		}])
	}
}, {
	apiVersion: "apps/v1"
	kind:       "Deployment"
	metadata: {
		name:      "app"
		namespace: config.namespace
	}
	spec: {
		replicas: 1
		selector: {
			matchLabels: {
				app: "app"
			}
		}
		template: {
			metadata: {
				labels: {
					app: "app"
				}
			}
			spec: {
				containers: [{
					name:            "app"
					image:           config.app.image
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
					ports: [{
						name:          "api"
						containerPort: config.app.apiPort
					}, {
						name:          "app"
						containerPort: config.app.appPort
					}, {
						name:          "opamp"
						containerPort: config.app.opampPort
					}]
				}]
			}
		}
	}
}, {
	apiVersion: "v1"
	kind:       "Service"
	metadata: {
		name:      "app"
		namespace: config.namespace
	}
	spec: {
		type: "LoadBalancer"
		selector: {
			app: "app"
		}
		ports: [{
			name:       "api"
			port:       config.app.apiPort
			targetPort: config.app.apiPort
		}, {
			name:       "app"
			port:       config.app.appPort
			targetPort: config.app.appPort
		}, {
			name:       "opamp"
			port:       config.app.opampPort
			targetPort: config.app.opampPort
		}]
	}
}]
