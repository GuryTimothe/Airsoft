# Protocoles de Déploiement Continu et Intégration Continue
  
**Environnements**: Development (dev), Staging, Production (main)

---

## 1. Protocole d'Intégration Continue (CI)

### 1.1 Architecture Générale

```
Developer Push → GitHub Events → ci-cd.yml
                                    ├─ backend-ci.yml (PHP 8.4)  ─┐
                                    ├─ frontend-ci.yml (Node 20)  ─┤ Parallèle
                                    │                               │
                                    │       ┌───────────────────────┘
                                    ├─ lighthouse.yml (needs: frontend)
                                    ├─ pa11y.yml (needs: lighthouse)
                                    └─ release.yml (needs: all, si main)
                                           ↓
                                    [Pass] → [Release Automation]
                                    [Fail] → [Block Merge + Alert]
```

### 1.2 Flux d'Intégration

1. **Trigger** : Push sur toutes branches (`**`)
2. **Jobs** :
   - `backend-ci.yml` + `frontend-ci.yml` — **Parallèle**
   - `lighthouse.yml` — **Après** frontend (needs: frontend)
   - `pa11y.yml` — **Après** lighthouse (needs: lighthouse)
   - `release.yml` — **Après tout** (si branche `main` uniquement)
3. **Résultat** : ✓ Tous tests passent → Release possible | ✗ Fail → Job bloqué

**Fichier config** : `.github/workflows/ci-cd.yml`

### 1.3 Backend CI Workflow

**Fichier** : `.github/workflows/backend-ci.yml`

#### Étapes (Sequence)

| Étape | Outil | Commande | Objectif | Résultat attendu |
|-------|-------|----------|----------|------------------|
| 1 | Setup PHP | shivammathur/setup-php@v2 | PHP 8.4 + extensions | PHP disponible |
| 2 | Composer Install | `composer install` | Dépendances | vendor/ populé |
| 3 | **PHP-CS-Fixer Check** | `composer fix:check` | Code style | 0 errors |
| 4 | **PHPStan Analyse** | `vendor/bin/phpstan analyse -c phpstan.neon.dist` | Analyse statique Level 5 | 0 errors |
| 5 | **PHPUnit Tests** | `vendor/bin/phpunit` | Tests unitaires | 269 tests ✓, 0 failures |

**Seuils Minimums** :
- PHPStan: 0 errors (level 5 = strict)
- PHPUnit: 0 failures

**Configuration** :
- PHP version: `8.4`
- Extensions: mbstring, intl, pdo, pdo_mysql
- Coverage format: HTML + text report
- Artifact: Coverage report (sauvegardé 30 jours)

#### Code Coverage

```bash
cd backend

# Rapport texte
php vendor/bin/phpunit --coverage-text

# Rapport HTML
php vendor/bin/phpunit --coverage-html coverage/
```

**Couverture Actuelle**:
- Lines: **71.73%** (cible 70% ✅)
- Methods: 85%
- Classes: 66.67%

### 1.4 Frontend CI Workflow

**Fichier** : `.github/workflows/frontend-ci.yml`

#### Étapes (Sequence)

| Étape | Outil | Commande | Objectif | Résultat attendu |
|-------|-------|----------|----------|------------------|
| 1 | Setup Node | actions/setup-node@v4 | Node 20 | Node.js disponible |
| 2 | npm install | `npm install` | Dépendances | node_modules/ populé |
| 3 | **ESLint Check** | `npm run lint` | Linting TypeScript/React | 0 errors |
| 4 | **Prettier Format Check** | `npm run format:check` | Formatting | 0 unformatted files |
| 5 | **Jest Tests** | `npm test` | Tests unitaires | 227 tests ✓, 0 failures |

**Seuils Minimums** :
- ESLint: 0 errors
- Prettier: 100% formatted
- Jest: All tests pass

**Configuration** :
- Node version: `20`
- Package Manager: npm 10+
- Testing Framework: Jest
- Test Coverage: ≥ 70% (actuellement **78.73%** ✅)

#### Test Coverage

```bash
cd frontend

# Rapport couverture
npm test -- --coverage

# Format check
npm run format:check

# Linting
npm run lint
```

