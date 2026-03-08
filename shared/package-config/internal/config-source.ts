import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

import { parseJson, readTextFileIfExists } from './files.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringRecord(value: unknown, sourceDescription: string): Record<string, string> {
	if (!isRecord(value)) {
		throw new Error(`${sourceDescription} must export an object`)
	}

	const result: Record<string, string> = {}
	for (const [key, entryValue] of Object.entries(value)) {
		if (typeof entryValue !== 'string') {
			throw new Error(`${sourceDescription} must contain only string values; key ${key} is not a string`)
		}

		result[key] = entryValue
	}

	return result
}

async function loadFromTsModule(filePath: string, exportName: string): Promise<Record<string, string>> {
	const moduleUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`
	const module = (await import(moduleUrl)) as Record<string, unknown>

	const exportedValue = module[exportName] ?? module.config
	if (exportedValue === undefined) {
		throw new Error(
			`${filePath} must export ${exportName} (or config) to provide package-config values`
		)
	}

	return toStringRecord(exportedValue, filePath)
}

export async function tryLoadNamedStringRecordConfig(
	baseDirectory: string,
	baseName: string,
	exportName: string
): Promise<Record<string, string> | undefined> {
	const tsFilePath = join(baseDirectory, `${baseName}.ts`)
	const tsSource = await readTextFileIfExists(tsFilePath)
	if (tsSource !== undefined) {
		if (tsSource.trim() === '') {
			return {}
		}

		return loadFromTsModule(tsFilePath, exportName)
	}

	const jsonFilePath = join(baseDirectory, `${baseName}.json`)
	const jsonSource = await readTextFileIfExists(jsonFilePath)
	if (jsonSource !== undefined) {
		if (jsonSource.trim() === '') {
			return {}
		}

		return toStringRecord(parseJson(jsonSource, jsonFilePath), jsonFilePath)
	}

	return undefined
}

export async function loadNamedStringRecordConfig(
	baseDirectory: string,
	baseName: string,
	exportName: string
): Promise<Record<string, string>> {
	const loaded = await tryLoadNamedStringRecordConfig(baseDirectory, baseName, exportName)
	if (loaded !== undefined) {
		return loaded
	}

	const tsFilePath = join(baseDirectory, `${baseName}.ts`)
	const jsonFilePath = join(baseDirectory, `${baseName}.json`)

	throw new Error(
		`Missing config source for ${baseName}; expected ${tsFilePath} or ${jsonFilePath}`
	)
}
