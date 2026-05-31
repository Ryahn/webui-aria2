import { GLOBAL_POLL_INTERVAL, defaultRpcConfig } from "../config/app-config";
import type { ConnectionStatus, RpcResponse } from "./aria2-types";
import { unwrapMulticallEntry } from "./aria2-types";
import type { RpcConfig } from "../config/app-config";
import { JsonRpcClient, WebSocketRpcClient } from "./rpc-transport";
import {
  loadSavedConnection,
  parseConnectionFromUrl,
  saveConnection,
} from "../utils/helpers";

type Subscription = {
  once: boolean | 2;
  name: string;
  params: unknown[];
  cb: (data: RpcResponse) => void;
};

type SyscallState = "http" | "ws" | "initializing";

const BUSY_PATTERN = /busy|timeout|temporarily unavailable|resource temporarily/i;

export class RpcClient {
  private subscriptions: Subscription[] = [];
  private configurations: RpcConfig[] = [];
  private currentConf: RpcConfig = defaultRpcConfig();
  private currentToken: string | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private forceNextUpdate = false;
  private needNewConnection = true;
  private json = new JsonRpcClient();
  private ws = new WebSocketRpcClient();
  private state: SyscallState = "http";
  private pollInterval = GLOBAL_POLL_INTERVAL;
  private retryDelay = GLOBAL_POLL_INTERVAL;
  private connectionSaved = false;
  private hasConnected = false;
  private lastErrorToast = 0;

  status: ConnectionStatus = "disconnected";
  retryAt: number | null = null;

  onStatusChange: ((status: ConnectionStatus) => void) | null = null;
  onRetryAtChange: ((retryAt: number | null) => void) | null = null;
  onErrorMessage: ((message: string) => void) | null = null;
  onSuccessMessage: ((message: string) => void) | null = null;

  constructor() {
    this.bootstrapConfigurations();
    this.timeout = setTimeout(() => this.update(), this.pollInterval);
  }

