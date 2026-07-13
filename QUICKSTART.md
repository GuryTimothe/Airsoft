# Quick Start Guide - Pour Commencer Rapidement

Cette page vous guide rapidement à travers les étapes essentielles pour démarrer avec Airsoft.

---

## ✅ Prérequis

| Outil | Version minimale | Installation |
|-------|-----------------|-------------|
| **PHP** | 8.4+ | https://www.php.net/downloads |
| **Composer** | 2.5+ | https://getcomposer.org |
| **PostgreSQL** | 13+ | https://www.postgresql.org/download/ |
| **Node.js** | 18+ | https://nodejs.org |
| **Symfony CLI** | Latest | https://symfony.com/download |
| **Git** | 2.30+ | https://git-scm.com |

---

## 🚀 Démarrage en 5 Minutes

### Backend API

```bash
cd backend

# 1. Installer les dépendances
composer install

# 2. Configurer la BD
cp .env .env.local
```

Ouvrir `.env.local` et adapter la ligne `DATABASE_URL` :

```
# Format PostgreSQL
DATABASE_URL="postgresql://UTILISATEUR:MOT_DE_PASSE@127.0.0.1:5432/airsoft?serverVersion=16&charset=utf8"

# Exemple
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/airsoft?serverVersion=16&charset=utf8"
```

```bash
# 3. Créer/migrer la BD
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate

# 4. Lancer le serveur
symfony serve -d
# ✓ API disponible: http://localhost:8000/api
```

### Frontend Web

```bash
cd frontend

# 1. Installer les dépendances
npm install

# 2. Lancer en mode dev
npm run dev
# ✓ App disponible: http://localhost:3000
```

### Test l'App

1. Ouvrir `http://localhost:3000` dans le navigateur
2. Cliquer "S'inscrire"
3. Remplir le formulaire
4. Se loguer et tester les fonctionnalités

---

## 📚 Documentation

**Pour chaque besoin, consultez**:

| Besoin | Fichier | Temps lecture |
|--------|---------|---------------|
| **API endpoints** (GET, POST, etc.) | [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) | 15 min |
| **Architecture & tech stack** | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 10 min |
| **Setup développement complet** | [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) | 10 min |
| **CI/CD & déploiement** | [docs/DEPLOYMENT_PROTOCOL.md](./docs/DEPLOYMENT_PROTOCOL.md) | 20 min |
| **Sécurité OWASP** | [docs/SECURITY_OWASP.md](./docs/SECURITY_OWASP.md) | 15 min |
| **Cas de test (84 tests)** | [docs/TEST_RECIPES.md](./docs/TEST_RECIPES.md) | 20 min |
| **Accessibilité & Performance** | [docs/ACCESSIBILITY_PERFORMANCE.md](./docs/ACCESSIBILITY_PERFORMANCE.md) | 10 min |

---

## 🧪 Tests

### Backend

```bash
cd backend

# Tous les tests
php vendor/bin/phpunit

# Avec couverture
php vendor/bin/phpunit --coverage-text

# Analyse statique
php vendor/bin/phpstan analyse src/ --level 5
```

**Résultat actuel**: 52.86% couverture (434/821 lignes)

### Frontend

```bash
cd frontend

# Tous les tests
npm test

# Avec couverture
npm test -- --coverage

# Linting
npm run lint

# Formatting
npm run format:check
```

**Résultat actuel**: 70.62% couverture

---

## 🔑 Identifiants de Test

```
Email: test@example.com
Password: TestPassword123

Roles:
- USER: utilisateur standard
- ORGANIZER: peut créer parties
- ADMIN: gestion complète
- SUPER_ADMIN: gestion des rôles
```

*Note: Créer des comptes de test via formulaire d'inscription.*


## 🛠️ Commandes Utiles

### Backend

```bash
# Console Symfony
php bin/console list

# Nouvelles migrations
php bin/console make:migration

# Reset complet (⚠️ destructif!)
php bin/console doctrine:database:drop --force
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

### Frontend

```bash
# Build production
npm run build

