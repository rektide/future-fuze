import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

import { createPackageJsonOutputLabels } from '../internal/apply/labels.ts'
import { applyConfigPackageJson } from '../internal/apply/package-json.ts'
import { tryLoadNamedObjectConfig } from '../internal/config-source.ts'
import { resolveConflictAction } from '../internal/conflict.ts'
import {
	parseJsonWithComments,
	readTextFileIfExists,
	stringifyJson,
	writeTextFileIfChanged
} from '../internal/files.ts'
import { logInfo } from '../internal/log.ts'

import type {
	ApplyRuntimeOptions,
	ProjectContext,
	TsconfigProfile
} from '../internal/types.ts'

const typescriptConfigDirectory = dirname(fileURLToPath(import.meta.url))
const recursiveTypescriptConfigDirectory = join(typescriptConfigDirectory, 'recursive')

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function resolveTsconfigExtends(profile: TsconfigProfile): string {
	if (profile === 'cdk8s') {
		return '@future-fuze/package-config/typescript/cdk8s.json'
	}

	return '@future-fuze/package-config/typescript/base.json'
}

async function loadTypescriptTsconfigTemplate(
	project: ProjectContext,
	profile: TsconfigProfile
): Promise<Record<string, unknown>> {
	const recursiveTemplate = project.isMonorepoRoot
		? await tryLoadNamedObjectConfig(recursiveTypescriptConfigDirectory, 'tsconfig', 'tsconfig')
		: undefined
	const baseTemplate = await tryLoadNamedObjectConfig(typescriptConfigDirectory, 'tsconfig', 'tsconfig')

	const template = recursiveTemplate ?? baseTemplate ?? {}
	return {
		...template,
		extends: resolveTsconfigExtends(profile)
	}
}

function applyCompilerOptionTemplate(
	existingCompilerOptions: Record<string, unknown>,
	desiredCompilerOptions: Record<string, unknown>,
	options: ApplyRuntimeOptions,
	tsconfigPath: string
): boolean {
	let changed = false

	for (const [subKey, desiredValue] of Object.entries(desiredCompilerOptions)) {
		const existingValue = existingCompilerOptions[subKey]
		if (existingValue === undefined) {
			existingCompilerOptions[subKey] = desiredValue
			changed = true
			continue
		}

		if (isDeepStrictEqual(existingValue, desiredValue)) {
			continue
		}

		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: tsconfigPath,
			message: `compilerOptions.${subKey} differs from template value`
		})

		if (!shouldOverwrite) {
			continue
		}

		existingCompilerOptions[subKey] = desiredValue
		changed = true
	}

	return changed
}

function applyTsconfigTemplate(
	tsconfig: Record<string, unknown>,
	template: Record<string, unknown>,
	options: ApplyRuntimeOptions,
	tsconfigPath: string
): boolean {
	let changed = false

	for (const [key, desiredValue] of Object.entries(template)) {
		const existingValue = tsconfig[key]

		if (existingValue === undefined) {
			tsconfig[key] = desiredValue
			changed = true
			continue
		}

		if (key === 'compilerOptions' && isRecord(existingValue) && isRecord(desiredValue)) {
			changed =
				applyCompilerOptionTemplate(existingValue, desiredValue, options, tsconfigPath) || changed
			continue
		}

		if (isDeepStrictEqual(existingValue, desiredValue)) {
			continue
		}

		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: tsconfigPath,
			message: `${key} differs from template value`
		})

		if (!shouldOverwrite) {
			continue
		}

		tsconfig[key] = desiredValue
		changed = true
	}

	return changed
}

async function applyTypescriptPackageJsonConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	await applyConfigPackageJson({
		project,
		options,
		configName: 'typescript',
		configDirectory: typescriptConfigDirectory,
		outputLabels: createPackageJsonOutputLabels({ configId: 'typescript' })
	})
}

async function applyTypescriptTsconfigFile(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	const tsconfigTemplate = await loadTypescriptTsconfigTemplate(project, options.tsconfigProfile)
	const tsconfigPath = join(project.projectRoot, 'tsconfig.json')
	const existingTsconfigText = await readTextFileIfExists(tsconfigPath)

	if (!existingTsconfigText) {
		await writeTextFileIfChanged(tsconfigPath, stringifyJson(tsconfigTemplate), {
			dryRun: options.dryRun,
			label: 'Create tsconfig.json'
		})
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

		await writeTextFileIfChanged(tsconfigPath, stringifyJson(tsconfigTemplate), {
			dryRun: options.dryRun,
			label: 'Overwrite tsconfig.json'
		})
		return
	}

	const changed = applyTsconfigTemplate(parsedTsconfig, tsconfigTemplate, options, tsconfigPath)
	if (!changed) {
		logInfo('apply', 'TypeScript tsconfig.json is already up-to-date')
		return
	}

	await writeTextFileIfChanged(tsconfigPath, stringifyJson(parsedTsconfig), {
		dryRun: options.dryRun,
		label: 'Apply TypeScript config'
	})
}

export async function applyTypescriptConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	await applyTypescriptPackageJsonConfig(project, options)
	await applyTypescriptTsconfigFile(project, options)
}
