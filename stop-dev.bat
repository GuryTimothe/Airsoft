@echo off
echo [AIRSOFT] Stop mode DEV...
docker compose --env-file .env.dev down
echo [AIRSOFT] Containers DEV stopped !
