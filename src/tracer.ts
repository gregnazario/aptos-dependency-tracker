/**
 * Dependency tracing logic for the Dependency Tracer tool.
 * Recursively fetches and builds the dependency graph for a given package.
 *
 * Also supports building a module-level dependency tree for --module-tree output.
 */

import { fetchPackageMetadata } from "./api";
import { DependencyTraceResult, DependencyTreeNode, CLIOptions, ModuleTreeNode } from "./types";

/**
 * Recursively traces all dependencies for a given package.
 * @param packageId The root package ID to trace.
 * @param options CLI options (for network selection, etc.)
 * @returns DependencyTraceResult containing lists, counts, and the dependency tree.
 */
export async function traceDependencies(
  packageId: string,
  options: Pick<CLIOptions, "network">,
): Promise<DependencyTraceResult> {
  // Sets for deduplication and tracking
  const allDependencies: string[] = [];
  const dedupedDependencies = new Set<string>();
  const allModules: string[] = [];
  const dedupedModules = new Set<string>();

  let moduleTreeRoot: ModuleTreeNode | null = null;

  // Helper to recursively build the package dependency tree
  async function buildTree(pkgId: string, visited: Set<string>): Promise<DependencyTreeNode> {
    // Prevent cycles
    if (visited.has(pkgId)) {
      return {
        name: pkgId + " (cycle detected)",
        dependencies: [],
      };
    }
    visited.add(pkgId);

    const pkgAddress = pkgId.split("::")[0];

    // Fetch metadata
    const metadata = await fetchPackageMetadata(pkgId, options.network);

    // Track dependencies
    for (const dep of metadata.deps) {
      const name = `${dep.account}::${dep.package_name}`;
      allDependencies.push(name);
      dedupedDependencies.add(name);
    }

    // Track modules
    for (const module of metadata.modules) {
      const name = `${pkgAddress}::${module.name}`;
      allModules.push(name);
      dedupedModules.add(name);
    }

    // Recursively build children
    const children: DependencyTreeNode[] = [];
    for (const dep of metadata.deps) {
      const name = `${dep.account}::${dep.package_name}`;
      children.push(await buildTree(name, new Set(visited)));
    }

    return {
      name: pkgId,
      dependencies: children,
    };
  }

  // Helper to recursively build the module dependency tree
  async function buildModuleTree(pkgId: string, visited: Set<string>): Promise<ModuleTreeNode> {
    if (visited.has(pkgId)) {
      return {
        name: pkgId + " (cycle detected)",
        children: [],
      };
    }
    visited.add(pkgId);

    const pkgAddress = pkgId.split("::")[0];
    const metadata = await fetchPackageMetadata(pkgId, options.network);

    // For each module in this package, build its dependency tree
    const moduleNodes: ModuleTreeNode[] = [];
    for (const module of metadata.modules) {
      const moduleName = `${pkgAddress}::${module.name}`;
      // If the module has explicit dependencies, you could fetch them here.
      // For now, just show the module as a leaf.
      moduleNodes.push({
        name: moduleName,
        children: [],
      });
    }

    // For each dependency package, build its module tree as children
    for (const dep of metadata.deps) {
      const depPkgId = `${dep.account}::${dep.package_name}`;
      const depModuleTree = await buildModuleTree(depPkgId, new Set(visited));
      moduleNodes.push(depModuleTree);
    }

    return {
      name: pkgId,
      children: moduleNodes,
    };
  }

  // Start tracing from the root package
  const dependencyTree = await buildTree(packageId, new Set());
  moduleTreeRoot = await buildModuleTree(packageId, new Set());

  return {
    packageId,
    dependencyList: allDependencies,
    dedupedDependencyList: Array.from(dedupedDependencies),
    dependencyTree,
    directDependencyCount: dependencyTree.dependencies.length,
    allDependencyCount: allDependencies.length,
    dedupedDependencyCount: dedupedDependencies.size,
    moduleList: allModules,
    dedupedModuleList: Array.from(dedupedModules),
    allModuleCount: allModules.length,
    dedupedModuleCount: dedupedModules.size,
    moduleTree: moduleTreeRoot,
  };
}
