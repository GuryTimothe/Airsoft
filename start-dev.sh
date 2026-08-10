#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "[AIRSOFT] Launch DEV mode..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build
