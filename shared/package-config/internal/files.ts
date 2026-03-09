import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { parse as parseJsonc } from 'jsonc-parser'

import { logDryRun, logInfo } from './log.ts'

import type { ActionStatus } from './types.ts'

interface WriteFileOptions {
	dryRun: boolean
	label?: string
}

export async function readTextFileIfExists(filePath: string): Promise<string | undefined> {
	try {
		return await readFile(filePath, 'utf8')
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException
		if (nodeError.code === 'ENOENT') {
			return undefined
		}

		throw error
	}
}

export function parseJson(text: string, filePath: string): unknown {
	try {
		return JSON.parse(text)
	} catch (error) {
		const message = (error as Error).message
		throw new Error(`Failed to parse JSON at ${filePath}: ${message}`)
	}
}

export function parseJsonWithComments(text: string, filePath: string): unknown {
	const errors: Parameters<typeof parseJsonc>[1] = []
	const parsed = parseJsonc(text, errors)

	if (errors.length > 0) {
		const [firstError] = errors
		throw new Error(
			`Failed to parse JSONC at ${filePath}: code ${String(firstError?.error)} at offset ${String(firstError?.offset)}`
		)
	}

	return parsed
}

export function stringifyJson(value: unknown): string {
	return `${JSON.stringify(value, null, '\t')}\n`
}

export async function writeTextFileIfChanged(
	filePath: string,
	nextContent: string,
	options: WriteFileOptions
): Promise<ActionStatus> {
	const previousContent = await readTextFileIfExists(filePath)
	const nextStatus: ActionStatus = previousContent === undefined ? 'created' : 'updated'

	if (previousContent === nextContent) {
		logInfo('file', `No changes needed for ${filePath}`)
		return 'unchanged'
	}

	if (options.dryRun) {
		const label = options.label ?? 'Update file'
		logDryRun(`${label}: ${filePath}`)
		return nextStatus
	}

	await mkdir(dirname(filePath), { recursive: true })
	await writeFile(filePath, nextContent, 'utf8')
	const label = options.label ?? 'Updated file'
	logInfo('file', `${label}: ${filePath}`)
	return nextStatus
}
