import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { applyConfigPackageJson } from '../internal/apply/package-json.ts'

import type { ApplyRuntimeOptions, ProjectContext } from '../internal/types.ts'

const temporaryDirectories: string[] = []

async function createTempDirectory(): Promise<string> {
	const directoryPath = await mkdtemp(join(tmpdir(), 'package-config-package-json-apply-'))
	temporaryDirectories.push(directoryPath)
	return directoryPath
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
	await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function createOptions(overrides: Partial<ApplyRuntimeOptions> = {}): ApplyRuntimeOptions {
	return {
		update: false,
		dryRun: false,
		verbose: false,
		conflict: 'error',
		tsconfigProfile: 'base',
		link: false,
		skipInstall: false,
		...overrides
	}
}

function createProjectContext(
	projectRoot: string,
	packageJson: Record<string, unknown>,
	overrides: Partial<ProjectContext> = {}
): ProjectContext {
	return {
		cwd: projectRoot,
		projectRoot,
		packageJsonPath: join(projectRoot, 'package.json'),
		packageJson,
		packageManager: 'pnpm',
		isMonorepoRoot: false,
		...overrides
	}
}

afterEach(async () => {
	await Promise.all(
		temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true }))
	)
})

describe('applyConfigPackageJson', () => {
	test('merges object and array values without resetting existing values', async () => {
		const rootDirectory = await createTempDirectory()
		const projectRoot = join(rootDirectory, 'project')
		const configDirectory = join(rootDirectory, 'config')

		await mkdir(join(configDirectory, 'recursive'), { recursive: true })
		await mkdir(projectRoot, { recursive: true })

		const initialPackageJson = {
			name: 'fixture-project',
			version: '1.0.0',
			private: true,
			keywords: ['existing', 'shared'],
			scripts: {
				lint: 'vitest'
			}
		}

		await writeJson(join(projectRoot, 'package.json'), initialPackageJson)
		await writeJson(join(configDirectory, 'package.json'), {
			keywords: ['base', 'shared'],
			scripts: {
				test: 'vitest run'
			}
		})
		await writeJson(join(configDirectory, 'recursive', 'package.json'), {
			keywords: ['recursive'],
			scripts: {
				test: 'pnpm -r run test:vitest',
				build: 'pnpm -r run build'
			}
		})

		const project = createProjectContext(projectRoot, initialPackageJson, { isMonorepoRoot: true })

		await applyConfigPackageJson({
			project,
			options: createOptions(),
			configName: 'vitest',
			configDirectory,
			outputLabels: {
				updated: 'apply',
				noChange: 'no change',
				noSource: 'no source'
			}
		})

		const saved = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8')) as {
			keywords: string[]
			scripts: Record<string, string>
		}

		expect(saved.keywords).toEqual(['existing', 'shared', 'base', 'recursive'])
		expect(saved.scripts).toEqual({
			lint: 'vitest',
			test: 'pnpm -r run test:vitest',
			build: 'pnpm -r run build'
		})
	})

	test('fails on empty source package.json', async () => {
		const rootDirectory = await createTempDirectory()
		const projectRoot = join(rootDirectory, 'project')
		const configDirectory = join(rootDirectory, 'config')

		await mkdir(configDirectory, { recursive: true })
		await mkdir(projectRoot, { recursive: true })

		await writeJson(join(projectRoot, 'package.json'), {
			name: 'fixture-project',
			version: '1.0.0',
			private: true
		})
		await writeFile(join(configDirectory, 'package.json'), '', 'utf8')

		const project = createProjectContext(projectRoot, {
			name: 'fixture-project',
			version: '1.0.0',
			private: true
		})

		await expect(
			applyConfigPackageJson({
				project,
				options: createOptions(),
				configName: 'vitest',
				configDirectory,
				outputLabels: {
					updated: 'apply',
					noChange: 'no change',
					noSource: 'no source'
				}
			})
		).rejects.toThrow('must not be empty')
	})
})
