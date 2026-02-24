import { ApiObject, Chart, type ChartProps } from "cdk8s";
import type { Construct } from "constructs";
import { componentLabels, HYPERDX_NAMESPACE, STORAGE_CLAIMS } from "@hyperdx-cdk8s-multistack/contracts";

export interface ClickHouseRuntimeChartProps extends ChartProps {
  namespace?: string;
  image: string;
  httpPort: number;
  nativePort: number;
}

const configXml = (httpPort: number, nativePort: number): string => {
  return `<?xml version="1.0"?>
<clickhouse>
  <listen_host>0.0.0.0</listen_host>
  <http_port>${httpPort}</http_port>
  <tcp_port>${nativePort}</tcp_port>
  <interserver_http_host>ch-server</interserver_http_host>
  <interserver_http_port>9009</interserver_http_port>
  <path>/var/lib/clickhouse/</path>
  <tmp_path>/var/lib/clickhouse/tmp/</tmp_path>
  <user_files_path>/var/lib/clickhouse/user_files/</user_files_path>
</clickhouse>`;
};

const usersXml = `<?xml version="1.0"?>
<clickhouse>
  <users>
    <default>
      <password></password>
      <networks>
        <ip>::/0</ip>
      </networks>
      <profile>default</profile>
      <quota>default</quota>
    </default>
  </users>
</clickhouse>`;

export class ClickHouseRuntimeChart extends Chart {
  public constructor(scope: Construct, id: string, props: ClickHouseRuntimeChartProps) {
    super(scope, id, props);

    const namespace = props.namespace ?? HYPERDX_NAMESPACE;
    const labels = componentLabels("ch-server");

    new ApiObject(this, "config", {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: {
        name: "ch-server-config",
        namespace,
        labels,
      },
      data: {
        "config.xml": configXml(props.httpPort, props.nativePort),
        "users.xml": usersXml,
      },
    });

    new ApiObject(this, "deployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: "ch-server",
        namespace,
        labels,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: labels,
        },
        template: {
          metadata: {
            labels,
          },
          spec: {
            initContainers: [
              {
                name: "verify-clickhouse-volumes",
                image: "busybox:1.36.1",
                command: ["sh", "-c", "test -w /var/lib/clickhouse && test -w /var/log/clickhouse-server"],
                volumeMounts: [
                  {
                    name: "ch-data",
                    mountPath: "/var/lib/clickhouse",
                  },
                  {
                    name: "ch-logs",
                    mountPath: "/var/log/clickhouse-server",
                  },
                ],
              },
            ],
            containers: [
              {
                name: "ch-server",
                image: props.image,
                imagePullPolicy: "IfNotPresent",
                env: [
                  {
                    name: "CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT",
                    value: "1",
                  },
                ],
                ports: [
                  {
                    name: "http",
                    containerPort: props.httpPort,
                  },
                  {
                    name: "native",
                    containerPort: props.nativePort,
                  },
                ],
                volumeMounts: [
                  {
                    name: "config",
                    mountPath: "/etc/clickhouse-server/config.xml",
                    subPath: "config.xml",
                  },
                  {
                    name: "config",
                    mountPath: "/etc/clickhouse-server/users.xml",
                    subPath: "users.xml",
                  },
                  {
                    name: "ch-data",
                    mountPath: "/var/lib/clickhouse",
                  },
                  {
                    name: "ch-logs",
                    mountPath: "/var/log/clickhouse-server",
                  },
                ],
              },
            ],
            volumes: [
              {
                name: "config",
                configMap: {
                  name: "ch-server-config",
                },
              },
              {
                name: "ch-data",
                persistentVolumeClaim: {
                  claimName: STORAGE_CLAIMS.clickhouseData,
                },
              },
              {
                name: "ch-logs",
                persistentVolumeClaim: {
                  claimName: STORAGE_CLAIMS.clickhouseLogs,
                },
              },
            ],
          },
        },
      },
    });

    new ApiObject(this, "service", {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "ch-server",
        namespace,
        labels,
      },
      spec: {
        type: "ClusterIP",
        selector: labels,
        ports: [
          {
            name: "http",
            port: props.httpPort,
            targetPort: props.httpPort,
          },
          {
            name: "native",
            port: props.nativePort,
            targetPort: props.nativePort,
          },
        ],
      },
    });
  }
}
