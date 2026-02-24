import { ApiObject, Chart, type ChartProps } from "cdk8s";
import type { Construct } from "constructs";
import { componentLabels, HYPERDX_NAMESPACE, STORAGE_CLAIMS } from "@hyperdx-cdk8s-multistack/contracts";

export interface VolumeInitJobSpec {
  name: string;
  claimName: string;
  mountPath: string;
  ownerUid: number;
  ownerGid: number;
}

export interface StorageInitChartProps extends ChartProps {
  namespace?: string;
  initImage?: string;
  jobs: VolumeInitJobSpec[];
}

const renderInitCommand = (spec: VolumeInitJobSpec): string => {
  return [
    `mkdir -p ${spec.mountPath}`,
    `chown -R ${spec.ownerUid}:${spec.ownerGid} ${spec.mountPath}`,
    `touch ${spec.mountPath}/.hyperdx-initialized`,
  ].join(" && ");
};

export class StorageInitChart extends Chart {
  public constructor(scope: Construct, id: string, props: StorageInitChartProps) {
    super(scope, id, props);

    const namespace = props.namespace ?? HYPERDX_NAMESPACE;
    const image = props.initImage ?? "busybox:1.36.1";

    for (const job of props.jobs) {
      new ApiObject(this, `${job.name}-job`, {
        apiVersion: "batch/v1",
        kind: "Job",
        metadata: {
          name: `${job.name}-volume-init`,
          namespace,
          labels: componentLabels(`${job.name}-volume-init`),
        },
        spec: {
          backoffLimit: 2,
          template: {
            metadata: {
              labels: componentLabels(`${job.name}-volume-init`),
            },
            spec: {
              restartPolicy: "OnFailure",
              initContainers: [
                {
                  name: "prepare-volume",
                  image,
                  command: ["sh", "-c", renderInitCommand(job)],
                  securityContext: {
                    runAsUser: 0,
                    runAsGroup: 0,
                  },
                  volumeMounts: [
                    {
                      name: "target",
                      mountPath: job.mountPath,
                    },
                  ],
                },
              ],
              containers: [
                {
                  name: "done",
                  image,
                  command: ["sh", "-c", "ls -la /volume && echo initialized"],
                  volumeMounts: [
                    {
                      name: "target",
                      mountPath: "/volume",
                    },
                  ],
                },
              ],
              volumes: [
                {
                  name: "target",
                  persistentVolumeClaim: {
                    claimName: job.claimName,
                  },
                },
              ],
            },
          },
        },
      });
    }
  }
}

export const defaultInitJobs: VolumeInitJobSpec[] = [
  {
    name: "db",
    claimName: STORAGE_CLAIMS.mongoData,
    mountPath: "/data/db",
    ownerUid: 999,
    ownerGid: 999,
  },
  {
    name: "clickhouse-data",
    claimName: STORAGE_CLAIMS.clickhouseData,
    mountPath: "/var/lib/clickhouse",
    ownerUid: 101,
    ownerGid: 101,
  },
  {
    name: "clickhouse-logs",
    claimName: STORAGE_CLAIMS.clickhouseLogs,
    mountPath: "/var/log/clickhouse-server",
    ownerUid: 101,
    ownerGid: 101,
  },
];
