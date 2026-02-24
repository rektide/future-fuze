package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
  ...
}

#ChDataInitJob: {
  #config: #Config
  apiVersion: "batch/v1"
  kind:       "Job"
  metadata: {
    name:      "ch-data-volume-init"
    namespace: #config.metadata.namespace
    labels:    #BaseLabels
  }
  spec: {
    backoffLimit: 2
    template: {
      spec: {
        restartPolicy: "OnFailure"
        initContainers: [{
          name:    "prepare-volume"
          image:   #config.initImage
          command: [
            "sh",
            "-c",
            "mkdir -p /var/lib/clickhouse && chown -R \(#config.clickhouseOwner.uid):\(#config.clickhouseOwner.gid) /var/lib/clickhouse && touch /var/lib/clickhouse/.hyperdx-initialized",
          ]
          securityContext: {
            runAsUser:  0
            runAsGroup: 0
          }
          volumeMounts: [{
            name:      "target"
            mountPath: "/var/lib/clickhouse"
          }]
        }]
        containers: [{
          name:    "done"
          image:   #config.initImage
          command: ["sh", "-c", "ls -la /volume && echo initialized"]
          volumeMounts: [{
            name:      "target"
            mountPath: "/volume"
          }]
        }]
        volumes: [{
          name: "target"
          persistentVolumeClaim: {
            claimName: "ch-data"
          }
        }]
      }
    }
  }
}

#ChLogsInitJob: {
  #config: #Config
  apiVersion: "batch/v1"
  kind:       "Job"
  metadata: {
    name:      "ch-logs-volume-init"
    namespace: #config.metadata.namespace
    labels:    #BaseLabels
  }
  spec: {
    backoffLimit: 2
    template: {
      spec: {
        restartPolicy: "OnFailure"
        initContainers: [{
          name:    "prepare-volume"
          image:   #config.initImage
          command: [
            "sh",
            "-c",
            "mkdir -p /var/log/clickhouse-server && chown -R \(#config.clickhouseOwner.uid):\(#config.clickhouseOwner.gid) /var/log/clickhouse-server && touch /var/log/clickhouse-server/.hyperdx-initialized",
          ]
          securityContext: {
            runAsUser:  0
            runAsGroup: 0
          }
          volumeMounts: [{
            name:      "target"
            mountPath: "/var/log/clickhouse-server"
          }]
        }]
        containers: [{
          name:    "done"
          image:   #config.initImage
          command: ["sh", "-c", "ls -la /volume && echo initialized"]
          volumeMounts: [{
            name:      "target"
            mountPath: "/volume"
          }]
        }]
        volumes: [{
          name: "target"
          persistentVolumeClaim: {
            claimName: "ch-logs"
          }
        }]
      }
    }
  }
}
