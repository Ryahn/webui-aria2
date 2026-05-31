import { normalizeUri } from "./helpers";

export interface CligetParseResult {
  uris: string[];
  options: Record<string, string>;
}

/** aria2c short flags commonly emitted by cliget */
const SHORT_OPTS: Record<string, string> = {
  x: "max-connection-per-server",
  s: "split",
  k: "min-split-size",
  j: "max-concurrent-downloads",
  o: "out",
  d: "dir",
};

const URI_SCHEME = /^(https?|ftp|magnet):/i;

function stripOuterQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\(["'\\])/g, "$1");
  }
  return trimmed;
}

function isUri(value: string): boolean {
  return URI_SCHEME.test(stripOuterQuotes(value));
}

function appendHeader(headers: string[], value: string): void {
  const header = stripOuterQuotes(value).trim();
  if (header) headers.push(header);
}

function setOption(
  options: Record<string, string>,
  headers: string[],
  name: string,
  value: string
): void {
  const key = name.trim();
  const val = stripOuterQuotes(value);
  if (!key) return;

  if (key === "header") {
    appendHeader(headers, val);
    return;
  }

  if (key === "referer" && val) {
    options.referer = val;
    return;
  }

  if (key === "user-agent" && val) {
    options["user-agent"] = val;
    return;
  }

  options[key] = val || "true";
}

function finalizeHeaders(options: Record<string, string>, headers: string[]): void {
  if (!headers.length) return;
  options.header = headers.join("\n");
}

/**
 * Parse an aria2c command line copied from cliget (or similar generators).
 * Merges repeated --header flags into one newline-separated aria2 header option.
 */
export function parseCligetCommand(input: string): CligetParseResult {
  const src = input.replace(/\\\r?\n/g, " ").trim();
  const uris: string[] = [];
  const options: Record<string, string> = {};
  const headers: string[] = [];
  let i = 0;

  function skipWs(): void {
    while (i < src.length && /\s/.test(src[i])) i++;
  }

  function readQuoted(): string {
    const quote = src[i++];
    let out = "";
    while (i < src.length) {
      const c = src[i];
      if (c === "\\" && i + 1 < src.length) {
        out += src[i + 1];
        i += 2;
        continue;
      }
      if (c === quote) {
        i++;
        break;
      }
      out += c;
      i++;
    }
    return out;
  }

  function readBareToken(): string {
    const start = i;
    while (i < src.length && !/\s/.test(src[i])) i++;
    return src.slice(start, i);
  }

  function readUnquotedValue(): string {
    skipWs();
    const start = i;
    while (i < src.length) {
      if (/\s/.test(src[i])) {
        const rest = src.slice(i).trimStart();
        if (rest.startsWith("--") || /^-[a-zA-Z]/.test(rest)) break;
        if (isUri(rest.split(/\s+/)[0] ?? "")) break;
      }
      i++;
    }
    return src.slice(start, i).trim();
  }

  function readOptionValue(name: string, hasEquals: boolean): string {
    skipWs();
    if (i >= src.length) return "";

    if (hasEquals && src[i] !== "=") {
      return readUnquotedValue();
    }

    if (hasEquals && src[i] === "=") {
      i++;
      skipWs();
    }

    if (src[i] === '"' || src[i] === "'") return readQuoted();

    if (name === "header") return readUnquotedValue();

    return readBareToken();
  }

  function readShortOptionValue(): string {
    let value = "";
    while (i < src.length && /\d/.test(src[i])) value += src[i++];
    if (value && i < src.length && /[KMGkmgi]/i.test(src[i])) value += src[i++];
    if (value) return value;

    skipWs();
    if (src[i] === '"' || src[i] === "'") return readQuoted();
    if (i < src.length && !/\s/.test(src[i])) return readBareToken();
    skipWs();
    return readBareToken();
  }

  while (i < src.length) {
    skipWs();
    if (i >= src.length) break;

    if (src.startsWith("aria2c", i) && (i + 6 >= src.length || /\s/.test(src[i + 6]))) {
      i += 6;
      continue;
    }

    const ch = src[i];

    if (ch === '"' || ch === "'") {
      const value = readQuoted();
      if (isUri(value)) uris.push(normalizeUri(value));
      continue;
    }

    if (ch === "-" && src[i + 1] === "-") {
      i += 2;
      const nameStart = i;
      while (i < src.length && src[i] !== "=" && !/\s/.test(src[i])) i++;
      const name = src.slice(nameStart, i);
      const hasEquals = src[i] === "=";
      const value = readOptionValue(name, hasEquals || name === "header");
      setOption(options, headers, name, value);
      continue;
    }

    if (ch === "-" && i + 1 < src.length && /[a-zA-Z]/.test(src[i + 1])) {
      i++;
      const opt = src[i++];
      const longName = SHORT_OPTS[opt];
      if (longName) {
        const value = readShortOptionValue();
        setOption(options, headers, longName, value);
      }
      continue;
    }

    const token = readBareToken();
    if (!token) continue;
    if (isUri(token)) uris.push(normalizeUri(token));
  }

  finalizeHeaders(options, headers);
  return { uris, options };
}
