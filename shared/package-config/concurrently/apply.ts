import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseJson, readTextFileIfExists } from '../internal/files.ts'
import {
	applyPackageJsonSections,
	toOptionalStringRecord
} from '../internal/package-json-sections.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const concurrentlyConfigDirectory = dirname(fileURLToPath(import.meta.url))

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function loadConcurrentlyConfig(): Promise<{
	devDependencies?: Record<string, string>
	scripts?: Record<string, string>
}> {
	const configPath = join(concurrentlyConfigDirectory, 'scripts.json')
	const configText = await readTextFileIfExists(configPath)
	if (configText === undefined) {
		throw new Error(`Missing concurrently config at ${configPath}`)
	}

	const parsed = parseJson(configText, configPath)
	if (!isRecord(parsed)) {
		throw new Error(`Concurrently config must be an object at ${configPath}`)
	}

	return {
		devDependencies: toOptionalStringRecord(
			parsed.devDependencies,
			`${configPath}.devDependencies`
		),
		scripts: toOptionalStringRecord(parsed.scripts, `${configPath}.scripts`)
	}
}

export async function applyConcurrentlyConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	const updates = await loadConcurrentlyConfig()
	await applyPackageJsonSections(project, options, updates, {
		updated: 'Apply concurrently package.json settings',
		noChange: 'Concurrently package.json settings are already up-to-date'
	})
}
