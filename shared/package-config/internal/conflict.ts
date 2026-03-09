import { conflictModes, defaultConflictMode, type ConflictMode } from './types.ts'

interface ConflictInput {
	mode: ConflictMode
	filePath: string
	message: string
}

const nonErrorConflictModes = conflictModes.filter(mode => mode !== defaultConflictMode)

export function resolveConflictAction(input: ConflictInput): boolean {
	if (input.mode === 'overwrite') {
		console.log(`Conflict resolved by overwrite for ${input.filePath}: ${input.message}`)
		return true
	}

	if (input.mode === 'skip') {
		console.log(`Conflict skipped for ${input.filePath}: ${input.message}`)
		return false
	}

	throw new Error(
		`Conflict at ${input.filePath}: ${input.message}. Re-run with --conflict ${nonErrorConflictModes.join(' or --conflict ')}.`
	)
}
