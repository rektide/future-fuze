# prompt

we are creating an `apply` meta-tool for package-config to make it easier to apply the various package-configs. this repo is typically broken down by the tool being configured. example: typescript in typescript/.

## tasks

1. first task is package-config/apply.ts. we want to build this in small steps.
   a. create. checks if the @future-fuze/package-config package is installed for project in $CWD and installs if not
   a. auto-determine if the invoking tool is npm or pnpm and switch to whichever tool for the package install
   a. add gunshi package dependency and commit
   a. create a gunshi/update.ts gunshi plugin, that captures an --update flag. if set, package configs that install packages should also check to see if package is latest version or not & install latest if not.
   a. implement global/update.ts for existing package configs
1. create an typescript/apply.ts file apply the shared/package-config/typescript file to a project.
1. create a prettier/apply.ts

## future tasks

- add batch apply to apply multiple package configs at once
- add recursive apply to apply recursively to packages

## notes

jj commit after each step, big or small!
