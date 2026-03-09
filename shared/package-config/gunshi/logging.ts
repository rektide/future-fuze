import { plugin } from 'gunshi/plugin'

export const pluginId = 'future-fuze:apply-logging' as const
export type PluginId = typeof pluginId

export default function loggingPlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Logging Option',
		setup: ctx => {
			ctx.addGlobalOption('verbose', {
				type: 'boolean',
				description: 'Log each package.json JSON-path changed by each config'
			})
		}
	})
}
