import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createPackageJsonConfigRunner } from '../internal/apply/config-runner.ts'

import type { ApplyActionResult, ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const esmConfigDirectory = dirname(fileURLToPath(import.meta.url))
const runEsmPackageJson = createPackageJsonConfigRunner({
	configId: 'esm',
	configDirectory: esmConfigDirectory
})

export async function applyEsmConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<ApplyActionResult[]> {
	return [await runEsmPackageJson(project, options)]
}
