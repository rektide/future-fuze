export const packageConfigPackageName = '@future-fuze/package-config'

export const conflictModes = ['error', 'overwrite', 'skip'] as const

export type PackageManager = 'pnpm' | 'npm'
export type MonorepoManager = 'pnpm' | 'npm'

export type ConflictMode = (typeof conflictModes)[number]
export const defaultConflictMode: ConflictMode = 'error'
export type TsconfigProfile = 'base' | 'cdk8s'

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
	isMonorepoRoot: boolean
	monorepoManager?: MonorepoManager
}

export interface ApplyRuntimeOptions {
	update: boolean
	dryRun: boolean
	verbose: boolean
	conflict: ConflictMode
	tsconfigProfile: TsconfigProfile
}
