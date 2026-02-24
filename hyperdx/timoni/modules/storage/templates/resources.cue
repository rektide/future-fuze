package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
}

#DbDataClaim: {
  #config: #Config
  apiVersion: "v1"
  kind:       "PersistentVolumeClaim"
  metadata: {
    name:      "hyperdx-db-data"
    namespace: #config.metadata.namespace
    labels:    #BaseLabels
  }
  spec: {
    accessModes: ["ReadWriteOnce"]
    resources: {
      requests: {
        storage: #config.storage.db.size
      }
    }
  }
  if #config.storage.db.storageClassName != _|_ {
    spec: storageClassName: #config.storage.db.storageClassName
  }
}

#ChDataClaim: {
  #config: #Config
  apiVersion: "v1"
  kind:       "PersistentVolumeClaim"
  metadata: {
    name:      "ch-data"
    namespace: #config.metadata.namespace
    labels:    #BaseLabels
  }
  spec: {
    accessModes: ["ReadWriteOnce"]
    resources: {
      requests: {
        storage: #config.storage.clickhouse.dataSize
      }
    }
  }
  if #config.storage.clickhouse.dataStorageClass != _|_ {
    spec: storageClassName: #config.storage.clickhouse.dataStorageClass
  }
}

#ChLogsClaim: {
  #config: #Config
  apiVersion: "v1"
  kind:       "PersistentVolumeClaim"
  metadata: {
    name:      "ch-logs"
    namespace: #config.metadata.namespace
    labels:    #BaseLabels
  }
  spec: {
    accessModes: ["ReadWriteOnce"]
    resources: {
      requests: {
        storage: #config.storage.clickhouse.logSize
      }
    }
  }
  if #config.storage.clickhouse.logStorageClass != _|_ {
    spec: storageClassName: #config.storage.clickhouse.logStorageClass
  }
}
