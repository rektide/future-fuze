import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createPackageJsonConfigRunner } from '../internal/apply/config-runner.ts'
import { resolveConflictAction } from '../internal/conflict.ts'
import { parseJson, readTextFileIfExists, writeTextFileIfChanged } from '../internal/files.ts'
import { logDryRun, logInfo } from '../internal/log.ts'
import type { ActionStatus, ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

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

export async function applyFormattingConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	await runFormattingPackageJson(project, options)

	const formattingConfigPath = join(project.projectRoot, '.prettierrc.json')
	const existingFormattingText = await readTextFileIfExists(formattingConfigPath)
	let status: ActionStatus = 'unchanged'

	if (!existingFormattingText) {
		status = await writeTextFileIfChanged(formattingConfigPath, targetFormattingConfigText, {
			dryRun: options.dryRun,
			label: 'Create .prettierrc.json'
		})
		logInfo('apply', `Formatting .prettierrc.json action status: ${status}`)
		return
	}

	if (existingFormattingText.trim() === targetFormattingConfigText.trim()) {
		status = 'unchanged'
		logInfo('apply', `Formatting .prettierrc.json action status: ${status}`)
		return
	}

	let parsedFormatting: unknown
	try {
		parsedFormatting = parseJson(existingFormattingText, formattingConfigPath)
	} catch {
		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: formattingConfigPath,
			message: 'existing .prettierrc.json is not valid JSON'
		})

		if (!shouldOverwrite) {
			logInfo('apply', `Formatting .prettierrc.json action status: ${status}`)
			return
		}

		status = await writeTextFileIfChanged(formattingConfigPath, targetFormattingConfigText, {
			dryRun: options.dryRun,
			label: 'Overwrite .prettierrc.json'
		})
		logInfo('apply', `Formatting .prettierrc.json action status: ${status}`)
		return
	}

	if (parsedFormatting === targetFormattingConfig) {
		status = 'unchanged'
		logInfo('apply', `Formatting .prettierrc.json action status: ${status}`)
		return
	}

	const shouldOverwrite = resolveConflictAction({
		mode: options.conflict,
		filePath: formattingConfigPath,
		message: 'existing .prettierrc.json differs from shared config reference'
	})

	if (!shouldOverwrite) {
		logInfo('apply', `Formatting .prettierrc.json action status: ${status}`)
		return
	}

	status = await writeTextFileIfChanged(formattingConfigPath, targetFormattingConfigText, {
		dryRun: options.dryRun,
		label: 'Apply Formatting config'
	})

	logInfo('apply', `Formatting .prettierrc.json action status: ${status}`)
}
