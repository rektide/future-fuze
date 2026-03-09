import { applyConfigPackageJson } from './package-json.ts'
import { createPackageJsonOutputLabels } from './labels.ts'
import { logInfo } from '../log.ts'

import type { ActionStatus, ApplyRuntimeOptions, ProjectContext } from '../types.ts'

interface PackageJsonConfigRunnerInput {
	configId: string
	configDirectory: string
}

export function createPackageJsonConfigRunner(input: PackageJsonConfigRunnerInput) {
	const outputLabels = createPackageJsonOutputLabels({ configId: input.configId })

	return async function runPackageJsonConfig(
		project: ProjectContext,
		options: ApplyRuntimeOptions
	): Promise<ActionStatus> {
		const status = await applyConfigPackageJson({
			project,
			options,
			configName: input.configId,
			configDirectory: input.configDirectory,
			outputLabels
		})

		logInfo('apply', `${input.configId} package.json action status: ${status}`)
		return status
	}
}
