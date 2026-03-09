import { join } from 'node:path'
import { isDeepStrictEqual } from 'node:util'

import { resolveConflictAction } from '../conflict.ts'
import { parseJson, readTextFileIfExists, stringifyJson, writeTextFileIfChanged } from '../files.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../types.ts'

type JsonChangeStatus = 'created' | 'overwrote'

interface JsonChange {
	path: string
	status: JsonChangeStatus
}

interface ConfigPackageJsonSource {
	value: Record<string, unknown>
}

interface ApplyConfigPackageJsonInput {
	project: ProjectContext
	options: ApplyRuntimeOptions
	configName: string
	configDirectory: string
	outputLabels: {
		updated: string
		noChange: string
		noSource: string
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toPathSegment(key: string): string {
	if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
		return `.${key}`
	}

	return `[${JSON.stringify(key)}]`
}

function asJsonPath(basePath: string, key: string): string {
	return `${basePath}${toPathSegment(key)}`
}

function cloneJsonValue<T>(value: T): T {
	return structuredClone(value)
}

function addChange(changes: JsonChange[], path: string, status: JsonChangeStatus): void {
	changes.push({ path, status })
}

function addLeafChanges(
	changes: JsonChange[],
	value: unknown,
	path: string,
	status: JsonChangeStatus
): void {
	if (isRecord(value)) {
		const entries = Object.entries(value)
		if (entries.length === 0) {
			addChange(changes, path, status)
			return
		}

		for (const [key, nestedValue] of entries) {
			addLeafChanges(changes, nestedValue, asJsonPath(path, key), status)
		}
		return
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			addChange(changes, path, status)
			return
		}

		for (const [index, nestedValue] of value.entries()) {
			addLeafChanges(changes, nestedValue, `${path}[${String(index)}]`, status)
		}
		return
	}

	addChange(changes, path, status)
}

function mergeSourceValue(targetValue: unknown, sourceValue: unknown): unknown {
	if (isRecord(targetValue) && isRecord(sourceValue)) {
		for (const [key, sourceEntryValue] of Object.entries(sourceValue)) {
			const existingEntryValue = targetValue[key]
			if (existingEntryValue === undefined) {
				targetValue[key] = cloneJsonValue(sourceEntryValue)
				continue
			}

			targetValue[key] = mergeSourceValue(existingEntryValue, sourceEntryValue)
		}

		return targetValue
	}

	if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
		for (const sourceEntryValue of sourceValue) {
			if (targetValue.some(targetEntryValue => isDeepStrictEqual(targetEntryValue, sourceEntryValue))) {
				continue
			}

			targetValue.push(cloneJsonValue(sourceEntryValue))
		}

		return targetValue
	}

	return cloneJsonValue(sourceValue)
}

function mergeSourceObject(
	target: Record<string, unknown>,
	source: Record<string, unknown>
): Record<string, unknown> {
	for (const [key, sourceValue] of Object.entries(source)) {
		const existingValue = target[key]
		if (existingValue === undefined) {
			target[key] = cloneJsonValue(sourceValue)
			continue
		}

		target[key] = mergeSourceValue(existingValue, sourceValue)
	}

	return target
}

function applyArrayValue(
	targetArray: unknown[],
	desiredArray: unknown[],
	path: string,
	changes: JsonChange[]
): boolean {
	let changed = false

	for (const desiredEntry of desiredArray) {
		if (targetArray.some(existingEntry => isDeepStrictEqual(existingEntry, desiredEntry))) {
			continue
		}

		targetArray.push(cloneJsonValue(desiredEntry))
		addLeafChanges(changes, desiredEntry, `${path}[${String(targetArray.length - 1)}]`, 'created')
		changed = true
	}

	return changed
}

