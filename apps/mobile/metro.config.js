// Expo + pnpm monorepo: watch the workspace root and resolve the @warmdock/*
// source packages (which ship TypeScript via package "exports").
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;
// our internal packages expose their entry via package.json "exports"
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
