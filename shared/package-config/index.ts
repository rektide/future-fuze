#!/usr/bin/env node

import { realpath } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { cli, define } from 'gunshi'

import { applySubCommands, createApplyPlugins } from './apply.ts'

const entryCommand = define({
	name: 'package-config',
	description: 'Manage shared package-config presets',
	run: () => {
		console.log('Select a subcommand (apply).')
	}
})

const applyCommand = define({
	name: 'apply',
	description: 'Apply shared package-config presets to a project',
	subCommands: applySubCommands,
	run: () => {
		console.log('Select a config to apply (tsconfig, prettier).')
	}
})

export async function main(argv = process.argv.slice(2)): Promise<void> {
	await cli(argv, entryCommand, {
		name: '@future-fuze/package-config',
		plugins: createApplyPlugins(),
		subCommands: {
			apply: applyCommand
		}
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
