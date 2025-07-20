/**
 * Dependency Tracer CLI
 * Entry point for the Aptos Move package dependency tracer tool.
 */

import { savePackageMetadataCache } from "./api";
import { DependencyTraceResult } from "./types";

const HELP_TEXT = `
Dependency Tracer CLI

Usage:
  pnpm run src/cli.ts <package_id> [options]

Arguments:
  <package_id>         Package identifier in the format <address>::<PackageName>

Options:
  --format <format>    Output format: "json" (default) or "table"
  --tree               Output dependency tree as ASCII
  --dedupe             Output only unique dependencies in list/count
  --network <network>  Aptos network: "mainnet" (default), "testnet", or "devnet"
  --svg-tree           Output dependency tree as SVG (dependency_tree.svg)
  --help               Show this help message

Examples:
  pnpm run src/cli.ts 0x1::AptosFramework
  pnpm run src/cli.ts 0x1::AptosFramework --format=table --tree
  pnpm run src/cli.ts 0x1::AptosFramework --svg-tree
`;

interface CLIOptions {
  packageIds: string[];
  format: "json" | "table";
  tree: boolean;
  dedupe: boolean;
  network: "mainnet" | "testnet" | "devnet";
  help: boolean;
  svgTree: boolean;
}

function parseArgs(argv: string[]): CLIOptions {
  const options: CLIOptions = {
    packageIds: [],
    format: "json",
    tree: false,
    dedupe: false,
    network: "mainnet",
    help: false,
    svgTree: false,
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    // Accept multiple package IDs before any option
    if (!arg.startsWith("--")) {
      options.packageIds.push(arg);
      i++;
      continue;
    }
    switch (arg) {
      case "--format":
        if (argv[i + 1] === "json" || argv[i + 1] === "table") {
          options.format = argv[i + 1] as "json" | "table";
          i += 2;
        } else {
          console.error("Error: --format must be 'json' or 'table'");
          process.exit(1);
        }
        break;
      case "--tree":
        options.tree = true;
        i++;
        break;
      case "--dedupe":
        options.dedupe = true;
        i++;
        break;
      case "--network":
        if (
          argv[i + 1] === "mainnet" ||
          argv[i + 1] === "testnet" ||
          argv[i + 1] === "devnet"
        ) {
          options.network = argv[i + 1] as "mainnet" | "testnet" | "devnet";
          i += 2;
        } else {
          console.error(
            "Error: --network must be 'mainnet', 'testnet', or 'devnet'",
          );
          process.exit(1);
        }
        break;
      case "--svg-tree":
        options.svgTree = true;
        i++;
        break;
      case "--help":
        options.help = true;
        i++;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

async function main() {
  const argv = process.argv.slice(2);
  const options = parseArgs(argv);

  if (options.help || options.packageIds.length === 0) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Dynamically import modules to avoid circular dependencies
  const { traceDependencies } = await import("./tracer");
  const { formatJson, formatTable, formatTree } = await import("./output");
  const { renderDependencyTreeSvg } = await import("./graph");

  try {
    // Trace dependencies for each package
    const traceResults: DependencyTraceResult[] = [];
    for (const pkgId of options.packageIds) {
      traceResults.push(
        await traceDependencies(pkgId, {
          network: options.network,
        }),
      );
    }

    // Aggregate all dependencies
    const allDeps = traceResults.flatMap((r) => r.dependencyList);
    const allDedupedDeps = Array.from(
      new Set(traceResults.flatMap((r) => r.dedupedDependencyList)),
    );

    // Aggregate all modules
    const allModules = traceResults.flatMap((r) => r.moduleList || []);
    const allDedupedModules = Array.from(
      new Set(traceResults.flatMap((r) => r.dedupedModuleList || [])),
    );

    // Combined output object
    const combinedOutput = {
      packages: options.packageIds,
      perPackage: traceResults,
      combined: {
        dependencyCount: allDeps.length,
        dedupedDependencyCount: allDedupedDeps.length,
        dependencies: allDedupedDeps,
        moduleCount: allModules.length,
        dedupedModuleCount: allDedupedModules.length,
        modules: allDedupedModules,
      },
    };

    // Output in the requested format
    let output = "";
    let outputFile = "";
    if (options.format === "json") {
      output = formatJson(combinedOutput);
      outputFile = "dependency_output.json";
    } else if (options.format === "table") {
      output = formatTable(combinedOutput);
      outputFile = "dependency_output.txt";
    }

    // Write the output to a file
    const fs = await import("fs");
    fs.writeFileSync(outputFile, output, "utf8");
    console.log(`Dependency output written to ${outputFile}`);
    if (options.format === "json") {
      console.log(
        `Combined module count: ${combinedOutput.combined.moduleCount}`,
      );
      console.log(
        `Combined deduped module count: ${combinedOutput.combined.dedupedModuleCount}`,
      );
    }

    // Optionally output the dependency tree as ASCII (forest)
    if (options.tree) {
      console.log("\nDependency Trees:");
      for (const result of traceResults) {
        console.log(`\n${result.packageId}:`);
        console.log(formatTree(result));
      }
    }

    // Optionally output the dependency tree as SVG (forest)
    if (options.svgTree) {
      // For multiple roots, combine SVGs vertically
      let svg = "";
      let yOffset = 0;
      for (const result of traceResults) {
        const treeSvg = renderDependencyTreeSvg(result.dependencyTree, yOffset);
        // Extract height from SVG header
        const match = treeSvg.match(/height="(\d+)"/);
        let height = 0;
        if (match) height = parseInt(match[1], 10);
        svg += treeSvg.replace(/<svg[^>]*>|<\/svg>/g, ""); // Remove svg tags
        yOffset += height || 0;
      }
      // Wrap in one SVG
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${yOffset}">\n${svg}</svg>\n`;
      const svgFile = "dependency_tree.svg";
      fs.writeFileSync(svgFile, svg, "utf8");
      console.log(`Dependency tree SVG written to ${svgFile}`);
    }

    // Write packageMetadataCache to disk
    savePackageMetadataCache();
  } catch (err: any) {
    console.error("Error:", err?.message || err);
    process.exit(1);
  }
}

main();