**Couverture Actuelle**:
- Coverage: **78.73%** (global, 227 tests)

### 1.5 Conditions de Validation

**Pass Criteria** (tous doivent être ✓):
- ✓ PHP-CS-Fixer: 0 errors
- ✓ PHPStan Level 5: 0 errors
- ✓ PHPUnit: 133/133 tests pass
- ✓ ESLint: 0 errors
- ✓ Prettier: Formatted
- ✓ Jest: All pass
- ✓ TypeScript: Compiles

**Fail Criteria** (au moins 1 = ✗):
- ✗ Code style errors
- ✗ Type errors
- ✗ Test failures
- ✗ Build fails

**Actions if Fail**:
- PR comment: "CI check failed. See details..."
- Merge blocker: "Required status checks did not pass"
- Email notification: Configuré dans GitHub

---

## 2. Protocole de Déploiement Continu (CD)

### 2.1 Versioning & Release Automation

**Tool**: `release-please` (Google)  
**Trigger**: Merge vers `main` branch après CI success

```
Feature Branches
    ↓ (feat:, fix:, chore: commits)
    ↓
PR → Code Review → Approved
    ↓ (CI passes)
Merge → main
    ↓
release-please workflow triggers
    ↓
├─ Parse commits (Conventional Commits)
├─ Calculate version bump (semantic versioning)
├─ Generate CHANGELOG.md
├─ Create Release PR
├─ Await approval/merge
└─ Create Git Tag (v1.0.0, etc)
```

**Configuration** : `.release-pleaserc.json`

#### Conventional Commits (Format Requis)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types** (Sémantique):
- `feat:` → Minor version bump (1.0.0 → 1.1.0)
- `fix:` → Patch version bump (1.0.0 → 1.0.1)
- `chore:` → No bump
- `refactor:` → No bump
- `docs:` → No bump
- `BREAKING CHANGE:` → Major version bump (1.0.0 → 2.0.0)

**Exemples**:
```
feat: ajouter export en Excel format

fix: corriger validation email regex

docs: mettre à jour API reference

BREAKING CHANGE: supprimer endpoint v1/users (utiliser /api/users)
```

#### Version Strategy

- **Format**: Semantic Versioning (MAJOR.MINOR.PATCH)
- **Initial**: v1.0.0
- **Example sequence**: v1.0.0 → v1.0.1 → v1.1.0 → v2.0.0

**Fichier config**:
```json
{
  "packages": {
    "backend": {
      "bump-minor-pre-major": true
    },
    "frontend": {
      "bump-minor-pre-major": true
    }
  }
}
```

**Fichiers impactés par version**:
- Backend: `backend/composer.json` (`version` field)
- Frontend: `frontend/package.json` (`version` field)
- Root: `package.json` (`version` field)
- Generated: `CHANGELOG.md`

### 2.2 Release Workflow

**Fichier** : `.github/workflows/release.yml`

#### Conditions Execution

- Only on: `main` branch
- Only on: `push` events (not PR)
- Requires: Backend CI success
- Requires: Frontend CI success

#### Étapes (Sequence)

| Étape | Action | Détail | Output |
|-------|--------|--------|--------|
| 1 | Checkout | Récupère code | Main branch |
| 2 | release-please | Parse commits, bump version | Release PR OR version tag |
| 3 | Prettier Format | Formate CHANGELOG.md | Commit si changements |
| 4 | Create Tag | Git tag (v1.x.y) | Tag créé + pushed |
| 5 | Publish Release | GitHub Release created | Release notes |

#### Output Release

```
Release v1.2.0
─────────────────

## [1.2.0] - 2026-07-10

### Added
- feat: export users en Excel

### Fixed
- fix: validation email regex
- fix: redirect after login

### Changed
- docs: updated API reference

[Compare](https://github.com/org/Airsoft/compare/v1.1.0...v1.2.0)
```

### 2.3 Déploiement Environnements

**Status**: Partiellement implémenté (workflows commentés)

#### 2.3.1 Development (Branche `dev`)

**Trigger**: Merge PR vers `dev`

```yaml
# À implémenter
- Build backend container
- Build frontend container  
- Deploy à: dev.airsoft.local
- Run migrations
- Run tests
- Notification Slack: "Deployed to dev"
```

