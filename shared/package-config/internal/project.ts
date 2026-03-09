import { access, readFile, realpath } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import type {
	MonorepoManager,
	PackageJsonData,
	PackageManager,
	ProjectContext
} from './types.ts'

async function exists(filePath: string): Promise<boolean> {
	try {
		await access(filePath)
		return true
	} catch {
		return false
	}
}

function parsePackageManagerFromMetadata(value: unknown): PackageManager | undefined {
	if (typeof value !== 'string') {
		return undefined
	}

	if (value.startsWith('pnpm@') || value === 'pnpm') {
		return 'pnpm'
	}

	if (value.startsWith('npm@') || value === 'npm') {
		return 'npm'
	}

	return undefined
}

function hasNpmWorkspaces(packageJson: PackageJsonData): boolean {
	const workspaces = packageJson.workspaces
	if (Array.isArray(workspaces)) {
		return workspaces.every(entry => typeof entry === 'string')
	}

	if (typeof workspaces === 'object' && workspaces !== null) {
		const packages = (workspaces as Record<string, unknown>).packages
		return Array.isArray(packages) && packages.every(entry => typeof entry === 'string')
	}

	return false
}

async function detectMonorepo(
	projectRoot: string,
	packageJson: PackageJsonData
): Promise<{ isMonorepoRoot: boolean; monorepoManager?: MonorepoManager }> {
	const pnpmWorkspacePath = join(projectRoot, 'pnpm-workspace.yaml')
	if (await exists(pnpmWorkspacePath)) {
		const content = await readFile(pnpmWorkspacePath, 'utf8')
		if (/^packages:/m.test(content)) {
			return {
				isMonorepoRoot: true,
				monorepoManager: 'pnpm'
			}
		}
	}

	if (hasNpmWorkspaces(packageJson)) {
		return {
			isMonorepoRoot: true,
			monorepoManager: 'npm'
		}
	}

	return {
		isMonorepoRoot: false
	}
}

export async function findProjectRoot(startDirectory = process.cwd()): Promise<string> {
	let currentDirectory = await realpath(startDirectory)

	while (true) {
		const packageJsonPath = join(currentDirectory, 'package.json')
		if (await exists(packageJsonPath)) {
			return currentDirectory
		}

		const parentDirectory = dirname(currentDirectory)
		if (parentDirectory === currentDirectory) {
			throw new Error(`Could not find package.json from ${startDirectory}`)
		}

		currentDirectory = parentDirectory
	}
}

export async function detectPackageManager(
	projectRoot: string,
	packageJson: PackageJsonData,
	fallbackPackageManager?: PackageManager
): Promise<PackageManager> {
	const managerFromMetadata = parsePackageManagerFromMetadata(packageJson.packageManager)
	if (managerFromMetadata) {
		return managerFromMetadata
	}

	if (await exists(join(projectRoot, 'pnpm-lock.yaml'))) {
		return 'pnpm'
	}

	if (await exists(join(projectRoot, 'package-lock.json'))) {
		return 'npm'
	}

	if (fallbackPackageManager) {
		return fallbackPackageManager
	}

	// TODO: add optional environment-based detection fallback (e.g. npm_config_user_agent).
	// We intentionally defer env detection to keep package metadata and lockfiles as priority.
	return 'pnpm'
}

export async function loadProjectContext(
	cwd = process.cwd(),
	fallbackPackageManager?: PackageManager
): Promise<ProjectContext> {
	const projectRoot = await findProjectRoot(cwd)
	const packageJsonPath = join(projectRoot, 'package.json')
	const packageJsonText = await readFile(packageJsonPath, 'utf8')
	const packageJson = JSON.parse(packageJsonText) as PackageJsonData
	const packageManager = await detectPackageManager(projectRoot, packageJson, fallbackPackageManager)
	const monorepo = await detectMonorepo(projectRoot, packageJson)

	return {
		cwd,
		projectRoot,
		packageJsonPath,
		packageJson,
		packageManager,
		isMonorepoRoot: monorepo.isMonorepoRoot,
		monorepoManager: monorepo.monorepoManager
	}
}
