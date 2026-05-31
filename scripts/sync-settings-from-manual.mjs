/**
 * Sync file-settings.json and global-settings.json from doc/manual-src/en/aria2c.rst.
 * Run: node scripts/sync-settings-from-manual.mjs
 * Writes SETTINGS-AUDIT.md with a diff summary.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const configDir = path.join(root, "src/config");
const manualPath = path.join(__dirname, "data/aria2c.rst");
const auditPath = path.join(root, "SETTINGS-AUDIT.md");

/** Options only changeable via aria2.changeGlobalOption (explicit list in manual). */
const GLOBAL_EXCLUSIVE = [
  "bt-max-open-files",
  "download-result",
  "keep-unfinished-download-result",
  "log",
  "log-level",
  "max-concurrent-downloads",
  "max-download-result",
  "max-overall-download-limit",
  "max-overall-upload-limit",
  "optimize-concurrent-downloads",
  "save-cookies",
  "save-session",
  "server-stat-of",
];

/** Daemon / RPC / session options — global template, not per-URI in input file hlist. */
const SERVER_GLOBAL = [
  "async-dns-server",
  "auto-save-interval",
  "bt-lpd-interface",
  "ca-certificate",
  "certificate",
  "conf-path",
  "console-log-level",
  "disk-cache",
  "dscp",
  "dht-entry-point",
  "dht-entry-point6",
  "dht-file-path",
  "dht-file-path6",
  "dht-listen-addr6",
  "dht-listen-port",
  "dht-message-timeout",
  "enable-rpc",
  "event-poll",
  "interface",
  "listen-port",
  "load-cookies",
  "min-tls-version",
  "multiple-interface",
  "on-bt-download-complete",
  "on-download-complete",
  "on-download-error",
  "on-download-pause",
  "on-download-start",
  "on-download-stop",
  "peer-id-prefix",
  "private-key",
  "rlimit-nofile",
  "rpc-allow-origin-all",
  "rpc-certificate",
  "rpc-listen-all",
  "rpc-listen-port",
  "rpc-max-request-size",
  "rpc-passwd",
  "rpc-private-key",
  "rpc-secret",
  "rpc-secure",
  "rpc-user",
  "save-not-found",
  "save-session-interval",
  "server-stat-if",
  "server-stat-timeout",
  "socket-recv-buffer-size",
  "stop-with-process",
  "summary-interval",
];

/** CLI-only — not exposed in WebUI settings forms. */
const EXCLUDE = new Set([
  "help",
  "version",
  "gid",
  "input-file",
  "metalink-file",
  "torrent-file",
  "stop",
  "stderr",
  "enable-async-dns6", // removed from aria2; legacy typo
]);

/** Per-download options also useful but not listed in Input File hlist. */
const EXTRA_FILE = ["force-sequential", "netrc-path", "no-want-digest-header"];

const MULTILINE = new Set(["header"]);

function readManual() {
  if (!fs.existsSync(manualPath)) {
    throw new Error(`Missing ${manualPath}. Copy aria2 doc/manual-src/en/aria2c.rst there.`);
  }
  return fs.readFileSync(manualPath, "utf8");
}

