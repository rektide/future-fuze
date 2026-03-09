import { printApplyLog } from '../gunshi/logging.ts'

import type { LogScope } from '../gunshi/logging.ts'

export function logInfo(scope: LogScope, message: string): void {
	printApplyLog({ scope, message })
}

export function logDryRun(message: string): void {
	printApplyLog({ scope: 'dry-run', message })
}

export function logVerbose(configId: string, message: string): void {
	printApplyLog({ scope: 'verbose', configId, message })
}
