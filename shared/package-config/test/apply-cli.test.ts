import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

import { afterEach, describe, expect, test } from 'vitest'

const applyCliPath = fileURLToPath(new URL('../apply.ts', import.meta.url))
const fixturesRoot = fileURLToPath(new URL('./fixtures', import.meta.url))

const temporaryDirectories: string[] = []

async function createFixtureProject(name: string): Promise<string> {
	const fixturePath = join(fixturesRoot, name)
	const tempRoot = await mkdtemp(join(tmpdir(), 'package-config-apply-'))
	temporaryDirectories.push(tempRoot)

	await cp(fixturePath, tempRoot, { recursive: true })
	return tempRoot
}

async function runApply(args: string[], cwd: string) {
	return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
		const child = spawn('node', [applyCliPath, ...args], {
			cwd,
			env: {
				...process.env,
				NO_COLOR: '1'
			}
		})

		let stdout = ''
		let stderr = ''

		child.stdout.on('data', (chunk: unknown) => {
			stdout += String(chunk)
		})

		child.stderr.on('data', (chunk: unknown) => {
			stderr += String(chunk)
		})

		child.on('error', reject)
		child.on('close', (code: number | null) => {
			resolve({
				code: code ?? 1,
				stdout,
				stderr
			})
		})
	})
}

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('apply CLI package manager detection', () => {
	test('uses package metadata before lockfiles', async () => {
		const projectPath = await createFixtureProject('pnpm-project')
		const result = await runApply(['tsconfig', '--dry-run'], projectPath)

		expect(result.code).toBe(0)
		expect(result.stdout).toContain('[dry-run] pnpm add --save-dev @future-fuze/package-config')
	})

	test('uses npm lockfile when metadata is missing', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const result = await runApply(['tsconfig', '--dry-run'], projectPath)

		expect(result.code).toBe(0)
		expect(result.stdout).toContain('[dry-run] npm install --save-dev @future-fuze/package-config')
	})

	test('uses latest specifier when update flag is enabled', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const result = await runApply(['tsconfig', '--dry-run', '--update'], projectPath)

		expect(result.code).toBe(0)
		expect(result.stdout).toContain('@future-fuze/package-config@latest')
	})
})

describe('apply CLI conflict handling', () => {
	test('fails on tsconfig conflict by default', async () => {
		const projectPath = await createFixtureProject('npm-project')
		await writeFile(
			join(projectPath, 'tsconfig.json'),
			JSON.stringify({ extends: '@example/other-config' }, null, 2),
			'utf8'
		)

		const result = await runApply(['tsconfig', '--dry-run'], projectPath)

		expect(result.code).not.toBe(0)
		expect(result.stderr).toContain('Conflict at')
	})

	test('skips conflicting prettier config with --conflict skip', async () => {
		const projectPath = await createFixtureProject('npm-project')
		await writeFile(join(projectPath, '.prettierrc.json'), JSON.stringify({ semi: true }, null, 2), 'utf8')

		const result = await runApply(['prettier', '--dry-run', '--conflict', 'skip'], projectPath)

		expect(result.code).toBe(0)
		expect(result.stdout).toContain('Conflict skipped')
	})

	test('overwrites conflicting prettier config with --conflict overwrite', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const prettierPath = join(projectPath, '.prettierrc.json')
		await writeFile(prettierPath, JSON.stringify({ semi: true }, null, 2), 'utf8')

		const dryRunResult = await runApply(['prettier', '--dry-run', '--conflict', 'overwrite'], projectPath)
		expect(dryRunResult.code).toBe(0)
		expect(dryRunResult.stdout).toContain('[dry-run] Apply Prettier config')

		const applyResult = await runApply(['prettier', '--conflict', 'overwrite'], projectPath)
		expect(applyResult.code).toBe(0)

		const savedText = await readFile(prettierPath, 'utf8')
		expect(savedText).toBe('"@future-fuze/package-config/prettier"\n')
	})

	test('writes tsconfig extends for comment-preserving input', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const tsconfigPath = join(projectPath, 'tsconfig.json')
		await writeFile(tsconfigPath, '{\n  // comment\n  "compilerOptions": {\n    "strict": true\n  }\n}\n', 'utf8')

		const result = await runApply(['tsconfig', '--conflict', 'overwrite'], projectPath)
		expect(result.code).toBe(0)

		const savedText = await readFile(tsconfigPath, 'utf8')
		expect(savedText).toContain('"extends": "@future-fuze/package-config/typescript/base.json"')
	})
})
