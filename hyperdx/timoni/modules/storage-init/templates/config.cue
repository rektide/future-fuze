package templates

#Config: {
  metadata: {
    name:      string
    namespace: string
  }
  moduleVersion: string
  initImage:     *"busybox:1.36.1" | string
  dbOwner: {
    uid: *999 | int
    gid: *999 | int
  }
  clickhouseOwner: {
    uid: *101 | int
    gid: *101 | int
  }
}

#Instance: {
  config: #Config
  objects: {
    dbInit:     #DbInitJob & {#config: config}
    chDataInit: #ChDataInitJob & {#config: config}
    chLogsInit: #ChLogsInitJob & {#config: config}
  }
}