# Linter fix automatique
npm run lint:fix

# Format code
npm run format

# Tests en mode watch
npm run test:watch
```

---

## 🐛 Troubleshooting

### "Connection refused" PostgreSQL

```bash
# Option 1: Lancer avec Docker
cd backend && docker compose up -d database

# Option 2: Installer PostgreSQL localement
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
```

### "CORS error" depuis frontend

Vérifier dans `config/packages/nelmio_cors.yaml`:
```yaml
allow_origin: ['http://localhost:3000']
```

### Les tests échouent

```bash
# Réinstaller les dépendances
composer install --no-cache
npm ci

# Vérifier la BD de test
php bin/console doctrine:database:drop --force --env=test
php bin/console doctrine:database:create --env=test
php bin/console doctrine:migrations:migrate --env=test
```

---

## 📖 Fichiers Clés

```
Airsoft/
├── readme.md (cette page)
├── docs/
│   ├── API_REFERENCE.md          👈 Endpoints API
│   ├── TEST_RECIPES.md           👈 Test cases
│   ├── DEPLOYMENT_PROTOCOL.md    👈 CI/CD setup
│   ├── SECURITY_OWASP.md         👈 Sécurité
│   ├── MISSING_FEATURES_REPORT.md 👈 Lacunes
│   ├── ENVIRONMENT.md            👈 Setup dev
│   ├── ARCHITECTURE.md           👈 Tech stack
│   └── ACCESSIBILITY_PERFORMANCE.md 👈 Perf
├── backend/
│   ├── src/                      API code
│   ├── tests/                    Tests PHP
│   ├── config/                   Configuration
│   └── migrations/               Migrations BD
├── frontend/
│   ├── src/                      React code
│   ├── tests/                    Tests Jest
│   └── public/                   Static files
└── .github/workflows/            CI/CD pipelines
```

---

## 🚀 Prochaines Étapes

### Pour Développeurs

1. Lire [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) pour comprendre la structure
2. Faire un test: créer une nouvelle feature dans une branche
3. Soumettre PR avec tests
4. Regarder les tests CI/CD passer

### Pour QA / Testeurs

1. Lire [docs/TEST_RECIPES.md](./docs/TEST_RECIPES.md)
2. Exécuter les 84 test cases manuellement
3. Documenter les résultats
4. Signaler les bugs trouvés

### Pour DevOps / Deployment

1. Lire [docs/DEPLOYMENT_PROTOCOL.md](./docs/DEPLOYMENT_PROTOCOL.md)
2. Configurer les environnements (dev/staging/prod)
3. Mettre en place monitoring
4. Tester les rollbacks

### Pour Project Manager

1. Lire [docs/MISSING_FEATURES_REPORT.md](./docs/MISSING_FEATURES_REPORT.md)
2. Prioriser les lacunes
3. Planifier sprints
4. Assigner les tâches

---

## ❓ FAQ

**Q: Comment créer un utilisateur ADMIN?**
```bash
# Après inscription normal (ROLE_USER par défaut)
# Se loguer en SUPER_ADMIN et edit l'utilisateur
# Ou en base directement:
psql -U app -d airsoft_dev
UPDATE "users" SET role='ROLE_ADMIN' WHERE id=1;
```

**Q: Où sont les logs?**
```bash
# Backend
tail -f backend/var/log/dev.log

# Frontend
# Console du navigateur (F12)
```

**Q: Comment reset la BD de test?**
```bash
php bin/console doctrine:database:drop --force --env=test
php bin/console doctrine:database:create --env=test
php bin/console doctrine:migrations:migrate --env=test
```

**Q: Puis-je déployer sur Heroku/AWS?**
Voir [docs/DEPLOYMENT_PROTOCOL.md](./docs/DEPLOYMENT_PROTOCOL.md) section "À Implémenter".