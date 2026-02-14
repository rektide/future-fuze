package hyperdx

#Config: {
	namespace: string

	db: {
		image:       string
		storageSize: string
	}

	clickhouse: {
		image:           string
		httpPort:        int
		nativePort:      int
		dataStorageSize: string
		logsStorageSize: string
	}

	otelCollector: {
		image: string
		ports: {
			health:   int
			fluentd:  int
			otlpGrpc: int
			otlpHttp: int
			metrics:  int
		}
	}

	app: {
		image:        string
		apiPort:      int
		appPort:      int
		opampPort:    int
		logLevel:     string
		frontendUrl:  string
		appUrl:       string
	}
}

config: #Config & {
	namespace: "hyperdx"

	db: {
		image:       "mongo:5.0.32-focal"
		storageSize: "20Gi"
	}

	clickhouse: {
		image:           "clickhouse/clickhouse-server:25.6-alpine"
		httpPort:        8123
		nativePort:      9000
		dataStorageSize: "100Gi"
		logsStorageSize: "10Gi"
	}

	otelCollector: {
		image: "docker.clickhouse.com/clickstack-otel-collector:2"
		ports: {
			health:   13133
			fluentd:  24225
			otlpGrpc: 4317
			otlpHttp: 4318
			metrics:  8888
		}
	}

	app: {
		image:       "docker.hyperdx.io/hyperdx/hyperdx:2"
		apiPort:     8000
		appPort:     8080
		opampPort:   4320
		logLevel:    "debug"
		frontendUrl: "http://localhost"
		appUrl:      "http://localhost"
	}
}
