import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { tryLoadNamedStringRecordConfig } from '../internal/config-source.ts'
import { applyPackageJsonSections } from '../internal/package-json-sections.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const cdk8sConfigDirectory = dirname(fileURLToPath(import.meta.url))
const recursiveCdk8sConfigDirectory = join(cdk8sConfigDirectory, 'recursive')

async function loadCdk8sSectionConfig(
	project: ProjectContext,
	sectionName: 'devDependencies' | 'scripts'
): Promise<Record<string, string> | undefined> {
	if (project.isMonorepoRoot) {
		const recursiveConfig = await tryLoadNamedStringRecordConfig(
			recursiveCdk8sConfigDirectory,
			sectionName,
			sectionName
		)
		if (recursiveConfig !== undefined) {
			return recursiveConfig
		}
	}

	return tryLoadNamedStringRecordConfig(cdk8sConfigDirectory, sectionName, sectionName)
}

export async function applyCdk8sConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	const targetDevDependencies = await loadCdk8sSectionConfig(project, 'devDependencies')
	const targetScripts = await loadCdk8sSectionConfig(project, 'scripts')

	if (targetDevDependencies === undefined && targetScripts === undefined) {
		await applyPackageJsonSections(project, options, {}, {
			updated: 'Apply cdk8s package.json settings',
			noChange: 'No cdk8s package.json section sources found'
		})
		return
	}

	await applyPackageJsonSections(project, options, {
		devDependencies: targetDevDependencies,
		scripts: targetScripts
	}, {
		updated: 'Apply cdk8s package.json settings',
		noChange: 'Cdk8s package.json settings are already up-to-date'
	})
}
