import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createPackageJsonConfigRunner } from '../internal/apply/config-runner.ts'

import type { ApplyActionResult, ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const vitestConfigDirectory = dirname(fileURLToPath(import.meta.url))
const runVitestPackageJson = createPackageJsonConfigRunner({
	configId: 'vitest',
	configDirectory: vitestConfigDirectory
})

export async function applyVitestConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<ApplyActionResult[]> {
	return [await runVitestPackageJson(project, options)]
}
