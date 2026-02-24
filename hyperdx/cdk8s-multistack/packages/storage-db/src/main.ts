import { App } from "cdk8s";
import { DEFAULT_STORAGE_SIZING, HYPERDX_NAMESPACE } from "@hyperdx-cdk8s-multistack/contracts";
import { DbStorageChart } from "./storage-db-chart.ts";

const app = new App();

new DbStorageChart(app, "hyperdx-storage-db", {
  namespace: HYPERDX_NAMESPACE,
  storageSize: DEFAULT_STORAGE_SIZING.mongoData,
});

app.synth();
