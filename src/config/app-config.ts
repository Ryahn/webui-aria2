export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Aria2 WebUI";

export const TITLE_PATTERN =
  import.meta.env.VITE_TITLE_PATTERN ??
  "active: {active} - waiting: {waiting} - stopped: {stopped} — {name}";

export const PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE ?? 11);

export const GLOBAL_POLL_INTERVAL = Number(import.meta.env.VITE_GLOBAL_TIMEOUT ?? 1000);

export const DEFAULT_RPC_PORT = Number(import.meta.env.VITE_DEFAULT_RPC_PORT ?? 6800);

export const DEFAULT_RPC_PATH = import.meta.env.VITE_DEFAULT_RPC_PATH ?? "/jsonrpc";

export const DEFAULT_DIRECT_URL = import.meta.env.VITE_DIRECT_URL ?? "";

export interface RpcAuth {
  token?: string;
  user?: string;
  pass?: string;
}

export type RpcProtocol = "http" | "https" | "ws" | "wss";

export interface RpcConfig {
  host: string;
  port: number;
  path: string;
  encrypt: boolean;
  protocol?: RpcProtocol;
  auth?: RpcAuth;
  directURL?: string;
}

export function defaultRpcConfig(): RpcConfig {
  const sameOrigin =
    typeof location !== "undefined" && location.protocol.startsWith("http");
  const pagePort =
    sameOrigin && location.port ? Number(location.port) : null;

  return {
    host: sameOrigin ? location.hostname : "localhost",
    // When UI and RPC share one origin (Docker nginx, Vite dev proxy), use the page port.
    port: pagePort ?? DEFAULT_RPC_PORT,
    path: DEFAULT_RPC_PATH,
    encrypt: sameOrigin ? location.protocol === "https:" : false,
    auth: {},
    directURL: DEFAULT_DIRECT_URL,
  };
}

export const ENABLE = {
  torrent: true,
  metalink: true,
  sidebar: {
    show: true,
    stats: true,
    filters: true,
    starredProps: true,
  },
} as const;

export const STARRED_PROPS = [
  "dir",
  "conf-path",
  "auto-file-renaming",
  "max-connection-per-server",
  "peer-agent",
];

export const DOWNLOAD_PROPS = [
  "header",
  "referer",
  "http-user",
  "http-passwd",
  "pause",
  "dir",
  "max-connection-per-server",
];

export const GLOBAL_SETTINGS_EXCLUDE = ["checksum", "index-out", "out", "pause", "select-file"];

export const WAITING_SETTINGS_EXCLUDE = [
  "dry-run",
  "metalink-base-uri",
  "parameterized-uri",
  "pause",
  "piece-length",
];

export const ACTIVE_SETTINGS_INCLUDE = [
  "bt-max-peers",
  "bt-request-peer-speed-limit",
  "bt-remove-unselected-file",
  "max-download-limit",
  "max-upload-limit",
];

export const LOCALE_OPTIONS = [
  { code: "en_US", flag: "us", label: "English" },
  { code: "de_DE", flag: "de", label: "Deutsch" },
  { code: "es_ES", flag: "es", label: "Español" },
  { code: "fr_FR", flag: "fr", label: "Français" },
  { code: "it_IT", flag: "it", label: "Italiano" },
  { code: "nl_NL", flag: "nl", label: "Nederlands" },
  { code: "pl_PL", flag: "pl", label: "Polski" },
  { code: "pt_BR", flag: "br", label: "Português" },
  { code: "ru_RU", flag: "ru", label: "Русский" },
  { code: "zh_CN", flag: "cn", label: "简体中文" },
  { code: "zh_TW", flag: "tw", label: "繁體中文" },
  { code: "cs_CZ", flag: "cz", label: "Čeština" },
  { code: "fa_IR", flag: "ir", label: "فارسی" },
  { code: "id_ID", flag: "id", label: "Indonesia" },
  { code: "th_TH", flag: "th", label: "ไทย" },
  { code: "tr_TR", flag: "tr", label: "Türkçe" },
];
