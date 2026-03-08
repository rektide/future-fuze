import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
	loadNamedStringRecordConfig,
	tryLoadNamedStringRecordConfig
} from '../internal/config-source.ts'
import { applyPackageJsonSections } from '../internal/package-json-sections.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const concurrentlyConfigDirectory = dirname(fileURLToPath(import.meta.url))
const recursiveConcurrentlyConfigDirectory = join(concurrentlyConfigDirectory, 'recursive')


async function loadConcurrentlySectionConfig(
	project: ProjectContext,
	sectionName: 'devDependencies' | 'scripts'
): Promise<Record<string, string>> {
	if (project.isMonorepoRoot) {
		const recursiveConfig = await tryLoadNamedStringRecordConfig(
			recursiveConcurrentlyConfigDirectory,
			sectionName,
			sectionName
		)
		if (recursiveConfig !== undefined) {
			return recursiveConfig
		}
	}

	return loadNamedStringRecordConfig(concurrentlyConfigDirectory, sectionName, sectionName)
}

export async function applyConcurrentlyConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	const targetDevDependencies = await loadConcurrentlySectionConfig(project, 'devDependencies')
	const targetScripts = await loadConcurrentlySectionConfig(project, 'scripts')

	await applyPackageJsonSections(project, options, {
		devDependencies: targetDevDependencies,
		scripts: targetScripts
	}, {
		updated: 'Apply concurrently package.json settings',
		noChange: 'Concurrently package.json settings are already up-to-date'
	})
}
