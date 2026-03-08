#!/usr/bin/env node

import { realpath } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { cli, define } from 'gunshi'

import conflictPlugin from './gunshi/conflict.ts'
import dryRunPlugin from './gunshi/dry-run.ts'
import updatePlugin from './gunshi/update.ts'
import { ensurePackageConfigDependency } from './internal/install.ts'
import { parseApplyRuntimeOptions } from './internal/options.ts'
import { loadProjectContext } from './internal/project.ts'
import { applyPrettierConfig } from './prettier/apply.ts'
import { applyTypescriptConfig } from './typescript/apply.ts'

const configChoices = ['tsconfig', 'prettier'] as const
type ConfigChoice = (typeof configChoices)[number]

const configRunners: Record<ConfigChoice, typeof applyTypescriptConfig> = {
	tsconfig: applyTypescriptConfig,
	prettier: applyPrettierConfig
}

export function createApplyPlugins() {
	return [updatePlugin(), dryRunPlugin(), conflictPlugin()]
}

export const applyCommand = define({
	name: 'apply',
	description: 'Apply shared package-config presets to a project',
	args: {
		config: {
			type: 'enum',
			choices: [...configChoices],
			multiple: true,
			required: true,
			description: 'Config to apply; pass multiple --config arguments to apply more than one'
		}
	},
	run: async ctx => {
		const options = parseApplyRuntimeOptions(ctx.values)
		const project = await loadProjectContext()
		await ensurePackageConfigDependency(project, options)

		const requestedConfigs = ctx.values.config
		for (const config of requestedConfigs) {
			await configRunners[config](project, options)
		}
	}
})

export async function main(argv = process.argv.slice(2)): Promise<void> {
	await cli(argv, applyCommand, {
		name: '@future-fuze/package-config apply',
		plugins: createApplyPlugins()
	})
}

if (process.argv[1]) {
	void realpath(process.argv[1])
		.then((resolvedArgv: string) => {
			if (import.meta.url !== pathToFileURL(resolvedArgv).href) {
				return
			}

			return main()
		})
		.catch((error: unknown) => {
			console.error(error)
			process.exitCode = 1
		})
}
