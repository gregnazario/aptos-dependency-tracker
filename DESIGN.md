dependency-tracer/DESIGN.md

# Dependency Tracer – Design Document

## Overview

The Dependency Tracer is a CLI tool (with future web UI support) for tracing, listing, and visualizing dependencies of Aptos Move packages. It fetches package metadata from the Aptos blockchain, recursively resolves dependencies, and presents results in configurable formats (JSON, table, and tree visualization).

---

## Goals & Requirements

- **Input:** Aptos Move package ID (`<address>::<PackageName>`)
- **Output:**
  - List of all dependencies (with and without duplicates)
  - Count of all dependencies (with and without duplicates)
  - Tree visualization of dependencies
  - Configurable output format: JSON (default) or table
- **Features:**
  1. Count all dependencies, including duplicates
  2. Count deduped dependencies
  3. List all dependencies
  4. Output a tree image (ASCII for CLI, SVG/PNG for web UI)
  5. Configurable output format (JSON/table)
  6. Modular design for CLI and future web UI
  7. Fetch package data by package ID

---

## Architecture

### High-Level Structure

```
src/
├── cli.ts         # CLI entry point
├── tracer.ts      # Core dependency tracing logic
├── api.ts         # Aptos blockchain API client
├── graph.ts       # Dependency tree construction and visualization
├── output.ts      # Output formatting (JSON, table, tree)
└── types.ts       # Shared types and interfaces
```

### Module Responsibilities

#### 1. `api.ts`

- Uses `@aptos-labs/ts-sdk` to fetch package metadata and dependencies from the Aptos blockchain.
- Provides functions:
  - `fetchPackageMetadata(packageId: string): Promise<PackageMetadata>`
  - `fetchPackageDependencies(packageId: string): Promise<string[]>`

#### 2. `tracer.ts`

- Recursively traces dependencies for a given package.
- Tracks:
  - All dependencies (with duplicates)
  - Deduped dependencies (using a Set)
- Builds an in-memory dependency tree.
- Provides:
  - `traceDependencies(packageId: string): Promise<DependencyTraceResult>`

#### 3. `graph.ts`

- Constructs a tree structure representing dependencies.
- Renders the tree as ASCII for CLI.
- Prepares for SVG/PNG rendering for web UI.
- Provides:
  - `buildDependencyTree(traceResult: DependencyTraceResult): DependencyTreeNode`
  - `renderAsciiTree(tree: DependencyTreeNode): string`

#### 4. `output.ts`

- Formats results for output.
- Supports:
  - JSON (default)
  - Table (optional)
  - ASCII tree
- Provides:
  - `formatJson(traceResult: DependencyTraceResult): string`
  - `formatTable(traceResult: DependencyTraceResult): string`
  - `formatTree(tree: DependencyTreeNode): string`

#### 5. `cli.ts`

- Parses CLI arguments (package ID, output format).
- Orchestrates calls to tracer and output modules.
- Handles errors and displays results.

#### 6. `types.ts`

- Defines:
  - `PackageMetadata`
  - `DependencyTraceResult`
  - `DependencyTreeNode`
  - Output format enums/types

---

## Data Flow

1. **User Input:**
   CLI receives package ID and optional output format.

2. **API Fetch:**
   `api.ts` fetches package metadata and dependencies from Aptos.

3. **Dependency Tracing:**
   `tracer.ts` recursively resolves all dependencies, tracking duplicates and deduped sets.

4. **Tree Construction:**
   `graph.ts` builds a dependency tree structure.

5. **Output Formatting:**
   `output.ts` formats the results as JSON, table, and/or ASCII tree.

6. **Display:**
   `cli.ts` outputs the results to the user.

---

## Example CLI Usage

```sh
pnpm run src/cli.ts 0x1::AptosFramework --format=table
pnpm run src/cli.ts 0x1::AptosFramework
```

---

## Example Output

### JSON (default)

```json
{
  "package": "0x1::AptosFramework",
  "dependencyCount": 5,
  "dedupedDependencyCount": 3,
  "dependencies": [
    "0x1::MoveStdlib",
    "0x1::Table",
    "0x1::Event"
  ],
  "dependencyTree": {
    "name": "0x1::AptosFramework",
    "dependencies": [
      {
        "name": "0x1::MoveStdlib",
        "dependencies": []
      },
      ...
    ]
  }
}
```

### Table

```
Package                | Direct Deps | All Deps | Deduped Deps
--------------------------------------------------------------
0x1::AptosFramework    |      3      |    5     |      3
```

### ASCII Tree

```
0x1::AptosFramework
├── 0x1::MoveStdlib
├── 0x1::Table
└── 0x1::Event
```

---

## Extensibility & Future Enhancements

- **Web UI:**
  Core logic is decoupled from CLI, enabling easy integration with a web frontend.
- **Tree Images:**
  Plan for SVG/PNG rendering in `graph.ts` for web visualization.
- **Multiple Package IDs:**
  Extend CLI and core logic to support batch analysis.
- **Caching:**
  Add caching for repeated queries to reduce network load.

---

## Error Handling

- Invalid package ID: User-friendly error message.
- Network/API errors: Retry logic and clear reporting.
- Cyclic dependencies: Detect and prevent infinite recursion.

---

## Testing

- Unit tests for each module.
- Integration tests with real package IDs.
- Validation of output formats and tree correctness.

---

## Documentation

- Usage instructions in `README.md`
- CLI options and output format documentation
- Example outputs

---

## Dependencies

- [pnpm](https://pnpm.sh/) – Runtime and package manager
- [`@aptos-labs/ts-sdk`](https://www.npmjs.com/package/@aptos-labs/ts-sdk) – Aptos blockchain SDK

---

## Conclusion

This design ensures a robust, extensible, and user-friendly dependency tracer for Aptos Move packages, with a clear path to future enhancements and web UI support.
