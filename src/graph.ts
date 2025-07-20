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
  const childPrefix = prefix + (prefix.length > 0 ? (isLast ? "    " : "│   ") : "");

  // Render children
  const deps = tree.dependencies || [];
  deps.forEach((child, idx) => {
    const last = idx === deps.length - 1;
    output += renderAsciiTree(child, childPrefix, last);
  });

  return output;
}

/**
 * Renders a dependency tree as an SVG string.
 * @param tree The root DependencyTreeNode.
 * @param yOffset Optional vertical offset for stacking multiple trees.
 * @returns SVG string representation of the tree.
 */
export function renderDependencyTreeSvg(tree: DependencyTreeNode, yOffset: number = 0): string {
  // Simple vertical tree layout: each node is a box, children are below parent, lines connect them.
  // This is a basic implementation for small/medium trees.

  // Layout constants
  const NODE_WIDTH = 160;
  const NODE_HEIGHT = 40;
  const HORIZONTAL_GAP = 30;
  const VERTICAL_GAP = 60;
  const FONT_SIZE = 14;

  // Traverse tree to assign coordinates
  type PositionedNode = {
    node: DependencyTreeNode;
    x: number;
    y: number;
    children: PositionedNode[];
    parent?: PositionedNode;
  };

  let maxX = 0;
  let maxY = 0;

  function layoutTree(
    node: DependencyTreeNode,
    depth: number,
    xOffset: number,
  ): [PositionedNode, number] {
    let width = 0;
    const children: PositionedNode[] = [];
    let childX = xOffset;

    for (const child of node.dependencies) {
      const [childPos, childWidth] = layoutTree(child, depth + 1, childX);
      children.push(childPos);
      childX += childWidth + HORIZONTAL_GAP;
      width += childWidth + HORIZONTAL_GAP;
    }
    if (children.length > 0) width -= HORIZONTAL_GAP; // Remove last gap

    // If no children, width is NODE_WIDTH
    if (width === 0) width = NODE_WIDTH;

    // Center parent above children
    const x = children.length === 0 ? xOffset : xOffset + width / 2 - NODE_WIDTH / 2;
    const y = yOffset + depth * (NODE_HEIGHT + VERTICAL_GAP);

    maxX = Math.max(maxX, x + NODE_WIDTH);
    maxY = Math.max(maxY, y + NODE_HEIGHT);

    const posNode: PositionedNode = {
      node,
      x,
      y,
      children,
    };
    for (const child of children) {
      child.parent = posNode;
    }
    return [posNode, width];
  }

  const [root, _] = layoutTree(tree, 0, 0);

  // SVG header
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxX + 40}" height="${maxY + 40}" font-family="monospace" font-size="${FONT_SIZE}">\n`;

  // Draw edges (lines)
  function drawEdges(node: PositionedNode) {
    for (const child of node.children) {
      // Draw a line from bottom center of parent to top center of child
      const x1 = node.x + NODE_WIDTH / 2;
      const y1 = node.y + NODE_HEIGHT;
      const x2 = child.x + NODE_WIDTH / 2;
      const y2 = child.y;
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#888" stroke-width="2"/>\n`;
      drawEdges(child);
    }
  }
  drawEdges(root);

  // Draw nodes (rectangles with text)
  function drawNodes(node: PositionedNode) {
    // Node rectangle
    svg += `<rect x="${node.x}" y="${node.y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="8" fill="#f5f5f5" stroke="#333" stroke-width="2"/>\n`;
    // Node label (centered)
    svg += `<text x="${node.x + NODE_WIDTH / 2}" y="${node.y + NODE_HEIGHT / 2 + FONT_SIZE / 2 - 2}" text-anchor="middle" fill="#222">${escapeXml(
      node.node.name,
    )}</text>\n`;
    for (const child of node.children) {
      drawNodes(child);
    }
  }
  function escapeXml(str: string) {
    return str.replace(/[<>&"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
  }
  drawNodes(root);

  svg += "</svg>\n";
  return svg;
}
