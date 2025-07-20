/**
 * output.ts
 * Output formatting utilities for the Dependency Tracer tool.
 * Supports JSON (default), table, and ASCII tree formats.
 * Now supports combined output for multiple packages.
 */

import { DependencyTraceResult, TraceResult } from "./types";
import { renderAsciiTree } from "./graph";

/**
 * Formats the dependency trace result as a JSON string.
 * @param result The DependencyTraceResult object.
 * @returns JSON string.
 */
export function formatJson(result: TraceResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Formats the dependency trace result or combined output as a human-readable table string.
 * @param result The DependencyTraceResult object or combined output.
 * @returns Table string.
 *
 * TODO: Fix with new info
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatTable(result: any): string {
  // If result has perPackage, it's a combined output
  if (result && Array.isArray(result.perPackage)) {
    const header =
      "Package                | Direct Deps | All Deps | Deduped Deps\n" +
      "--------------------------------------------------------------";
    const rows = result.perPackage
      .map(
        (r: DependencyTraceResult) =>
          `${r.packageId.padEnd(23)}| ${String(r.directDependencyCount).padEnd(
            11,
          )}| ${String(r.allDependencyCount).padEnd(8)}| ${String(r.dedupedDependencyCount).padEnd(
            12,
          )}`,
      )
      .join("\n");
    const combined =
      "\n\nCombined (all packages):\n" +
      `All Deps (with duplicates): ${result.combined.dependencyCount}\n` +
      `Deduped Dependency Count: ${result.combined.dedupedDependencyCount}\n` +
      `Deduped Dependencies: ${result.combined.dependencies.join(", ")}\n` +
      `All Modules (with duplicates): ${result.combined.moduleCount}\n` +
      `Deduped Module Count: ${result.combined.dedupedModuleCount}\n` +
      `Deduped Modules: ${result.combined.modules.join(", ")}`;
    return `${header}\n${rows}${combined}`;
  } else {
    // Single package fallback
    const header =
      "Package                | Direct Deps | All Deps | Deduped Deps\n" +
      "--------------------------------------------------------------";
    const row = `${result.packageId.padEnd(23)}| ${String(result.directDependencyCount).padEnd(
      11,
    )}| ${String(result.allDependencyCount).padEnd(8)}| ${String(
      result.dedupedDependencyCount,
    ).padEnd(12)}`;
    return `${header}\n${row}`;
  }
}

/**
 * Formats the dependency tree as an ASCII string.
 * @param result The DependencyTraceResult object.
 * @returns ASCII tree string.
 */
export function formatTree(result: DependencyTraceResult): string {
  return renderAsciiTree(result.dependencyTree);
}
