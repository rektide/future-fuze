import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
	loadNamedStringRecordConfig,
	tryLoadNamedStringRecordConfig
} from '../internal/config-source.ts'
import { resolveConflictAction } from '../internal/conflict.ts'
import {
	parseJson,
	parseJsonWithComments,
	readTextFileIfExists,
	stringifyJson,
	writeTextFileIfChanged
} from '../internal/files.ts'
import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const targetTsconfigExtends = '@future-fuze/package-config/typescript/base.json'
const typescriptConfigDirectory = dirname(fileURLToPath(import.meta.url))
const recursiveTypescriptConfigDirectory = join(typescriptConfigDirectory, 'recursive')

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function applyTypescriptConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	await applyTypescriptPackageJsonConfig(project, options)

	const tsconfigPath = join(project.projectRoot, 'tsconfig.json')
	const existingTsconfigText = await readTextFileIfExists(tsconfigPath)

	if (!existingTsconfigText) {
		await writeTextFileIfChanged(
			tsconfigPath,
			stringifyJson({ extends: targetTsconfigExtends }),
			{ dryRun: options.dryRun, label: 'Create tsconfig.json' }
		)
		return
	}

	const parsedTsconfig = parseJsonWithComments(existingTsconfigText, tsconfigPath)
	if (!isRecord(parsedTsconfig)) {
		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: tsconfigPath,
			message: 'tsconfig.json root value is not an object'
		})

		if (!shouldOverwrite) {
			return
		}

		await writeTextFileIfChanged(
			tsconfigPath,
			stringifyJson({ extends: targetTsconfigExtends }),
			{ dryRun: options.dryRun, label: 'Overwrite tsconfig.json' }
		)
		return
	}

	const currentExtends = parsedTsconfig.extends
	if (currentExtends === targetTsconfigExtends) {
		console.log(`TypeScript config already extends ${targetTsconfigExtends}`)
		return
	}

	if (typeof currentExtends === 'string' && currentExtends.length > 0) {
		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: tsconfigPath,
			message: `existing extends is ${currentExtends}`
		})

		if (!shouldOverwrite) {
			return
		}
	}

	const { extends: _existingExtends, ...rest } = parsedTsconfig
	const nextTsconfig = {
		extends: targetTsconfigExtends,
		...rest
	}

	await writeTextFileIfChanged(tsconfigPath, stringifyJson(nextTsconfig), {
		dryRun: options.dryRun,
		label: 'Apply TypeScript config'
	})
}

function applyStringRecordSection(
	packageJson: Record<string, unknown>,
	sectionName: 'devDependencies' | 'scripts',
	targetValues: Record<string, string>,
	options: ApplyRuntimeOptions,
	packageJsonPath: string
): boolean {
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

async function applyTypescriptPackageJsonConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	const packageJsonText = await readTextFileIfExists(project.packageJsonPath)
	if (!packageJsonText) {
		throw new Error(`Missing package.json at ${project.packageJsonPath}`)
	}

	const packageJson = parseJson(packageJsonText, project.packageJsonPath)
	if (!isRecord(packageJson)) {
		throw new Error(`package.json root must be an object at ${project.packageJsonPath}`)
	}

	const targetDevDependencies = await loadTypescriptPackageSectionConfig(project, 'devDependencies')
	const targetScripts = await loadTypescriptPackageSectionConfig(project, 'scripts')

	const changedDevDependencies = applyStringRecordSection(
		packageJson,
		'devDependencies',
		targetDevDependencies,
		options,
		project.packageJsonPath
	)
	const changedScripts = applyStringRecordSection(
		packageJson,
		'scripts',
		targetScripts,
		options,
		project.packageJsonPath
	)

	if (!changedDevDependencies && !changedScripts) {
		console.log('TypeScript package.json settings are already up-to-date')
		return
	}

	await writeTextFileIfChanged(project.packageJsonPath, stringifyJson(packageJson), {
		dryRun: options.dryRun,
		label: 'Apply TypeScript package.json settings'
	})
}

async function loadTypescriptPackageSectionConfig(
	project: ProjectContext,
	sectionName: 'devDependencies' | 'scripts'
): Promise<Record<string, string>> {
	if (project.isMonorepoRoot) {
		const recursiveConfig = await tryLoadNamedStringRecordConfig(
			recursiveTypescriptConfigDirectory,
			sectionName,
			sectionName
		)
		if (recursiveConfig !== undefined) {
			return recursiveConfig
		}
	}

	return loadNamedStringRecordConfig(typescriptConfigDirectory, sectionName, sectionName)
}
