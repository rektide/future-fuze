export const packageConfigPackageName = '@future-fuze/package-config'

export type PackageManager = 'pnpm' | 'npm'

export type ConflictMode = 'error' | 'overwrite' | 'skip'

export interface PackageJsonData {
	name?: string
	packageManager?: string
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	peerDependencies?: Record<string, string>
	optionalDependencies?: Record<string, string>
	[key: string]: unknown
}

export interface ProjectContext {
	cwd: string
	projectRoot: string
	packageJsonPath: string
	packageJson: PackageJsonData
	packageManager: PackageManager
}

export interface ApplyRuntimeOptions {
	update: boolean
	dryRun: boolean
	conflict: ConflictMode
}
