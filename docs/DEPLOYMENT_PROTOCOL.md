# Protocoles de Déploiement Continu et Intégration Continue
  
**Environnements**: Development (dev), Staging, Production (main)

---

## 1. Protocole d'Intégration Continue (CI)

### 1.1 Architecture Générale

```
Developer Push → GitHub Events → Workflows
                                    ├─ backend-ci.yml (PHP 8.4)
                                    ├─ frontend-ci.yml (Node 20)
                                    └─ Parallel Execution
                                           ↓
                                    [Pass] → [Release Automation]
                                    [Fail] → [Block Merge + Alert]
```

### 1.2 Flux d'Intégration

1. **Trigger** : Push sur branche (`**`) ou PR
2. **Jobs Parallèles** :
   - `backend-ci.yml` - Tests et linting PHP
   - `frontend-ci.yml` - Linting, tests, build Next.js
3. **Dépendance** : Release workflow s'exécute APRÈS backend + frontend (si main)
4. **Résultat** : ✓ Tous tests passent → Merge autorisé | ✗ Fail → PR bloquée

**Fichier config** : `.github/workflows/ci-cd.yml`

### 1.3 Backend CI Workflow

**Fichier** : `.github/workflows/backend-ci.yml`

#### Étapes (Sequence)

| Étape | Outil | Commande | Objectif | Résultat attendu |
|-------|-------|----------|----------|------------------|
| 1 | Setup PHP | shivammathur/setup-php@v2 | PHP 8.4 + extensions | PHP disponible |
| 2 | Composer Install | `composer install` | Dépendances | vendor/ populé |
| 3 | **PHP-CS-Fixer Check** | `composer fix:check` | Code style | 0 errors |
| 4 | **PHPStan Analyse** | `php ./vendor/bin/phpstan` | Analyse statique Level 5 | 0 errors |
| 5 | **PHPUnit Tests** | `php bin/console test` | Tests unitaires | 222 tests ✓, 469 assertions |
| 6 | **Coverage Report** | `--coverage-text` | Code coverage | 70.35% ✅ (cible 70%) |

**Seuils Minimums** :
- PHPStan: 0 errors (level 5 = strict)
- PHPUnit: 0 failures
- Code Coverage: 70.35% — cible 70% ✅

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
- Lines: 52.86% (434/821)
- Methods: 69.66% (124/178)
- Classes: 35.71% (10/28)

### 1.4 Frontend CI Workflow

**Fichier** : `.github/workflows/frontend-ci.yml`

#### Étapes (Sequence)

| Étape | Outil | Commande | Objectif | Résultat attendu |
|-------|-------|----------|----------|------------------|
| 1 | Setup Node | actions/setup-node@v4 | Node 20 | Node.js disponible |
| 2 | npm install | `npm install` | Dépendances | node_modules/ populé |
| 3 | **ESLint Check** | `npm run lint` | Linting TypeScript/React | 0 errors |
| 4 | **Prettier Format Check** | `npm run format:check` | Formatting | 0 unformatted files |
| 5 | **Jest Tests** | `npm test` | Tests unitaires | All tests ✓ |
| 6 | **TypeScript Compile** | `npm run build` | Build production | Build succeeds |

**Seuils Minimums** :
- ESLint: 0 errors
- Prettier: 100% formatted
- Jest: All tests pass
- TypeScript: No compilation errors

**Configuration** :
- Node version: `20`
- Package Manager: npm 10+
- Testing Framework: Jest
- Test Coverage: ≥ 70% (actuellement 70.62%)

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
- Coverage: 70.62% (global)
- Auth module: 60.37%

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

## 8. Timeline & Roadmap

### Phase 1: Développement (Complété ✓)

- ✓ Feature branches & PR reviews
- ✓ PHP + JavaScript CI/CD
- ✓ Unit tests (backend 52.86%, frontend 70.62%)
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
