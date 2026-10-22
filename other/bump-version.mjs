// @ts-check
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { fetch } from "node-fetch-native";

import { downloadCloc } from "./download-cloc.mjs";

const cwd = process.cwd();
const packageJsonPath = path.join(cwd, "package.json");
const readJson = async (p) =>
  JSON.parse(await readFile(p, { encoding: "utf-8" }));
const readPackageJson = () => readJson(packageJsonPath);

/**
 * @param {string} version
 * Normalizes cloc version:
 * 1.96 => 1.96.0
 * 1.96.1 => 1.96.1
 * 2.00.0 => 2.0.0
 */
function normalizeClocVersion(version) {
  const parts = version.split(".");
  if (parts.length === 2) {
    parts.push("0");
  }
  return parts.map((p) => Number(p)).join(".");
}

/**
 * @param {string} version
 * @param {string} clocVersion
 */
async function bumpPackageJsonVersion(version, clocVersion) {
  const packageJson = await readPackageJson();
  packageJson.version = version;
  packageJson.clocVersion = clocVersion;
  await writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n",
  );
}

async function getVersionFromPackageJson() {
  const packageJson = await readPackageJson();
  return packageJson.version.replace(/^v/, "").replace("-cloc", "");
}

async function main() {
  const latestVersion = await fetch(
    "https://api.github.com/repos/AlDanial/cloc/releases/latest",
  )
    .then((res) => res.json())
    .then((json) => json.tag_name);
  const latestVersionWithoutV = latestVersion.replace(/^v/, "");
  const normalizedVersion = normalizeClocVersion(latestVersionWithoutV);
  const lastCheckedVersion = await getVersionFromPackageJson();
  if (normalizedVersion === lastCheckedVersion) {
    console.log("Already up to date");
    process.exit(1);
  }
  console.log(`Updating from v${lastCheckedVersion} to ${normalizedVersion}`);
  await bumpPackageJsonVersion(normalizedVersion + "-cloc", latestVersion);
  await downloadCloc();
  console.log("Done");
}

main();
