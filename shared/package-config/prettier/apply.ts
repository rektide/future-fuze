import { spawn } from 'node:child_process'
import { join } from 'node:path'

import { resolveConflictAction } from '../internal/conflict.ts'
import { parseJson, readTextFileIfExists, writeTextFileIfChanged } from '../internal/files.ts'
import { logDryRun, logInfo } from '../internal/log.ts'
import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const targetPrettierConfig = '@future-fuze/package-config/prettier'
const targetPrettierConfigText = `"${targetPrettierConfig}"\n`

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

export async function applyPrettierConfig(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	const prettierConfigPath = join(project.projectRoot, '.prettierrc.json')
	const existingPrettierText = await readTextFileIfExists(prettierConfigPath)

	if (!existingPrettierText) {
		await writeTextFileIfChanged(prettierConfigPath, targetPrettierConfigText, {
			dryRun: options.dryRun,
			label: 'Create .prettierrc.json'
		})
		return
	}

	if (existingPrettierText.trim() === targetPrettierConfigText.trim()) {
		logInfo('apply', `Prettier config already set to ${targetPrettierConfig}`)
		return
	}

	let parsedPrettier: unknown
	try {
		parsedPrettier = parseJson(existingPrettierText, prettierConfigPath)
	} catch {
		const shouldOverwrite = resolveConflictAction({
			mode: options.conflict,
			filePath: prettierConfigPath,
			message: 'existing .prettierrc.json is not valid JSON'
		})

		if (!shouldOverwrite) {
			return
		}

		await writeTextFileIfChanged(prettierConfigPath, targetPrettierConfigText, {
			dryRun: options.dryRun,
			label: 'Overwrite .prettierrc.json'
		})
		return
	}

	if (parsedPrettier === targetPrettierConfig) {
		logInfo('apply', `Prettier config already set to ${targetPrettierConfig}`)
		return
	}

	const shouldOverwrite = resolveConflictAction({
		mode: options.conflict,
		filePath: prettierConfigPath,
		message: 'existing .prettierrc.json differs from shared config reference'
	})

	if (!shouldOverwrite) {
		return
	}

	await writeTextFileIfChanged(prettierConfigPath, targetPrettierConfigText, {
		dryRun: options.dryRun,
		label: 'Apply Prettier config'
	})
}
