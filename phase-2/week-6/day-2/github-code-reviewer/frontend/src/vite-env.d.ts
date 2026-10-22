/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVIEW_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
