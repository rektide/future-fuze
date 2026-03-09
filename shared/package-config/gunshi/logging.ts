import { plugin } from 'gunshi/plugin'

export const pluginId = 'future-fuze:apply-logging' as const
export type PluginId = typeof pluginId

export const logFormatChoices = ['bracket', 'kv'] as const
export type LogFormat = (typeof logFormatChoices)[number]
export const defaultLogFormat: LogFormat = 'bracket'

export type LogScope = 'apply' | 'conflict' | 'file' | 'fmt' | 'install' | 'dry-run' | 'verbose'

interface LogMessageInput {
	scope: LogScope
	message: string
	configId?: string
}

let activeLogFormat: LogFormat = defaultLogFormat

export function configureApplyLogging(input: { logFormat?: LogFormat }): void {
	activeLogFormat = input.logFormat ?? defaultLogFormat
}

function formatKeyValueLog(input: LogMessageInput): string {
	const parts = [`scope=${input.scope}`]
	if (input.configId) {
		parts.push(`config=${input.configId}`)
	}
	parts.push(`message=${JSON.stringify(input.message)}`)
	return parts.join(' ')
}

export function formatApplyLogMessage(input: LogMessageInput): string {
	if (activeLogFormat === 'kv') {
		return formatKeyValueLog(input)
	}

	if (input.scope === 'verbose' && input.configId) {
		return `[verbose] [${input.configId}] ${input.message}`
	}

	return `[${input.scope}] ${input.message}`
}

export function printApplyLog(input: LogMessageInput): void {
	console.log(formatApplyLogMessage(input))
}

export default function loggingPlugin() {
	return plugin<{}, PluginId, [], {}>({
		id: pluginId,
		name: 'Apply Logging Option',
		setup: ctx => {
			ctx.addGlobalOption('verbose', {
				type: 'boolean',
				description: 'Log each package.json JSON-path changed by each config'
			})

			ctx.addGlobalOption('logFormat', {
				type: 'enum',
				choices: [...logFormatChoices],
				toKebab: true,
				description: 'Output style for logs: bracket (default) or kv'
			})
		}
	})
}
