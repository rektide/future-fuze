package hyperdx

otelCollector: [{
	apiVersion: "apps/v1"
	kind:       "Deployment"
	metadata: {
		name:      "otel-collector"
		namespace: config.namespace
	}
	spec: {
		replicas: 1
		selector: {
			matchLabels: {
				app: "otel-collector"
			}
		}
		template: {
			metadata: {
				labels: {
					app: "otel-collector"
				}
			}
			spec: {
				containers: [{
					name:            "otel-collector"
					image:           config.otelCollector.image
					imagePullPolicy: "IfNotPresent"
					env: [{
						name:  "CLICKHOUSE_ENDPOINT"
						value: "tcp://ch-server:\(config.clickhouse.nativePort)?dial_timeout=10s"
					}, {
						name:  "HYPERDX_OTEL_EXPORTER_CLICKHOUSE_DATABASE"
						value: "default"
					}, {
						name:  "HYPERDX_LOG_LEVEL"
						value: config.app.logLevel
					}, {
						name:  "OPAMP_SERVER_URL"
						value: "http://app:\(config.app.opampPort)"
					}, {
						name:  "HYPERDX_OTEL_EXPORTER_CREATE_LEGACY_SCHEMA"
						value: "true"
					}]
					ports: [{
						name:          "health"
						containerPort: config.otelCollector.ports.health
					}, {
						name:          "fluentd"
						containerPort: config.otelCollector.ports.fluentd
					}, {
						name:          "otlp-grpc"
						containerPort: config.otelCollector.ports.otlpGrpc
					}, {
						name:          "otlp-http"
						containerPort: config.otelCollector.ports.otlpHttp
					}, {
						name:          "metrics"
						containerPort: config.otelCollector.ports.metrics
					}]
				}]
			}
		}
	}
}, {
	apiVersion: "v1"
	kind:       "Service"
	metadata: {
		name:      "otel-collector"
		namespace: config.namespace
	}
	spec: {
		type: "ClusterIP"
		selector: {
			app: "otel-collector"
		}
		ports: [{
			name:       "health"
			port:       config.otelCollector.ports.health
			targetPort: config.otelCollector.ports.health
		}, {
			name:       "fluentd"
			port:       config.otelCollector.ports.fluentd
			targetPort: config.otelCollector.ports.fluentd
		}, {
			name:       "otlp-grpc"
			port:       config.otelCollector.ports.otlpGrpc
			targetPort: config.otelCollector.ports.otlpGrpc
		}, {
			name:       "otlp-http"
			port:       config.otelCollector.ports.otlpHttp
			targetPort: config.otelCollector.ports.otlpHttp
		}, {
			name:       "metrics"
			port:       config.otelCollector.ports.metrics
			targetPort: config.otelCollector.ports.metrics
		}]
	}
}]
