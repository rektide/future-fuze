import { join } from 'node:path'

import { resolveConflictAction } from '../internal/conflict.ts'
import { parseJson, readTextFileIfExists, writeTextFileIfChanged } from '../internal/files.ts'
import { logInfo } from '../internal/log.ts'
import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const targetPrettierConfig = '@future-fuze/package-config/prettier'
const targetPrettierConfigText = `"${targetPrettierConfig}"\n`

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
