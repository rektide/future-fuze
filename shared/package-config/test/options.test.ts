import { describe, expect, test } from 'vitest'

import { parseApplyRuntimeOptions } from '../internal/options.ts'
import { applyOptionDefaults } from '../internal/options/schema.ts'

describe('parseApplyRuntimeOptions', () => {
	test('uses schema defaults when values are missing', () => {
		expect(parseApplyRuntimeOptions({})).toEqual(applyOptionDefaults)
	})

	test('normalizes known values', () => {
		expect(
			parseApplyRuntimeOptions({
				update: true,
				dryRun: true,
				verbose: true,
				conflict: 'overwrite',
				tsconfigProfile: 'cdk8s'
			})
		).toEqual({
			update: true,
			dryRun: true,
			verbose: true,
			conflict: 'overwrite',
			tsconfigProfile: 'cdk8s',
			link: false,
			skipInstall: false,
			logFormat: 'bracket'
		})
	})

	test('falls back to defaults for invalid enum values', () => {
		const parsed = parseApplyRuntimeOptions({
			conflict: 'replace',
			tsconfigProfile: 'strictest'
		})

		expect(parsed.conflict).toBe(applyOptionDefaults.conflict)
		expect(parsed.tsconfigProfile).toBe(applyOptionDefaults.tsconfigProfile)
	})

	test('requires explicit true for boolean flags', () => {
		const parsed = parseApplyRuntimeOptions({
			update: 'yes',
			dryRun: 1,
			verbose: 'true'
		})

		expect(parsed.update).toBe(false)
		expect(parsed.dryRun).toBe(false)
		expect(parsed.verbose).toBe(false)
	})
})
