#!/usr/bin/env node

import { realpath } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { cli, define } from 'gunshi'

import conflictPlugin from './gunshi/conflict.ts'
import dryRunPlugin from './gunshi/dry-run.ts'
import updatePlugin from './gunshi/update.ts'
import prettierApplyCommand from './prettier/apply.ts'
import typescriptApplyCommand from './typescript/apply.ts'

const entryCommand = define({
	name: 'apply',
	description: 'Apply shared package-config presets to a project',
	run: () => {
		console.log('Select a config to apply (tsconfig, prettier).')
	}
})

export async function main(argv = process.argv.slice(2)): Promise<void> {
	await cli(argv, entryCommand, {
		name: '@future-fuze/package-config apply',
		plugins: [updatePlugin(), dryRunPlugin(), conflictPlugin()],
		subCommands: {
			tsconfig: typescriptApplyCommand,
			prettier: prettierApplyCommand
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
