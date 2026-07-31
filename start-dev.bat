@echo off
echo [AIRSOFT] Launch DEV mode...
cd /d "%~dp0"
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up --build
