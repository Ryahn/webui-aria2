import type { RpcConfig } from "../config/app-config";
import { uuid } from "./helpers";

export interface ConnectionProfile {
  id: string;
  name: string;
  config: RpcConfig;
}

const PROFILES_KEY = "aria2-connection-profiles";
const ACTIVE_PROFILE_KEY = "aria2-active-profile-id";

export function loadProfiles(): ConnectionProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ConnectionProfile[];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: ConnectionProfile[]): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfileId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  else localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

export function upsertProfile(name: string, config: RpcConfig, id?: string): ConnectionProfile {
  const profiles = loadProfiles();
  const profile: ConnectionProfile = {
    id: id ?? uuid(),
    name: name.trim() || `${config.host}:${config.port}`,
    config: JSON.parse(JSON.stringify(config)) as RpcConfig,
  };

  const index = profiles.findIndex((p) => p.id === profile.id);
  if (index >= 0) profiles[index] = profile;
  else profiles.push(profile);

  saveProfiles(profiles);
  setActiveProfileId(profile.id);
  return profile;
}

export function deleteProfile(id: string): void {
  const profiles = loadProfiles().filter((p) => p.id !== id);
  saveProfiles(profiles);
  if (getActiveProfileId() === id) setActiveProfileId(null);
}

export function findProfile(id: string): ConnectionProfile | undefined {
  return loadProfiles().find((p) => p.id === id);
}
