package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
  ...
}

#DbInitJob: {
  #config: #Config
  apiVersion: "batch/v1"
  kind:       "Job"
  metadata: {
    name:      "db-volume-init"
    namespace: #config.metadata.namespace
    labels:    #BaseLabels
  }
  spec: {
    backoffLimit: 2
    template: {
      spec: {
        restartPolicy: "OnFailure"
        initContainers: [{
          name:    "prepare-volume"
          image:   #config.initImage
          command: [
            "sh",
            "-c",
            "mkdir -p /data/db && chown -R \(#config.dbOwner.uid):\(#config.dbOwner.gid) /data/db && touch /data/db/.hyperdx-initialized",
          ]
          securityContext: {
            runAsUser:  0
            runAsGroup: 0
          }
          volumeMounts: [{
            name:      "target"
            mountPath: "/data/db"
          }]
        }]
        containers: [{
          name:    "done"
          image:   #config.initImage
          command: ["sh", "-c", "ls -la /volume && echo initialized"]
          volumeMounts: [{
            name:      "target"
            mountPath: "/volume"
          }]
        }]
        volumes: [{
          name: "target"
          persistentVolumeClaim: {
            claimName: "hyperdx-db-data"
          }
        }]
      }
    }
  }
}
