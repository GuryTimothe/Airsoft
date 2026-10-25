# Manuel de Mise à Jour et Migrations

## 1. Objectif

Ce document décrit la procédure officielle pour mettre à jour l'application (backend + frontend), appliquer les migrations de base de données et gérer un rollback en cas d'incident.
Il est aligné sur la configuration réelle du dépôt (GitHub Actions + Docker Compose).

## 2. Périmètre

Ce manuel couvre:
- la mise à jour locale (développement),
- la mise à jour en environnement de déploiement (staging/production),
- les migrations Doctrine,
- la gestion des breaking changes,
- le rollback technique.

## 3. Prérequis

Avant toute mise à jour:
- Avoir une branche `main` à jour.
- Utiliser Docker Desktop (ou Docker Engine) avec Docker Compose v2.
- Vérifier que les tests passent en local.
- Disposer d'un backup BDD récent pour les environnements partagés.

## 4. Mise à Jour Locale (Développement)

### 4.1 Synchroniser le code

```bash
git fetch origin
git checkout main
git pull origin main
```

### 4.2 Démarrer les services via Docker Compose (mode recommandé)

```bash
cd ..
docker compose up --build -d
```

### 4.3 Mettre à jour les dépendances dans les conteneurs

Backend:

```bash
docker compose exec backend composer install --prefer-dist
```

Frontend:

```bash
docker compose exec frontend npm install --prefer-exact
```

### 4.4 Appliquer les migrations

```bash
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

### 4.5 Vérifications locales

```bash
docker compose exec backend vendor/bin/phpunit

docker compose exec frontend npm run lint
docker compose exec frontend npm run format:check
docker compose exec frontend npm test --if-present
docker compose exec frontend npm run build
```

Vérification rapide:
- API accessible (exemple: `GET /api/games`)
- Frontend charge sans erreur
- Authentification fonctionnelle

## 5. Mise à Jour Staging/Production

### 5.1 Branches et environnements

- `dev`: cible staging (prévu dans `deploy.yml`)
- `main`: cible production

### 5.2 Pipeline actif dans le dépôt

Le workflow d'orchestration est `.github/workflows/ci-cd.yml` et se déclenche sur chaque push.

Ordre d'exécution effectif:
1. `frontend-ci.yml` (lint -> format check -> tests)
2. `backend-ci.yml` (php-cs-fixer check -> phpstan -> phpunit)
3. `security-scanner.yml`
4. `lighthouse.yml`
5. `pa11y.yml`
6. `release.yml` uniquement sur `main`

Important:
- Le job `deploy-prod` est actif dans `ci-cd.yml` et s'exécute sur `main` uniquement.
- Il n'existe pas d'environnement de staging automatisé à ce jour.

### 5.3 Workflow deploy

Le workflow `.github/workflows/deploy.yml` déclenche un déploiement Coolify via
son API, puis attend le statut final du déploiement.

Il s'exécute via `workflow_call` (ou `workflow_dispatch`), avec les secrets:
- `COOLIFY_URL`
- `COOLIFY_TOKEN`
- `COOLIFY_RESOURCE_UUID`

Voir [DEPLOYMENT_PROTOCOL.md](./DEPLOYMENT_PROTOCOL.md) section 2.5 pour la
configuration de la ressource Coolify et les variables d'environnement.

### 5.4 Migration en environnement de déploiement

Les migrations sont appliquées automatiquement par `backend/docker-entrypoint.sh`
au démarrage du conteneur, avec `--all-or-nothing`. Aucune action manuelle n'est
requise lors d'un déploiement Coolify.

Pour une exécution manuelle:

```bash
cd backend
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
```

## 6. Migrations Base de Données

### 6.1 Emplacement et outil

- Emplacement: `backend/migrations/`
- Outil: Doctrine Migrations

### 6.2 Créer une migration

```bash
docker compose exec backend php bin/console doctrine:migrations:diff
```

Convention fichier:
- `backend/migrations/VersionYYYYMMDDHHMMSS.php`

### 6.3 Valider la migration générée

Avant exécution:
- Lire le SQL généré.
- Vérifier les index, contraintes, valeurs par défaut.
- Vérifier qu'un `down()` est exploitable.

### 6.4 Appliquer la migration

```bash
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

Sous Docker Compose:

```bash
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
```

### 6.5 Validation post-migration

- Exécuter les tests backend.
- Vérifier les endpoints critiques.
- Vérifier les logs applicatifs.

## 7. Breaking Changes et Dépendances

Pour chaque mise à jour majeure:
- Lire les release notes des dépendances critiques.
- Évaluer les impacts API backend/frontend.
- Mettre à jour les tests de non-régression.
- Documenter les changements contractuels (payloads, statuts, champs).

Dépendances critiques à surveiller:
- Symfony
- PHP
- Node.js
- PostgreSQL
- API Platform

## 8. Procédure de Rollback

Le rollback doit être préparé avant le déploiement.

### 8.1 Option 1 (recommandée): Revert Git

```bash
git checkout main
git revert HEAD --no-edit
git push origin main
```

Puis redéployer via CI/CD.

### 8.2 Option 2: Revenir à un tag stable

```bash
git checkout v1.2.0
git push origin main --force-with-lease
```

À utiliser uniquement si un revert simple n'est pas possible.

### 8.3 Option 3: Rollback base de données (urgence)

```bash
pg_restore -d airsoft_prod /backups/airsoft_prod_latest.dump
```

Important:
- Opération à risque de perte de données.
- À utiliser uniquement si la migration est bloquante.
- Toujours coupler avec un rollback applicatif cohérent (code + schéma).

## 9. Checklist Avant/Après Mise à Jour

### 9.1 Avant

- [ ] Backup BDD effectué (`pg_dump -Fc`).
- [ ] Tests backend et frontend au vert.
- [ ] Notes de version lues (breaking changes identifiés).
- [ ] Plan de rollback valide.
- [ ] Validation staging planifiée.
- [ ] Vérification que les secrets `COOLIFY_*` sont présents dans GitHub.

### 9.2 Après

- [ ] Health check API OK.
- [ ] Frontend sans erreur bloquante.
- [ ] Authentification et autorisations OK.
- [ ] Logs sans pic d'erreurs.
- [ ] Fonctions critiques validées.
- [ ] Vérification des jobs GitHub Actions: frontend, backend, scanner, lighthouse, pa11y, release.
