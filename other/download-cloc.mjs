// @ts-check
import { readFile, writeFile, chmod, access, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetch } from "node-fetch-native";

const cwd = process.cwd();
const packageJsonPath = path.join(cwd, "package.json");
const libPath = path.join(cwd, "lib");
const clocPath = path.join(libPath, "cloc");

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  );

/**
 * Downloads the upstream cloc script for package.json's `clocVersion`
 * into lib/cloc and marks it executable.
 */
export async function downloadCloc() {
  const packageJson = JSON.parse(
    await readFile(packageJsonPath, { encoding: "utf-8" }),
  );
  const clocVersion = packageJson.clocVersion;
  if (typeof clocVersion !== "string" || clocVersion.length === 0) {
    throw new Error("package.json is missing a clocVersion field");
  }
  const versionWithoutV = clocVersion.replace(/^v/, "");
  if (!(await exists(libPath))) {
    await mkdir(libPath);
  }
  const url = `https://github.com/AlDanial/cloc/releases/download/${clocVersion}/cloc-${versionWithoutV}.pl`;
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download cloc: ${res.status} ${res.statusText}`);
  }
  await writeFile(clocPath, await res.text());
  await chmod(clocPath, 0o755);
  console.log(`Wrote ${clocPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await downloadCloc();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
