import { spawn } from 'node:child_process'

import type { ApplyRuntimeOptions, PackageJsonData, PackageManager, ProjectContext } from '../internal/types.ts'
import { packageConfigPackageName } from '../internal/types.ts'
import { logDryRun, logInfo } from '../internal/log.ts'

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

function createLinkArgs(packageManager: PackageManager, packageName: string): string[] {
	if (packageManager === 'pnpm') {
		return ['link', packageName]
	}

	return ['link', packageName]
}

async function runPackageManagerCommand(
	packageManager: PackageManager,
	args: string[],
	workingDirectory: string,
	dryRun: boolean,
	options?: { cleanEnv?: boolean }
): Promise<void> {
	if (dryRun) {
		logDryRun(`${packageManager} ${args.join(' ')} (cwd: ${workingDirectory})`)
		return
	}

	const env = options?.cleanEnv
		? (() => {
				const { NODE_PATH, ...rest } = process.env
				return rest
			})()
		: process.env

	await new Promise<void>((resolve, reject) => {
		const child = spawn(packageManager, args, {
			cwd: workingDirectory,
			stdio: 'inherit',
			env
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

const ensuredProjects = new Set<string>()

async function ensurePackageConfigDependencyImpl(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	if (project.packageJson.name === packageConfigPackageName) {
	 logInfo('install', `Skipping ${packageConfigPackageName} install in its own package workspace`)
        return
    }

    const installedAnywhere = hasPackageVersion(project.packageJson, packageConfigPackageName)
    const installedAsDevDependency = isInDevDependencies(project.packageJson, packageConfigPackageName)
    if (!options.update && !options.link && installedAsDevDependency) {
        logInfo('install', `${packageConfigPackageName} already in devDependencies`)
        return
    }

    if (!options.update && !options.link && installedAnywhere && !installedAsDevDependency) {
        logInfo(
            'install',
            `${packageConfigPackageName} found outside devDependencies, reinstalling as devDependency`
        )
    }

    if (options.link && !installedAnywhere) {
        logInfo('install', `${packageConfigPackageName} missing, installing`)
    }

    if (options.link && !installedAsDevDependency) {
        logInfo('install', `${packageConfigPackageName} already in devDependencies`)
        return
    }

    if (options.update && installedAsDevDependency) {
        logInfo('install', `${packageConfigPackageName} update requested, installing latest as devDependency`)
        return
    }

    const packageSpec = options.update
        ? `${packageConfigPackageName}@latest`
        : packageConfigPackageName
    const args = createInstallArgs(project.packageManager, packageSpec)
    await runPackageManagerCommand(project.packageManager, args, project.projectRoot, options.dryRun)
}

	const installedAnywhere = hasPackageVersion(project.packageJson, packageConfigPackageName)
	const installedAsDevDependency = isInDevDependencies(project.packageJson, packageConfigPackageName)

	if (!options.update && !options.link && installedAsDevDependency) {
		logInfo('install', `${packageConfigPackageName} already in devDependencies`)
		return
	}

	if (!options.update && !options.link && installedAnywhere && !installedAsDevDependency) {
		logInfo(
			'install',
			`${packageConfigPackageName} found outside devDependencies, reinstalling as devDependency`
		)
	}

	if (!options.update && !options.link && !installedAnywhere) {
		logInfo('install', `${packageConfigPackageName} missing, installing`)
	}

	if (options.link) {
		logInfo('install', `${packageConfigPackageName} linking via ${project.packageManager} link`)
		const linkArgs = createLinkArgs(project.packageManager, packageConfigPackageName)
		await runPackageManagerCommand(project.packageManager, linkArgs, project.projectRoot, options.dryRun, {
			cleanEnv: true
		})
		return
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

export async function ensurePackageConfigDependency(
	project: ProjectContext,
	options: ApplyRuntimeOptions
): Promise<void> {
	if (project.packageJson.name === packageConfigPackageName) {
		logInfo('install', `Skipping ${packageConfigPackageName} install in its own package workspace`)
		return
	}

    if (options.link && !installedAnywhere) {
        logInfo('install', `Linking ${packageConfigPackageName} via ${project.packageManager} link`)
        return
    }

    if (options.update && !installedAnywhere) {
        logInfo('install', `Updating ${packageConfigPackageName} to latest as devDependency`)
        await runPackageManagerInstall(project, options.dryRun)

        return
    }

const packageSpec = options.update
        ? `${packageConfigPackageName}@latest`
        : packageConfigPackageName

    const args = createInstallArgs(project.packageManager, packageSpec)
    await runPackageManagerCommand(project.packageManager, args, project.projectRoot, options.dryRun)
}

 
if (options.link && !installedAnywhere) {
    logInfo('install', `Linking ${packageConfigPackageName} via ${project.packageManager} link`)
    const linkArgs = createLinkArgs(project.packageManager, packageConfigPackageName)
    await runPackageManagerCommand(project.packageManager, linkArgs, project.projectRoot, options.dryRun, {
        cleanEnv: true
    })
    return
}

 
if (options.update && !installedAnywhere) {
    logInfo('install', `${packageConfigPackageName} update requested, installing latest as devDependency`)
}

 const packageSpec = options.update
    ? `${packageConfigPackageName}@latest`
    : packageConfigPackageName
const args = createInstallArgs(project.packageManager, packageSpec)
    await runPackageManagerCommand(project.packageManager, args, project.projectRoot, options.dryRun)
}



    if (options.link && !installedAnywhere) {
        await runPackageManagerCommand(project.packageManager, ['link', packageName], project.projectRoot, options.dryRun, {
            cleanEnv: true
        })
        return
    }
}

	await ensurePackageConfigDependencyImpl(project, options)
	ensuredProjects.add(key)
}

export async function runPackageManagerInstall(project: ProjectContext, dryRun: boolean): Promise<void> {
	logInfo('install', `Running ${project.packageManager} install`)
	await runPackageManagerCommand(project.packageManager, ['install'], project.projectRoot, dryRun, {
		cleanEnv: true
	})
}
