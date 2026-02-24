import { App } from "cdk8s";
import { HYPERDX_NAMESPACE } from "@hyperdx-cdk8s-multistack/contracts";
import { defaultInitJobs, StorageInitChart } from "./storage-init-chart.ts";

const app = new App();

new StorageInitChart(app, "hyperdx-storage-init", {
  namespace: HYPERDX_NAMESPACE,
  jobs: defaultInitJobs,
});

app.synth();
