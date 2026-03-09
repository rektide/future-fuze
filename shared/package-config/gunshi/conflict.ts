import { plugin } from 'gunshi/plugin'

import { conflictModes, defaultConflictMode } from '../internal/types.ts'

export const pluginId = 'future-fuze:apply-conflict' as const
export type PluginId = typeof pluginId

export default function conflictPlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Conflict Option',
		setup: ctx => {
			ctx.addGlobalOption('conflict', {
				type: 'enum',
				default: defaultConflictMode,
				choices: [...conflictModes],
				description: 'Conflict behavior: error, overwrite, or skip'
			})
		}
	})
}
