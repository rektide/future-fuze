import { ApiObject, Chart, type ChartProps } from "cdk8s";
import type { Construct } from "constructs";
import { componentLabels, HYPERDX_NAMESPACE, STORAGE_CLAIMS } from "@hyperdx-cdk8s-multistack/contracts";

export interface DbRuntimeChartProps extends ChartProps {
  namespace?: string;
  image: string;
}

export class DbRuntimeChart extends Chart {
  public constructor(scope: Construct, id: string, props: DbRuntimeChartProps) {
    super(scope, id, props);

    const namespace = props.namespace ?? HYPERDX_NAMESPACE;
    const labels = componentLabels("db");

    new ApiObject(this, "deployment", {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: "db",
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
                name: "verify-volume",
                image: "busybox:1.36.1",
                command: ["sh", "-c", "test -w /data/db && ls -la /data/db"],
                volumeMounts: [
                  {
                    name: "db-data",
                    mountPath: "/data/db",
                  },
                ],
              },
            ],
            containers: [
              {
                name: "db",
                image: props.image,
                imagePullPolicy: "IfNotPresent",
                ports: [
                  {
                    name: "mongo",
                    containerPort: 27017,
                  },
                ],
                volumeMounts: [
                  {
                    name: "db-data",
                    mountPath: "/data/db",
                  },
                ],
              },
            ],
            volumes: [
              {
                name: "db-data",
                persistentVolumeClaim: {
                  claimName: STORAGE_CLAIMS.mongoData,
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
        name: "db",
        namespace,
        labels,
      },
      spec: {
        type: "ClusterIP",
        selector: labels,
        ports: [
          {
            name: "mongo",
            port: 27017,
            targetPort: 27017,
          },
        ],
      },
    });
  }
}
