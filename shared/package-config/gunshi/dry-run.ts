import { plugin } from 'gunshi/plugin'

export const pluginId = 'future-fuze:apply-dry-run' as const
export type PluginId = typeof pluginId

export default function dryRunPlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Dry-Run Option',
		setup: ctx => {
			ctx.addGlobalOption('dry-run', {
				type: 'boolean',
				description: 'Show planned changes without modifying files'
			})
		}
	})
}
