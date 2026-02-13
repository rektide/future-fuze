import { Construct } from 'constructs';
import { App, Chart, ChartProps } from 'cdk8s';
import * as kplus from 'cdk8s-plus-28';

export interface DatabaseProps extends ChartProps {
  readonly namespace: string;
  readonly image: string;
  readonly storageSize: string;
}

export class Database extends Chart {
  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id, props);
    
    const pvc = new kplus.PersistentVolumeClaim(this, 'data-pvc', {
      storage: kplus.Size.gibibytes(parseInt(props.storageSize)),
      accessModes: [kplus.PersistentVolumeAccessMode.READ_WRITE_ONCE],
      metadata: {
        name: 'hyperdx-db-data',
        namespace: props.namespace,
      },
    });
    
    const deployment = new kplus.Deployment(this, 'deployment', {
      metadata: {
        name: 'db',
        namespace: props.namespace,
      },
      replicas: 1,
      containers: [
        {
          name: 'db',
          image: kplus.ContainerImage.fromRegistry(props.image),
          ports: [
            { containerPort: 27017, name: 'mongo' },
          ],
          securityContext: {
            ensureNonRoot: false,
            readOnlyRootFilesystem: false,
          },
        },
      ],
      volumes: [
        {
          name: 'db-data',
          persistentVolumeClaim: kplus.PersistentVolumeClaim.fromPersistentVolumeClaimName('hyperdx-db-data'),
        },
      ],
    });
    
    deployment.spec.template.spec.containers[0].mount('/data/db', { volume: deployment.spec.template.spec.volumes[0] });
    
    const service = new kplus.Service(this, 'service', {
      metadata: {
        name: 'db',
        namespace: props.namespace,
      },
      type: kplus.ServiceType.CLUSTER_IP,
      selector: deployment,
      ports: [
        { name: 'mongo', port: 27017, targetPort: 27017 },
      ],
    });
  }
}
