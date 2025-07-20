/**
 * API module for fetching Aptos Move package metadata and dependencies.
 * Uses @aptos-labs/ts-sdk.
 */

import {
  OnchainDependency,
  OnchainModule,
  PackageMetadata,
  PackageMetadataWithAddress,
} from "./types";
import { Aptos, AptosConfig, ClientConfig, Network } from "@aptos-labs/ts-sdk";
import * as fs from "fs";
import * as path from "path";

// Persistent disk cache for package metadata
export const PACKAGE_METADATA_CACHE_FILE = path.resolve(
  process.cwd(),
  ".package_metadata.json",
);

export let packageMetadataCache = new Map<string, PackageMetadataWithAddress>();

// Load cache from disk on startup
function loadPackageMetadataCache() {
  try {
    if (fs.existsSync(PACKAGE_METADATA_CACHE_FILE)) {
      const raw = fs.readFileSync(PACKAGE_METADATA_CACHE_FILE, "utf8");
      packageMetadataCache = JSON.parse(raw);
    }
  } catch (e) {
    packageMetadataCache = new Map();
  }
}
loadPackageMetadataCache();

// Save cache to disk
export function savePackageMetadataCache() {
  try {
    fs.writeFileSync(
      PACKAGE_METADATA_CACHE_FILE,
      JSON.stringify(packageMetadataCache, null, 2),
      "utf8",
    );
  } catch (e) {
    // ignore
  }
}

const aptosCache = new Map<string, Aptos>();

function getAptos(network: "mainnet" | "testnet" | "devnet") {
  if (!aptosCache.has(network)) {
    aptosCache.set(
      network,
      new Aptos(
        new AptosConfig({
          network: getAptosNetwork(network),
          clientConfig: {
            API_KEY: process.env.API_KEY,
          },
        }),
      ),
    );
  }
  return aptosCache.get(network)!;
}

/**
 * Maps CLI network string to Aptos SDK Network.
 */
function getAptosNetwork(
  network: "mainnet" | "testnet" | "devnet" | "local",
): Network {
  switch (network) {
    case "mainnet":
      return Network.MAINNET;
    case "testnet":
      return Network.TESTNET;
    case "devnet":
      return Network.DEVNET;
    case "local":
      return Network.LOCAL;
    default:
      throw Network.MAINNET;
  }
}

/**
 * Fetches package metadata for a given package ID.
 * @param packageId The package identifier in the format <address>::<PackageName>
 * @param network The Aptos network ("mainnet", "testnet", "devnet")
 * @returns PackageMetadata object
 */
export async function fetchPackageMetadata(
  packageId: string,
  network: "mainnet" | "testnet" | "devnet",
): Promise<PackageMetadataWithAddress> {
  const [address, name] = packageId.split("::");
  if (!address || !name) {
    throw new Error(
      "Invalid package ID format. Expected <address>::<PackageName>.",
    );
  }

  const cacheKey = `${network}::${address}::${name}`;
  const cacheEntry: PackageMetadataWithAddress | undefined =
    packageMetadataCache[cacheKey];
  if (cacheEntry !== undefined) {
    return cacheEntry;
  }

  console.debug("Fetching package metadata for", packageId);

  const aptos = getAptos(network);

  // The resource type for the package registry
  const registryType = "0x1::code::PackageRegistry";
  let registry: any;
  try {
    registry = await aptos.getAccountResource<{ packages: PackageMetadata[] }>({
      accountAddress: address,
      resourceType: registryType,
    });
  } catch (e) {
    throw new Error("Package not found on the specified network." + e);
  }

  // Find the package entry in the registry
  const packages: PackageMetadata[] = registry?.packages || [];
  const pkgEntry: PackageMetadata | undefined = packages.find(
    (pkg: PackageMetadata) => {
      return pkg.name === name;
    },
  );

  if (pkgEntry === undefined) {
    throw new Error(
      "Package not found in the registry for this address. Found: " +
        packages.map((pkg) => pkg.name).join(", "),
    );
  }

  // Extract modules and dependencies

  const metadataWithAddress: PackageMetadataWithAddress = {
    address: address,
    ...pkgEntry,
  };

  packageMetadataCache[cacheKey] = metadataWithAddress;
  return metadataWithAddress;
}

/**
 * Fetches the list of dependencies for a given package ID.
 * @param packageId The package identifier in the format <address>::<PackageName>
 * @param network The Aptos network ("mainnet", "testnet", "devnet")
 * @returns Array of dependency package IDs
 */
export async function fetchPackageDependencies(
  packageId: string,
  network: "mainnet" | "testnet" | "devnet",
): Promise<string[]> {
  // Always use disk cache via fetchPackageMetadata
  const metadata = await fetchPackageMetadata(packageId, network);
  return metadata.deps.map((dep) => `${dep.account}::${dep.package_name}`);
}
