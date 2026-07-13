# Environnement de Développement

## Prérequis Minimums

### Système d'Exploitation
- **Windows 10+** / **macOS 11+** / **Linux (Ubuntu 20.04+)**
- Minimum 8 GB RAM
- Minimum 10 GB espace disque

### Versions Requises

| Outil | Version Minimale | Testée | Installation |
|-------|-----------------|--------|--------------|
| **Git** | 2.30+ | 2.40+ | https://git-scm.com |
| **PHP** | 8.4+ | 8.4+ | https://www.php.net |
| **Composer** | 2.5+ | 2.6+ | https://getcomposer.org |
| **Node.js** | 18.0+ | 20.0+ | https://nodejs.org |
| **npm** | 9.0+ | 10.0+ | Livré avec Node.js |
| **PostgreSQL** | 13+ | 16-alpine | https://www.postgresql.org |

## Installation Locale

### 1. Cloner le Repository

```bash
git clone https://github.com/ton-org/Airsoft.git
cd Airsoft
```

### 2. Backend (Symfony)

#### Option A : Installation Locale (Recommandé)

```bash
cd backend

# Installer dépendances PHP
composer install

# Créer fichier configuration local
cp .env .env.local

# Configuration .env.local (adapter les valeurs)
DATABASE_URL="postgresql://app:!ChangeMe!@localhost:5432/airsoft_dev"

# Créer base de données
php bin/console doctrine:database:create

# Exécuter migrations
php bin/console doctrine:migrations:migrate

# Charger données de test (optionnel)
php bin/console doctrine:fixtures:load

# Lancer serveur de développement
symfony serve
# ou: php -S localhost:8000 -t public/
```

L'API sera accessible sur `http://localhost:8000/api`

#### Option B : PostgreSQL avec compose.yaml (optionnel)

```bash
cd backend

# Lancer PostgreSQL en Docker
docker compose up -d database

# Attendre que PostgreSQL soit prêt (~5s)
sleep 5

# Puis exécuter les étapes ci-dessus
```

### 3. Frontend (Next.js)

```bash
cd frontend

# Installer dépendances
npm install

# Configuration variables d'environnement
cp .env.local.example .env.local  # Si existe
# Ou créer .env.local avec:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Lancer serveur de développement
npm run dev
```

L'app sera accessible sur `http://localhost:3000`

## Éditeur de Code Recommandé

### VS Code
- **Télécharger** : https://code.visualstudio.com
- **Extensions essentielles** :
  - **PHP Intelephense** (bmewburn.vscode-intelephense-client) - PHP intellisense
  - **Volar** (Vue.volar) - TypeScript/React support
  - **ESLint** (dbaeumer.vscode-eslint) - Linting frontend
  - **Prettier** (esbenp.prettier-vscode) - Code formatting
  - **GitLens** (eamodio.gitlens) - Git history
  - **Docker** (ms-azuretools.vscode-docker) - Docker support

### Installation Extensions
```bash
code --install-extension bmewburn.vscode-intelephense-client
code --install-extension Vue.volar
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension eamodio.gitlens
code --install-extension ms-azuretools.vscode-docker
```

## Structure Locale

```
Airsoft/
├── backend/                      # API Symfony
│   ├── .env                      # Configuration (ne pas versionner)
│   ├── .env.local                # Config locale (créer)
│   ├── compose.yaml              # PostgreSQL (optionnel)
│   ├── composer.json             # Dépendances PHP
│   ├── phpunit.dist.xml          # Configuration tests
│   ├── phpstan.neon.dist         # Analyse statique
│   ├── bin/console               # CLI Symfony
│   ├── src/                      # Code source PHP
│   ├── tests/                    # Tests PHPUnit
│   ├── config/                   # Configuration Symfony
│   ├── migrations/               # Migrations BD
│   ├── public/                   # Point d'entrée (index.php)
│   └── vendor/                   # Dépendances (généré)
│
├── frontend/                     # App Next.js
│   ├── .env.local                # Config locale (créer)
│   ├── package.json              # Dépendances npm
│   ├── next.config.ts            # Configuration Next.js
│   ├── jest.config.js            # Configuration Jest
│   ├── tsconfig.json             # Configuration TypeScript
│   ├── src/                      # Code source TypeScript/React
│   ├── .next/                    # Build Next.js (généré)
│   └── node_modules/             # Dépendances (généré)
│
└── .github/
    └── workflows/                # GitHub Actions CI/CD
```

