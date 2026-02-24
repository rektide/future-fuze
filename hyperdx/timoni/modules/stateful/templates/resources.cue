package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
  ...
}

#DbLabels: #BaseLabels & {
  "app.kubernetes.io/name": "db"
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

#DbDeployment: {
  #config: #Config
  apiVersion: "apps/v1"
  kind:       "Deployment"
  metadata: {
    name:      "db"
    namespace: #config.metadata.namespace
    labels:    #DbLabels
  }
  spec: {
    replicas: 1
    selector: matchLabels: #DbLabels
    template: {
      metadata: labels: #DbLabels
      spec: {
        initContainers: [{
          name:    "verify-volume"
          image:   "busybox:1.36.1"
          command: ["sh", "-c", "test -w /data/db && ls -la /data/db"]
          volumeMounts: [{
            name:      "db-data"
            mountPath: "/data/db"
          }]
        }]
        containers: [{
          name:            "db"
          image:           #config.db.image
          imagePullPolicy: "IfNotPresent"
          ports: [{
            name:          "mongo"
            containerPort: 27017
          }]
          volumeMounts: [{
            name:      "db-data"
            mountPath: "/data/db"
          }]
        }]
        volumes: [{
          name: "db-data"
          persistentVolumeClaim: {
            claimName: #config.db.claimName
          }
        }]
      }
    }
  }
}

#DbService: {
  #config: #Config
  apiVersion: "v1"
  kind:       "Service"
  metadata: {
    name:      "db"
    namespace: #config.metadata.namespace
    labels:    #DbLabels
  }
  spec: {
    type:     "ClusterIP"
    selector: #DbLabels
    ports: [{
      name:       "mongo"
      port:       27017
      targetPort: 27017
    }]
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
