package main

import templates "timoni.sh/hyperdx/storage-clickhouse-init/templates"

values: templates.#Config

timoni: {
  apiVersion: "v1alpha1"
  instance: templates.#Instance & {
    config: values
    config: {
      metadata: {
        name:      string @tag(name)
        namespace: string @tag(namespace)
      }
      moduleVersion: string @tag(mv, var=moduleVersion)
    }
  }
  apply: app: [for obj in instance.objects {obj}]
}
