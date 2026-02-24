package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
  ...
}

#ClickHouseLabels: #BaseLabels & {
  "app.kubernetes.io/name": "ch-server"
}

#ClickHouseConfigMap: {
  #config: #Config
  apiVersion: "v1"
  kind:       "ConfigMap"
  metadata: {
    name:      "ch-server-config"
    namespace: #config.metadata.namespace
    labels:    #ClickHouseLabels
  }
  data: {
    "config.xml": """
<?xml version="1.0"?>
<clickhouse>
  <listen_host>0.0.0.0</listen_host>
  <http_port>\(#config.clickhouse.httpPort)</http_port>
  <tcp_port>\(#config.clickhouse.nativePort)</tcp_port>
  <interserver_http_host>ch-server</interserver_http_host>
  <interserver_http_port>9009</interserver_http_port>
  <path>/var/lib/clickhouse/</path>
  <tmp_path>/var/lib/clickhouse/tmp/</tmp_path>
  <user_files_path>/var/lib/clickhouse/user_files/</user_files_path>
</clickhouse>
"""
    "users.xml": """
<?xml version="1.0"?>
<clickhouse>
  <users>
    <default>
      <password></password>
      <profile>default</profile>
      <networks>
        <ip>::/0</ip>
      </networks>
      <quota>default</quota>
    </default>
  </users>
</clickhouse>
"""
  }
}

#ClickHouseDeployment: {
  #config: #Config
  apiVersion: "apps/v1"
  kind:       "Deployment"
  metadata: {
    name:      "ch-server"
    namespace: #config.metadata.namespace
    labels:    #ClickHouseLabels
  }
  spec: {
    replicas: 1
    selector: matchLabels: #ClickHouseLabels
    template: {
      metadata: labels: #ClickHouseLabels
      spec: {
        initContainers: [{
          name:    "verify-clickhouse-volumes"
          image:   "busybox:1.36.1"
          command: ["sh", "-c", "test -w /var/lib/clickhouse && test -w /var/log/clickhouse-server"]
          volumeMounts: [
            {
              name:      "ch-data"
              mountPath: "/var/lib/clickhouse"
            },
            {
              name:      "ch-logs"
              mountPath: "/var/log/clickhouse-server"
            },
          ]
        }]
        containers: [{
          name:            "ch-server"
          image:           #config.clickhouse.image
          imagePullPolicy: "IfNotPresent"
          env: [{
            name:  "CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT"
            value: "1"
          }]
          ports: [
            {
              name:          "http"
              containerPort: #config.clickhouse.httpPort
            },
            {
              name:          "native"
              containerPort: #config.clickhouse.nativePort
            },
          ]
          volumeMounts: [
            {
              name:      "config"
              mountPath: "/etc/clickhouse-server/config.xml"
              subPath:   "config.xml"
            },
            {
              name:      "config"
              mountPath: "/etc/clickhouse-server/users.xml"
              subPath:   "users.xml"
            },
            {
              name:      "ch-data"
              mountPath: "/var/lib/clickhouse"
            },
            {
              name:      "ch-logs"
              mountPath: "/var/log/clickhouse-server"
            },
          ]
        }]
        volumes: [
          {
            name: "config"
            configMap: {
              name: "ch-server-config"
            }
          },
          {
            name: "ch-data"
            persistentVolumeClaim: {
              claimName: #config.clickhouse.dataClaimName
            }
          },
          {
            name: "ch-logs"
            persistentVolumeClaim: {
              claimName: #config.clickhouse.logsClaimName
            }
          },
        ]
      }
    }
  }
}

#ClickHouseService: {
  #config: #Config
  apiVersion: "v1"
  kind:       "Service"
  metadata: {
    name:      "ch-server"
    namespace: #config.metadata.namespace
    labels:    #ClickHouseLabels
  }
  spec: {
    type:     "ClusterIP"
    selector: #ClickHouseLabels
    ports: [
      {
        name:       "http"
        port:       #config.clickhouse.httpPort
        targetPort: #config.clickhouse.httpPort
      },
      {
        name:       "native"
        port:       #config.clickhouse.nativePort
        targetPort: #config.clickhouse.nativePort
      },
    ]
  }
}
