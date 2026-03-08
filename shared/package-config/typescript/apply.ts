import { join } from 'node:path'

import { define } from 'gunshi'

import { resolveConflictAction } from '../internal/conflict.ts'
import {
	parseJsonWithComments,
	readTextFileIfExists,
	stringifyJson,
	writeTextFileIfChanged
} from '../internal/files.ts'
import { ensurePackageConfigDependency } from '../internal/install.ts'
import { parseApplyRuntimeOptions } from '../internal/options.ts'
import { loadProjectContext } from '../internal/project.ts'

const targetTsconfigExtends = '@future-fuze/package-config/typescript/base.json'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export default define({
	name: 'tsconfig',
	description: 'Apply shared TypeScript package config',
	run: async ctx => {
		const options = parseApplyRuntimeOptions(ctx.values)
		const project = await loadProjectContext()

		await ensurePackageConfigDependency(project, options)

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
})
