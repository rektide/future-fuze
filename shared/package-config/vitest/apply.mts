import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createPackageJsonOutputLabels } from '../internal/apply/labels.ts'
import { applyConfigPackageJson } from '../internal/apply/package-json.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const vitestConfigDirectory = dirname(fileURLToPath(import.meta.url))

export async function applyVitestConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	await applyConfigPackageJson({
		project,
		options,
		configName: 'vitest',
		configDirectory: vitestConfigDirectory,
		outputLabels: createPackageJsonOutputLabels({ configId: 'vitest' })
	})
}
