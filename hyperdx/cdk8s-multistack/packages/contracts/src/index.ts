export const HYPERDX_NAMESPACE = "hyperdx";

export const STORAGE_CLAIMS = {
  mongoData: "hyperdx-db-data",
  clickhouseData: "ch-data",
  clickhouseLogs: "ch-logs",
} as const;

export interface StorageSizing {
  mongoData: string;
  clickhouseData: string;
  clickhouseLogs: string;
}

export const DEFAULT_STORAGE_SIZING: StorageSizing = {
  mongoData: "20Gi",
  clickhouseData: "100Gi",
  clickhouseLogs: "10Gi",
};

export interface StorageClasses {
  mongoData?: string;
  clickhouseData?: string;
  clickhouseLogs?: string;
}

export const APP_NAME = "hyperdx";

export const componentLabels = (component: string): Record<string, string> => {
  return {
    "app.kubernetes.io/name": component,
    "app.kubernetes.io/part-of": APP_NAME,
    "app.kubernetes.io/managed-by": "cdk8s",
  };
};
