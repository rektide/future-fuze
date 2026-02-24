import { ApiObject, Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';

export interface NamespaceProps extends ChartProps {
  readonly name: string;
}

export class Namespace extends Chart {
  public readonly name: string;

  constructor(scope: Construct, id: string, props: NamespaceProps) {
    super(scope, id, props);

    this.name = props.name;

    new ApiObject(this, 'namespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: props.name,
      },
    });
  }
}