**Checklist Avant Merge**:
- ✓ CI/CD passes
- ✓ Code review approved
- ✓ Commits sont conventionnels

#### 2.3.2 Staging (Branche `staging`)

**Trigger**: Manual trigger ou merge depuis `dev`

```yaml
# À implémenter
- Build containers (docker-compose)
- Push à registry (Docker Hub / GitHub Container Registry)
- Deploy à: staging.airsoft.example.com
- Run DB migrations
- Load test data
- Run smoke tests
- Performance benchmarks
- Notification: "Staged version v1.x.y ready for testing"
```

**Durée Moyenne**: 5-10 minutes

#### 2.3.3 Production (Branche `main`)

**Trigger**: Manual approval après staging tests

```yaml
# À implémenter
- Backup current DB
- Deploy containers (blue-green deployment)
- Run migrations (with rollback plan)
- Health checks
- Smoke tests
- Notification: "Production v1.x.y deployed"
- Rollback available: git revert + redeploy
```

**Checklist Production**:
- ✓ All tests pass
- ✓ Staging approved
- ✓ Release notes reviewed
- ✓ Backup confirmed
- ✓ Maintenance window (if needed)

### 2.4 Déploiement Infrastructure (À Implémenter)

#### Docker Setup

```yaml
# backend/Dockerfile (À créer)
FROM php:8.4-fpm-alpine
RUN apk add --no-cache postgresql-client
COPY . /var/www
WORKDIR /var/www
RUN composer install --no-dev
EXPOSE 9000

# frontend/Dockerfile (À créer)
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:20-alpine
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
```

#### Docker Compose Production

```yaml
# docker-compose.prod.yml (À créer)
version: '3.8'
services:
  api:
    image: airsoft-api:v1.2.0
    environment:
      APP_ENV: prod
      DATABASE_URL: postgresql://...
    restart: always
    
  web:
    image: airsoft-web:v1.2.0
    environment:
      NEXT_PUBLIC_API_URL: https://api.example.com
    restart: always
    
  database:
    image: postgres:16-alpine
    volumes:
      - db-data:/var/lib/postgresql/data
    restart: always
```

### 2.5 Monitoring & Rollback

#### Monitoring Post-Deploy

- [ ] Health check: `GET /api/health` (À implémenter)
- [ ] Error tracking: (À configurer)
- [ ] Performance: Lighthouse CI
- [ ] Uptime monitoring: (À configurer)

#### Rollback Procedure

```bash
# Option 1: Git revert
git checkout main
git revert v1.2.0
git push origin main
# → CI/CD re-executes, deploys previous version

# Option 2: Manual docker
docker pull airsoft-api:v1.1.0
docker-compose down && docker-compose up -d
```

**Time to Rollback**: < 5 minutes

---

## 3. Environnement de Développement

### 3.1 Setup Local Dev

#### Prérequis

| Outil | Version | Installation |
|-------|---------|--------------|
| Git | 2.30+ | https://git-scm.com |
| PHP | 8.4.22 | https://www.php.net (Windows) |
| Composer | 2.5+ | https://getcomposer.org |
| Node.js | 20+ | https://nodejs.org |
| PostgreSQL | 13+ | Localhost ou Docker |

#### Installation Rapide

```bash
# 1. Clone
git clone https://github.com/org/Airsoft.git
cd Airsoft

# 2. Backend Setup
cd backend
composer install
cp .env .env.local
# Edit .env.local: DATABASE_URL=postgresql://app:!ChangeMe!@localhost:5432/airsoft_dev

php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
symfony serve -d  # Démarre http://localhost:8000

# 3. Frontend Setup  
cd ../frontend
npm install
npm run dev  # http://localhost:3000
```

#### IDE Recommandé: VS Code

**Extensions Essentielles**:
- PHP Intelephense (bmewburn.vscode-intelephense-client)
- Volar (Vue Language Features)
- ESLint (dbaeumer.vscode-eslint)
- Prettier - Code formatter
- Thunder Client or REST Client

### 3.2 Compilateurs & Outils

