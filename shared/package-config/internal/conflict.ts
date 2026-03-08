import type { ConflictMode } from './types.ts'

interface ConflictInput {
	mode: ConflictMode
	filePath: string
	message: string
}

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
		`Conflict at ${input.filePath}: ${input.message}. Re-run with --conflict overwrite or --conflict skip.`
	)
}
