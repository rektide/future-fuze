package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
  ...
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
        storage: #config.storage.size
      }
    }
  }
  if #config.storage.storageClassName != _|_ {
    spec: storageClassName: #config.storage.storageClassName
  }
}
