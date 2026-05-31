import {
  ACTIVE_SETTINGS_INCLUDE,
  WAITING_SETTINGS_EXCLUDE,
} from "../config/app-config";

export type DownloadListType = "active" | "waiting" | "stopped";

export function getDownloadSettingsKeys(
  listType: DownloadListType,
  allKeys: string[]
): string[] {
  if (listType === "active") {
    return allKeys.filter((k) => ACTIVE_SETTINGS_INCLUDE.includes(k));
  }
  if (listType === "waiting") {
    return allKeys.filter((k) => !WAITING_SETTINGS_EXCLUDE.includes(k));
  }
  return allKeys;
}

export function buildOptionChanges(
  values: Record<string, string>,
  previous: Record<string, string>
): Record<string, string> {
  const changes: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const prev = previous[key];
    if (prev !== undefined && String(prev) === String(value)) continue;
    changes[key] = value;
  }
  return changes;
}
