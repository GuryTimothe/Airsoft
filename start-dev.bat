@echo off
echo [AIRSOFT] Launch DEV mode...
cd /d "%~dp0"
docker compose --env-file .env.dev up --build
