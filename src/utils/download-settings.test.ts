import { describe, expect, it } from "vitest";
import {
  buildOptionChanges,
  getDownloadSettingsKeys,
} from "./download-settings";

describe("getDownloadSettingsKeys", () => {
  const allKeys = [
    "dir",
    "pause",
    "dry-run",
    "bt-max-peers",
    "max-download-limit",
    "header",
  ];

  it("limits active downloads to ACTIVE_SETTINGS_INCLUDE", () => {
    expect(getDownloadSettingsKeys("active", allKeys)).toEqual([
      "bt-max-peers",
      "max-download-limit",
    ]);
  });

  it("excludes waiting-only options for waiting downloads", () => {
    expect(getDownloadSettingsKeys("waiting", allKeys)).toEqual([
      "dir",
      "bt-max-peers",
      "max-download-limit",
      "header",
    ]);
  });

  it("includes all file settings for stopped downloads", () => {
    expect(getDownloadSettingsKeys("stopped", allKeys)).toEqual(allKeys);
  });
});

describe("buildOptionChanges", () => {
  it("returns only changed values", () => {
    expect(
      buildOptionChanges(
        { dir: "/new", "max-download-limit": "0" },
        { dir: "/old", "max-download-limit": "0" }
      )
    ).toEqual({ dir: "/new" });
  });
});
