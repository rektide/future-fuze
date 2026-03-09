import { conflictModes, defaultConflictMode, type ConflictMode, type TsconfigProfile } from '../types.ts'

export const tsconfigProfiles = ['base', 'cdk8s'] as const satisfies readonly TsconfigProfile[]
export const defaultTsconfigProfile: TsconfigProfile = 'base'

export const applyOptionDefaults: Readonly<{
	update: boolean
	dryRun: boolean
	verbose: boolean
	conflict: ConflictMode
	tsconfigProfile: TsconfigProfile
	link: boolean
}> = {
	update: false,
	dryRun: false,
	verbose: false,
	conflict: defaultConflictMode,
	tsconfigProfile: defaultTsconfigProfile,
	link: false
}

export const applyEnumChoices = {
	conflict: conflictModes,
	tsconfigProfile: tsconfigProfiles
} as const
