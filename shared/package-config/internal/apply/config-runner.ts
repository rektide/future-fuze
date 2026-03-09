import {
	 applyConfigPackageJson,
+ planConfigPackageJson,
+ applyPlannedConfigPackageJson,
+ type ApplyActionResult,
+ type ApplyRuntimeOptions,
+ type PackageJsonOutputLabels,
+ type ProjectContext
} from '../internal/apply/package-json.ts'
import type { PackageJsonOutputLabels } from './labels.ts'

interface PackageJsonConfigRunnerInput {
	configId: string
	configDirectory: string
}

export interface PackageJsonConfigRunner {
	 plan: (
	 project: ProjectContext,
        options: ApplyRuntimeOptions
    ) => Promise<PackageJsonPlan>
  apply: (
        plan: PackageJsonPlan,
        options: ApplyRuntimeOptions
    ) => Promise<ActionStatus>
}

export function createPackageJsonConfigRunner(input: PackageJsonConfigRunnerInput): PackageJsonConfigRunner {
  const outputLabels = createPackageJsonOutputLabels({ configId: input.configId })

  return {
    plan: async function planPackageJsonConfig(
      project: ProjectContext,
      options: ApplyRuntimeOptions
    ): Promise<PackageJsonPlan> {
      return planConfigPackageJson({
        project,
        options,
        configName: input.configId,
        configDirectory: input.configDirectory,
        outputLabels
      })
    },

    apply: async function applyPackageJsonConfig(
      plan: PackageJsonPlan,
      options: ApplyRuntimeOptions
    ): Promise<ActionStatus> {
      return applyPlannedConfigPackageJson(plan, options)
    },

    run: async function runPackageJsonConfig(
      project: ProjectContext,
      options: ApplyRuntimeOptions
    ): Promise<ApplyActionResult> {
      const plan = await this.plan(project, options)
      const status = await this.apply(plan, options)

      return {
        configId: input.configId,
        actionId: 'package-json',
        status
      }
    }
  }
}
