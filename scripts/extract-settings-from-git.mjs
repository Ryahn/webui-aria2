import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const configOut = path.join(root, "src/config");

function extractValue(name, source) {
  const marker = `.value("${name}", `;
  const start = source.indexOf(marker);
  if (start === -1) return null;
  let i = start + marker.length;
  while (source[i] === " " || source[i] === "\n") i++;
  if (source[i] !== "{") return null;
  let depth = 0;
  const begin = i;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(begin, i + 1);
    }
  }
  return null;
}

const source = execSync("git show HEAD:src/js/services/settings/settings.js", {
  cwd: root,
  encoding: "utf8",
});

const globalRaw = extractValue("$globalSettings", source);
const fileRaw = extractValue("$fileSettings", source);

if (globalRaw) {
  const globalSettings = eval(`(${globalRaw})`);
  // Ensure peer-agent exists in global settings (aria2 global option)
  if (!globalSettings["peer-agent"]) {
    globalSettings["peer-agent"] = {
      val: "aria2/$VERSION",
      desc: "Specify user agent for peer connecting handshake in BitTorrent. Default: aria2/$VERSION",
    };
  }
  fs.writeFileSync(
    path.join(configOut, "global-settings.json"),
    JSON.stringify(globalSettings, null, 2)
  );
  console.log(`Wrote global-settings.json (${Object.keys(globalSettings).length} options)`);
}

if (fileRaw) {
  const fileSettings = eval(`(${fileRaw})`);
  if (!fileSettings["peer-agent"]) {
    fileSettings["peer-agent"] = {
      val: "aria2/$VERSION",
      desc: "Specify user agent for peer connecting handshake in BitTorrent. Default: aria2/$VERSION",
    };
  }
  fs.writeFileSync(path.join(configOut, "file-settings.json"), JSON.stringify(fileSettings, null, 2));
  console.log(`Wrote file-settings.json (${Object.keys(fileSettings).length} options)`);
}
