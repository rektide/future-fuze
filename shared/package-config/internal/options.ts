import type { ApplyRuntimeOptions, ConflictMode, TsconfigProfile } from './types.ts'

const tsconfigProfiles = new Set<TsconfigProfile>(['base', 'cdk8s'])

interface ApplyOptionValues {
	update?: boolean
	dryRun?: boolean
	conflict?: ConflictMode
	tsconfigProfile?: string
	[key: string]: unknown
}

export function parseApplyRuntimeOptions(values: ApplyOptionValues): ApplyRuntimeOptions {

	return {
		update: values.update === true,
		dryRun: values.dryRun === true,
		conflict: values.conflict ?? 'error',
		tsconfigProfile:
			values.tsconfigProfile && tsconfigProfiles.has(values.tsconfigProfile as TsconfigProfile)
				? (values.tsconfigProfile as TsconfigProfile)
				: 'base'
	}
}