  private bootstrapConfigurations(): void {
    const base = defaultRpcConfig();
    const urlOverride = parseConnectionFromUrl();
    const saved = loadSavedConnection(base);

    this.configurations = [base];
    if (saved) this.configurations.unshift(saved);
    if (urlOverride) {
      this.configurations.unshift({ ...base, ...urlOverride, auth: urlOverride.auth ?? base.auth });
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.onStatusChange?.(status);
  }

  private setRetryAt(retryAt: number | null): void {
    this.retryAt = retryAt;
    this.onRetryAtChange?.(retryAt);
  }

  private toastError(message: string, throttleMs = 8000): void {
    const now = Date.now();
    if (now - this.lastErrorToast < throttleMs) return;
    this.lastErrorToast = now;
    this.onErrorMessage?.(message);
  }

  private scheduleRetry(delayMs: number): void {
    this.retryDelay = delayMs;
    this.setRetryAt(Date.now() + delayMs);
    this.timeout = setTimeout(this.update, delayMs);
  }

  private update = (): void => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.setRetryAt(null);

    this.subscriptions = this.subscriptions.filter((e) => e && e.once !== 2);
    const subs = this.subscriptions.slice();
    if (!subs.length) {
      this.timeout = setTimeout(this.update, this.pollInterval);
      return;
    }

    if (this.state === "initializing") {
      this.timeout = setTimeout(this.update, this.pollInterval);
      return;
    }

    if (this.needNewConnection && this.configurations.length) {
      this.needNewConnection = false;
      this.currentConf = this.configurations[0];
      this.currentToken = this.currentConf.auth?.token ?? null;
      this.setStatus("connecting");
      this.initSyscall(this.currentConf);
      this.timeout = setTimeout(this.update, this.pollInterval);
      return;
    }

    const params = subs.map((s) => {
      let p = s.params;
      if (this.currentToken) {
        p = [`token:${this.currentToken}`, ...(p ?? [])];
      }
      return { methodName: s.name, params: p?.length ? p : undefined };
    });

    const invoke = this.state === "ws" && this.ws.initialized ? this.ws : this.json;

    invoke.invoke({
      name: "system.multicall",
      params: [params],
      success: (data) => {
        const results = ((data.result as unknown[]) ?? []).map(unwrapMulticallEntry);
        const unauthorized = results.some((d) => d.code && d.message === "Unauthorized");
        if (unauthorized) {
          this.needNewConnection = true;
          this.setStatus("unauthorized");
          this.toastError("Authentication failed while connecting to Aria2 RPC server.");
          this.scheduleRetry(this.retryDelay);
          return;
        }

        if (this.configurations.length) {
          this.configurations = [];
          this.hasConnected = true;
          this.setStatus("connected");
          if (!this.connectionSaved) {
            this.onSuccessMessage?.("Successfully connected to Aria2 RPC server.");
          }
        } else if (this.status === "busy" || this.status === "disconnected") {
          this.setStatus("connected");
        }

        this.retryDelay = this.pollInterval;
        const callbacks: { cb: Subscription["cb"]; data: RpcResponse }[] = [];
        let sawBusy = false;

        results.forEach((d, i) => {
          const handle = subs[i];
          if (!handle) return;
          if (d.code && d.message) {
            if (BUSY_PATTERN.test(d.message)) {
              sawBusy = true;
            } else {
              this.toastError(d.message);
            }
            if (handle.once) handle.once = 2;
            return;
          }
          callbacks.push({ cb: handle.cb, data: d as RpcResponse });
          if (handle.once) handle.once = 2;
        });

        if (sawBusy) {
          this.setStatus("busy");
        }

        callbacks.forEach(({ cb, data }) => cb(data));

        if (this.forceNextUpdate) {
          this.forceNextUpdate = false;
          this.timeout = setTimeout(this.update, 0);
        } else {
          this.timeout = setTimeout(this.update, this.pollInterval);
        }
      },
      error: () => {
        const index = this.configurations.indexOf(this.currentConf);
        if (index !== -1) {
          this.configurations.splice(index, 1);
          this.toastError("Connection attempt failed. Trying another configuration.", 3000);
          this.timeout = setTimeout(this.update, 0);
          return;
        }

        if (this.hasConnected) {
          this.setStatus("busy");
          this.scheduleRetry(10000);
          return;
        }

        this.setStatus("disconnected");
        this.toastError("Could not connect to the aria2 RPC server. Will retry in 10 secs.");
        this.scheduleRetry(10000);
      },
    });
  };

  private initSyscall(conf: RpcConfig): void {
    this.state = "initializing";
    this.json.init(conf);
    this.ws.init(conf, () => {
      this.state = this.ws.initialized ? "ws" : "http";
    });
  }

  configure(conf: RpcConfig | RpcConfig[]): void {
    this.configurations = Array.isArray(conf) ? conf : [conf];
    this.connectionSaved = false;
    this.hasConnected = false;
    this.needNewConnection = true;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(this.update, 0);
    }
  }

  saveCurrentConfiguration(): void {
    saveConnection(this.currentConf);
    this.connectionSaved = true;
  }

  getConfiguration(): RpcConfig {
    return this.currentConf;
  }

  getDirectURL(): string {
    return this.currentConf.directURL ?? "";
  }

  once(name: string, params: unknown[] = [], cb: (data: RpcResponse) => void = () => {}, delay = false): void {
    this.subscriptions.push({ once: true, name: `aria2.${name}`, params, cb });
    if (!delay) this.forceUpdate();
  }

  subscribe(name: string, params: unknown[] = [], cb: (data: RpcResponse) => void = () => {}, delay = false): Subscription {
    const handle: Subscription = { once: false, name: `aria2.${name}`, params, cb };
    this.subscriptions.push(handle);
    if (!delay) this.forceUpdate();
    return handle;
  }

  unsubscribe(handle: Subscription): void {
    const index = this.subscriptions.indexOf(handle);
    if (index >= 0) this.subscriptions[index] = null as unknown as Subscription;
  }

  forceUpdate(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(this.update, 0);
    } else {
      this.forceNextUpdate = true;
    }
  }

  destroy(): void {
    if (this.timeout) clearTimeout(this.timeout);
    this.subscriptions = [];
  }
}

export const rpcClient = new RpcClient();
