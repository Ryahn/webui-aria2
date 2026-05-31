/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_TITLE_PATTERN?: string;
  readonly VITE_PAGE_SIZE?: string;
  readonly VITE_GLOBAL_TIMEOUT?: string;
  readonly VITE_DEFAULT_RPC_PORT?: string;
  readonly VITE_DEFAULT_RPC_PATH?: string;
  readonly VITE_DIRECT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.json" {
  const value: Record<string, unknown>;
  export default value;
}
