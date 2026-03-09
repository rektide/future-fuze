import { spawn } from 'node:child_process'

import type { ApplyRuntimeOptions, PackageJsonData, PackageManager, ProjectContext } from './types.ts'
import { packageConfigPackageName } from './types.ts'
import { logDryRun, logInfo } from './log.ts'

function hasPackageVersion(packageJson: PackageJsonData, packageName: string): boolean {
	return Boolean(
		packageJson.devDependencies?.[packageName] ||
			packageJson.dependencies?.[packageName] ||
			packageJson.peerDependencies?.[packageName] ||
			packageJson.optionalDependencies?.[packageName]
	)
}

function isInDevDependencies(packageJson: PackageJsonData, packageName: string): boolean {
	return Boolean(packageJson.devDependencies?.[packageName])
}

function createInstallArgs(packageManager: PackageManager, packageSpec: string): string[] {
	if (packageManager === 'pnpm') {
		return ['add', '--save-dev', packageSpec]
	}

	return ['install', '--save-dev', packageSpec]
}

async function runPackageManagerCommand(
	packageManager: PackageManager,
	args: string[],
	workingDirectory: string,
	dryRun: boolean
): Promise<void> {
	if (dryRun) {
		logDryRun(`${packageManager} ${args.join(' ')} (cwd: ${workingDirectory})`)
		return
	}

	await new Promise<void>((resolve, reject) => {
		const child = spawn(packageManager, args, {
			cwd: workingDirectory,
			stdio: 'inherit'
		})

		child.on('error', reject)
		child.on('exit', (code: number | null) => {
			if (code === 0) {
				resolve()
				return
			}

			reject(new Error(`${packageManager} ${args.join(' ')} failed with code ${String(code)}`))
		})
	})
}

export async function ensurePackageConfigDependency(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	if (project.packageJson.name === packageConfigPackageName) {
		logInfo('install', `Skipping ${packageConfigPackageName} install in its own package workspace`)
		return
	}

	const installedAnywhere = hasPackageVersion(project.packageJson, packageConfigPackageName)
	const installedAsDevDependency = isInDevDependencies(project.packageJson, packageConfigPackageName)

	if (!options.update && installedAsDevDependency) {
		logInfo('install', `${packageConfigPackageName} already in devDependencies`)
		return
	}

	if (!options.update && installedAnywhere && !installedAsDevDependency) {
		logInfo(
			'install',
			`${packageConfigPackageName} found outside devDependencies, reinstalling as devDependency`
		)
	}

	if (!options.update && !installedAnywhere) {
		logInfo('install', `${packageConfigPackageName} missing, installing`)
	}

	if (options.update) {
		logInfo('install', `${packageConfigPackageName} update requested, installing latest as devDependency`)
	}

	const packageSpec = options.update
		? `${packageConfigPackageName}@latest`
		: packageConfigPackageName
	const args = createInstallArgs(project.packageManager, packageSpec)
	await runPackageManagerCommand(project.packageManager, args, project.projectRoot, options.dryRun)
}
