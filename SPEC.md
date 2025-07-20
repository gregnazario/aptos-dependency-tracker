dependency-tracer/SPEC.md

# Dependency Tracer – Formal Specification

## 1. Purpose

The Dependency Tracer is a command-line tool for analyzing, counting, and visualizing dependencies of Aptos Move packages. It is designed for developers, auditors, and ecosystem participants who need insight into the dependency structure of on-chain Move packages.

---

## 2. Scope

- **Supported Platform:** Aptos blockchain (mainnet, testnet, devnet)
- **Supported Package:** Any Move package published on Aptos, identified by `<address>::<PackageName>`
- **Primary Interface:** Command-line (CLI)
- **Extensibility:** Core logic must be modular to support future web UI integration.

---

## 3. Functional Requirements

### 3.1. Input

- [ ] **Required:**
  - [ ] `package_id` (string): The Move package identifier in the format `<address>::<PackageName>`
- [ ] **Optional:**
  - [ ] `--format` (string): Output format. Supported values: `json` (default), `table`
  - [ ] `--tree` (boolean): If present, outputs the dependency tree as ASCII
  - [ ] `--dedupe` (boolean): If present, outputs only deduplicated dependencies in the list/count
  - [ ] `--network` (string): Aptos network to query (`mainnet`, `testnet`, `devnet`). Default: `mainnet`

### 3.2. Output

- [ ] **Dependency List:**
  - [ ] List of all dependencies (with duplicates and/or deduped, as specified)
- [ ] **Dependency Counts:**
  - [ ] Total number of dependencies (including duplicates)
  - [ ] Total number of unique dependencies (deduped)
- [ ] **Dependency Tree:**
  - [ ] ASCII tree representation of the dependency graph, rooted at the input package
- [ ] **Output Format:**
  - [ ] JSON (default): Machine-readable output
  - [ ] Table: Human-readable summary table

### 3.3. Behavior

- [ ] The tool SHALL fetch package metadata and dependencies from the Aptos blockchain using the official API or SDK
- [ ] The tool SHALL recursively resolve all dependencies for the given package
- [ ] The tool SHALL count all dependencies, including duplicates, and separately count unique dependencies
- [ ] The tool SHALL output a list of all dependencies
- [ ] The tool SHALL output a tree visualization of dependencies (ASCII for CLI)
- [ ] The tool SHALL support configurable output formats (JSON, table)
- [ ] The tool SHALL handle invalid input, network errors, and cyclic dependencies gracefully, providing clear error messages
- [ ] The tool SHALL be implemented in TypeScript, using PNPM as the runtime and `@aptos-labs/ts-sdk` for blockchain access
- [ ] The tool SHALL be structured for easy import into a future web UI

---

## 4. Non-Functional Requirements

- [ ] **Performance:**
  - [ ] The tool SHOULD resolve and output dependencies for typical packages in under 5 seconds
- [ ] **Reliability:**
  - [ ] The tool SHALL detect and prevent infinite recursion due to cyclic dependencies
- [ ] **Usability:**
  - [ ] CLI help and usage instructions SHALL be available via `--help`
  - [ ] Error messages SHALL be clear and actionable
- [ ] **Extensibility:**
  - [ ] Core logic SHALL be decoupled from CLI interface for future web UI integration
- [ ] **Portability:**
  - [ ] The tool SHALL run on any platform supported by PNPM

---

## 5. CLI Interface

### 5.1. Usage

```
pnpm run src/cli.ts <package_id> [options]
```

### 5.2. Options

- [ ] `<package_id>` (string): Package identifier (`<address>::<PackageName>`)
- [ ] `--format` (string): Output format: `json` or `table`
- [ ] `--tree` (boolean): Output dependency tree as ASCII
- [ ] `--dedupe` (boolean): Output only unique dependencies in list/count
- [ ] `--network` (string): Aptos network: `mainnet`, `testnet`, or `devnet`
- [ ] `--help` (boolean): Show usage instructions

### 5.3. Examples

- Default JSON output:
  ```
  pnpm run src/cli.ts 0x1::AptosFramework
  ```
- Table output with tree:
  ```
  pnpm run src/cli.ts 0x1::AptosFramework --format=table --tree
  ```
- Deduped dependency list:
  ```
  pnpm run src/cli.ts 0x1::AptosFramework --dedupe
  ```

---

## 6. Output Specification

### 6.1. JSON Format

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

### 6.2. Table Format

```
Package                | Direct Deps | All Deps | Deduped Deps
--------------------------------------------------------------
0x1::AptosFramework    |      3      |    5     |      3
```

### 6.3. ASCII Tree

```
0x1::AptosFramework
├── 0x1::MoveStdlib
├── 0x1::Table
└── 0x1::Event
```

---

## 7. Error Handling

- [ ] **Invalid Package ID:**
  - [ ] Output: `Error: Invalid package ID format. Expected <address>::<PackageName>.`
- [ ] **Package Not Found:**
  - [ ] Output: `Error: Package not found on the specified network.`
- [ ] **Network/API Error:**
  - [ ] Output: `Error: Unable to fetch package data. Please check your network connection.`
- [ ] **Cyclic Dependencies:**
  - [ ] Output: `Error: Cyclic dependency detected at <package_id>.`
- [ ] **Unknown Error:**
  - [ ] Output: `Error: An unexpected error occurred. Please try again.`

---

## 8. Future Extensions

- Support for multiple package IDs in a single invocation.
- Export dependency tree as SVG/PNG for web UI.
- Caching of package metadata for performance.
- Integration with web UI frontend.

---

## 9. References

- [Aptos Move Package Registry](https://api.mainnet.aptoslabs.com/v1/accounts/<address>/resource/0x1::code::PackageRegistry)
- [@aptos-labs/ts-sdk Documentation](https://www.npmjs.com/package/@aptos-labs/ts-sdk)
- [pnpm Documentation](https://pnpm.sh/docs)

---
