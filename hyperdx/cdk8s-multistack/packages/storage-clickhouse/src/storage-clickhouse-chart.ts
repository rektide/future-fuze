import { ApiObject, Chart, type ChartProps } from "cdk8s";
import type { Construct } from "constructs";
import { componentLabels, HYPERDX_NAMESPACE, STORAGE_CLAIMS } from "@hyperdx-cdk8s-multistack/contracts";

export interface ClickHouseStorageChartProps extends ChartProps {
  namespace?: string;
  dataStorageSize: string;
  logStorageSize: string;
  dataStorageClassName?: string;
  logStorageClassName?: string;
}

export class ClickHouseStorageChart extends Chart {
  public constructor(scope: Construct, id: string, props: ClickHouseStorageChartProps) {
    super(scope, id, props);

    const namespace = props.namespace ?? HYPERDX_NAMESPACE;

    new ApiObject(this, "clickhouse-data-claim", {
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      metadata: {
        name: STORAGE_CLAIMS.clickhouseData,
        namespace,
        labels: componentLabels("clickhouse-storage"),
      },
      spec: {
        accessModes: ["ReadWriteOnce"],
        ...(props.dataStorageClassName === undefined ? {} : { storageClassName: props.dataStorageClassName }),
        resources: {
          requests: {
            storage: props.dataStorageSize,
          },
        },
      },
    });

    new ApiObject(this, "clickhouse-logs-claim", {
      apiVersion: "v1",
      kind: "PersistentVolumeClaim",
      metadata: {
        name: STORAGE_CLAIMS.clickhouseLogs,
        namespace,
        labels: componentLabels("clickhouse-storage"),
      },
      spec: {
        accessModes: ["ReadWriteOnce"],
        ...(props.logStorageClassName === undefined ? {} : { storageClassName: props.logStorageClassName }),
        resources: {
          requests: {
            storage: props.logStorageSize,
          },
        },
      },
    });
  }
}
