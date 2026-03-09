export interface PackageJsonOutputLabels {
	updated: string
	noChange: string
	noSource: string
}

interface LabelInput {
	configId: string
}

export function createPackageJsonOutputLabels(input: LabelInput): PackageJsonOutputLabels {
	const configName = input.configId

	return {
		updated: `Apply ${configName} package.json settings`,
		noChange: `${configName} package.json settings are already up-to-date`,
		noSource: `No ${input.configId} config.json source found`
	}
}
