package templates

#Config: {
  metadata: {
    name:      string
    namespace: string
  }
  moduleVersion: string
  initImage:     *"busybox:1.36.1" | string
  clickhouseOwner: {
    uid: *101 | int
    gid: *101 | int
  }
}

#Instance: {
  config: #Config
  objects: {
    chDataInit: #ChDataInitJob & {#config: config}
    chLogsInit: #ChLogsInitJob & {#config: config}
  }
}