| Outil | Rôle | Commande |
|-------|------|----------|
| **PHP 8.4** | Compilateur/Runtime backend | `php -v` |
| **Composer** | Package manager PHP | `composer --version` |
| **Symfony CLI** | Dev server + commands | `symfony server:start` |
| **npm** | Package manager JS | `npm -v` |
| **webpack** | Bundler (via Next.js) | `npm run build` |
| **Docker** | Containerization | `docker --version` |
| **PostgreSQL** | Database | `psql --version` |

### 3.3 Serveurs d'Application

| Serveur | Rôle | Dev Port | Prod |
|---------|------|----------|------|
| **Symfony dev** | API backend | 8000 | Reverse proxy (Nginx) |
| **Next.js dev** | Frontend | 3000 | Node server / Vercel |
| **PostgreSQL** | Database | 5432 | RDS / Managed |

---

## 4. Critères Qualité & Performance

### 4.1 Seuils Requis (Pass/Fail)

| Critère | Seuil | Composant | Check |
|---------|-------|-----------|-------|
| **Code Coverage** | ≥ 50% | Backend (PHPUnit) | CI/CD (badge) |
| **Frontend Coverage** | ≥ 70% | Frontend (Jest) | CI/CD (badge) |
| **Linting Errors** | 0 | PHP + JS | CI/CD |
| **Type Errors** | 0 | PHPStan + TypeScript | CI/CD |
| **Performance Score** | ≥ 80 | Lighthouse | CI/CD (lighthouse.yml) |
| **Accessibility Score** | ≥ 90 | WCAG 2.1 AA | CI/CD (lighthouse.yml) |
| **Uptime** | ≥ 99% | Production | Monitoring (À configurer) |
| **Response Time** | ≤ 500ms | API endpoints | Load testing |

### 4.2 Performance Budgets

```yaml
# lighthouse.config.js
budgets:
  performance: 80
  accessibility: 90
  best-practices: 85
  seo: 80
  core-web-vitals:
    FCP: 2.5s
    LCP: 4s
    CLS: 0.1
```

### 4.3 Build & Test Artifacts

**Backend**:
- Artifact: `coverage/` (HTML report)
- Retention: 30 days
- Size: ~5MB

**Frontend**:
- Artifact: `.next/` (built app)
- Artifact: `coverage/` (test report)
- Retention: 30 days

---

## 5. Monitoring & Alertes

### 5.1 GitHub Actions Notifications

- **Workflow failures**: Email to repo owner
- **Required status checks**: PR comment with error details
- **Release published**: GitHub Releases page + Email

### 5.2 Production Monitoring (À Configurer)

- [ ] Error tracking (Sentry)
- [ ] Performance APM (DataDog / New Relic)
- [ ] Uptime monitoring (StatusPage)
- [ ] Log aggregation (ELK / Datadog)
- [ ] Slack alerts for critical errors

---

## 6. Checklist Avant Production

### Pre-Deploy

- [ ] All tests pass locally & in CI/CD
- [ ] Code reviewed & approved
- [ ] Release notes written
- [ ] Database migrations tested
- [ ] Staging environment verified
- [ ] HTTPS certificates valid
- [ ] Secrets in `.env` (not in git)
- [ ] CORS origins configured
- [ ] Rate limiting configured
- [ ] Logging configured

### Post-Deploy

- [ ] Health check passes
- [ ] No error spike in monitoring
- [ ] Performance metrics normal
- [ ] Users reporting no issues
- [ ] Documentation updated
- [ ] Release notes published

---

## 7. Support & Troubleshooting

### Local Dev Issues

**Composer timeout**:
```bash
composer config -g process-timeout 2000
```

**PHP extensions missing**:
```bash
php -m | grep pdo  # Check extensions
php.ini: extension=pdo_pgsql
```

**PostgreSQL connection error**:
```bash
psql -U app -d airsoft_dev -h localhost  # Test connection
```

### CI/CD Debug

**View GitHub Actions logs**:
1. Go to: Repo → Actions → Workflow → Run
2. Expand failed step
3. Check "Run" command output

**Re-run workflows**:
```bash
# Push empty commit
git commit --allow-empty -m "chore: re-run ci"
git push origin branch-name
```

### Production Rollback

