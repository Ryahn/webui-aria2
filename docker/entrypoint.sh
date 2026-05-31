#!/bin/sh
set -e

ARIA2_DATA="${ARIA2_DATA_DIR:-/var/lib/aria2}"
SESSION="${ARIA2_DATA}/aria2.session"
CONF="${ARIA2_DATA}/aria2.conf"

mkdir -p "$ARIA2_DATA" /downloads

if [ ! -f "$SESSION" ]; then
  touch "$SESSION"
fi

if [ ! -f "$CONF" ]; then
  cat > "$CONF" << 'EOF'
# Persistent aria2 options (loaded on container start).
# Add global defaults here, one option per line, e.g.:
# max-concurrent-downloads=5
# seed-ratio=1.0
#
# Note: changes from the Web UI Global Settings modal apply at runtime.
# To make them permanent across rebuilds, add the same options in this file
# or use: docker exec -it <container> cat /var/lib/aria2/aria2.conf
EOF
fi

exec /usr/bin/supervisord -c /etc/supervisord.conf
