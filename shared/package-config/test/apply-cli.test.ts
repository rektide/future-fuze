import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

import { afterEach, describe, expect, test } from 'vitest'

const applyCliPath = fileURLToPath(new URL('../apply.ts', import.meta.url))
const indexCliPath = fileURLToPath(new URL('../index.ts', import.meta.url))
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

async function runIndex(args: string[], cwd: string) {
	return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
		const child = spawn('node', [indexCliPath, ...args], {
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
		test('index command calls apply subcommand', async () => {
			const projectPath = await createFixtureProject('npm-project')
			const result = await runIndex(['apply', '--config', 'tsconfig', '--dry-run'], projectPath)

			expect(result.code).toBe(0)
			expect(result.stdout).toContain('[dry-run] npm install --save-dev @future-fuze/package-config')
		})

	test('applies multiple configs in one invocation', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const result = await runApply(
			['--config', 'tsconfig', '--config', 'prettier', '--dry-run'],
			projectPath
		)

			expect(result.code).toBe(0)
			expect(result.stdout).toContain('[dry-run] Create tsconfig.json')
		expect(result.stdout).toContain('[dry-run] Create .prettierrc.json')
	})

	test('applies all configs with --config all', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const result = await runApply(['--config', 'all', '--dry-run'], projectPath)

		expect(result.code).toBe(0)
		expect(result.stdout).toContain('[dry-run] Create tsconfig.json')
		expect(result.stdout).toContain('[dry-run] Create .prettierrc.json')
		expect(result.stdout).toContain('[dry-run] Apply concurrently package.json settings')
		expect(result.stdout).toContain('[dry-run] Apply cdk8s package.json settings')
	})

	test('applies recursively with --recursive', async () => {
		const projectPath = await createFixtureProject('npm-workspace')
		const result = await runApply(['--config', 'tsconfig', '--dry-run', '--recursive'], projectPath)

		expect(result.code).toBe(0)
		expect(result.stdout).toContain(`Applying configs in ${projectPath}`)
		expect(result.stdout).toContain(join(projectPath, 'packages', 'a'))
		expect(result.stdout).toContain(join(projectPath, 'packages', 'b'))

		const installMatches = result.stdout.match(/\[dry-run\] npm install --save-dev @future-fuze\/package-config/g)
		expect(installMatches?.length).toBe(3)
	})

	test('uses recursive scripts source at monorepo root only', async () => {
		const projectPath = await createFixtureProject('npm-workspace')
		const rootPackageJsonPath = join(projectPath, 'package.json')
		const leafAPackageJsonPath = join(projectPath, 'packages', 'a', 'package.json')
		const leafBPackageJsonPath = join(projectPath, 'packages', 'b', 'package.json')

		await writeFile(
			rootPackageJsonPath,
			JSON.stringify(
				{
					name: 'fixture-npm-workspace',
					version: '1.0.0',
					private: true,
					workspaces: ['packages/*'],
					devDependencies: {
						'@future-fuze/package-config': '*',
						'@typescript/native-preview': '*'
					},
					scripts: {
						'checkbuild:tsgo': 'old-root-script'
					}
				},
				null,
				2
			),
			'utf8'
		)

		for (const leafPath of [leafAPackageJsonPath, leafBPackageJsonPath]) {
			const packageJson = JSON.parse(await readFile(leafPath, 'utf8')) as Record<string, unknown>
			await writeFile(
				leafPath,
				JSON.stringify(
					{
						...packageJson,
						devDependencies: {
							'@future-fuze/package-config': '*',
							'@typescript/native-preview': '*'
						},
						scripts: {
							'checkbuild:tsgo': 'old-leaf-script'
						}
					},
					null,
					2
				),
				'utf8'
			)
		}

		const result = await runApply(
			['--config', 'tsconfig', '--recursive', '--conflict', 'overwrite'],
			projectPath
		)

		expect(result.code).toBe(0)

		const rootPackageJson = JSON.parse(await readFile(rootPackageJsonPath, 'utf8')) as {
			scripts: Record<string, string>
		}
		expect(rootPackageJson.scripts['checkbuild:tsgo']).toBe('pnpm -r run checkbuild:tsgo')

		const leafAPackageJson = JSON.parse(await readFile(leafAPackageJsonPath, 'utf8')) as {
			scripts: Record<string, string>
		}
		const leafBPackageJson = JSON.parse(await readFile(leafBPackageJsonPath, 'utf8')) as {
			scripts: Record<string, string>
		}
		expect(leafAPackageJson.scripts['checkbuild:tsgo']).toBe('tsgo')
		expect(leafBPackageJson.scripts['checkbuild:tsgo']).toBe('tsgo')
	})

	test('uses cdk8s recursive script at monorepo root only', async () => {
		const projectPath = await createFixtureProject('npm-workspace')
		const rootPackageJsonPath = join(projectPath, 'package.json')
		const leafAPackageJsonPath = join(projectPath, 'packages', 'a', 'package.json')

		await writeFile(
			rootPackageJsonPath,
			JSON.stringify(
				{
					name: 'fixture-npm-workspace',
					version: '1.0.0',
					private: true,
					workspaces: ['packages/*'],
					devDependencies: {
						'@future-fuze/package-config': '*'
					}
				},
				null,
				2
			),
			'utf8'
		)

		const leafPackageJson = JSON.parse(await readFile(leafAPackageJsonPath, 'utf8')) as Record<string, unknown>
		await writeFile(
			leafAPackageJsonPath,
			JSON.stringify(
				{
					...leafPackageJson,
					devDependencies: {
						'@future-fuze/package-config': '*'
					}
				},
				null,
				2
			),
			'utf8'
		)

		const result = await runApply(
			['--config', 'cdk8s', '--recursive', '--conflict', 'overwrite'],
			projectPath
		)

		expect(result.code).toBe(0)

		const rootPackageJson = JSON.parse(await readFile(rootPackageJsonPath, 'utf8')) as {
			scripts: Record<string, string>
		}
		expect(rootPackageJson.scripts['build:cdk8s']).toBe('pnpm -r run synth')

		const leafPackageJsonAfter = JSON.parse(await readFile(leafAPackageJsonPath, 'utf8')) as {
			scripts: Record<string, string>
		}
		expect(leafPackageJsonAfter.scripts['build:cdk8s']).toBe('cdk8s synth')
	})

		test('uses package metadata before lockfiles', async () => {
			const projectPath = await createFixtureProject('pnpm-project')
			const result = await runApply(['--config', 'tsconfig', '--dry-run'], projectPath)

			expect(result.code).toBe(0)
			expect(result.stdout).toContain('[dry-run] pnpm add --save-dev @future-fuze/package-config')
		})

		test('uses npm lockfile when metadata is missing', async () => {
			const projectPath = await createFixtureProject('npm-project')
			const result = await runApply(['--config', 'tsconfig', '--dry-run'], projectPath)

			expect(result.code).toBe(0)
			expect(result.stdout).toContain('[dry-run] npm install --save-dev @future-fuze/package-config')
		})

		test('uses latest specifier when update flag is enabled', async () => {
			const projectPath = await createFixtureProject('npm-project')
			const result = await runApply(['--config', 'tsconfig', '--dry-run', '--update'], projectPath)

			expect(result.code).toBe(0)
			expect(result.stdout).toContain('@future-fuze/package-config@latest')
		})
})

