# DirectURL

When configured, completed downloads show a direct download link in the WebUI.

## Setup

1. Configure aria2 download directory (`dir` in `aria2.conf`)
2. Run a web server that serves that directory (nginx, Apache, Caddy, etc.)
3. Set the base URL in **Settings → Connection Settings → Direct URL**, e.g. `http://192.168.1.10/downloads/`

Or set at build time: `VITE_DIRECT_URL=http://your-server/downloads/`

## Security

Only enable DirectURL on trusted networks. The WebUI cannot verify server permissions.
