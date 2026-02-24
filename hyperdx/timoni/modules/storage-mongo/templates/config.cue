package templates

#Config: {
  metadata: {
    name:      string
    namespace: string
  }
  moduleVersion: string

  storage: {
    size:             *"20Gi" | string
    storageClassName?: string
  }
}

#Instance: {
  config: #Config
  objects: {
    dbDataClaim: #DbDataClaim & {#config: config}
  }
}
