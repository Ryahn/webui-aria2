# Troubleshooting

## UI loads but cannot connect to aria2

1. Confirm aria2 is running with RPC enabled: `aria2c --enable-rpc --rpc-listen-all`
2. Default RPC port is **6800** — not the web UI port (8080/8888)
3. Open **Settings → Connection Settings** and verify host, port, and token
4. If using Docker, use the bundled image — nginx proxies `/jsonrpc` on the same port

## HTTPS / mixed content blocked

Browsers block HTTPS pages from calling `http://localhost:6800`. Solutions:

- Serve UI and RPC on the **same origin** (Docker nginx proxy, or reverse proxy `/jsonrpc`)
- Do **not** use GitHub Pages against a local HTTP aria2 instance

See [DEPLOYMENT.md](DEPLOYMENT.md) for nginx, Caddy, and Docker examples.

## Web UI still appears after uninstalling aria2

- Clear browser cache and unregister the PWA service worker
- Stop any remaining web server or Docker container
- Remove bookmarks pointing to the old URL

## `configuration.js` changes had no effect (legacy app)

The new app uses Vite env vars and Connection Settings modal — no rebuild needed for runtime RPC config.

## Port 6800 bind failure (Windows)

Port may be reserved by Hyper-V. Try `--rpc-listen-port=6801` in aria2 and update Connection Settings.

## Files downloaded as root (Docker)

The container runs aria2 as root by default. On Linux/macOS bind mounts, files may be owned by root. Options:

- Run `chown` on the host download folder after downloads
- Set `user:` in docker-compose (ensure the UID can write to `DOWNLOADS_DIR`)

Downloads are written to the host path mapped in `docker-compose.yml` (default `./downloads`, override with `DOWNLOADS_DIR` in `.env`).

## Session lost after reboot

**Docker:** the `aria2_data` volume keeps the download queue in `/var/lib/aria2/aria2.session` across container rebuilds. Your download **files** stay on the `DOWNLOADS_DIR` bind mount.

**Global aria2 options:** the Web UI Global Settings modal changes runtime options only. To restore defaults after a rebuild, add them to `/var/lib/aria2/aria2.conf` inside the `aria2_data` volume:

```bash
docker exec -it webui-aria2-webui-aria2-1 sh
cat /var/lib/aria2/aria2.conf
```

**Non-Docker:** configure aria2 `input-file`, `save-session`, and `force-save` in `aria2.conf`.

## Web UI settings vs aria2 settings

| What | Where it persists |
|------|-------------------|
| Connection, theme, language, profiles | Browser localStorage |
| Download queue | `aria2_data` volume (`aria2.session`) |
| Global aria2 defaults on startup | `aria2_data` volume (`aria2.conf`) |
| Downloaded files | `DOWNLOADS_DIR` bind mount |

## Blank white page

- Ensure you open the **web UI port**, not the raw RPC port (6800 returns JSON, not HTML)
- Check browser console for JavaScript errors

## Language resets on refresh

Locale is stored in `localStorage` key `aria2-locale`. Clear site data if corrupted.

## Cookie / config conflicts (legacy)

The Vue app uses **localStorage** keyed by `host:port` instead of a global cookie — multiple instances on one domain no longer conflict.
