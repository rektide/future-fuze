import type { ApplyRuntimeOptions, ConflictMode } from './types.ts'

const allowedConflictModes = new Set<ConflictMode>(['error', 'overwrite', 'skip'])

function getRecord(value: unknown): Record<string, unknown> {
	if (typeof value === 'object' && value !== null) {
		return value as Record<string, unknown>
	}

	return {}
}

function parseConflictMode(value: unknown): ConflictMode {
	if (typeof value === 'string' && allowedConflictModes.has(value as ConflictMode)) {
		return value as ConflictMode
	}

	return 'error'
}

export function parseApplyRuntimeOptions(values: unknown): ApplyRuntimeOptions {
	const record = getRecord(values)

	return {
		update: record.update === true,
		dryRun: record['dry-run'] === true || record.dryRun === true,
		conflict: parseConflictMode(record.conflict)
	}
}
