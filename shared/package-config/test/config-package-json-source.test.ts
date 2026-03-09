import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { loadConfigPackageJsonSources } from '../internal/apply/config-source.ts'

const temporaryDirectories: string[] = []

async function createTempDirectory(): Promise<string> {
	const directoryPath = await mkdtemp(join(tmpdir(), 'package-config-config-package-json-source-'))
	temporaryDirectories.push(directoryPath)
	return directoryPath
}

afterEach(async () => {
	await Promise.all(
		temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true }))
	)
})

describe('loadConfigPackageJsonSources', () => {
	test('loads base config.json source when present', async () => {
		const configDirectory = await createTempDirectory()
		await writeFile(
			join(configDirectory, 'config.json'),
			JSON.stringify({ scripts: { test: 'vitest run' } }, null, 2),
			'utf8'
		)

		const sources = await loadConfigPackageJsonSources({
			configId: 'vitest',
			configDirectory,
			isMonorepoRoot: false
		})

		expect(sources).toEqual([{ value: { scripts: { test: 'vitest run' } } }])
	})

	test('loads base and recursive package.json sources at monorepo root', async () => {
		const configDirectory = await createTempDirectory()
		await mkdir(join(configDirectory, 'recursive'), { recursive: true })
		await writeFile(
			join(configDirectory, 'config.json'),
			JSON.stringify({ scripts: { test: 'vitest run' } }, null, 2),
			'utf8'
		)
		await writeFile(
			join(configDirectory, 'recursive', 'config.json'),
			JSON.stringify({ scripts: { test: 'pnpm -r run test' } }, null, 2),
			'utf8'
		)

		const sources = await loadConfigPackageJsonSources({
			configId: 'vitest',
			configDirectory,
			isMonorepoRoot: true
		})

		expect(sources).toEqual([
			{ value: { scripts: { test: 'vitest run' } } },
			{ value: { scripts: { test: 'pnpm -r run test' } } }
		])
	})

	test('throws when source package.json is empty', async () => {
		const configDirectory = await createTempDirectory()
		await writeFile(join(configDirectory, 'config.json'), '', 'utf8')

		await expect(
			loadConfigPackageJsonSources({
				configId: 'vitest',
				configDirectory,
				isMonorepoRoot: false
			})
		).rejects.toThrow('must not empty')
	})
})
