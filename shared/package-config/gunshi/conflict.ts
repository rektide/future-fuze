import { plugin } from 'gunshi/plugin'

import { applyEnumChoices, applyOptionDefaults } from '../internal/options/schema.ts'

export const pluginId = 'future-fuze:apply-conflict' as const
export type PluginId = typeof pluginId

export default function conflictPlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Conflict Option',
		setup: ctx => {
			ctx.addGlobalOption('conflict', {
				type: 'enum',
				default: applyOptionDefaults.conflict,
				choices: [...applyEnumChoices.conflict],
				description: 'Conflict behavior: error, overwrite, or skip'
			})
		}
	})
}
