#!/usr/bin/env node

import { realpath } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { cli, define } from 'gunshi'

import { applyCdk8sConfig } from './cdk8s/apply.mts'
import { applyConcurrentlyConfig } from './concurrently/apply.mts'
import { applyEsmConfig } from './esm/apply.ts'
import conflictPlugin from './gunshi/conflict.ts'
import dryRunPlugin from './gunshi/dry-run.ts'
import loggingPlugin from './gunshi/logging.ts'
import updatePlugin from './gunshi/update.ts'
import { collectApplyTargetRoots } from './internal/targets.ts'
import { ensurePackageConfigDependency } from './internal/install.ts'
import { logInfo } from './internal/log.ts'
import { parseApplyRuntimeOptions } from './internal/options.ts'
import { applyEnumChoices, applyOptionDefaults } from './internal/options/schema.ts'
import { loadProjectContext } from './internal/project.ts'
import { applyPrettierConfig } from './prettier/apply.ts'
import { applyTypescriptConfig } from './typescript/apply.mts'
import { applyVitestConfig } from './vitest/apply.mts'

const applyTargetChoices = ['tsconfig', 'prettier', 'concurrently', 'cdk8s', 'vitest', 'esm'] as const
type ApplyTargetChoice = (typeof applyTargetChoices)[number]

const configChoices = ['all', ...applyTargetChoices] as const
type ConfigChoice = (typeof configChoices)[number]

const configRunners: Record<ApplyTargetChoice, typeof applyTypescriptConfig> = {
	tsconfig: applyTypescriptConfig,
	prettier: applyPrettierConfig,
	concurrently: applyConcurrentlyConfig,
	cdk8s: applyCdk8sConfig,
	vitest: applyVitestConfig,
	esm: applyEsmConfig
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
	return [updatePlugin(), dryRunPlugin(), conflictPlugin(), loggingPlugin()]
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
		},
		tsconfigProfile: {
			type: 'enum',
			choices: [...applyEnumChoices.tsconfigProfile],
			default: applyOptionDefaults.tsconfigProfile,
			toKebab: true,
			description: 'Profile for tsconfig apply behavior'
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
				logInfo('apply', `Applying configs in ${project.projectRoot}`)
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
