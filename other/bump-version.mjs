import { readFile, writeFile, chmod } from "fs/promises";
import { fetch } from "node-fetch-native";
import path from "path";

async function main () {
  const latestVersion = await fetch("https://api.github.com/repos/AlDanial/cloc/releases/latest")
    .then(res => res.json())
    .then(json => json.tag_name);
  const versionPath = path.join(process.cwd(), "other/version.txt")
  const clocPath = path.join(process.cwd(), "lib/cloc")
  const lastCheckedVersion = await readFile(versionPath, { encoding: "utf-8" });
  if (latestVersion === lastCheckedVersion) {
    console.log("Already up to date");
    return;
  }
  const latestVersionWithoutV = latestVersion.replace(/^v/, "");
  console.log(`Updating from ${lastCheckedVersion} to ${latestVersion}`);
  await fetch(`https://github.com/AlDanial/cloc/releases/download/${latestVersion}/cloc-${latestVersionWithoutV}.pl`)
    .then(res => res.text())
    .then(text => writeFile(clocPath, text));
  await chmod(clocPath, 0o755);
  await writeFile(versionPath, latestVersion);
  console.log("Done");
}

main()
