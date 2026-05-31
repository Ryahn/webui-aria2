# Deployment guide

This WebUI talks to aria2 over JSON-RPC. Browsers enforce **same-origin** or **HTTPS-to-HTTPS** rules — an HTTPS page cannot call `http://localhost:6800` directly.

## Recommended: single origin (Docker)

The bundled Docker image serves the UI and proxies `/jsonrpc` to aria2 on one port:

```bash
docker compose up --build
# Open http://localhost:8080
```

No extra configuration is needed — the app defaults to the page hostname and port.

## Development (Vite)

```bash
aria2c --enable-rpc --rpc-listen-all
npm run dev
# Open http://localhost:8888 — /jsonrpc is proxied to 127.0.0.1:6800
```

## nginx reverse proxy (production)

Serve static files from `dist/` and proxy RPC on the **same host and port**:

```nginx
server {
    listen 443 ssl;
    server_name aria2.example.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    root /var/www/webui-aria2/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /jsonrpc {
        proxy_pass http://127.0.0.1:6800/jsonrpc;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Run aria2 locally:

```bash
aria2c --enable-rpc --rpc-listen-all --rpc-listen-port=6800 --rpc-secret=YOUR_TOKEN
```

In **Connection Settings**, set host to `aria2.example.com`, port to `443`, protocol to `https` (or leave Auto).

## Caddy

```caddy
aria2.example.com {
    root * /var/www/webui-aria2/dist
    file_server
    try_files {path} /index.html

    reverse_proxy /jsonrpc 127.0.0.1:6800
}
```

## Direct RPC (no proxy)

If the UI and aria2 run on different hosts/ports without a proxy:

1. Open **Settings → Connection Settings**
2. Set host, port **6800**, and RPC secret token
3. For HTTPS pages, aria2 must expose **HTTPS or WSS** RPC — or use a reverse proxy above

## GitHub Pages / static CDN

**GitHub Pages cannot proxy to your home aria2 instance.** Options:

- Host the UI on your own server with nginx/Caddy (above)
- Use the Docker image on a VPS
- Do **not** expect `https://user.github.io/webui-aria2` to reach `http://192.168.1.x:6800`

## Connection profiles

Save multiple servers under **Settings → Connection Settings** using profile names. Profiles are stored in browser localStorage.

## Security checklist

- Always set `--rpc-secret` on aria2 exposed beyond localhost
- Prefer HTTPS + reverse proxy over exposing port 6800 to the internet
- See [SECURITY.md](SECURITY.md)
