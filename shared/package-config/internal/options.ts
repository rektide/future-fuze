import { applyEnumChoices, applyOptionDefaults } from './options/schema.ts'

import type { ApplyRuntimeOptions, ConflictMode, TsconfigProfile } from './types.ts'

export interface ApplyCliValues {
	update?: unknown
	dryRun?: unknown
	verbose?: unknown
	conflict?: unknown
	tsconfigProfile?: unknown
	link?: unknown
	skipInstall?: unknown
	[key: string]: unknown
}

interface ApplyRawOptions {
	update: boolean
	dryRun: boolean
	verbose: boolean
	conflict: unknown
	tsconfigProfile: unknown
	link: boolean
	skipInstall: boolean
}

function parseBooleanFlag(value: unknown, fallback: boolean): boolean {
	if (value === true) {
		return true
	}

	if (value === false) {
		return false
	}

	return fallback
}

function parseEnumChoice<TChoice extends string>(
	value: unknown,
	choices: readonly TChoice[],
	fallback: TChoice
): TChoice {
	if (typeof value !== 'string') {
		return fallback
	}

	if (choices.includes(value as TChoice)) {
		return value as TChoice
	}

	return fallback
}

function coerceApplyCliValues(values: ApplyCliValues): ApplyRawOptions {
	return {
		update: parseBooleanFlag(values.update, applyOptionDefaults.update),
		dryRun: parseBooleanFlag(values.dryRun, applyOptionDefaults.dryRun),
		verbose: parseBooleanFlag(values.verbose, applyOptionDefaults.verbose),
		conflict: values.conflict,
		tsconfigProfile: values.tsconfigProfile,
		link: parseBooleanFlag(values.link, applyOptionDefaults.link),
		skipInstall: parseBooleanFlag(values.skipInstall, applyOptionDefaults.skipInstall)
	}
}

export function normalizeApplyRuntimeOptions(raw: ApplyRawOptions): ApplyRuntimeOptions {
	return {
		update: raw.update,
		dryRun: raw.dryRun,
		verbose: raw.verbose,
		conflict: parseEnumChoice(
			raw.conflict,
			applyEnumChoices.conflict,
			applyOptionDefaults.conflict
		) as ConflictMode,
		tsconfigProfile: parseEnumChoice(
			raw.tsconfigProfile,
			applyEnumChoices.tsconfigProfile,
			applyOptionDefaults.tsconfigProfile
		) as TsconfigProfile,
		link: raw.link,
		skipInstall: raw.skipInstall
	}
}

export function parseApplyRuntimeOptions(values: ApplyCliValues): ApplyRuntimeOptions {
	return normalizeApplyRuntimeOptions(coerceApplyCliValues(values))
}
