/**
 * Dependency Tracer CLI
 * Entry point for the Aptos Move package dependency tracer tool.
 */

import { savePackageMetadataCache } from "./api";

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
  --help               Show this help message

Examples:
  pnpm run src/cli.ts 0x1::AptosFramework
  pnpm run src/cli.ts 0x1::AptosFramework --format=table --tree
`;

interface CLIOptions {
  packageId?: string;
  format: "json" | "table";
  tree: boolean;
  dedupe: boolean;
  network: "mainnet" | "testnet" | "devnet";
  help: boolean;
}

function parseArgs(argv: string[]): CLIOptions {
  const options: CLIOptions = {
    packageId: undefined,
    format: "json",
    tree: false,
    dedupe: false,
    network: "mainnet",
    help: false,
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (!options.packageId && !arg.startsWith("--")) {
      options.packageId = arg;
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

  if (options.help || !options.packageId) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  // Dynamically import modules to avoid circular dependencies
  const { traceDependencies } = await import("./tracer");
  const { formatJson, formatTable, formatTree } = await import("./output");

  try {
    // Trace dependencies
    const traceResult = await traceDependencies(options.packageId, {
      network: options.network,
    });

    // Output in the requested format
    let output = "";
    if (options.format === "json") {
      output = formatJson(traceResult);
    } else if (options.format === "table") {
      output = formatTable(traceResult);
    }
    //console.log(output);
    console.log(traceResult.dedupedModuleCount);
    //console.log(JSON.stringify(traceResult.dedupedModuleList));

    // Optionally output the dependency tree as ASCII
    if (options.tree) {
      console.log("\nDependency Tree:");
      console.log(formatTree(traceResult));
    }

    // Write packageMetadataCache to disk
    savePackageMetadataCache();
  } catch (err: any) {
    console.error("Error:", err?.message || err);
    process.exit(1);
  }
}

main();
