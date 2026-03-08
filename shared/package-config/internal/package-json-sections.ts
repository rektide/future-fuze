import { parseJson, readTextFileIfExists, stringifyJson, writeTextFileIfChanged } from './files.ts'
import { resolveConflictAction } from './conflict.ts'

import type { ApplyRuntimeOptions, ProjectContext } from './types.ts'

type PackageJsonSectionName = 'devDependencies' | 'scripts'

export interface PackageJsonSectionUpdates {
	devDependencies?: Record<string, string>
	scripts?: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function toOptionalStringRecord(
	value: unknown,
	locationDescription: string
): Record<string, string> | undefined {
	if (value === undefined) {
		return undefined
	}

	if (!isRecord(value)) {
		throw new Error(`${locationDescription} must be an object with string values`)
	}

	const result: Record<string, string> = {}
	for (const [key, entryValue] of Object.entries(value)) {
		if (typeof entryValue !== 'string') {
			throw new Error(`${locationDescription}.${key} must be a string`)
		}

		result[key] = entryValue
	}

	return result
}

function applyStringRecordSection(
	packageJson: Record<string, unknown>,
	sectionName: PackageJsonSectionName,
	targetValues: Record<string, string>,
	options: ApplyRuntimeOptions,
	packageJsonPath: string
): boolean {
	if (Object.keys(targetValues).length === 0) {
		return false
	}

	const existingSection = packageJson[sectionName]
	let mutableSection: Record<string, unknown>
	let changed = false

	if (existingSection === undefined) {
		mutableSection = {}
		packageJson[sectionName] = mutableSection
		changed = true
	} else if (isRecord(existingSection)) {
		mutableSection = existingSection
	} else {
		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: packageJsonPath,
			message: `${sectionName} exists but is not an object`
		})

		if (!shouldOverwrite) {
			return changed
		}

		mutableSection = {}
		packageJson[sectionName] = mutableSection
		changed = true
	}

	for (const [key, value] of Object.entries(targetValues)) {
		const existingValue = mutableSection[key]
		if (existingValue === undefined) {
			mutableSection[key] = value
			changed = true
			continue
		}

		if (existingValue === value) {
			continue
		}

		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: packageJsonPath,
			message: `${sectionName}.${key} is ${String(existingValue)} but target is ${value}`
		})

		if (!shouldOverwrite) {
			continue
		}

		mutableSection[key] = value
		changed = true
	}

	return changed
}

export async function applyPackageJsonSections(
	project: ProjectContext,
	options: ApplyRuntimeOptions,
	updates: PackageJsonSectionUpdates,
	outputLabels: {
		updated: string
		noChange: string
	}
): Promise<void> {
	const packageJsonText = await readTextFileIfExists(project.packageJsonPath)
	if (!packageJsonText) {
		throw new Error(`Missing package.json at ${project.packageJsonPath}`)
	}

	const packageJson = parseJson(packageJsonText, project.packageJsonPath)
	if (!isRecord(packageJson)) {
		throw new Error(`package.json root must be an object at ${project.packageJsonPath}`)
	}

	const changedDevDependencies =
		updates.devDependencies === undefined
			? false
			: applyStringRecordSection(
					packageJson,
					'devDependencies',
					updates.devDependencies,
					options,
					project.packageJsonPath
				)
	const changedScripts =
		updates.scripts === undefined
			? false
			: applyStringRecordSection(
					packageJson,
					'scripts',
					updates.scripts,
					options,
					project.packageJsonPath
				)

	if (!changedDevDependencies && !changedScripts) {
		console.log(outputLabels.noChange)
		return
	}

	await writeTextFileIfChanged(project.packageJsonPath, stringifyJson(packageJson), {
		dryRun: options.dryRun,
		label: outputLabels.updated
	})
}
