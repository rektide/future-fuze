import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { applyConfigPackageJson } from '../internal/apply/package-json.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const cdk8sConfigDirectory = dirname(fileURLToPath(import.meta.url))

export async function applyCdk8sConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	await applyConfigPackageJson({
		project,
		options,
		configName: 'cdk8s',
		configDirectory: cdk8sConfigDirectory,
		outputLabels: {
			updated: 'Apply cdk8s package.json settings',
			noChange: 'Cdk8s package.json settings are already up-to-date',
			noSource: 'No cdk8s package.json source found'
		}
	})
}
