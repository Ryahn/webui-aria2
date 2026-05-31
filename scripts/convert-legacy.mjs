import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const legacyTranslate = path.join(root, "legacy/src/js/translate");
const legacySettings = path.join(root, "legacy/src/js/services/settings/settings.js");
const localesOut = path.join(root, "src/locales");
const configOut = path.join(root, "src/config");

fs.mkdirSync(localesOut, { recursive: true });
fs.mkdirSync(configOut, { recursive: true });

for (const file of fs.readdirSync(legacyTranslate)) {
  if (!file.endsWith(".js") || file === "template.js") continue;
  const content = fs.readFileSync(path.join(legacyTranslate, file), "utf8");
  const translations = {};
  eval(content);
  const locale = file.replace(".js", "");
  const data = translations[locale];
  if (data) {
    fs.writeFileSync(path.join(localesOut, `${locale}.json`), JSON.stringify(data, null, 2));
  }
}

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
      if (depth === 0) {
        return source.slice(begin, i + 1);
      }
    }
  }
  return null;
}

const settingsSource = fs.readFileSync(legacySettings, "utf8");
const fileSettingsRaw = extractValue("$fileSettings", settingsSource);
const globalSettingsRaw = extractValue("$globalSettings", settingsSource);

if (fileSettingsRaw && globalSettingsRaw) {
  const fileSettings = eval(`(${fileSettingsRaw})`);
  const globalSettings = eval(`(${globalSettingsRaw})`);
  fs.writeFileSync(path.join(configOut, "file-settings.json"), JSON.stringify(fileSettings, null, 2));
  fs.writeFileSync(
    path.join(configOut, "global-settings.json"),
    JSON.stringify(globalSettings, null, 2)
  );
}

console.log("Converted locales and settings metadata.");
