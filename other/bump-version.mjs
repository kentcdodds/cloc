import { readFile, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { fetch } from "node-fetch-native";

const cwd = process.cwd()
const packageJsonPath = path.join(cwd, "package.json")
const clocPath = path.join(cwd, "lib/cloc");
const readJson = async path => JSON.parse(await readFile(path))
const readPackageJson = async () => await readJson(packageJsonPath);
/**
 * @param {string} version
 * Normalizes cloc version:
 * 1.96 => 1.96.0
 * 1.96.1 => 1.96.1
 */
function normalizeClocVersion (version) {
  const parts = version.split(".");
  if (parts.length === 2) {
    parts.push("0");
  }
  return parts.join(".");
}
/**
 * @param {string} normalizedVersion
 * Converts the normalized version to original version:
 * 1.96.0 => 1.96
 * 1.96.1 => 1.96.1
 */
function normalizedClocVersionToOriginal (normalizeVersion) {
  const parts = normalizeVersion.replace(/-cloc$/, "").split(".");
  if (parts[2] === "0") {
    parts.pop();
  }
  return parts.join(".");
}

/**
 * @param {string} version
 */
async function bumpPackageJsonVersion (version) {
  const packageJson = await readPackageJson();
  packageJson.version = version;
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}

async function getVersionFromPackageJson () {
  const packageJson = await readPackageJson();
  return normalizedClocVersionToOriginal(packageJson.version);
}

async function main () {
  const latestVersion = await fetch("https://api.github.com/repos/AlDanial/cloc/releases/latest")
    .then(res => res.json())
    .then(json => json.tag_name);
  const latestVersionWithoutV = latestVersion.replace(/^v/, "");
  const lastCheckedVersion = await getVersionFromPackageJson();
  if (latestVersionWithoutV === lastCheckedVersion) {
    console.log("Already up to date");
    process.exit(1);
  }
  console.log(`Updating from ${"v" + lastCheckedVersion} to ${latestVersion}`);
  await fetch(`https://github.com/AlDanial/cloc/releases/download/${latestVersion}/cloc-${latestVersionWithoutV}.pl`)
    .then(res => res.text())
    .then(text => writeFile(clocPath, text));
  await chmod(clocPath, 0o755);
  // Cloc 
  await bumpPackageJsonVersion(normalizeClocVersion(latestVersionWithoutV) + "-cloc");
  console.log("Done");
}

main()
