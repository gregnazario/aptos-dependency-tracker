/**
 * Core types and interfaces for the Dependency Tracer tool.
 */

/**
 * CLI options parsed from command line arguments.
 */
export interface CLIOptions {
  packageId: string;
  format: "json" | "table";
  tree: boolean;
  dedupe: boolean;
  network: "mainnet" | "testnet" | "devnet";
  help: boolean;
}

/**
 * Represents the metadata of a Move package.
 */
export interface PackageMetadata {
  name: string;
  modules: OnchainModule[];
  deps: OnchainDependency[]; // Array of package IDs, e.g., ["0x1::MoveStdlib"]
  extension: { vec: unknown[] };
  manifest: string;
  source_digest: string;
  upgrade_number: string;
  upgrade_policy: { policy: number };
}

export interface PackageMetadataWithAddress extends PackageMetadata {
  address: string;
  name: string;
  modules: OnchainModule[];
  deps: OnchainDependency[]; // Array of package IDs, e.g., ["0x1::MoveStdlib"]
  extension: { vec: unknown[] };
  manifest: string;
  source_digest: string;
  upgrade_number: string;
  upgrade_policy: { policy: number };
}

export interface OnchainDependency {
  account: string;
  package_name: string;
}

export interface OnchainModule {
  extension: unknown;
  name: string;
  source: string;
  source_map: string;
}

/**
 * Represents a node in the dependency tree.
 */
export interface DependencyTreeNode {
  name: string; // Package ID, e.g., "0x1::AptosFramework"
  dependencies: DependencyTreeNode[];
}

/**
 * Represents a node in the module tree.
 */
export interface ModuleTreeNode {
  name: string; // Module name, e.g., "aptos_framework::account"
  children: ModuleTreeNode[];
}

/**
 * The result of tracing dependencies for a package.
 */
export interface DependencyTraceResult {
  packageId: string;
  dependencyList: string[]; // All dependencies (may include duplicates)
  dedupedDependencyList: string[]; // Unique dependencies
  dependencyTree: DependencyTreeNode;
  moduleTree: ModuleTreeNode;
  directDependencyCount: number;
  allDependencyCount: number;
  dedupedDependencyCount: number;
  moduleList: string[]; // All modules (may include duplicates)
  dedupedModuleList: string[]; // Unique modules
  allModuleCount: number;
  dedupedModuleCount: number;
}

/**
 * Supported output formats.
 */
export type OutputFormat = "json" | "table";

export type TraceResult = {
  packages: string[];
  perPackage: DependencyTraceResult[];
  combined: {
    dependencyCount: number;
    dedupedDependencyCount: number;
    dependencies: string[];
    moduleCount: number;
    dedupedModuleCount: number;
    modules: string[];
  };
};
