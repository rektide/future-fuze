import { plugin } from 'gunshi/plugin'

export const pluginId = 'future-fuze:apply-skip-install' as const
export type PluginId = typeof pluginId

export default function installPlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Skip Install Option',
		setup: ctx => {
			ctx.addGlobalOption('skipInstall', {
				type: 'boolean',
				description: 'Skip running package manager install after applying configs'
			})
		}
	})
}
