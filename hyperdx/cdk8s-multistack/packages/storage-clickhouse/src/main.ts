import { App } from "cdk8s";
import { DEFAULT_STORAGE_SIZING, HYPERDX_NAMESPACE } from "@hyperdx-cdk8s-multistack/contracts";
import { ClickHouseStorageChart } from "./storage-clickhouse-chart.ts";

const app = new App();

new ClickHouseStorageChart(app, "hyperdx-storage-clickhouse", {
  namespace: HYPERDX_NAMESPACE,
  dataStorageSize: DEFAULT_STORAGE_SIZING.clickhouseData,
  logStorageSize: DEFAULT_STORAGE_SIZING.clickhouseLogs,
});

app.synth();
