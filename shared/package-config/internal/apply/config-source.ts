import { join } from 'node:path'

import { parseJson, readTextFileIfExists } from '../files.ts'

export interface ConfigPackageJsonSource {
	value: Record<string, unknown>
}

interface LoadConfigPackageJsonSourcesInput {
	configId: string
	configDirectory: string
	isMonorepoRoot: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function loadConfigPackageJsonSource(path: string, configId: string) {
	const sourceText = await readTextFileIfExists(path)
	if (sourceText === undefined) {
		return undefined
	}

	if (sourceText.trim() === '') {
		throw new Error(`${path} is empty; ${configId} source config.json must not empty`)
	}

	const sourceValue = parseJson(sourceText, path)
	if (!isRecord(sourceValue)) {
		throw new Error(`${path} must have an object as its config.json root`)
	}

	return {
		value: sourceValue
	} satisfies ConfigPackageJsonSource
}

export async function loadConfigPackageJsonSources(
	input: LoadConfigPackageJsonSourcesInput
): Promise<ConfigPackageJsonSource[]> {
	const baseSourcePath = join(input.configDirectory, 'config.json')
	const recursiveSourcePath = join(input.configDirectory, 'recursive', 'config.json')

	const sources: ConfigPackageJsonSource[] = []
	const baseSource = await loadConfigPackageJsonSource(baseSourcePath, input.configId)
	if (baseSource !== undefined) {
		sources.push(baseSource)
	}

	if (input.isMonorepoRoot) {
		const recursiveSource = await loadConfigPackageJsonSource(recursiveSourcePath, input.configId)
		if (recursiveSource !== undefined) {
			sources.push(recursiveSource)
		}
	}

	return sources
}
