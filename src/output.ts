/**
 * output.ts
 * Output formatting utilities for the Dependency Tracer tool.
 * Supports JSON (default), table, and ASCII tree formats.
 */

import { DependencyTraceResult, OutputFormat } from "./types";
import { renderAsciiTree } from "./graph";

/**
 * Formats the dependency trace result as a JSON string.
 * @param result The DependencyTraceResult object.
 * @returns JSON string.
 */
export function formatJson(result: DependencyTraceResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Formats the dependency trace result as a human-readable table string.
 * @param result The DependencyTraceResult object.
 * @returns Table string.
 */
export function formatTable(result: DependencyTraceResult): string {
  const header =
    "Package                | Direct Deps | All Deps | Deduped Deps\n" +
    "--------------------------------------------------------------";
  const row = `${result.packageId.padEnd(23)}| ${String(
    result.directDependencyCount,
  ).padEnd(11)}| ${String(result.allDependencyCount).padEnd(8)}| ${String(
    result.dedupedDependencyCount,
  ).padEnd(12)}`;
  return `${header}\n${row}`;
}

/**
 * Formats the dependency tree as an ASCII string.
 * @param result The DependencyTraceResult object.
 * @returns ASCII tree string.
 */
export function formatTree(result: DependencyTraceResult): string {
  return renderAsciiTree(result.dependencyTree);
}
