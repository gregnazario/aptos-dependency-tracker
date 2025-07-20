/**
 * Dependency tracing logic for the Dependency Tracer tool.
 * Recursively fetches and builds the dependency graph for a given package.
 *
 * NOTE: This is a stub implementation. Actual dependency resolution should use
 * real data from the API module.
 */

import { fetchPackageMetadata } from "./api";
import { DependencyTraceResult, DependencyTreeNode, CLIOptions } from "./types";

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

  // Helper to recursively build the tree
  async function buildTree(
    pkgId: string,
    visited: Set<string>,
  ): Promise<DependencyTreeNode> {
    // Prevent cycles
    if (visited.has(pkgId)) {
      return {
        name: pkgId + " (cycle detected)",
        dependencies: [],
      };
    }
    visited.add(pkgId);

    const pkgAddress = pkgId.split("::")[0];

    // Fetch metadata (stub)
    const metadata = await fetchPackageMetadata(pkgId, options.network);

    // Track dependencies
    for (const dep of metadata.deps) {
      let name = `${dep.account}::${dep.package_name}`;

      // Note dependencies by Package vs module are different
      allDependencies.push(name);
      dedupedDependencies.add(name);
    }

    // Track modules
    for (const module of metadata.modules) {
      let name = `${pkgAddress}::${module.name}`;

      // Note dependencies by Package vs module are different
      allModules.push(name);
      dedupedModules.add(name);
    }

    // Recursively build children
    const children: DependencyTreeNode[] = [];
    for (const dep of metadata.deps) {
      let name = `${dep.account}::${dep.package_name}`;
      children.push(await buildTree(name, new Set(visited)));
    }

    return {
      name: pkgId,
      dependencies: children,
    };
  }

  // Start tracing from the root package
  const dependencyTree = await buildTree(packageId, new Set());

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
  };
}
