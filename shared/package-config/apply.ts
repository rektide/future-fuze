#!/usr/bin/env node

import { realpath } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { cli, define } from 'gunshi'

import conflictPlugin from './gunshi/conflict.ts'
import dryRunPlugin from './gunshi/dry-run.ts'
import updatePlugin from './gunshi/update.ts'
import { collectApplyTargetRoots } from './internal/targets.ts'
import { ensurePackageConfigDependency } from './internal/install.ts'
import { parseApplyRuntimeOptions } from './internal/options.ts'
import { loadProjectContext } from './internal/project.ts'
import { applyPrettierConfig } from './prettier/apply.ts'
import { applyTypescriptConfig } from './typescript/apply.ts'

const applyTargetChoices = ['tsconfig', 'prettier'] as const
type ApplyTargetChoice = (typeof applyTargetChoices)[number]

const configChoices = ['all', ...applyTargetChoices] as const
type ConfigChoice = (typeof configChoices)[number]

const configRunners: Record<ApplyTargetChoice, typeof applyTypescriptConfig> = {
	tsconfig: applyTypescriptConfig,
	prettier: applyPrettierConfig
}

function resolveApplyTargets(configs: ConfigChoice[]): ApplyTargetChoice[] {
	if (configs.includes('all')) {
		return [...applyTargetChoices]
	}

	const uniqueTargets = new Set<ApplyTargetChoice>()
	for (const config of configs) {
		if (config !== 'all') {
			uniqueTargets.add(config)
		}
	}

	return [...uniqueTargets]
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
			description: 'Config to apply; pass multiple --config arguments or use --config all'
		},
		recursive: {
			type: 'boolean',
			short: 'r',
			description: 'Apply to every package.json project recursively from current project root'
		}
	},
	run: async ctx => {
		const options = parseApplyRuntimeOptions(ctx.values)
		const baseProject = await loadProjectContext()
		const applyTargets = resolveApplyTargets(ctx.values.config)
		const applyProjectRoots = await collectApplyTargetRoots({
			cwd: baseProject.projectRoot,
			recursive: ctx.values.recursive === true
		})

		for (const applyProjectRoot of applyProjectRoots) {
			const project = await loadProjectContext(applyProjectRoot, baseProject.packageManager)
			if (ctx.values.recursive === true) {
				console.log(`Applying configs in ${project.projectRoot}`)
			}

			await ensurePackageConfigDependency(project, options)

			for (const applyTarget of applyTargets) {
				await configRunners[applyTarget](project, options)
			}
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