function extractInputFileOptions(rst) {
  const section = rst.match(/Input File\n~+\n([\s\S]*?)Server Performance Profile/);
  if (!section) throw new Error("Could not find Input File section in manual");
  const names = [...section[1].matchAll(/:option:`([a-z0-9-]+)/g)].map((m) => m[1]);
  return [...new Set(names)];
}

function cleanRstText(text) {
  return text
    .replace(/\.\. (?:note|warning|code-block|hlist)::[\s\S]*?(?=\n\n|\n\.\. |\n[A-Z]|\Z)/g, " ")
    .replace(/:option:`[^`]*`/g, " ")
    .replace(/:func:`[^`]*`/g, " ")
    .replace(/``([^`]+)``/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDefault(desc, headerLine) {
  const defaultPatterns = [
    /Default:\s*``([^`]+)``/i,
    /Default:\s*`([^`]+)`/i,
    /Default:\s*([^.\n]+?)(?:\.|$)/i,
  ];
  for (const re of defaultPatterns) {
    const m = desc.match(re);
    if (m) return m[1].trim();
  }

  if (/\[true\|false\]/i.test(headerLine)) return "false";

  const enumInHeader = headerLine.match(/=([a-z0-9|]+)/i);
  if (enumInHeader && enumInHeader[1].includes("|")) {
    return enumInHeader[1].split("|")[0];
  }

  return "";
}

function parseEnumOptions(headerLine, desc) {
  if (/\[true\|false\]/i.test(headerLine)) return ["true", "false"];

  const headerEnum = headerLine.match(/=([a-z0-9|]+)/i);
  if (headerEnum && headerEnum[1].includes("|")) {
    return headerEnum[1].split("|");
  }

  const possible = desc.match(/Possible Values:\s*([^.\n]+)/i);
  if (possible) {
    return possible[1]
      .split(/[,|]/)
      .map((s) => s.trim().replace(/^`|`$/g, ""))
      .filter(Boolean);
  }

  return null;
}

function coerceVal(raw, enumOptions) {
  if (enumOptions?.length === 2 && enumOptions.includes("true") && enumOptions.includes("false")) {
    if (raw === "true") return true;
    if (raw === "false") return false;
  }
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
}

function parseManualOptions(rst) {
  const blocks = rst.split(/\n(?=\.\. option::)/);
  const options = new Map();

  for (const block of blocks) {
    const headerMatch = block.match(/^\.\. option::\s+(.+?)$/m);
    if (!headerMatch) continue;

    const headerLine = headerMatch[1];
    const longMatches = [...headerLine.matchAll(/--([a-z0-9-]+)/g)];
    if (!longMatches.length) continue;
    const name = longMatches[longMatches.length - 1][1];

    const body = block.slice(headerMatch.index + headerMatch[0].length);
    const bodyPart = body.split(/\n(?=\.\. )/)[0];
    const desc = cleanRstText(bodyPart);
    if (!desc) continue;

    const enumOptions = parseEnumOptions(headerLine, desc);
    const defaultRaw = parseDefault(desc, headerLine);

    const meta = { desc };
    if (enumOptions?.length) meta.options = enumOptions;
    if (defaultRaw !== "") meta.val = coerceVal(defaultRaw, enumOptions);
    else if (enumOptions?.length === 2 && enumOptions.includes("true")) meta.val = false;
    else meta.val = "";

    if (MULTILINE.has(name)) meta.multiline = true;

    options.set(name, meta);
  }

  return options;
}

function mergeMeta(name, manualMeta, existing) {
  const merged = { ...(existing ?? {}) };

  if (manualMeta.desc) merged.desc = manualMeta.desc;
  if (manualMeta.options) merged.options = manualMeta.options;
  if (manualMeta.multiline) merged.multiline = true;
  else if (merged.multiline && !MULTILINE.has(name)) delete merged.multiline;

  if (manualMeta.val !== undefined && manualMeta.val !== "") {
    merged.val = manualMeta.val;
  } else if (merged.val === undefined) {
    merged.val = manualMeta.val ?? "";
  }

  return merged;
}

function buildMap(keys, manual, existing) {
  const out = {};
  for (const key of keys.sort()) {
    if (EXCLUDE.has(key)) continue;
    const manualMeta = manual.get(key);
    if (!manualMeta) continue;
    out[key] = mergeMeta(key, manualMeta, existing[key]);
  }
  return out;
}

function main() {
  const rst = readManual();
  const manual = parseManualOptions(rst);
  const inputFile = extractInputFileOptions(rst);

  const existingFile = JSON.parse(fs.readFileSync(path.join(configDir, "file-settings.json"), "utf8"));
  const existingGlobal = JSON.parse(fs.readFileSync(path.join(configDir, "global-settings.json"), "utf8"));

  const fileKeys = new Set([
    ...inputFile,
    ...EXTRA_FILE,
    ...Object.keys(existingFile),
  ]);
  for (const k of SERVER_GLOBAL) fileKeys.delete(k);
  for (const k of GLOBAL_EXCLUSIVE) fileKeys.delete(k);
  for (const k of EXCLUDE) fileKeys.delete(k);

  const globalKeys = new Set([...GLOBAL_EXCLUSIVE, ...SERVER_GLOBAL, ...Object.keys(existingGlobal)]);
  for (const k of EXCLUDE) globalKeys.delete(k);
  for (const k of inputFile) globalKeys.delete(k);

  const fileSettings = buildMap([...fileKeys], manual, existingFile);
  const globalSettings = buildMap([...globalKeys], manual, existingGlobal);

  fs.writeFileSync(path.join(configDir, "file-settings.json"), JSON.stringify(fileSettings, null, 2) + "\n");
  fs.writeFileSync(path.join(configDir, "global-settings.json"), JSON.stringify(globalSettings, null, 2) + "\n");

  const prevFileKeys = new Set(Object.keys(existingFile));
  const prevGlobalKeys = new Set(Object.keys(existingGlobal));
  const newFileKeys = Object.keys(fileSettings);
  const newGlobalKeys = Object.keys(globalSettings);

  const addedFile = newFileKeys.filter((k) => !prevFileKeys.has(k));
  const removedFile = [...prevFileKeys].filter((k) => !fileSettings[k]);
  const addedGlobal = newGlobalKeys.filter((k) => !prevGlobalKeys.has(k));
  const removedGlobal = [...prevGlobalKeys].filter((k) => !globalSettings[k]);

  const manualNotInUi = [...manual.keys()]
    .filter((k) => !EXCLUDE.has(k) && !fileSettings[k] && !globalSettings[k])
    .sort();

  const audit = `# Settings audit (aria2 manual)

Generated by \`node scripts/sync-settings-from-manual.mjs\` from \`scripts/data/aria2c.rst\` (upstream aria2 manual).

## Summary

| Source | Count |
|--------|------:|
| Options in aria2 manual | ${manual.size} |
| Per-download (\`file-settings.json\`) | ${newFileKeys.length} |
| Global / server (\`global-settings.json\`) | ${newGlobalKeys.length} |
| Merged in Global Settings UI | ${new Set([...newFileKeys, ...newGlobalKeys.filter((k) => !["checksum", "index-out", "out", "pause", "select-file"].includes(k))]).size} |

Global Settings modal merges \`file-settings.json\` + \`global-settings.json\` (see \`GLOBAL_SETTINGS_EXCLUDE\` in \`app-config.ts\`).

## Changes in this sync

### Added to file-settings (${addedFile.length})

${addedFile.length ? addedFile.map((k) => `- \`${k}\``).join("\n") : "_none_"}

### Removed from file-settings (${removedFile.length})

${removedFile.length ? removedFile.map((k) => `- \`${k}\` — ${removedFile.includes("enable-async-dns6") && k === "enable-async-dns6" ? "obsolete / not in manual" : "moved or excluded"}`).join("\n") : "_none_"}

### Added to global-settings (${addedGlobal.length})

${addedGlobal.length ? addedGlobal.map((k) => `- \`${k}\``).join("\n") : "_none_"}

### Removed from global-settings (${removedGlobal.length})

${removedGlobal.length ? removedGlobal.map((k) => `- \`${k}\``).join("\n") : "_none_"}

## Manual options not in WebUI (${manualNotInUi.length})

These remain CLI-only or are intentionally omitted (e.g. \`help\`, \`version\`, \`input-file\`):

${manualNotInUi.map((k) => `- \`${k}\``).join("\n")}

## Regenerate

\`\`\`bash
# Refresh manual from upstream (optional)
curl -o scripts/data/aria2c.rst https://raw.githubusercontent.com/aria2/aria2/master/doc/manual-src/en/aria2c.rst

npm run sync-settings
\`\`\`
`;

  fs.writeFileSync(auditPath, audit);

  console.log(`Manual options parsed: ${manual.size}`);
  console.log(`file-settings.json: ${newFileKeys.length} (${addedFile.length} added, ${removedFile.length} removed)`);
  console.log(`global-settings.json: ${newGlobalKeys.length} (${addedGlobal.length} added, ${removedGlobal.length} removed)`);
  console.log(`Wrote ${auditPath}`);
}

main();
