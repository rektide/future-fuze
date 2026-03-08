import { plugin } from 'gunshi/plugin'

import type { ConflictMode } from '../internal/types.ts'

export const pluginId = 'future-fuze:apply-conflict' as const
export type PluginId = typeof pluginId

const conflictChoices = ['error', 'overwrite', 'skip'] as const satisfies readonly ConflictMode[]

export default function conflictPlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Conflict Option',
		setup: ctx => {
			ctx.addGlobalOption('conflict', {
				type: 'enum',
				default: 'error',
				choices: [...conflictChoices],
				description: 'Conflict behavior: error, overwrite, or skip'
			})
		}
	})
}
