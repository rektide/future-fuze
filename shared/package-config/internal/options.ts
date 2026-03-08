import type { ApplyRuntimeOptions, ConflictMode } from './types.ts'

interface ApplyOptionValues {
	update?: boolean
	dryRun?: boolean
	conflict?: ConflictMode
	[key: string]: unknown
}

export function parseApplyRuntimeOptions(values: ApplyOptionValues): ApplyRuntimeOptions {

	return {
		update: values.update === true,
		dryRun: values.dryRun === true,
		conflict: values.conflict ?? 'error'
	}
}
