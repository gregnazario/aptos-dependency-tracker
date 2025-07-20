/**
 * graph.ts
 * Dependency tree visualization utilities for the Dependency Tracer tool.
 * Provides functions to render the dependency tree as ASCII for CLI output.
 */

import { DependencyTreeNode } from "./types";

/**
 * Renders a dependency tree as an ASCII string.
 * @param tree The root DependencyTreeNode.
 * @param prefix Internal use: prefix for tree branches.
 * @param isLast Internal use: whether this node is the last child.
 * @returns ASCII string representation of the tree.
 */
export function renderAsciiTree(
  tree: DependencyTreeNode,
  prefix: string = "",
  isLast: boolean = true,
): string {
  let output = "";

  // Draw the current node
  output += prefix;
  if (prefix.length > 0) {
    output += isLast ? "└── " : "├── ";
  }
  output += tree.name + "\n";

  // Prepare prefix for children
  const childPrefix =
    prefix + (prefix.length > 0 ? (isLast ? "    " : "│   ") : "");

  // Render children
  const deps = tree.dependencies || [];
  deps.forEach((child, idx) => {
    const last = idx === deps.length - 1;
    output += renderAsciiTree(child, childPrefix, last);
  });

  return output;
}
