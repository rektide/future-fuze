#!/usr/bin/env node

import { realpath } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { cli, define } from 'gunshi'

import { applyCdk8sConfig } from './cdk8s/apply.mts'
import { applyConcurrentlyConfig } from './concurrently/apply.mts'
import { applyEsmConfig } from './esm/apply.ts'
import conflictPlugin from './gunshi/conflict.ts'
import dryRunPlugin from './gunshi/dry-run.ts'
import installPlugin from './gunshi/install.ts'
import linkPlugin from './gunshi/link.ts'
import { configureApplyLogging } from './gunshi/logging.ts'
import loggingPlugin from './gunshi/logging.ts'
import updatePlugin from './gunshi/update.ts'
import { collectApplyTargetRoots } from './internal/targets.ts'
import { ensurePackageConfigDependency, runPackageManagerInstall } from './internal/install.ts'
import { logInfo } from './internal/log.ts'
import { parseApplyRuntimeOptions } from './internal/options.ts'
import { applyEnumChoices, applyOptionDefaults } from './internal/options/schema.ts'
import { loadProjectContext } from './internal/project.ts'
import { applyFormattingConfig, runOxfmtAfterInstall } from './formatting/apply.ts'
import { applyTypescriptConfig } from './typescript/apply.mts'
import { applyVitestConfig } from './vitest/apply.mts'

import type { ApplyActionResult, ApplyRuntimeOptions, ProjectContext } from './internal/types.ts'

const applyTargetChoices = ['tsconfig', 'formatting', 'concurrently', 'cdk8s', 'vitest', 'esm'] as const
type ApplyTargetChoice = (typeof applyTargetChoices)[number]

const configChoices = ['all', ...applyTargetChoices] as const
type ConfigChoice = (typeof configChoices)[number]

type ConfigApplyRunner = (
	project: ProjectContext,
	options: ApplyRuntimeOptions
) => Promise<ApplyActionResult[]>

const configRunners: Record<ApplyTargetChoice, ConfigApplyRunner> = {
	tsconfig: applyTypescriptConfig,
	formatting: applyFormattingConfig,
	concurrently: applyConcurrentlyConfig,
	cdk8s: applyCdk8sConfig,
	vitest: applyVitestConfig,
	esm: applyEsmConfig
}

function logActionResults(results: ApplyActionResult[]): void {
	for (const result of results) {
		logInfo('apply', `${result.configId}.${result.actionId} status=${result.status}`)
	}
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
	return [updatePlugin(), dryRunPlugin(), conflictPlugin(), loggingPlugin(), linkPlugin(), installPlugin()]
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
		configureApplyLogging({ logFormat: options.logFormat })
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
				const results = await configRunners[applyTarget](project, options)
				logActionResults(results)
			}

			if (!options.skipInstall) {
				await runPackageManagerInstall(project, options.dryRun)
				await runOxfmtAfterInstall(project, options)
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
