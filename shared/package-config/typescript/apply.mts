import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

import { createPackageJsonConfigRunner } from '../internal/apply/config-runner.ts'
import { tryLoadNamedObjectConfig } from '../internal/config-source.ts'
import { resolveConflictAction } from '../internal/conflict.ts'
import {
	parseJsonWithComments,
	readTextFileIfExists,
	stringifyJson,
	writeTextFileIfChanged
} from '../internal/files.ts'

import type {
	ActionStatus,
	ApplyActionResult,
	ApplyRuntimeOptions,
	ProjectContext,
	TsconfigProfile
} from '../internal/types.ts'

const typescriptConfigDirectory = dirname(fileURLToPath(import.meta.url))
const recursiveTypescriptConfigDirectory = join(typescriptConfigDirectory, 'recursive')
const runTypescriptPackageJson = createPackageJsonConfigRunner({
	configId: 'typescript',
	configDirectory: typescriptConfigDirectory
})

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

interface TypescriptTsconfigPlan {
	tsconfigPath: string
	status: ActionStatus
	nextContent?: string
	writeLabel?: string
}

async function applyTypescriptPackageJsonConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<ApplyActionResult> {
	return await runTypescriptPackageJson(project, options)
}

async function planTypescriptTsconfigFile(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<TypescriptTsconfigPlan> {
	const tsconfigTemplate = await loadTypescriptTsconfigTemplate(project, options.tsconfigProfile)
	const tsconfigPath = join(project.projectRoot, 'tsconfig.json')
	const existingTsconfigText = await readTextFileIfExists(tsconfigPath)

	if (!existingTsconfigText) {
		return {
			tsconfigPath,
			status: 'created',
			nextContent: stringifyJson(tsconfigTemplate),
			writeLabel: 'Create tsconfig.json'
		}
	}

	const parsedTsconfig = parseJsonWithComments(existingTsconfigText, tsconfigPath)
	if (!isRecord(parsedTsconfig)) {
		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: tsconfigPath,
			message: 'tsconfig.json root value is not an object'
		})

		if (!shouldOverwrite) {
			return {
				tsconfigPath,
				status: 'unchanged'
			}
		}

		return {
			tsconfigPath,
			status: 'updated',
			nextContent: stringifyJson(tsconfigTemplate),
			writeLabel: 'Overwrite tsconfig.json'
		}
	}

	const changed = applyTsconfigTemplate(parsedTsconfig, tsconfigTemplate, options, tsconfigPath)
	if (!changed) {
		return {
			tsconfigPath,
			status: 'unchanged'
		}
	}

	return {
		tsconfigPath,
		status: 'updated',
		nextContent: stringifyJson(parsedTsconfig),
		writeLabel: 'Apply TypeScript config'
	}
}

async function applyPlannedTypescriptTsconfigFile(
	plan: TypescriptTsconfigPlan,
	options: ApplyRuntimeOptions
): Promise<ApplyActionResult> {
	if (!plan.nextContent) {
		return {
			configId: 'tsconfig',
			actionId: 'tsconfig-file',
			status: 'unchanged'
		}
	}

	const status = await writeTextFileIfChanged(plan.tsconfigPath, plan.nextContent, {
		dryRun: options.dryRun,
		label: plan.writeLabel
	})

	return {
		configId: 'tsconfig',
		actionId: 'tsconfig-file',
		status
	}
}

export async function applyTypescriptConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<ApplyActionResult[]> {
	const packageJsonResult = await applyTypescriptPackageJsonConfig(project, options)
	const plan = await planTypescriptTsconfigFile(project, options)
	const tsconfigResult = await applyPlannedTypescriptTsconfigFile(plan, options)

	return [packageJsonResult, tsconfigResult]
}
