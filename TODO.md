dependency-tracer/TODO.md

# Dependency Tracer TODO Checklist

A comprehensive checklist for building the Aptos Move package dependency tracer CLI tool.

---

## ✅ Project Setup

- [ ] Initialize pnpm project (`pnpm init`)
- [ ] Install dependencies (`@aptos-labs/ts-sdk`)
- [ ] Set up project directory structure (`src/`, etc.)

---

## ✅ Types & Interfaces (`types.ts`)

- [ ] Define types for Package, Dependency, DependencyTreeNode, OutputFormat, etc.

---

## ✅ API Module (`api.ts`)

- [ ] Set up Aptos client using `@aptos-labs/ts-sdk`
- [ ] Implement function to fetch package metadata by package ID (`<address>::<PackageName>`)
- [ ] Implement function to fetch dependencies for a package

---

## ✅ Tracer Module (`tracer.ts`)

- [ ] Implement function to recursively trace all dependencies for a package
- [ ] Track all dependencies (with duplicates)
- [ ] Track deduped dependencies
- [ ] Build in-memory dependency tree structure

---

## ✅ Graph Module (`graph.ts`)

- [ ] Implement function to generate ASCII tree for CLI output
- [ ] (Optional, for web UI) Plan function to generate SVG/PNG tree

---

## ✅ Output Module (`output.ts`)

- [ ] Implement JSON output formatter (default)
- [ ] Implement table output formatter (optional)
- [ ] Implement function to output list of all dependencies
- [ ] Implement function to output counts (all, deduped)
- [ ] Implement function to output dependency tree (ASCII)

---

## ✅ CLI Module (`cli.ts`)

- [ ] Parse CLI arguments (package ID, output format)
- [ ] Call tracer and output modules
- [ ] Display results in chosen format

---

## ✅ Testing & Validation

- [ ] Test with real package IDs (e.g., `0x1::AptosFramework`)
- [ ] Validate counts and tree output
- [ ] Handle errors (invalid package ID, network issues, etc.)

---

## ✅ Documentation

- [ ] Write usage instructions in `README.md`
- [ ] Document CLI options and output formats

---

## ✅ Future Enhancements (Optional)

- [ ] Add support for web UI (export core logic as a library)
- [ ] Add SVG/PNG tree output for web
- [ ] Add caching for repeated queries
- [ ] Add support for multiple package IDs

---
