import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { tryLoadNamedStringRecordConfig } from '../internal/config-source.ts'
import { applyPackageJsonSections } from '../internal/package-json-sections.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const vitestConfigDirectory = dirname(fileURLToPath(import.meta.url))
const recursiveVitestConfigDirectory = join(vitestConfigDirectory, 'recursive')

async function loadVitestSectionConfig(
	project: ProjectContext,
	sectionName: 'devDependencies' | 'scripts'
): Promise<Record<string, string> | undefined> {
	if (project.isMonorepoRoot) {
		const recursiveConfig = await tryLoadNamedStringRecordConfig(
			recursiveVitestConfigDirectory,
			sectionName,
			sectionName
		)
		if (recursiveConfig !== undefined) {
			return recursiveConfig
		}
	}

	return tryLoadNamedStringRecordConfig(vitestConfigDirectory, sectionName, sectionName)
}

export async function applyVitestConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	const targetDevDependencies = await loadVitestSectionConfig(project, 'devDependencies')
	const targetScripts = await loadVitestSectionConfig(project, 'scripts')

	if (targetDevDependencies === undefined && targetScripts === undefined) {
		await applyPackageJsonSections(project, options, {}, {
			updated: 'Apply vitest package.json settings',
			noChange: 'No vitest package.json section sources found'
		})
		return
	}

	await applyPackageJsonSections(
		project,
		options,
		{
			devDependencies: targetDevDependencies,
			scripts: targetScripts
		},
		{
			updated: 'Apply vitest package.json settings',
			noChange: 'Vitest package.json settings are already up-to-date'
		}
	)
}
