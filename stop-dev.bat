@echo off
echo [AIRSOFT] Stop mode DEV...
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev down
echo [AIRSOFT] Containers DEV stopped !
