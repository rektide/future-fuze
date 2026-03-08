import { plugin } from 'gunshi/plugin'

export const pluginId = 'future-fuze:apply-update' as const
export type PluginId = typeof pluginId

export default function updatePlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Update Option',
		setup: ctx => {
			ctx.addGlobalOption('update', {
				type: 'boolean',
				description: 'Install latest compatible package-config dependencies'
			})
		}
	})
}
