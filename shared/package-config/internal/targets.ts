import { access, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { loadProjectContext } from './project.ts'

interface CollectApplyTargetRootsInput {
	cwd: string
	recursive: boolean
}

async function hasPackageJson(directoryPath: string): Promise<boolean> {
	try {
		await access(join(directoryPath, 'package.json'))
		return true
	} catch {
		return false
	}
}

async function walkPackageRoots(
	directoryPath: string,
	collectedRoots: Set<string>
): Promise<void> {
	if (await hasPackageJson(directoryPath)) {
		collectedRoots.add(directoryPath)
	}

	const entries = await readdir(directoryPath, { withFileTypes: true })
	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue
		}

		if (
			entry.name === 'node_modules' ||
			entry.name === '.git' ||
			entry.name === '.jj' ||
			entry.name.startsWith('.')
		) {
			continue
		}

		await walkPackageRoots(join(directoryPath, entry.name), collectedRoots)
	}
}

export async function collectApplyTargetRoots(
	input: CollectApplyTargetRootsInput
): Promise<string[]> {
	const baseProject = await loadProjectContext(input.cwd)
	if (!input.recursive) {
		return [baseProject.projectRoot]
	}

	const roots = new Set<string>()
	await walkPackageRoots(baseProject.projectRoot, roots)

	const sortedRoots = [...roots].sort((left, right) => left.localeCompare(right))
	if (sortedRoots.includes(baseProject.projectRoot)) {
		return [baseProject.projectRoot, ...sortedRoots.filter(root => root !== baseProject.projectRoot)]
	}

	return [baseProject.projectRoot, ...sortedRoots]
}
