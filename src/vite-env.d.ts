/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ROUTER?: 'memory' | 'browser';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
