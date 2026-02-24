package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
  ...
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
        storage: #config.storage.dataSize
      }
    }
  }
  if #config.storage.dataStorageClass != _|_ {
    spec: storageClassName: #config.storage.dataStorageClass
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
        storage: #config.storage.logSize
      }
    }
  }
  if #config.storage.logStorageClass != _|_ {
    spec: storageClassName: #config.storage.logStorageClass
  }
}
