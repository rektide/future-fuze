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

  clickhouse: {
    image:          *"clickhouse/clickhouse-server:25.6-alpine" | string
    httpPort:       *8123 | int
    nativePort:     *9000 | int
    dataClaimName:  *"ch-data" | string
    logsClaimName:  *"ch-logs" | string
  }
}

#Instance: {
  config: #Config
  objects: {
    chConfig:      #ClickHouseConfigMap & {#config: config}
    dbDeployment:  #DbDeployment & {#config: config}
    dbService:     #DbService & {#config: config}
    chDeployment:  #ClickHouseDeployment & {#config: config}
    chService:     #ClickHouseService & {#config: config}
  }
}
