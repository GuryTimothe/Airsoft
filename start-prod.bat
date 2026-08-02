@echo off
echo [AIRSOFT] Launch PROD mode...
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build
echo [AIRSOFT] App started !