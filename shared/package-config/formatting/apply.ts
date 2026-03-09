import { spawn } from 'node:child_process'
import { join } from 'node:path'

import { resolveConflictAction } from '../internal/conflict.ts'
import { parseJson, readTextFileIfExists, writeTextFileIfChanged } from '../internal/files.ts'
import { logDryRun, logInfo } from '../internal/log.ts'
import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const targetFormattingConfig = '@future-fuze/package-config/formatting'
const targetFormattingConfigText = `"${targetFormattingConfig}"\n`

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
	const formattingConfigPath = join(project.projectRoot, '.prettierrc.json')
	const existingFormattingText = await readTextFileIfExists(formattingConfigPath)

	if (!existingFormattingText) {
		await writeTextFileIfChanged(formattingConfigPath, targetFormattingConfigText, {
			dryRun: options.dryRun,
			label: 'Create .prettierrc.json'
		})
		return
	}

	if (existingFormattingText.trim() === targetFormattingConfigText.trim()) {
		logInfo('apply', `Formatting config already set to ${targetFormattingConfig}`)
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
			return
		}

		await writeTextFileIfChanged(formattingConfigPath, targetFormattingConfigText, {
			dryRun: options.dryRun,
			label: 'Overwrite .prettierrc.json'
		})
		return
	}

	if (parsedFormatting === targetFormattingConfig) {
		logInfo('apply', `Formatting config already set to ${targetFormattingConfig}`)
		return
	}

	const shouldOverwrite = resolveConflictAction({
		mode: options.conflict,
		filePath: formattingConfigPath,
		message: 'existing .prettierrc.json differs from shared config reference'
	})

	if (!shouldOverwrite) {
		return
	}

	await writeTextFileIfChanged(formattingConfigPath, targetFormattingConfigText, {
		dryRun: options.dryRun,
		label: 'Apply Formatting config'
	})
}
