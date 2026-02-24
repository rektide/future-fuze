bundle: {
  apiVersion: "v1alpha1"
  name:       "hyperdx"
  instances: {
    "a-storage": {
      module: {
        url: "file://./modules/storage"
      }
      namespace: "hyperdx"
      values: {
        storage: {
          db: size: "20Gi"
          clickhouse: {
            dataSize: "100Gi"
            logSize:  "10Gi"
          }
        }
      }
    }
    "b-storage-init": {
      module: {
        url: "file://./modules/storage-init"
      }
      namespace: "hyperdx"
    }
    "c-stateful": {
      module: {
        url: "file://./modules/stateful"
      }
      namespace: "hyperdx"
    }
    "d-app": {
      module: {
        url: "file://./modules/app"
      }
      namespace: "hyperdx"
    }
  }
}