describe('apply CLI conflict handling', () => {
	test('applies cdk8s script for synth', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const packageJsonPath = join(projectPath, 'package.json')

		const result = await runApply(['--config', 'cdk8s', '--conflict', 'overwrite'], projectPath)

		expect(result.code).toBe(0)
		const saved = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
			scripts: Record<string, string>
		}
		expect(saved.scripts['build:cdk8s']).toBe('cdk8s synth')
	})

	test('applies concurrently config scripts and dependency', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const packageJsonPath = join(projectPath, 'package.json')
		await writeFile(
			packageJsonPath,
			JSON.stringify(
				{
					name: 'fixture-npm-project',
					version: '1.0.0',
					private: true,
					devDependencies: {
						'@future-fuze/package-config': '*'
					}
				},
				null,
				2
			),
			'utf8'
		)

		const result = await runApply(['--config', 'concurrently', '--conflict', 'overwrite'], projectPath)

		expect(result.code).toBe(0)
		const saved = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
			devDependencies: Record<string, string>
			scripts: Record<string, string>
		}
		expect(saved.devDependencies.concurrently).toBe('*')
		expect(saved.scripts.build).toBe('concurrently build:*')
		expect(saved.scripts.check).toBe('concurrently check:*')
	})

	test('applies typescript package.json scripts and devDependencies', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const packageJsonPath = join(projectPath, 'package.json')
		await writeFile(
			packageJsonPath,
			JSON.stringify(
				{
					name: 'fixture-npm-project',
					version: '1.0.0',
					private: true,
					devDependencies: {
						'@future-fuze/package-config': '*',
						'@typescript/native-preview': '0.0.1'
					},
					scripts: {
						'checkbuild:tsgo': 'old-command'
					}
				},
				null,
				2
			),
			'utf8'
		)

		const result = await runApply(['--config', 'tsconfig', '--conflict', 'overwrite'], projectPath)

		expect(result.code).toBe(0)
		const saved = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
			devDependencies: Record<string, string>
			scripts: Record<string, string>
		}
		expect(saved.devDependencies['@typescript/native-preview']).toBe('*')
		expect(saved.scripts['checkbuild:tsgo']).toBe('tsgo')
	})

	test('respects skip conflict mode for package.json script updates', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const packageJsonPath = join(projectPath, 'package.json')
		await writeFile(
			packageJsonPath,
			JSON.stringify(
				{
					name: 'fixture-npm-project',
					version: '1.0.0',
					private: true,
					devDependencies: {
						'@future-fuze/package-config': '*',
						'@typescript/native-preview': '*'
					},
					scripts: {
						'checkbuild:tsgo': 'old-command'
					}
				},
				null,
				2
			),
			'utf8'
		)

		const result = await runApply(['--config', 'tsconfig', '--conflict', 'skip'], projectPath)

		expect(result.code).toBe(0)
		const saved = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
			scripts: Record<string, string>
		}
		expect(saved.scripts['checkbuild:tsgo']).toBe('old-command')
	})

	test('fails on tsconfig conflict by default', async () => {
		const projectPath = await createFixtureProject('npm-project')
		await writeFile(
			join(projectPath, 'tsconfig.json'),
			JSON.stringify({ extends: '@example/other-config' }, null, 2),
			'utf8'
		)

		const result = await runApply(['--config', 'tsconfig', '--dry-run'], projectPath)

		expect(result.code).not.toBe(0)
		expect(result.stderr).toContain('Conflict at')
	})

	test('skips conflicting prettier config with --conflict skip', async () => {
		const projectPath = await createFixtureProject('npm-project')
		await writeFile(join(projectPath, '.prettierrc.json'), JSON.stringify({ semi: true }, null, 2), 'utf8')

		const result = await runApply(
			['--config', 'prettier', '--dry-run', '--conflict', 'skip'],
			projectPath
		)

		expect(result.code).toBe(0)
		expect(result.stdout).toContain('Conflict skipped')
	})

	test('overwrites conflicting prettier config with --conflict overwrite', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const prettierPath = join(projectPath, '.prettierrc.json')
		await writeFile(prettierPath, JSON.stringify({ semi: true }, null, 2), 'utf8')

		const dryRunResult = await runApply(
			['--config', 'prettier', '--dry-run', '--conflict', 'overwrite'],
			projectPath
		)
		expect(dryRunResult.code).toBe(0)
		expect(dryRunResult.stdout).toContain('[dry-run] Apply Prettier config')

		const applyResult = await runApply(['--config', 'prettier', '--conflict', 'overwrite'], projectPath)
		expect(applyResult.code).toBe(0)

		const savedText = await readFile(prettierPath, 'utf8')
		expect(savedText).toBe('"@future-fuze/package-config/prettier"\n')
	})

	test('writes tsconfig extends for comment-preserving input', async () => {
		const projectPath = await createFixtureProject('npm-project')
		const tsconfigPath = join(projectPath, 'tsconfig.json')
		await writeFile(tsconfigPath, '{\n  // comment\n  "compilerOptions": {\n    "strict": true\n  }\n}\n', 'utf8')

		const result = await runApply(['--config', 'tsconfig', '--conflict', 'overwrite'], projectPath)
		expect(result.code).toBe(0)

		const savedText = await readFile(tsconfigPath, 'utf8')
		expect(savedText).toContain('"extends": "@future-fuze/package-config/typescript/base.json"')
	})
})
