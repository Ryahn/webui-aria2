import { describe, expect, it } from "vitest";
import fileSettings from "../config/file-settings.json";
import globalSettings from "../config/global-settings.json";

describe("settings metadata audit", () => {
  it("includes core per-download options from aria2 manual", () => {
    expect(fileSettings).toHaveProperty("header");
    expect(fileSettings).toHaveProperty("seed-time");
    expect(fileSettings).toHaveProperty("max-connection-per-server");
    expect(fileSettings).toHaveProperty("https-proxy");
    expect(fileSettings).toHaveProperty("rpc-save-upload-metadata");
    expect(fileSettings).toHaveProperty("no-want-digest-header");
  });

  it("includes global and RPC server options", () => {
    expect(globalSettings).toHaveProperty("max-concurrent-downloads");
    expect(globalSettings).toHaveProperty("rpc-secret");
    expect(globalSettings).toHaveProperty("optimize-concurrent-downloads");
    expect(globalSettings).toHaveProperty("keep-unfinished-download-result");
  });

  it("does not include obsolete or CLI-only keys in file settings", () => {
    expect(fileSettings).not.toHaveProperty("enable-async-dns6");
    expect(fileSettings).not.toHaveProperty("help");
    expect(fileSettings).not.toHaveProperty("version");
  });

  it("marks header as multiline", () => {
    expect(fileSettings.header).toMatchObject({ multiline: true });
  });

  it("meets minimum coverage vs aria2 input file list", () => {
    expect(Object.keys(fileSettings).length).toBeGreaterThanOrEqual(125);
    expect(Object.keys(globalSettings).length).toBeGreaterThanOrEqual(60);
  });
});
