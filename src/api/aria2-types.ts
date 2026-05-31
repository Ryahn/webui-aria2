export interface Aria2File {
  index: string;
  path: string;
  length: string;
  completedLength: string;
  selected: string;
  uris?: { uri: string; status: string }[];
}

export interface DownloadItem {
  gid: string;
  status: string;
  totalLength: string;
  completedLength: string;
  uploadLength: string;
  downloadSpeed: string;
  uploadSpeed: string;
  connections: string;
  dir: string;
  files: Aria2File[];
  bittorrent?: {
    announceList?: string[][];
    comment?: string;
    creationDate?: number;
    mode?: string;
    name?: string;
  };
  errorCode?: string;
  errorMessage?: string;
  followedBy?: string[];
  following?: string;
  belongsTo?: string;
  numSeeders?: string;
  seeder?: string;
  pieceLength?: string;
  numPieces?: string;
  bitfield?: string;
  verifiedLength?: string;
  verifyIntegrityPending?: string;
  metadata?: string;
  // UI-enriched
  name?: string;
  followedFrom?: DownloadItem | null;
  expanded?: boolean;
}

export interface GlobalStat {
  downloadSpeed: string;
  uploadSpeed: string;
  numActive: string;
  numWaiting: string;
  numStopped: string;
}

export interface VersionInfo {
  version: string;
  enabledFeatures: string[];
}

export interface RpcError {
  code: number;
  message: string;
}

export interface RpcMulticallResult {
  code?: number;
  message?: string;
  result?: unknown;
}

/** Normalize one entry from aria2 `system.multicall` (one-item array or fault struct). */
export function unwrapMulticallEntry(entry: unknown): RpcMulticallResult {
  if (
    entry &&
    typeof entry === "object" &&
    !Array.isArray(entry) &&
    "code" in entry &&
    "message" in entry
  ) {
    const fault = entry as { code: number; message: string };
    return { code: fault.code, message: fault.message };
  }

  if (Array.isArray(entry)) {
    return { result: entry.length > 0 ? entry[0] : undefined };
  }

  return { result: entry };
}

export function getRpcErrorMessage(data: RpcMulticallResult | RpcResponse): string | null {
  const multi = data as RpcMulticallResult;
  if (multi.code && multi.message) return multi.message;
  const response = data as RpcResponse;
  if (response.error?.message) return response.error.message;
  return null;
}

export interface RpcResponse<T = unknown> {
  id: string;
  jsonrpc: string;
  result?: T;
  error?: RpcError;
}

export interface OptionMeta {
  val?: string | boolean | number;
  desc: string;
  options?: string[];
}

export type SettingsMap = Record<string, OptionMeta>;

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "busy"
  | "unauthorized";

export interface ParsedUriLine {
  uris: string[];
  options: Record<string, string>;
}

export interface AlertMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export interface DownloadFilterState {
  active: boolean;
  waiting: boolean;
  complete: boolean;
  error: boolean;
  paused: boolean;
  removed: boolean;
  hideLinkedMetadata: boolean;
  search: string;
}

export interface SpeedSample {
  time: number;
  download: number;
  upload: number;
}
