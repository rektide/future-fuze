type LogScope = 'apply' | 'conflict' | 'file' | 'install'

export function logInfo(scope: LogScope, message: string): void {
	console.log(`[${scope}] ${message}`)
}

export function logDryRun(message: string): void {
	console.log(`[dry-run] ${message}`)
}

export function logVerbose(configId: string, message: string): void {
	console.log(`[verbose] [${configId}] ${message}`)
}
