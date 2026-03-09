import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

import { parseJson, readTextFileIfExists } from './files.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toObjectRecord(value: unknown, sourceDescription: string): Record<string, unknown> {
	if (!isRecord(value)) {
		throw new Error(`${sourceDescription} must export an object`)
	}

	return value
}

async function loadFromTsModule(filePath: string, exportName: string): Promise<unknown> {
	const moduleUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`
	const module = (await import(moduleUrl)) as Record<string, unknown>

	const exportedValue = module[exportName] ?? module.config
	if (exportedValue === undefined) {
		throw new Error(
			`${filePath} must export ${exportName} (or config) to provide package-config values`
		)
	}
	return exportedValue
}

export async function tryLoadNamedObjectConfig(
	baseDirectory: string,
	baseName: string,
	exportName: string
): Promise<Record<string, unknown> | undefined> {
	const tsFilePath = join(baseDirectory, `${baseName}.ts`)
	const tsSource = await readTextFileIfExists(tsFilePath)
	if (tsSource !== undefined) {
		if (tsSource.trim() === '') {
			return {}
		}

		const loaded = await loadFromTsModule(tsFilePath, exportName)
		return toObjectRecord(loaded, tsFilePath)
	}

	const jsonFilePath = join(baseDirectory, `${baseName}.json`)
	const jsonSource = await readTextFileIfExists(jsonFilePath)
	if (jsonSource !== undefined) {
		if (jsonSource.trim() === '') {
			return {}
		}

		return toObjectRecord(parseJson(jsonSource, jsonFilePath), jsonFilePath)
	}

	return undefined
}
