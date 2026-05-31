# Contributing

## Development setup

```bash
npm install
npm run dev
```

Requires aria2 with RPC enabled on port 6800 (proxied in dev).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server on :8888 |
| `npm run build` | Production build to `dist/` |
| `npm test` | Vitest unit tests |
| `npm run convert-legacy` | Extract locales/settings from `legacy/` (if archived) |
| `npm run sync-settings` | Regenerate `file-settings.json` / `global-settings.json` from `scripts/data/aria2c.rst` |

Settings metadata is synced from the upstream aria2 manual. After updating `scripts/data/aria2c.rst`, run `npm run sync-settings` and review [SETTINGS-AUDIT.md](SETTINGS-AUDIT.md).

## Code style

TypeScript + Vue 3 Composition API (`<script setup>`). Tailwind CSS v4 with theme tokens in `src/styles/themes.css`.
