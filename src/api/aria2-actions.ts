import { rpcClient } from "../api/rpc-client";
import type { RpcMulticallResult } from "./aria2-types";
import { readFileAsBase64, readFileAsText } from "../utils/helpers";

export { parseCligetCommand } from "../utils/cliget-parser";

export function addUris(
  lines: { uris: string[]; options: Record<string, string> }[],
  settings: Record<string, string>,
  onEach?: (data: RpcMulticallResult) => void
): void {
  for (const line of lines) {
    const merged = { ...settings, ...line.options };
    rpcClient.once("addUri", [line.uris, merged], onEach ?? (() => {}), true);
  }
  rpcClient.forceUpdate();
}

export async function addTorrents(
  files: File[],
  settings: Record<string, string>,
  onEach?: (data: RpcMulticallResult) => void
): Promise<void> {
  for (const file of files) {
    const data = await readFileAsBase64(file);
    rpcClient.once("addTorrent", [data, [], settings], onEach ?? (() => {}), true);
  }
  rpcClient.forceUpdate();
}

export async function addMetalinks(
  files: File[],
  settings: Record<string, string>,
  onEach?: (data: RpcMulticallResult) => void
): Promise<void> {
  for (const file of files) {
    const data = await readFileAsText(file);
    rpcClient.once("addMetalink", [data, settings], onEach ?? (() => {}), true);
  }
  rpcClient.forceUpdate();
}