function applyDesiredObject(
	target: Record<string, unknown>,
	desired: Record<string, unknown>,
	options: ApplyRuntimeOptions,
	configName: string,
	filePath: string,
	changes: JsonChange[],
	path = '$'
): boolean {
	let changed = false

	for (const [key, desiredValue] of Object.entries(desired)) {
		const nextPath = asJsonPath(path, key)
		const existingValue = target[key]

		if (existingValue === undefined) {
			target[key] = cloneJsonValue(desiredValue)
			addLeafChanges(changes, desiredValue, nextPath, 'created')
			changed = true
			continue
		}

		if (isRecord(existingValue) && isRecord(desiredValue)) {
			changed =
				applyDesiredObject(
					existingValue,
					desiredValue,
					options,
					configName,
					filePath,
					changes,
					nextPath
				) || changed
			continue
		}

		if (Array.isArray(existingValue) && Array.isArray(desiredValue)) {
			changed = applyArrayValue(existingValue, desiredValue, nextPath, changes) || changed
			continue
		}

		if (isDeepStrictEqual(existingValue, desiredValue)) {
			continue
		}

		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath,
			message: `${nextPath} conflicts while applying ${configName}`
		})

		if (!shouldOverwrite) {
			continue
		}

		target[key] = cloneJsonValue(desiredValue)
		addLeafChanges(changes, desiredValue, nextPath, 'overwrote')
		changed = true
	}

	return changed
}

async function loadConfigSource(path: string, configName: string) {
	const sourceText = await readTextFileIfExists(path)
	if (sourceText === undefined) {
		return undefined
	}

	if (sourceText.trim() === '') {
		throw new Error(`${path} is empty; ${configName} source package.json must not be empty`)
	}

	const sourceValue = parseJson(sourceText, path)
	if (!isRecord(sourceValue)) {
		throw new Error(`${path} must have an object as its package.json root`)
	}

	return {
		value: sourceValue
	} satisfies ConfigPackageJsonSource
}

async function loadConfigSources(
	configName: string,
	configDirectory: string,
	isMonorepoRoot: boolean
): Promise<ConfigPackageJsonSource[]> {
	const baseSourcePath = join(configDirectory, 'package.json')
	const recursiveSourcePath = join(configDirectory, 'recursive', 'package.json')

	const sources: ConfigPackageJsonSource[] = []
	const baseSource = await loadConfigSource(baseSourcePath, configName)
	if (baseSource !== undefined) {
		sources.push(baseSource)
	}

	if (isMonorepoRoot) {
		const recursiveSource = await loadConfigSource(recursiveSourcePath, configName)
		if (recursiveSource !== undefined) {
			sources.push(recursiveSource)
		}
	}

	return sources
}

function composeDesiredPackageJson(sources: ConfigPackageJsonSource[]): Record<string, unknown> {
	const desiredPackageJson: Record<string, unknown> = {}

	for (const source of sources) {
		mergeSourceObject(desiredPackageJson, source.value)
	}

	return desiredPackageJson
}

function logVerboseChanges(configName: string, changes: JsonChange[]): void {
	for (const change of changes) {
		console.log(`[verbose] [${configName}] ${change.status}: ${change.path}`)
	}
}

export async function applyConfigPackageJson(input: ApplyConfigPackageJsonInput): Promise<void> {
	const sources = await loadConfigSources(
		input.configName,
		input.configDirectory,
		input.project.isMonorepoRoot
	)

	if (sources.length === 0) {
		console.log(input.outputLabels.noSource)
		return
	}

	const packageJsonText = await readTextFileIfExists(input.project.packageJsonPath)
	if (!packageJsonText) {
		throw new Error(`Missing package.json at ${input.project.packageJsonPath}`)
	}

	const packageJsonValue = parseJson(packageJsonText, input.project.packageJsonPath)
	if (!isRecord(packageJsonValue)) {
		throw new Error(`package.json root must be an object at ${input.project.packageJsonPath}`)
	}

	const desiredPackageJson = composeDesiredPackageJson(sources)
	const changes: JsonChange[] = []
	const changed = applyDesiredObject(
		packageJsonValue,
		desiredPackageJson,
		input.options,
		input.configName,
		input.project.packageJsonPath,
		changes
	)

	if (!changed) {
		console.log(input.outputLabels.noChange)
		return
	}

	if (input.options.verbose) {
		logVerboseChanges(input.configName, changes)
	}

	await writeTextFileIfChanged(input.project.packageJsonPath, stringifyJson(packageJsonValue), {
		dryRun: input.options.dryRun,
		label: input.outputLabels.updated
	})
}
