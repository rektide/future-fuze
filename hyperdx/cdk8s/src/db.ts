import { Construct } from "constructs";
import { App, Chart, ChartProps, Size } from "cdk8s";
import * as kplus from "cdk8s-plus-33";

export interface DatabaseProps extends ChartProps {
  readonly namespace: string;
  readonly image: string;
  readonly storageSize: string;
}

export class Database extends Chart {
  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id, props);

    const pvc = new kplus.PersistentVolumeClaim(this, "data-pvc", {
      storage: Size.gibibytes(parseInt(props.storageSize)),
      accessModes: [kplus.PersistentVolumeAccessMode.READ_WRITE_ONCE],
      metadata: {
        name: "hyperdx-db-data",
        namespace: props.namespace,
      },
    });

    const deployment = new kplus.Deployment(this, "deployment", {
      metadata: {
        name: "db",
        namespace: props.namespace,
      },
      replicas: 1,
    });

    const container = deployment.addContainer({
      name: "db",
      image: props.image,
      ports: [{ number: 27017, name: "mongo" }],
      securityContext: {
        ensureNonRoot: false,
        readOnlyRootFilesystem: false,
      },
    });

    container.mount(
      "/data/db",
      kplus.Volume.fromPersistentVolumeClaim(this, "db-data-volume", pvc),
    );

    const service = new kplus.Service(this, "service", {
      metadata: {
        name: "db",
        namespace: props.namespace,
      },
      type: kplus.ServiceType.CLUSTER_IP,
      selector: deployment,
      ports: [{ name: "mongo", port: 27017, targetPort: 27017 }],
    });
  }
}
