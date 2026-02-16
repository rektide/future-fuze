import { Construct } from 'constructs';
import { Chart, ChartProps, ApiObject } from 'cdk8s';
import * as kplus from 'cdk8s-plus-28';

export interface ClickHouseProps extends ChartProps {
  readonly namespace: string;
  readonly image: string;
  readonly httpPort: number;
  readonly nativePort: number;
  readonly dataStorageSize: string;
  readonly logsStorageSize: string;
}

export class ClickHouse extends Chart {
  constructor(scope: Construct, id: string, props: ClickHouseProps) {
    super(scope, id, props);
    
    const configXml = `<?xml version="1.0"?>
<clickhouse>
    <logger>
        <level>debug</level>
        <console>true</console>
        <log remove="remove" />
        <errorlog remove="remove" />
    </logger>
    <listen_host>0.0.0.0</listen_host>
    <http_port>${props.httpPort}</http_port>
    <tcp_port>${props.nativePort}</tcp_port>
    <interserver_http_host>ch-server</interserver_http_host>
    <interserver_http_port>9009</interserver_http_port>
    <max_connections>4096</max_connections>
    <keep_alive_timeout>64</keep_alive_timeout>
    <max_concurrent_queries>100</max_concurrent_queries>
    <uncompressed_cache_size>8589934592</uncompressed_cache_size>
    <mark_cache_size>5368709120</mark_cache_size>
    <path>/var/lib/clickhouse/</path>
    <tmp_path>/var/lib/clickhouse/tmp/</tmp_path>
    <user_files_path>/var/lib/clickhouse/user_files/</user_files_path>
    <user_directories>
        <users_xml>
            <path>users.xml</path>
        </users_xml>
    </user_directories>
    <default_profile>default</default_profile>
    <default_database>default</default_database>
    <timezone>UTC</timezone>
    <mlock_executable>false</mlock_executable>
    <prometheus>
        <endpoint>/metrics</endpoint>
        <port>9363</port>
        <metrics>true</metrics>
        <events>true</events>
        <asynchronous_metrics>true</asynchronous_metrics>
        <errors>true</errors>
    </prometheus>
    <remote_servers>
        <hdx_cluster>
            <shard>
                <replica>
                    <host>ch-server</host>
                    <port>${props.nativePort}</port>
                </replica>
            </shard>
        </hdx_cluster>
    </remote_servers>
    <distributed_ddl>
        <path>/clickhouse/task_queue/ddl</path>
    </distributed_ddl>
    <format_schema_path>/var/lib/clickhouse/format_schemas/</format_schema_path>
    <custom_settings_prefixes>hyperdx</custom_settings_prefixes>
</clickhouse>`;

    const usersXml = `<?xml version="1.0"?>
<clickhouse>
    <profiles>
        <default>
            <max_memory_usage>10000000000</max_memory_usage>
            <use_uncompressed_cache>0</use_uncompressed_cache>
            <load_balancing>in_order</load_balancing>
            <log_queries>1</log_queries>
        </default>
    </profiles>
    <users>
        <default>
            <password></password>
            <profile>default</profile>
            <networks>
                <ip>::/0</ip>
            </networks>
            <quota>default</quota>
        </default>
    </users>
    <quotas>
        <default>
            <interval>
                <duration>3600</duration>
                <queries>0</queries>
                <errors>0</errors>
                <result_rows>0</result_rows>
                <read_rows>0</read_rows>
                <execution_time>0</execution_time>
            </interval>
        </default>
    </quotas>
</clickhouse>`;

    new kplus.ConfigMap(this, 'config', {
      metadata: {
        name: 'ch-server-config',
        namespace: props.namespace,
      },
      data: {
        'config.xml': configXml,
        'users.xml': usersXml,
      },
    });

    new kplus.PersistentVolumeClaim(this, 'data-pvc', {
      storage: kplus.Size.gibibytes(parseInt(props.dataStorageSize)),
      accessModes: [kplus.PersistentVolumeAccessMode.READ_WRITE_ONCE],
      metadata: {
        name: 'ch-data',
        namespace: props.namespace,
      },
    });

    new kplus.PersistentVolumeClaim(this, 'logs-pvc', {
      storage: kplus.Size.gibibytes(parseInt(props.logsStorageSize)),
      accessModes: [kplus.PersistentVolumeAccessMode.READ_WRITE_ONCE],
      metadata: {
        name: 'ch-logs',
        namespace: props.namespace,
      },
    });

    const deployment = new kplus.Deployment(this, 'deployment', {
      metadata: {
        name: 'ch-server',
        namespace: props.namespace,
      },
      replicas: 1,
      containers: [
        {
          name: 'ch-server',
          image: kplus.ContainerImage.fromRegistry(props.image),
          ports: [
            { containerPort: props.httpPort, name: 'http' },
            { containerPort: props.nativePort, name: 'native' },
          ],
          envVariables: {
            CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: kplus.EnvValue.fromValue('1'),
          },
          securityContext: {
            ensureNonRoot: false,
            readOnlyRootFilesystem: false,
          },
        },
      ],
    });

    const configVolume = kplus.Volume.fromConfigMap(this, 'config-volume', 'ch-server-config');
    const dataVolume = kplus.Volume.fromPersistentVolumeClaim(this, 'data-volume', 'ch-data');
    const logsVolume = kplus.Volume.fromPersistentVolumeClaim(this, 'logs-volume', 'ch-logs');
    
    const container = deployment.spec.template.spec.containers[0];
    container.mount('/etc/clickhouse-server/config.xml', { volume: configVolume, subPath: 'config.xml' });
    container.mount('/etc/clickhouse-server/users.xml', { volume: configVolume, subPath: 'users.xml' });
    container.mount('/var/lib/clickhouse', { volume: dataVolume });
    container.mount('/var/log/clickhouse-server', { volume: logsVolume });

    new kplus.Service(this, 'service', {
      metadata: {
        name: 'ch-server',
        namespace: props.namespace,
      },
      type: kplus.ServiceType.CLUSTER_IP,
      selector: deployment,
      ports: [
        { name: 'http', port: props.httpPort, targetPort: props.httpPort },
        { name: 'native', port: props.nativePort, targetPort: props.nativePort },
      ],
    });
  }
}
