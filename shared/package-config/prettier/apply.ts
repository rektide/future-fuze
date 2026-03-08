import { join } from 'node:path'

import { define } from 'gunshi'

import { resolveConflictAction } from '../internal/conflict.ts'
import { parseJson, readTextFileIfExists, writeTextFileIfChanged } from '../internal/files.ts'
import { ensurePackageConfigDependency } from '../internal/install.ts'
import { parseApplyRuntimeOptions } from '../internal/options.ts'
import { loadProjectContext } from '../internal/project.ts'

const targetPrettierConfig = '@future-fuze/package-config/prettier'
const targetPrettierConfigText = `"${targetPrettierConfig}"\n`

export default define({
	name: 'prettier',
	description: 'Apply shared Prettier package config',
	run: async ctx => {
		const options = parseApplyRuntimeOptions(ctx.values)
		const project = await loadProjectContext()

		await ensurePackageConfigDependency(project, options)

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
			console.log(`Prettier config already set to ${targetPrettierConfig}`)
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
			console.log(`Prettier config already set to ${targetPrettierConfig}`)
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
})
