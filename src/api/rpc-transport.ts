import type { RpcConfig } from "../config/app-config";
import type { RpcResponse } from "./aria2-types";
import { buildRpcUrl, uuid } from "../utils/helpers";

export interface JsonCallOptions {
  name: string;
  params?: unknown[];
  success: (data: RpcResponse) => void;
  error: () => void;
}

export class JsonRpcClient {
  private avgTimeout = 2000;
  private config: RpcConfig | null = null;

  init(config: RpcConfig): void {
    this.config = config;
  }

  async invoke(opts: JsonCallOptions): Promise<void> {
    if (!this.config) {
      opts.error();
      return;
    }

    const url = buildRpcUrl(this.config, false);
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: uuid(),
          method: opts.name,
          params: opts.params?.length ? opts.params : undefined,
        }),
        signal: AbortSignal.timeout(this.avgTimeout),
      });

      if (!response.ok) {
        if (this.config.auth?.user && this.config.auth.pass) {
          await this.authFallback(opts);
          return;
        }
        opts.error();
        return;
      }

      this.avgTimeout = 2000 + (Date.now() - start) * 3;
      const data = (await response.json()) as RpcResponse;
      opts.success(data);
    } catch {
      if (this.config.auth?.user && this.config.auth.pass) {
        await this.authFallback(opts);
        return;
      }
      opts.error();
    }
  }

  private async authFallback(opts: JsonCallOptions): Promise<void> {
    if (!this.config?.auth?.user || !this.config.auth.pass) {
      opts.error();
      return;
    }

    const scheme = this.config.encrypt ? "https" : "http";
    const authUrl = `${scheme}://${this.config.auth.user}:${this.config.auth.pass}@${this.config.host}:${this.config.port}${this.config.path || "/jsonrpc"}`;

    const img = new Image();
    img.src = authUrl;
    await new Promise((r) => setTimeout(r, this.avgTimeout));

    try {
      const response = await fetch(authUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: uuid(),
          method: opts.name,
          params: opts.params?.length ? opts.params : undefined,
        }),
        signal: AbortSignal.timeout(this.avgTimeout),
      });
      if (!response.ok) {
        opts.error();
        return;
      }
      opts.success((await response.json()) as RpcResponse);
    } catch {
      opts.error();
    }
  }
}

export class WebSocketRpcClient {
  initialized = false;
  private sock: WebSocket | null = null;
  private handles: {
    id: string;
    success: (data: RpcResponse) => void;
    error: () => void;
  }[] = [];
  private onReady: (() => void) | null = null;

  init(config: RpcConfig, onReady: () => void): void {
    this.initialized = false;
    if (this.onReady) this.onReady();
    this.onReady = onReady;

    if (typeof WebSocket === "undefined") {
      onReady();
      return;
    }

    if (this.sock) {
      this.sock.onopen =
        this.sock.onmessage =
        this.sock.onerror =
        this.sock.onclose =
          null;
      this.handles.forEach((h) => h.error());
      this.handles = [];
    }

    try {
      const url = buildRpcUrl(config, true);
      this.sock = new WebSocket(url);
      this.sock.onopen = () => {
        this.initialized = true;
        this.onReady?.();
        this.onReady = null;
      };
      this.sock.onclose = () => {
        if (this.handles.length) this.onError();
      };
      this.sock.onerror = () => this.onError();
      this.sock.onmessage = (message) => {
        const data = JSON.parse(message.data as string) as RpcResponse & { id: string };
        const idx = this.handles.findIndex((h) => h.id === data.id);
        if (idx >= 0) {
          const handle = this.handles[idx];
          this.handles.splice(idx, 1);
          handle.success(data);
        }
      };
    } catch {
      onReady();
    }
  }

  invoke(opts: JsonCallOptions): void {
    if (!this.sock || this.sock.readyState !== WebSocket.OPEN) {
      opts.error();
      return;
    }

    const id = uuid();
    const payload = {
      jsonrpc: "2.0" as const,
      id,
      method: opts.name,
      params: opts.params?.length ? opts.params : undefined,
    };

    this.handles.push({ id, success: opts.success, error: opts.error });
    this.sock.send(JSON.stringify(payload));
  }

  private onError(): void {
    this.handles.forEach((h) => h.error());
    this.handles = [];
    this.initialized = false;
    this.onReady?.();
    this.onReady = null;
  }
}
