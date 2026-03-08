import { Construct } from "constructs"
import { App, Chart, Duration } from "cdk8s"
import * as kplus from "cdk8s-plus-26"
import { Deployment } from "cdk8s-plus-26"

export interface NodePortConfig {
	enabled: boolean
	port: number
}

export interface PodInfoConfig {
	namespace: string
	image: string
	port: number
	nodePort: NodePortConfig
}

export const defaultConfig: PodInfoConfig = {
	namespace: "default",
	image: "stefanprodan/podinfo:3.0.0",
	port: 9898,
	nodePort: {
		enabled: true,
		port: 30980,
	},
}

export class PodInfo extends Chart {
	constructor(scope: Construct, id: string, config: PodInfoConfig = defaultConfig) {
		super(scope, id)

		const deployment = new Deployment(this, "Deployment")

		deployment.metadata.addAnnotation("prometheus.io/scrape", "true")
		deployment.metadata.addAnnotation(
			"prometheus.io/port",
			config.port.toString(),
		)

		const container = deployment.addContainer({
			image: config.image,
			command: [
				"./podinfo",
				`--port=${config.port}`,
				"--level=info",
				"--random-error=true",
			],
			imagePullPolicy: kplus.ImagePullPolicy.IF_NOT_PRESENT,
			portNumber: config.port,
			liveness: kplus.Probe.fromCommand(
				["podcli", "check", "http", `localhost:${config.port}/healthz`],
				{
					initialDelaySeconds: Duration.seconds(1),
					timeoutSeconds: Duration.seconds(5),
				},
			),
			readiness: kplus.Probe.fromCommand(
				["podcli", "check", "http", `localhost:${config.port}/readyz`],
				{
					initialDelaySeconds: Duration.seconds(1),
					timeoutSeconds: Duration.seconds(5),
				},
			),
		})
		container.env.addVariable(
			"PODINFO_UI_MESSAGE",
			kplus.EnvValue.fromValue("this is my podinfo message"),
		)
		container.mount("/data", kplus.Volume.fromEmptyDir(this, "data", "data"))

		new kplus.HorizontalPodAutoscaler(this, "HPA", {
			target: deployment,
			maxReplicas: 100,
			minReplicas: 2,
			metrics: [
				kplus.Metric.resourceCpu(kplus.MetricTarget.averageUtilization(80)),
			],
		})

		const serviceType = config.nodePort.enabled ? kplus.ServiceType.NODE_PORT : kplus.ServiceType.CLUSTER_IP

		new kplus.Service(this, "service", {
			type: serviceType,
			externalTrafficPolicy: config.nodePort.enabled ? "Local" : undefined,
			selector: deployment,
			ports: [{
				port: config.port,
				targetPort: config.port,
				nodePort: config.nodePort.enabled ? config.nodePort.port : undefined,
			}],
		})
	}
}

const app = new App()
new PodInfo(app, "pod-info")
app.synth()
