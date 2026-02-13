import { ApiObject } from 'cdk8s';
import { Construct } from 'constructs';

export interface NamespaceProps {
  readonly name: string;
}

export class Namespace extends Construct {
  public readonly name: string;
  
  constructor(scope: Construct, id: string, props: NamespaceProps) {
    super(scope, id);
    
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
