# Aria2 WebUI (Vue 3)

Modern web interface for [aria2](https://aria2.github.io/) with light/dark themes, PWA support, and single-port Docker deployment.

## Quick start

### With Docker (recommended)

```bash
docker compose up --build
```

Open http://localhost:8080 — the UI and JSON-RPC share one origin via nginx (`/jsonrpc` proxied to aria2).

**Download directory:** by default files go to `./downloads` on the host. To use another folder, copy `.env.example` to `.env` and set `DOWNLOADS_DIR`:

```env
# Windows (forward slashes)
DOWNLOADS_DIR=C:/Users/you/Downloads

# Linux / macOS
DOWNLOADS_DIR=/home/you/Downloads
```

Or pass it inline:

```bash
DOWNLOADS_DIR=C:/Path/Downloads docker compose up --build
```

**Two storage locations:**

| Mount | Purpose |
|-------|---------|
| `DOWNLOADS_DIR` → `/downloads` | Files you download (bind mount to your PC) |
| `aria2_data` volume → `/var/lib/aria2` | Download queue session + `aria2.conf` (Docker volume, survives rebuilds) |

Web UI preferences (connection, theme, language) stay in your **browser** localStorage — not in either volume.

### Development

Requires Node 22+ and a running aria2 RPC server:

```bash
aria2c --enable-rpc --rpc-listen-all
npm install
npm run convert-legacy   # extracts locales/settings from legacy/ if present
npm run dev
```

Dev server runs at http://localhost:8888 and proxies `/jsonrpc` to `127.0.0.1:6800`.

## Configuration

Build-time environment variables (`.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_DEFAULT_RPC_PORT` | `6800` | Default aria2 RPC port |
| `VITE_DIRECT_URL` | `` | Base URL for direct file downloads |
| `VITE_APP_NAME` | `Aria2 WebUI` | Application name |

Runtime connection settings are saved in **localStorage** (scoped by host:port) via Settings → Connection Settings. Named **connection profiles** let you switch between multiple aria2 servers.

URL parameters: `?host=192.168.1.1&port=6800&token=secret&protocol=ws`

For HTTPS, Docker, and reverse-proxy deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Features

- Active / waiting / completed download lists with pagination
- Add URI, torrent, metalink; cliget command paste; drag-and-drop to add
- Global and per-download aria2 options synced from the [aria2 manual](scripts/data/aria2c.rst) (`npm run sync-settings`)
- Speed graph, quick-access starred settings, file picker for torrents
- Sort downloads by name, size, progress, or speed; batch select for pause/resume/remove
- Browser notifications when downloads complete (opt-in)
- Named connection profiles for multiple aria2 servers
- 16 languages, light/dark theme
- PWA offline shell
- Keyboard shortcuts: `Ctrl+U` add URI, `/` search, `Esc` close modal

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).
