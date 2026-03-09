import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { applyConfigPackageJson } from '../internal/apply/package-json.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const esmConfigDirectory = dirname(fileURLToPath(import.meta.url))

export async function applyEsmConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	await applyConfigPackageJson({
		project,
		options,
		configName: 'esm',
		configDirectory: esmConfigDirectory,
		outputLabels: {
			updated: 'Apply esm package.json settings',
			noChange: 'Esm package.json settings are already up-to-date',
			noSource: 'No esm package.json source found'
		}
	})
}
