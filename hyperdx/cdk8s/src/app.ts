import { Construct } from "constructs";
import { Chart, ChartProps } from "cdk8s";
import * as kplus from "cdk8s-plus-33";

export interface AppProps extends ChartProps {
  readonly namespace: string;
  readonly image: string;
  readonly apiPort: number;
  readonly appPort: number;
  readonly opampPort: number;
  readonly logLevel: string;
  readonly mongoUri: string;
  readonly otelEndpoint: string;
  readonly frontendUrl: string;
  readonly appUrl: string;
  readonly defaultConnections: string;
  readonly defaultSources: string;
}

export class App extends Chart {
  constructor(scope: Construct, id: string, props: AppProps) {
    super(scope, id, props);

    const secret = new kplus.Secret(this, "secrets", {
      metadata: {
        name: "app-secrets",
        namespace: props.namespace,
      },
      stringData: {
        HYPERDX_API_KEY: "replace-with-hyperdx-api-key",
      },
    });

    const configMap = new kplus.ConfigMap(this, "config", {
      metadata: {
        name: "app-config",
        namespace: props.namespace,
      },
      data: {
        FRONTEND_URL: `${props.frontendUrl}:${props.appPort}`,
        HYPERDX_API_PORT: props.apiPort.toString(),
        HYPERDX_APP_PORT: props.appPort.toString(),
        HYPERDX_APP_URL: props.appUrl,
        HYPERDX_LOG_LEVEL: props.logLevel,
        MINER_API_URL: "http://miner:5123",
        MONGO_URI: props.mongoUri,
        SERVER_URL: `http://127.0.0.1:${props.apiPort}`,
        OPAMP_PORT: props.opampPort.toString(),
        OTEL_EXPORTER_OTLP_ENDPOINT: props.otelEndpoint,
        OTEL_SERVICE_NAME: "hdx-oss-app",
        USAGE_STATS_ENABLED: "true",
        DEFAULT_CONNECTIONS: props.defaultConnections,
        DEFAULT_SOURCES: props.defaultSources,
      },
    });

    const deployment = new kplus.Deployment(this, "deployment", {
      metadata: {
        name: "app",
        namespace: props.namespace,
      },
      replicas: 1,
    });

    const container = deployment.addContainer({
      name: "app",
      image: props.image,
      ports: [
        { number: props.apiPort, name: "api" },
        { number: props.appPort, name: "app" },
        { number: props.opampPort, name: "opamp" },
      ],
      envFrom: [kplus.Env.fromConfigMap(configMap)],
      securityContext: {
        ensureNonRoot: false,
        readOnlyRootFilesystem: false,
      },
    });
    container.env.addVariable(
      "HYPERDX_API_KEY",
      secret.envValue("HYPERDX_API_KEY"),
    );

    new kplus.Service(this, "service", {
      metadata: {
        name: "app",
        namespace: props.namespace,
      },
      type: kplus.ServiceType.LOAD_BALANCER,
      selector: deployment,
      ports: [
        { name: "api", port: props.apiPort, targetPort: props.apiPort },
        { name: "app", port: props.appPort, targetPort: props.appPort },
        { name: "opamp", port: props.opampPort, targetPort: props.opampPort },
      ],
    });
  }
}