```bash
# Quick rollback to previous release
git log --oneline --all | head -5
git tag -l v*

# Revert to v1.1.0
git checkout v1.1.0
git push origin main --force-with-lease

# OR use docker
docker pull airsoft-api:v1.1.0
docker-compose pull && docker-compose up -d
```

---

## 8. Manuel d'Upgrade et Migrations (C2.4.1)

### 8.1 Processus de Mise à Jour

#### Mise à Jour Locale (Développement)

**Prérequis** : Application arrêtée, branche `main` à jour

```bash
# 1. Récupérer les derniers changements
git fetch origin
git checkout main
git pull origin main

# 2. Mettre à jour dépendances
cd backend
composer install --prefer-dist  # Production-ready lockfile
php bin/console doctrine:migrations:migrate

cd ../frontend
npm install --prefer-exact  # Exact versions
npm run build  # Vérifier build compile

# 3. Redémarrer l'application
cd ../backend
symfony serve -d
cd ../frontend
npm run dev

# 4. Vérifier fonctionnalité
curl http://localhost:8000/api/games  # Backend OK?
open http://localhost:3000             # Frontend accessible?
```

#### Mise à Jour Production (Déploiement)

**Processus** : Décrit en section 2 (CI/CD automated)

```
1. Merge PR vers main → GitHub Actions déclenche
2. Tests backend + frontend run
3. Build containers (si Docker configuré)
4. Deploy automatic (si workflow configuré)
5. Health checks
6. Monitoring alertes (si non-blocking)
```

### 8.2 Migrations Base de Données

**Localisation** : `backend/migrations/`

**Framework** : Doctrine Migrations

#### Structure Migration

```php
// backend/migrations/Version20260713000000.php
namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260713000000 extends AbstractMigration {
    public function getDescription(): string {
        return 'Add status column to games table';
    }

    public function up(Schema $schema): void {
        $this->addSql('ALTER TABLE game ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT \'pending\'');
    }

    public function down(Schema $schema): void {
        $this->addSql('ALTER TABLE game DROP COLUMN status');
    }
}
```

#### Générer Nouvelle Migration

```bash
cd backend

# 1. Modifier une Entity (ex: src/Entity/Game.php)
# Ajouter propriété: private string $status = 'pending';

# 2. Générer migration automatiquement
php bin/console doctrine:migrations:diff

# 3. Migration créée : backend/migrations/VersionXXX.php

# 4. Vérifier avant appliquer
cat migrations/VersionXXX.php  # Revue SQL généré

# 5. Appliquer (dev local)
php bin/console doctrine:migrations:migrate

# 6. Tester l'appli
php bin/console test  # Tests doivent passer

# 7. Commit migration
git add migrations/
git commit -m "migration(db): add status column to games"
```

#### Appliquer en Production

```bash
# Exécuté automatiquement par deploy workflow (À configurer)
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration

# OU manuel
ssh prod-server
cd /app
php bin/console doctrine:migrations:migrate
# Rollback si needed:
# php bin/console doctrine:migrations:migrate --first Version20260713000000
```

### 8.3 Breaking Changes & Dépendances

#### Dépendances Critiques

| Package | Changement Mineur | Changement Majeur | Action |
|---------|------------------|------------------|--------|
| **Symfony** | 7.4.x | 8.0.0 | PR required, test intensif |
| **PHP** | 8.4.x | 9.0 | Maj PHP-FPM + code review |
| **Node.js** | 20.x | 22.x | Vérifier compat packages |
| **PostgreSQL** | 16.x | 17.0 | Dump/restore + testing |
| **API Platform** | 4.3.x | 5.0.0 | API peut changer, tester |

#### Frontend Breaking Changes (API)

```typescript
// Vérifier dans src/lib/api-client.ts si API endpoints changent
// Exemple breaking change:
// OLD: GET /api/games  (retourne array)
// NEW: GET /api/games  (retourne {data: array, total: number})

// Fix: Ajuster lib/api-client.ts + tests + composants
```

#### Backend Breaking Changes (API)

```php
// Vérifier dans docs/API_REFERENCE.md si endpoints changent
// Exemple breaking change:
// OLD: POST /api/login (retourne token)
// NEW: POST /api/login (retourne {token, user})

// Teste: PHPUnit tests doivent fail et à updater
```

