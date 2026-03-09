import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createPackageJsonConfigRunner } from '../internal/apply/config-runner.ts'

import type { ApplyActionResult, ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const concurrentlyConfigDirectory = dirname(fileURLToPath(import.meta.url))
const runConcurrentlyPackageJson = createPackageJsonConfigRunner({
	configId: 'concurrently',
	configDirectory: concurrentlyConfigDirectory
})

export async function applyConcurrentlyConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<ApplyActionResult[]> {
	return [await runConcurrentlyPackageJson(project, options)]
}
