package hyperdx

db: [{
	apiVersion: "v1"
	kind:       "PersistentVolumeClaim"
	metadata: {
		name:      "hyperdx-db-data"
		namespace: config.namespace
	}
	spec: {
		accessModes: ["ReadWriteOnce"]
		resources: {
			requests: {
				storage: config.db.storageSize
			}
		}
	}
}, {
	apiVersion: "apps/v1"
	kind:       "Deployment"
	metadata: {
		name:      "db"
		namespace: config.namespace
	}
	spec: {
		replicas: 1
		selector: {
			matchLabels: {
				app: "db"
			}
		}
		template: {
			metadata: {
				labels: {
					app: "db"
				}
			}
			spec: {
				containers: [{
					name:            "db"
					image:           config.db.image
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
						claimName: "hyperdx-db-data"
					}
				}]
			}
		}
	}
}, {
	apiVersion: "v1"
	kind:       "Service"
	metadata: {
		name:      "db"
		namespace: config.namespace
	}
	spec: {
		type: "ClusterIP"
		selector: {
			app: "db"
		}
		ports: [{
			name:       "mongo"
			port:       27017
			targetPort: 27017
		}]
	}
}]
