@echo off
echo [AIRSOFT] Stop PROD mode...
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod down
echo [AIRSOFT] Containers PROD stopped !
