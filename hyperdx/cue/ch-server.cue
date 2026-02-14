package hyperdx

clickhouse: [{
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: {
		name:      "ch-server-config"
		namespace: config.namespace
	}
	data: {
		"config.xml": """
<?xml version="1.0"?>
<clickhouse>
    <logger>
        <level>debug</level>
        <console>true</console>
        <log remove="remove" />
        <errorlog remove="remove" />
    </logger>
    <listen_host>0.0.0.0</listen_host>
    <http_port>\(config.clickhouse.httpPort)</http_port>
    <tcp_port>\(config.clickhouse.nativePort)</tcp_port>
    <interserver_http_host>ch-server</interserver_http_host>
    <interserver_http_port>9009</interserver_http_port>
    <max_connections>4096</max_connections>
    <keep_alive_timeout>64</keep_alive_timeout>
    <max_concurrent_queries>100</max_concurrent_queries>
    <uncompressed_cache_size>8589934592</uncompressed_cache_size>
    <mark_cache_size>5368709120</mark_cache_size>
    <path>/var/lib/clickhouse/</path>
    <tmp_path>/var/lib/clickhouse/tmp/</tmp_path>
    <user_files_path>/var/lib/clickhouse/user_files/</user_files_path>
    <user_directories>
        <users_xml>
            <path>users.xml</path>
        </users_xml>
    </user_directories>
    <default_profile>default</default_profile>
    <default_database>default</default_database>
    <timezone>UTC</timezone>
    <mlock_executable>false</mlock_executable>
    <prometheus>
        <endpoint>/metrics</endpoint>
        <port>9363</port>
        <metrics>true</metrics>
        <events>true</events>
        <asynchronous_metrics>true</asynchronous_metrics>
        <errors>true</errors>
    </prometheus>
    <query_log>
        <database>system</database>
        <table>query_log</table>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </query_log>
    <metric_log>
        <database>system</database>
        <table>metric_log</table>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
        <collect_interval_milliseconds>1000</collect_interval_milliseconds>
    </metric_log>
    <asynchronous_metric_log>
        <database>system</database>
        <table>asynchronous_metric_log</table>
        <flush_interval_milliseconds>7000</flush_interval_milliseconds>
    </asynchronous_metric_log>
    <opentelemetry_span_log>
        <engine>
            engine MergeTree
            partition by toYYYYMM(finish_date)
            order by (finish_date, finish_time_us, trace_id)
        </engine>
        <database>system</database>
        <table>opentelemetry_span_log</table>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </opentelemetry_span_log>
    <crash_log>
        <database>system</database>
        <table>crash_log</table>
        <partition_by />
        <flush_interval_milliseconds>1000</flush_interval_milliseconds>
    </crash_log>
    <processors_profile_log>
        <database>system</database>
        <table>processors_profile_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </processors_profile_log>
    <part_log>
        <database>system</database>
        <table>part_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </part_log>
    <trace_log>
        <database>system</database>
        <table>trace_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </trace_log>
    <query_thread_log>
        <database>system</database>
        <table>query_thread_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </query_thread_log>
    <query_views_log>
        <database>system</database>
        <table>query_views_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </query_views_log>
    <remote_servers>
        <hdx_cluster>
            <shard>
                <replica>
                    <host>ch-server</host>
                    <port>\(config.clickhouse.nativePort)</port>
                </replica>
            </shard>
        </hdx_cluster>
    </remote_servers>
    <distributed_ddl>
        <path>/clickhouse/task_queue/ddl</path>
    </distributed_ddl>
    <format_schema_path>/var/lib/clickhouse/format_schemas/</format_schema_path>
    <custom_settings_prefixes>hyperdx</custom_settings_prefixes>
</clickhouse>
"""
		"users.xml": """
<?xml version="1.0"?>
<clickhouse>
    <profiles>
        <default>
            <max_memory_usage>10000000000</max_memory_usage>
            <use_uncompressed_cache>0</use_uncompressed_cache>
            <load_balancing>in_order</load_balancing>
            <log_queries>1</log_queries>
        </default>
    </profiles>
    <users>
        <default>
            <password></password>
            <profile>default</profile>
            <networks>
                <ip>::/0</ip>
            </networks>
            <quota>default</quota>
        </default>
        <api>
            <password>api</password>
            <profile>default</profile>
            <networks>
                <ip>::/0</ip>
            </networks>
            <quota>default</quota>
        </api>
        <worker>
            <password>worker</password>
            <profile>default</profile>
            <networks>
                <ip>::/0</ip>
            </networks>
            <quota>default</quota>
        </worker>
    </users>
    <quotas>
        <default>
            <interval>
                <duration>3600</duration>
                <queries>0</queries>
                <errors>0</errors>
                <result_rows>0</result_rows>
                <read_rows>0</read_rows>
                <execution_time>0</execution_time>
            </interval>
        </default>
    </quotas>
</clickhouse>
"""
	}
}, {
	apiVersion: "v1"
	kind:       "PersistentVolumeClaim"
	metadata: {
		name:      "ch-data"
		namespace: config.namespace
	}
	spec: {
		accessModes: ["ReadWriteOnce"]
		resources: {
			requests: {
				storage: config.clickhouse.dataStorageSize
			}
		}
	}
}, {
	apiVersion: "v1"
	kind:       "PersistentVolumeClaim"
	metadata: {
		name:      "ch-logs"
		namespace: config.namespace
	}
	spec: {
		accessModes: ["ReadWriteOnce"]
		resources: {
			requests: {
				storage: config.clickhouse.logsStorageSize
			}
		}
	}
}, {
	apiVersion: "apps/v1"
	kind:       "Deployment"
	metadata: {
		name:      "ch-server"
		namespace: config.namespace
	}
	spec: {
		replicas: 1
		selector: {
			matchLabels: {
				app: "ch-server"
			}
		}
		template: {
			metadata: {
				labels: {
					app: "ch-server"
				}
			}
			spec: {
				containers: [{
					name:            "ch-server"
					image:           config.clickhouse.image
					imagePullPolicy: "IfNotPresent"
					env: [{
						name:  "CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT"
						value: "1"
					}]
					ports: [{
						name:          "http"
						containerPort: config.clickhouse.httpPort
					}, {
						name:          "native"
						containerPort: config.clickhouse.nativePort
					}]
					volumeMounts: [{
						name:      "config"
						mountPath: "/etc/clickhouse-server/config.xml"
						subPath:   "config.xml"
					}, {
						name:      "config"
						mountPath: "/etc/clickhouse-server/users.xml"
						subPath:   "users.xml"
					}, {
						name:      "ch-data"
						mountPath: "/var/lib/clickhouse"
					}, {
						name:      "ch-logs"
						mountPath: "/var/log/clickhouse-server"
					}]
				}]
				volumes: [{
					name: "config"
					configMap: {
						name: "ch-server-config"
					}
				}, {
					name: "ch-data"
					persistentVolumeClaim: {
						claimName: "ch-data"
					}
				}, {
					name: "ch-logs"
					persistentVolumeClaim: {
						claimName: "ch-logs"
					}
				}]
			}
		}
	}
}, {
	apiVersion: "v1"
	kind:       "Service"
	metadata: {
		name:      "ch-server"
		namespace: config.namespace
	}
	spec: {
		type: "ClusterIP"
		selector: {
			app: "ch-server"
		}
		ports: [{
			name:       "http"
			port:       config.clickhouse.httpPort
			targetPort: config.clickhouse.httpPort
		}, {
			name:       "native"
			port:       config.clickhouse.nativePort
			targetPort: config.clickhouse.nativePort
		}]
	}
}]