## Commandes Utiles au Démarrage

### Backend

```bash
cd backend

# Vérifier PHP
php -v

# Vérifier Composer
composer --version

# Installer dépendances
composer install

# Analyse statique (PHPStan)
php ./vendor/bin/phpstan analyse src/

# Lancer les tests
php bin/console test
# ou: php ./vendor/bin/phpunit

# Voir les routes API
php bin/console debug:router

# Vérifier configuration
php bin/console debug:config
```

### Frontend

```bash
cd frontend

# Vérifier Node.js et npm
node -v
npm -v

# Linter et vérifier types
npm run lint

# Formater le code
npm run format

# Lancer les tests Jest
npm test
npm run test:watch

# Build production
npm run build
npm start
```

## Variables d'Environnement Clés

### Backend (.env.local)

```env
APP_ENV=dev
APP_DEBUG=1

# Base de données
DATABASE_URL="postgresql://app:password@localhost:5432/airsoft_dev"

# JWT (fichiers dans backend/config/jwt/)
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem

# CORS
CORS_ALLOW_ORIGIN=http://localhost:3000

# Redis (optionnel, pour cache)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Checklist Démarrage Complet

- [ ] Git cloned (`git clone ...`)
- [ ] PHP >= 8.4 installé (`php -v`)
- [ ] Composer installé (`composer --version`)
- [ ] Node.js >= 18.0 installé (`node -v`)
- [ ] npm >= 9.0 installé (`npm -v`)
- [ ] Backend dependencies installées (`composer install`)
- [ ] Backend .env.local créé et configuré
- [ ] BD créée (`php bin/console doctrine:database:create`)
- [ ] Migrations appliquées (`php bin/console doctrine:migrations:migrate`)
- [ ] Backend accessible `http://localhost:8000/api` (check: `php bin/console debug:router`)
- [ ] Frontend dependencies installées (`npm install`)
- [ ] Frontend .env.local créé (optionnel)
- [ ] Frontend accessible `http://localhost:3000`
- [ ] VS Code + extensions installées

## Dépannage

### "PHP version incorrecte"
```bash
php -v
# Résult doit être >= 8.4
# Installer depuis https://www.php.net
```

### "Composer install échoué"
```bash
composer self-update
composer install --no-cache --verbose
```

### "Base de données non trouvée"
```bash
# Vérifier PostgreSQL tourne
# Windows: postgresql://app:password@localhost:5432/airsoft_dev
# Créer:
php bin/console doctrine:database:create

# Ou avec Docker:
docker compose up -d database
```

### "Migrations échouées"
```bash
# Voir statut
php bin/console doctrine:migrations:status

# Dry run (sans exécuter)
php bin/console doctrine:migrations:migrate --dry-run

# Exécuter
php bin/console doctrine:migrations:migrate
```

### "Frontend ne se connecte pas à l'API"
```bash
# Vérifier backend tourne sur http://localhost:8000
# Vérifier .env.local frontend:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Vérifier CORS backend accepte frontend:
# CORS_ALLOW_ORIGIN=http://localhost:3000
```

### "npm install échoue"
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "Port 8000 ou 3000 déjà utilisé"
```bash
# Linux/Mac
lsof -i :8000   # Voir processus
kill -9 <PID>   # Tuer

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Support et Ressources

- **PHP Docs** : https://www.php.net/docs.php
- **Composer Docs** : https://getcomposer.org/doc/
- **Symfony Docs** : https://symfony.com/doc/
- **API Platform Docs** : https://api-platform.com/docs/
- **Next.js Docs** : https://nextjs.org/docs
- **PostgreSQL Docs** : https://www.postgresql.org/docs/
