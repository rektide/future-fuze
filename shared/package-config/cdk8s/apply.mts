import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createPackageJsonConfigRunner } from '../internal/apply/config-runner.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const cdk8sConfigDirectory = dirname(fileURLToPath(import.meta.url))
const runCdk8sPackageJson = createPackageJsonConfigRunner({
	configId: 'cdk8s',
	configDirectory: cdk8sConfigDirectory
})

export async function applyCdk8sConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	await runCdk8sPackageJson(project, options)
}
