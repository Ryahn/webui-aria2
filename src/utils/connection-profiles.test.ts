import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RpcConfig } from "../config/app-config";
import {
  deleteProfile,
  loadProfiles,
  saveProfiles,
  upsertProfile,
  getActiveProfileId,
} from "./connection-profiles";

const sampleConfig = (): RpcConfig => ({
  host: "192.168.1.5",
  port: 6800,
  path: "/jsonrpc",
  encrypt: false,
  auth: { token: "secret" },
});

describe("connection-profiles", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-1" });
  });

  it("saves and loads profiles", () => {
    upsertProfile("Home", sampleConfig());
    expect(loadProfiles()).toHaveLength(1);
    expect(loadProfiles()[0].name).toBe("Home");
    expect(getActiveProfileId()).toBe("test-uuid-1");
  });

  it("updates existing profile by id", () => {
    const profile = upsertProfile("Home", sampleConfig());
    upsertProfile("Work server", { ...sampleConfig(), host: "10.0.0.1" }, profile.id);
    expect(loadProfiles()).toHaveLength(1);
    expect(loadProfiles()[0].name).toBe("Work server");
    expect(loadProfiles()[0].config.host).toBe("10.0.0.1");
  });

  it("deletes profile", () => {
    const profile = upsertProfile("Home", sampleConfig());
    deleteProfile(profile.id);
    expect(loadProfiles()).toHaveLength(0);
    expect(getActiveProfileId()).toBeNull();
  });

  it("persists to localStorage", () => {
    saveProfiles([{ id: "a", name: "A", config: sampleConfig() }]);
    expect(loadProfiles()[0].id).toBe("a");
  });
});
