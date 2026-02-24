package templates

#BaseLabels: {
  "app.kubernetes.io/managed-by": "timoni"
  "app.kubernetes.io/part-of":    "hyperdx"
  ...
}

#DbLabels: #BaseLabels & {
  "app.kubernetes.io/name": "db"
}

#DbDeployment: {
  #config: #Config
  apiVersion: "apps/v1"
  kind:       "Deployment"
  metadata: {
    name:      "db"
    namespace: #config.metadata.namespace
    labels:    #DbLabels
  }
  spec: {
    replicas: 1
    selector: matchLabels: #DbLabels
    template: {
      metadata: labels: #DbLabels
      spec: {
        initContainers: [{
          name:    "verify-volume"
          image:   "busybox:1.36.1"
          command: ["sh", "-c", "test -w /data/db && ls -la /data/db"]
          volumeMounts: [{
            name:      "db-data"
            mountPath: "/data/db"
          }]
        }]
        containers: [{
          name:            "db"
          image:           #config.db.image
          imagePullPolicy: "IfNotPresent"
          ports: [{
            name:          "mongo"
            containerPort: 27017
          }]
          volumeMounts: [{
            name:      "db-data"
            mountPath: "/data/db"
          }]
        }]
        volumes: [{
          name: "db-data"
          persistentVolumeClaim: {
            claimName: #config.db.claimName
          }
        }]
      }
    }
  }
}

#DbService: {
  #config: #Config
  apiVersion: "v1"
  kind:       "Service"
  metadata: {
    name:      "db"
    namespace: #config.metadata.namespace
    labels:    #DbLabels
  }
  spec: {
    type:     "ClusterIP"
    selector: #DbLabels
    ports: [{
      name:       "mongo"
      port:       27017
      targetPort: 27017
    }]
  }
}
