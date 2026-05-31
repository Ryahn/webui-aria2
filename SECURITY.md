# Security

## RPC authentication

- Never expose aria2 RPC to the public internet without `--rpc-secret` or `--rpc-user` / `--rpc-passwd`
- Do not embed secrets in frontend build artifacts; use Connection Settings or URL params over trusted networks only
- Prefer reverse-proxy authentication when exposing the WebUI externally

## Token storage

Connection tokens are stored in **browser localStorage** (`aria2conf:host:port`). Anyone with access to the browser profile can read them. Use HTTP auth or VPN for shared machines.

## XSS

Alert messages support limited HTML from RPC error strings. Avoid injecting untrusted content; prefer text where possible.

## Content Security Policy

When deploying behind nginx/Apache, consider CSP headers restricting script sources to your origin.

## Reporting vulnerabilities

Report security issues privately via GitHub Security Advisories on this repository.

## Changes from legacy app

- Removed writing `aria2conf` cookie on every RPC poll (reduced exposure window)
- Connection config scoped per host:port in localStorage
- Dropped IE11 and legacy polyfills
- Single-origin Docker deployment reduces mixed-content downgrade attacks
