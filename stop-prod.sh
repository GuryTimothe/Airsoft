#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "[AIRSOFT] Stop PROD mode..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod down
echo "[AIRSOFT] Containers PROD stopped !"
