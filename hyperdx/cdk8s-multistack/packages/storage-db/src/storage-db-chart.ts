import { ApiObject, Chart, type ChartProps } from "cdk8s";
import type { Construct } from "constructs";
import { componentLabels, HYPERDX_NAMESPACE, STORAGE_CLAIMS } from "@hyperdx-cdk8s-multistack/contracts";

export interface DbStorageChartProps extends ChartProps {
  namespace?: string;
  storageSize: string;
  storageClassName?: string;
}

export class DbStorageChart extends Chart {
  public constructor(scope: Construct, id: string, props: DbStorageChartProps) {
    super(scope, id, props);

    new ApiObject(this, "mongo-data-claim", {
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      metadata: {
        name: STORAGE_CLAIMS.mongoData,
        namespace: props.namespace ?? HYPERDX_NAMESPACE,
        labels: componentLabels("db-storage"),
      },
      spec: {
        accessModes: ["ReadWriteOnce"],
        ...(props.storageClassName === undefined ? {} : { storageClassName: props.storageClassName }),
        resources: {
          requests: {
            storage: props.storageSize,
          },
        },
      },
    });
  }
}
