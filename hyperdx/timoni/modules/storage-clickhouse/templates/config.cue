package templates

#Config: {
  metadata: {
    name:      string
    namespace: string
  }
  moduleVersion: string

  storage: {
    dataSize:          *"100Gi" | string
    dataStorageClass?: string
    logSize:           *"10Gi" | string
    logStorageClass?:  string
  }
}

#Instance: {
  config: #Config
  objects: {
    chDataClaim:  #ChDataClaim & {#config: config}
    chLogsClaim:  #ChLogsClaim & {#config: config}
  }
}
