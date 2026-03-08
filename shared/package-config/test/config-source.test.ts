import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { loadNamedStringRecordConfig } from '../internal/config-source.ts'

const temporaryDirectories: string[] = []

async function createTempDirectory(): Promise<string> {
	const directoryPath = await mkdtemp(join(tmpdir(), 'package-config-config-source-'))
	temporaryDirectories.push(directoryPath)
	return directoryPath
}

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('loadNamedStringRecordConfig', () => {
	test('loads named export from TypeScript config file', async () => {
		const directoryPath = await createTempDirectory()
		await writeFile(
			join(directoryPath, 'scripts.ts'),
			"export const scripts = { 'checkbuild:tsgo': 'tsgo' }\n",
			'utf8'
		)

		const loaded = await loadNamedStringRecordConfig(directoryPath, 'scripts', 'scripts')
		expect(loaded).toEqual({ 'checkbuild:tsgo': 'tsgo' })
	})

	test('falls back to config export when named export is absent', async () => {
		const directoryPath = await createTempDirectory()
		await writeFile(
			join(directoryPath, 'devDependencies.ts'),
			"export const config = { '@typescript/native-preview': '*' }\n",
			'utf8'
		)

		const loaded = await loadNamedStringRecordConfig(
			directoryPath,
			'devDependencies',
			'devDependencies'
		)
		expect(loaded).toEqual({ '@typescript/native-preview': '*' })
	})

	test('prefers TypeScript source over JSON source', async () => {
		const directoryPath = await createTempDirectory()
		await writeFile(
			join(directoryPath, 'scripts.ts'),
			"export const scripts = { 'checkbuild:tsgo': 'from-ts' }\n",
			'utf8'
		)
		await writeFile(
			join(directoryPath, 'scripts.json'),
			JSON.stringify({ 'checkbuild:tsgo': 'from-json' }, null, 2),
			'utf8'
		)

		const loaded = await loadNamedStringRecordConfig(directoryPath, 'scripts', 'scripts')
		expect(loaded).toEqual({ 'checkbuild:tsgo': 'from-ts' })
	})
})
