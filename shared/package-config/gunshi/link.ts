import { plugin } from 'gunshi/plugin'

export const pluginId = 'future-fuze:apply-link' as const
export type PluginId = typeof pluginId

export default function linkPlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Link Option',
		setup: ctx => {
			ctx.addGlobalOption('link', {
				type: 'boolean',
				description: 'Link @future-fuze/package-config via package manager link instead of installing'
			})
		}
	})
}
