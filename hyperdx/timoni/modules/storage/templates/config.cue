package templates

#Config: {
  metadata: {
    name:      string
    namespace: string
  }
  moduleVersion: string

  storage: {
    db: {
      size:             *"20Gi" | string
      storageClassName?: string
    }
    clickhouse: {
      dataSize:          *"100Gi" | string
      dataStorageClass?: string
      logSize:           *"10Gi" | string
      logStorageClass?:  string
    }
  }
}

#Instance: {
  config: #Config
  objects: {
    dbDataClaim: #DbDataClaim & {#config: config}
    chDataClaim: #ChDataClaim & {#config: config}
    chLogsClaim: #ChLogsClaim & {#config: config}
  }
}