### 8.4 Rollback Procedure

**Scénario** : Upgrade déploié mais erreur détectée → Rollback

#### Option 1: Git Revert (Recommandé)

```bash
# Production server
ssh prod-server
cd /app

# Voir commits récents
git log --oneline -5

# Revert le dernier commit
git revert HEAD --no-edit

# Redémarrer app
docker-compose down && docker-compose up -d
# OU
php bin/console cache:clear
symfony serve -d

# Vérifier
curl http://prod.airsoft.com/api/health
```

#### Option 2: Tag Checkout (Fallback)

```bash
# Si Git revert complexe
git checkout v1.2.0  # Retour à version précédente
git push origin main --force-with-lease

# Redéployer
# CI/CD re-triggers automatiquement
```

#### Option 3: Database Rollback (Si migration cassée)

```bash
# EMERGENCY ONLY - Data risk!

# Restaurer backup pré-migration
pg_restore -d airsoft_prod /backups/airsoft_prod_20260713_0800.dump

# Revert code en même temps
git checkout v1.2.0
```

### 8.5 Checklist Avant/Après Upgrade

**Avant Upgrade** :
- [ ] Backup database complète: `pg_dump -Fc airsoft_prod > backup.dump`
- [ ] Tous tests passent localement
- [ ] Release notes lues (breaking changes?)
- [ ] Dépendances critiques vérifiées (Symfony, PHP version)
- [ ] Staging testé avec nouvelle version
- [ ] Rollback plan documenté
- [ ] Slack notification: "Upgrade en cours..."

**Après Upgrade** :
- [ ] Health check: API responds correctly
- [ ] UI loads without errors
- [ ] Authentification fonctionne (JWT token OK)
- [ ] Database queries performantes
- [ ] Logs (var/log) pas d'erreurs
- [ ] Monitoring: No error spike
- [ ] Features critiques testées (game registration, login, etc.)
- [ ] Slack notification: "Upgrade completed"

### 8.6 Versions Actuelles & Support

| Composant | Version | Release | EOL | Status |
|-----------|---------|---------|-----|--------|
| **PHP** | 8.4.22 | Nov 2024 | Nov 2026 | ✓ Active |
| **Symfony** | 7.4.0 | Nov 2024 | Nov 2027 | ✓ LTS |
| **Node.js** | 20.x | Apr 2023 | Apr 2025 | ✓ Active |
| **Next.js** | 16.2.6 | Jan 2025 | Ongoing | ✓ Latest |
| **PostgreSQL** | 16 | Oct 2023 | Oct 2028 | ✓ Supported |

---

## 9. Timeline & Roadmap

### Phase 1: Développement (Complété ✓)

- ✓ Feature branches & PR reviews
- ✓ PHP + JavaScript CI/CD
- ✓ Unit tests (backend 71.73% / 269 tests, frontend 78.73% / 227 tests)
- ✓ Code analysis (PHPStan, ESLint)
- ✓ Release automation (release-please)

### Phase 2: Déploiement (À faire)

- [ ] Docker containerization
- [ ] Deploy workflow (dev → staging → prod)
- [ ] Health checks
- [ ] Blue-green deployments
- [ ] Database migration strategy

### Phase 3: Monitoring (À faire)

- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Alerting system
- [ ] Dashboards

### Phase 4: Security (Partiellement fait)

- ✓ JWT authentication
- ✓ RBAC (4 roles)
- ✓ SQL injection prevention (ORM)
- [ ] Rate limiting
- [ ] CSRF tokens
- [ ] Security headers
- [ ] Dependency scanning

---

## 9. Support & Ressources

**Documentation**:
- API: [docs/API_REFERENCE.md](./API_REFERENCE.md)
- Architecture: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- Environment: [docs/ENVIRONMENT.md](./ENVIRONMENT.md)
- Tests: [docs/TEST_RECIPES.md](./TEST_RECIPES.md)

**GitHub Actions**:
- Workflows: `.github/workflows/*.yml`
- Config: `.release-pleaserc.json`, `lighthouse.config.js`

**External**:
- Conventional Commits: https://www.conventionalcommits.org
- Semantic Versioning: https://semver.org
- GitHub Actions: https://docs.github.com/en/actions
