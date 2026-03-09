import {
	conflictModes,
	defaultConflictMode,
	type ApplyRuntimeOptions,
	type ConflictMode,
	type TsconfigProfile
} from './types.ts'

const tsconfigProfiles = new Set<TsconfigProfile>(['base', 'cdk8s'])
const conflictModeSet = new Set<ConflictMode>(conflictModes)

interface ApplyOptionValues {
	update?: boolean
	dryRun?: boolean
	verbose?: boolean
	conflict?: unknown
	tsconfigProfile?: string
	[key: string]: unknown
}

function parseConflictMode(value: unknown): ConflictMode {
	if (typeof value === 'string' && conflictModeSet.has(value as ConflictMode)) {
		return value as ConflictMode
	}

	return defaultConflictMode
}

export function parseApplyRuntimeOptions(values: ApplyOptionValues): ApplyRuntimeOptions {
	return {
		update: values.update === true,
		dryRun: values.dryRun === true,
		verbose: values.verbose === true,
		conflict: parseConflictMode(values.conflict),
		tsconfigProfile:
			values.tsconfigProfile && tsconfigProfiles.has(values.tsconfigProfile as TsconfigProfile)
				? (values.tsconfigProfile as TsconfigProfile)
				: 'base'
	}
}
