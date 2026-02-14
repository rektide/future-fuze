package hyperdx

import "list"

output: list.FlattenN([namespace, db, clickhouse, otelCollector, app], 1)
