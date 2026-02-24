import { App } from "cdk8s";
import { HYPERDX_NAMESPACE } from "@hyperdx-cdk8s-multistack/contracts";
import { ClickHouseRuntimeChart } from "./ch-runtime-chart.ts";
import { DbRuntimeChart } from "./db-runtime-chart.ts";

const app = new App();

new DbRuntimeChart(app, "hyperdx-db-runtime", {
  namespace: HYPERDX_NAMESPACE,
  image: "mongo:5.0.32-focal",
});

new ClickHouseRuntimeChart(app, "hyperdx-clickhouse-runtime", {
  namespace: HYPERDX_NAMESPACE,
  image: "clickhouse/clickhouse-server:25.6-alpine",
  httpPort: 8123,
  nativePort: 9000,
});

app.synth();
