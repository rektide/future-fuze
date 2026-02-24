bundle: {
  apiVersion: "v1alpha1"
  name:       "hyperdx"
  instances: {
    "a-storage-mongo": {
      module: {
        url: "file://./modules/storage-mongo"
      }
      namespace: "hyperdx"
      values: {
        storage: size: "20Gi"
      }
    }
    "b-storage-mongo-init": {
      module: {
        url: "file://./modules/storage-mongo-init"
      }
      namespace: "hyperdx"
    }
    "c-stateful-mongo": {
      module: {
        url: "file://./modules/stateful-mongo"
      }
      namespace: "hyperdx"
    }
    "d-storage-clickhouse": {
      module: {
        url: "file://./modules/storage-clickhouse"
      }
      namespace: "hyperdx"
      values: {
        storage: {
          dataSize: "100Gi"
          logSize:  "10Gi"
        }
      }
    }
    "e-storage-clickhouse-init": {
      module: {
        url: "file://./modules/storage-clickhouse-init"
      }
      namespace: "hyperdx"
    }
    "f-stateful-clickhouse": {
      module: {
        url: "file://./modules/stateful-clickhouse"
      }
      namespace: "hyperdx"
    }
    "g-app": {
      module: {
        url: "file://./modules/app"
      }
      namespace: "hyperdx"
    }
  }
}
