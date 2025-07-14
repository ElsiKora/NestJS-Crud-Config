export default {
  'branch-lint': {
    isEnabled: true
  },
  builder: {
    isEnabled: false
  },
  ci: {
    isEnabled: true,
    isNpmPackage: true,
    moduleProperties: {
      dependabot: {
        devBranchName: 'dev'
      },
      'release-npm': {
        mainBranch: 'main',
        isPrerelease: true,
        preReleaseBranch: 'dev'
      }
    },
    modules: [
      'codecommit-sync',
      'dependabot',
      'qodana',
      'release-npm',
      'snyk',
      'test'
    ],
    provider: 'GitHub'
  },
  commitlint: {
    isEnabled: true
  },
  eslint: {
    isEnabled: true,
    features: [
      'sonar',
      'unicorn',
      'perfectionist',
      'jsdoc',
      'javascript',
      'typescriptStrict',
      'json',
      'yaml',
      'checkFile',
      'packageJson',
      'markdown',
      'nest',
      'node',
      'regexp',
      'typeorm',
      'prettier',
      'stylistic',
      'noSecrets'
    ]
  },
  gitignore: {
    isEnabled: true
  },
  ide: {
    isEnabled: true,
    ides: [
      'intellij-idea'
    ]
  },
  license: {
    isEnabled: true,
    author: 'ElsiKora',
    license: 'MIT',
    year: 2025
  },
  'lint-staged': {
    isEnabled: true,
    features: [
      'eslint',
      'prettier'
    ]
  },
  prettier: {
    isEnabled: true
  },
  'semantic-release': {
    isEnabled: true,
    repositoryUrl: 'https://github.com/ElsiKora/NestJS-Crud-Config',
    mainBranch: 'main',
    isPrereleaseEnabled: true,
    preReleaseBranch: 'dev',
    preReleaseChannel: 'beta',
    isBackmergeEnabled: true,
    developBranch: 'dev'
  },
  stylelint: {
    isEnabled: false
  },
  testing: {
    isEnabled: true,
    framework: 'vitest',
    isTypeScript: true,
    isUnitEnabled: true,
    isEndToEndEnabled: true,
    isCoverageEnabled: true
  },
  typescript: {
    isEnabled: false
  }
};