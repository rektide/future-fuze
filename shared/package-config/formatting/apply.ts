import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createPackageJsonConfigRunner } from '../internal/apply/config-runner.ts'
import { resolveConflictAction } from '../internal/conflict.ts'
import { parseJson, readTextFileIfExists, writeTextFileIfChanged } from '../internal/files.ts'
import { logDryRun, logInfo } from '../internal/log.ts'
import type { ActionStatus, ApplyActionResult, ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const targetFormattingConfig = '@future-fuze/package-config/formatting'
const targetFormattingConfigText = `"${targetFormattingConfig}"\n`
const formattingConfigDirectory = dirname(fileURLToPath(import.meta.url))
const runFormattingPackageJson = createPackageJsonConfigRunner({
	configId: 'formatting',
	configDirectory: formattingConfigDirectory
})

async function runOxfmt(projectRoot: string, dryRun: boolean): Promise<void> {
	if (dryRun) {
		logDryRun(`oxfmt . (cwd: ${projectRoot})`)
		return
	}

	logInfo('fmt', 'Running oxfmt')

	const { NODE_PATH, ...cleanEnv } = process.env

	await new Promise<void>((resolve, reject) => {
		const child = spawn('oxfmt', ['.'], {
			cwd: projectRoot,
			stdio: 'inherit',
			env: cleanEnv
		})

		child.on('error', reject)
		child.on('exit', (code: number | null) => {
			if (code === 0) {
				resolve()
				return
			}

			reject(new Error(`oxfmt . failed with code ${String(code)}`))
		})
	})
}

export async function runOxfmtAfterInstall(project: ProjectContext, options: ApplyRuntimeOptions): Promise<void> {
	await runOxfmt(project.projectRoot, options.dryRun)
}

interface FormattingPrettierrcPlan {
	prettierrcPath: string
	status: ActionStatus
	nextContent?: string
	writeLabel?: string
}

async function planFormattingPrettierrcFile(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<FormattingPrettierrcPlan> {
	const prettierrcPath = join(project.projectRoot, '.prettierrc.json')
	const existingPrettierrcText = await readTextFileIfExists(prettierrcPath)

	if (!existingPrettierrcText) {
		return {
			prettierrcPath,
			status: 'created',
			nextContent: targetFormattingConfigText,
			writeLabel: 'Create .prettierrc.json'
		}
	}

	if (existingPrettierrcText.trim() === targetFormattingConfigText.trim()) {
		return {
			prettierrcPath,
			status: 'unchanged'
		}
	}

	let parsedPrettierrc: unknown
	try {
		parsedPrettierrc = parseJson(existingPrettierrcText, prettierrcPath)
	} catch {
		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: prettierrcPath,
			message: 'existing .prettierrc.json is not valid JSON'
		})

		if (!shouldOverwrite) {
			return {
				prettierrcPath,
				status: 'unchanged'
			}
		}

		return {
			prettierrcPath,
			status: 'updated',
			nextContent: targetFormattingConfigText,
			writeLabel: 'Overwrite .prettierrc.json'
		}
	}

	if (parsedPrettierrc === targetFormattingConfig) {
		return {
			prettierrcPath,
			status: 'unchanged'
		}
	}

	const shouldOverwrite = resolveConflictAction({
		mode: options.conflict,
		filePath: prettierrcPath,
		message: 'existing .prettierrc.json differs from shared config reference'
	})

	if (!shouldOverwrite) {
		return {
			prettierrcPath,
			status: 'unchanged'
		}
	}

	return {
		prettierrcPath,
		status: 'updated',
		nextContent: targetFormattingConfigText,
		writeLabel: 'Apply Formatting config'
	}
}

async function applyPlannedFormattingPrettierrcFile(
	plan: FormattingPrettierrcPlan,
	options: ApplyRuntimeOptions
): Promise<ApplyActionResult> {
	if (!plan.nextContent) {
		return {
			configId: 'formatting',
			actionId: 'prettierrc',
			status: 'unchanged'
		}
	}

	const status = await writeTextFileIfChanged(plan.prettierrcPath, plan.nextContent, {
		dryRun: options.dryRun,
		label: plan.writeLabel
	})

	return {
		configId: 'formatting',
		actionId: 'prettierrc',
		status
	}
}

export async function applyFormattingConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<ApplyActionResult[]> {
	const packageJsonResult = await runFormattingPackageJson(project, options)
	const plan = await planFormattingPrettierrcFile(project, options)
	const prettierrcResult = await applyPlannedFormattingPrettierrcFile(plan, options)

	return [packageJsonResult, prettierrcResult]
}
