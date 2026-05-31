import type { RpcConfig, RpcProtocol } from "../config/app-config";

export function uuid(): string {
  return crypto.randomUUID();
}

export function storageKey(prefix: string, config: RpcConfig): string {
  return `${prefix}:${config.host}:${config.port}`;
}

export function resolveProtocol(config: RpcConfig): RpcProtocol {
  if (config.protocol) return config.protocol;
  return config.encrypt ? "wss" : "ws";
}

export function resolveHttpScheme(config: RpcConfig): "http" | "https" {
  const protocol = resolveProtocol(config);
  if (protocol === "https" || protocol === "wss") return "https";
  if (protocol === "http" || protocol === "ws") return "http";
  return config.encrypt ? "https" : "http";
}

export function buildRpcUrl(config: RpcConfig, forWebSocket = false): string {
  const protocol = forWebSocket
    ? resolveProtocol(config)
    : resolveHttpScheme(config);
  const path = config.path || "/jsonrpc";
  const auth = config.auth;

  if (forWebSocket && auth?.user && auth.pass) {
    return `${protocol}://${auth.user}:${auth.pass}@${config.host}:${config.port}${path}`;
  }

  if (
    typeof location !== "undefined" &&
    !forWebSocket &&
    location.origin &&
    config.host === location.hostname
  ) {
    return `${location.origin}${path}`;
  }

  if (
    forWebSocket &&
    typeof location !== "undefined" &&
    config.host === location.hostname &&
    location.host
  ) {
    const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
    return `${wsProtocol}://${location.host}${path}`;
  }

  return `${protocol}://${config.host}:${config.port}${path}`;
}

export function normalizeUri(uri: string): string {
  const stripped = uri.trim().replace(/^['"]|['"]$/g, "");
  // aria2 accepts encoded URIs; apostrophes in paths must be percent-encoded
  return stripped.replace(/'/g, "%27");
}

function parseOptionFlags(text: string): Record<string, string> {
  const options: Record<string, string> = {};
  const normalized = text.trim();
  if (!normalized) return options;

  const regex = /--([a-z0-9-]+)(?:=(?:\s*([^\s"']+|"[^"]*"|'[^']*')))?/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalized)) !== null) {
    const val = match[2] ?? "true";
    options[match[1]] = val.replace(/^['"]|['"]$/g, "");
  }
  return options;
}

function parseUriLine(line: string): { uris: string[]; options: Record<string, string> } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  if (/^(https?|ftp|magnet):/i.test(trimmed)) {
    const optIndex = trimmed.search(/\s+--/);
    const uriPart = optIndex >= 0 ? trimmed.slice(0, optIndex) : trimmed;
    const optPart = optIndex >= 0 ? trimmed.slice(optIndex) : "";
    return {
      uris: [normalizeUri(uriPart)],
      options: parseOptionFlags(optPart),
    };
  }

  const uris: string[] = [];
  const options: Record<string, string> = {};
  const tokens = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];

  for (const token of tokens) {
    if (token.startsWith("--")) {
      const match = token.match(/^--([^=]+)(?:=(.*))?$/);
      if (match) options[match[1]] = match[2] ?? "true";
    } else {
      uris.push(normalizeUri(token));
    }
  }

  if (!uris.length) return null;
  return { uris, options };
}

export function parseUriLines(input: string): { uris: string[]; options: Record<string, string> }[] {
  return input
    .split(/\r?\n/)
    .map(parseUriLine)
    .filter((entry): entry is { uris: string[]; options: Record<string, string> } => entry !== null);
}

export function formatBytes(bytes: number | string, decimals = 2): string {
  const n = Number(bytes);
  if (!n || n <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((n / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number | string): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

export function getProgress(d: { completedLength: string; totalLength: string }): number {
  const total = Number(d.totalLength);
  if (!total) return 0;
  return Math.min(100, (Number(d.completedLength) / total) * 100);
}

export function downloadName(d: {
  bittorrent?: { name?: string };
  files?: { path: string }[];
}): string {
  if (d.bittorrent?.name) return d.bittorrent.name;
  if (d.files?.length) {
    const path = d.files[0].path.replace(/\\/g, "/");
    return path.split("/").pop() ?? path;
  }
  return "unknown";
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function mergeDownloads<T extends { gid: string }>(
  incoming: T[],
  existing: T[],
  enrich?: (item: T) => T
): T[] {
  const map = new Map(existing.map((d) => [d.gid, d]));
  return incoming.map((item) => {
    const prev = map.get(item.gid);
    const merged = { ...(prev ?? {}), ...item } as T;
    return enrich ? enrich(merged) : merged;
  });
}

export function parseConnectionFromUrl(): Partial<RpcConfig> | null {
  if (typeof location === "undefined") return null;
  const params = new URLSearchParams(location.search);
  const host = params.get("host");
  if (!host) return null;

  const config: Partial<RpcConfig> = { host };
  const port = params.get("port");
  if (port) config.port = Number(port);
  const path = params.get("path") ?? params.get("rpcpath");
  if (path) config.path = path.startsWith("/") ? path : `/${path}`;
  const token = params.get("token");
  const username = params.get("username");
  const password = params.get("password");
  if (token || username) {
    config.auth = {
      token: token ?? undefined,
      user: username ?? undefined,
      pass: password ?? undefined,
    };
  }
  const encrypt = params.get("encrypt");
  if (encrypt != null) config.encrypt = encrypt === "true" || encrypt === "1";
  const protocol = params.get("protocol") as RpcProtocol | null;
  if (protocol) config.protocol = protocol;
  const directURL = params.get("directURL");
  if (directURL) config.directURL = directURL;
  return config;
}

export function loadSavedConnection(config: RpcConfig): RpcConfig | null {
  try {
    const raw = localStorage.getItem(storageKey("aria2conf", config));
    if (!raw) return null;
    return JSON.parse(raw) as RpcConfig;
  } catch {
    return null;
  }
}

export function saveConnection(config: RpcConfig): void {
  localStorage.setItem(storageKey("aria2conf", config), JSON.stringify(config));
}
