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
}

#Instance: {
  config: #Config
  objects: {
    dbInit: #DbInitJob & {#config: config}
  }
}
