package templates

#Config: {
  metadata: {
    name:      string
    namespace: string
  }
  moduleVersion: string

  db: {
    image:     *"mongo:5.0.32-focal" | string
    claimName: *"hyperdx-db-data" | string
  }
}

#Instance: {
  config: #Config
  objects: {
    dbDeployment: #DbDeployment & {#config: config}
    dbService:    #DbService & {#config: config}
  }
}
