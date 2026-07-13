# Architecture Technique et Outils

## Vue d'Ensemble

Application web full-stack avec séparation nette entre **backend API** et **frontend web**, déployée via GitHub Actions CI/CD.

```
┌────────────────────────────────────────────────────────────────┐
│                     UTILISATEURS (Navigateur)                   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
        ┌────────▼─────────────────┐
        │  FRONTEND (WEB)          │
        │  Next.js 16 / React 19   │
        │  TypeScript 5.0+         │
        │  Port 3000               │
        └────────┬─────────────────┘
                 │
        ┌────────▼──────────────────────────┐
        │   API REST (HTTP/JSON)            │
        │   Symfony 7.4 + API Platform     │
        │   Port 8000                       │
        └────────┬──────────────────────────┘
                 │
        ┌────────▼──────────────────┐
        │   BASE DE DONNÉES         │
        │   PostgreSQL 16-alpine    │
        │   Port 5432               │
        └───────────────────────────┘
```

## Composants Principaux

### 1. Backend - API REST

| Composant | Technologie | Rôle | Version |
|-----------|-------------|------|---------|
| **Framework API** | Symfony | Framework web + routing | 7.4 |
| **API REST** | API Platform | CRUD REST automatisé | 4.3.15 |
| **ORM** | Doctrine | Mapping objet-relationnel | 3.6.7 |
| **BD** | PostgreSQL | Stockage données | 16-alpine |
| **Auth** | JWT (Lexik) | Authentification tokens | 3.2 |
| **Validation** | Symfony Validator | Validation données | Built-in |
| **Sécurité** | Symfony Security | Contrôle accès + Voters | Built-in |
| **Migrations** | Doctrine Migrations | Versionning schéma BD | 3.7 |
| **Langue** | PHP | Langage serveur | 8.4+ |

**Fichiers clés** :
- `src/Entity/` - Modèles de données (User, Game, GameRegistration, etc.)
- `src/Controller/` - Contrôleurs custom (AdminExportController, etc.)
- `src/State/` - Processors/Providers API Platform (business logic)
- `src/Repository/` - Requêtes personnalisées BD
- `config/` - Configuration Symfony
- `migrations/` - Historique changements schéma
- `public/index.php` - Point d'entrée
- `tests/` - Tests PHPUnit

### 2. Frontend - Interface Utilisateur

| Composant | Technologie | Rôle | Version |
|-----------|-------------|------|---------|
| **Framework** | Next.js | Framework React + SSR | 16.2.6 |
| **Langage** | TypeScript | Typage statique | 5.0+ |
| **UI Framework** | React | Composants UI | 19.2.4 |
| **Styling** | Tailwind CSS | Utilitaires CSS | 4.0+ |
| **Components** | shadcn/ui | Composants réutilisables | Latest |
| **Forms** | React Hook Form | Gestion formulaires | 7.76.1 |
| **Validation** | Zod | Validation schémas | 4.4.3 |
| **HTTP Client** | Fetch API | Requêtes HTTP | Built-in |
| **Build Tool** | Webpack | Bundling (via Next.js) | Via Next.js |
| **Package Manager** | npm | Gestion dépendances | 10.0+ |
| **Runtime** | Node.js | Runtime JavaScript | 20+ |

**Fichiers clés** :
- `src/app/` - Pages et layout
- `src/components/` - Composants React
- `src/lib/` - Utilitaires et API clients
- `next.config.ts` - Configuration Next.js
- `tailwind.config.ts` - Configuration Tailwind
- `jest.config.js` - Configuration tests
- `tsconfig.json` - Configuration TypeScript

### 3. Gestion de Versions et CI/CD

| Composant | Outil | Rôle | Configuration |
|-----------|-------|------|---------------|
| **VCS** | Git | Contrôle version code | Branches: main, dev, feature/* |
| **Repository** | GitHub | Hébergement code | https://github.com |
| **Commits** | Conventional Commits | Traçabilité commits | feat:, fix:, chore:, refactor: |
| **CI/CD** | GitHub Actions | Tests, build, deploy automatiques | .github/workflows/ |
| **Release** | release-please | Version automation + changelog | .release-pleaserc.json |

**Workflows** :
- `ci-cd.yml` - Tests/lint sur dev et main
- `release.yml` - Changelog + version bump sur main

### 4. Outils de Build et Compilation

#### Backend
| Outil | Rôle | Commande |
|-------|------|---------|
| **Composer** | Gestionnaire dépendances PHP | `composer install` |
| **Symfony Console** | CLI Symfony | `php bin/console` |
| **Doctrine** | Migrations BD | `php bin/console doctrine:migrations:migrate` |
| **PHP** | Compilation runtime | Natif avec PHP 8.4+ |

#### Frontend
| Outil | Rôle | Commande |
|-------|------|---------|
| **npm** | Gestionnaire dépendances JS | `npm install` |
| **Webpack** | Bundler (via Next.js) | `npm run build` |
| **Next.js** | Build SSR/SSG | `npm run build` |
| **TypeScript** | Compilation TS → JS | `npx tsc --noEmit` |

### 5. Outils de Test et Qualité

| Outil | Type | Framework | Commande | Cible |
|-------|------|-----------|----------|-------|
| **PHPUnit** | Tests unitaires | Backend | `php bin/console test` | `tests/` |
| **Jest** | Tests unitaires | Frontend | `npm test` | `*.test.ts(x)` |
| **PHPStan** | Analyse statique | Backend | `php ./vendor/bin/phpstan analyse src/` | Type checking |
| **ESLint** | Linting | Frontend | `npm run lint` | Code quality |
| **Prettier** | Formatting | Frontend/Config | `npm run format` | Code style |

### 6. Serveurs d'Application

| Serveur | Environnement | Port | Utilisation |
|---------|---------------|------|-------------|
| **PHP Built-in** | Dev local | 8000 | `symfony serve` |
| **Node.js** | Dev local | 3000 | `npm run dev` |
| **PostgreSQL** | Dev local | 5432 | Via compose.yaml (optionnel) |

### 7. Base de Données

| Composant | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| **SGBD** | PostgreSQL | 16-alpine | BD relationnelle |
| **Migrations** | Doctrine Migrations | 3.7+ | Versionning schéma |
| **Connexion** | PDO/Doctrine | Built-in | Accès données |

**Fichiers clés** :
- `migrations/` - Historique migrations
- `.env` / `.env.local` - Config BD
- `compose.yaml` - PostgreSQL optionnel

## Matrice Outils Complète

| Catégorie | Outil | Rôle | Version | Installation |
|-----------|-------|------|---------|--------------|
| **VCS** | Git | Contrôle version | 2.30+ | https://git-scm.com |
| **Repository** | GitHub | Hébergement | Cloud | https://github.com |
| **CI/CD** | GitHub Actions | Automation | Natif | .github/workflows/ |
| **Release** | release-please | Version automation | Latest | .release-pleaserc.json |
| **PM Backend** | Composer | Gestionnaire PHP | 2.5+ | https://getcomposer.org |
| **PM Frontend** | npm | Gestionnaire JS | 9.0+ | Avec Node.js |
| **Runtime Backend** | PHP | Moteur PHP | 8.4+ | https://www.php.net |
| **Runtime Frontend** | Node.js | Moteur JS | 18.0+ | https://nodejs.org |
| **Framework Backend** | Symfony | Framework PHP | 7.4 | Via Composer |
| **API Backend** | API Platform | REST CRUD | 4.3.15 | Via Composer |
| **Framework Frontend** | Next.js | Framework React | 16.2.6 | Via npm |
| **UI Frontend** | React | Lib composants | 19.2.4 | Via npm |
| **Styling** | Tailwind CSS | Utilitaires CSS | 4.0+ | Via npm |
| **BD** | PostgreSQL | SGBD | 16-alpine | Docker ou local |
| **ORM** | Doctrine | Mapping ORM | 3.6.7 | Via Composer |
| **Auth** | JWT Lexik | Authentification | 3.2 | Via Composer |
| **Tests Backend** | PHPUnit | Tests unitaires | Via Composer | Via Composer |
| **Tests Frontend** | Jest | Tests unitaires | 30.4.2 | Via npm |
| **Lint Backend** | PHPStan | Analyse statique | Via Composer | Via Composer |
| **Lint Frontend** | ESLint | Linting | 9.0 | Via npm |
| **Format** | Prettier | Code formatting | 3.0+ | Via npm |
| **Validation** | React Hook Form | Formulaires | 7.76.1 | Via npm |
| **Validation Schema** | Zod | Validation données | 4.4.3 | Via npm |

## Flux de Données

```
1. Utilisateur remplit formulaire (frontend)
   ↓
2. React Hook Form + Zod validation côté client
   ↓
3. Fetch API envoie JSON → Backend
   ↓
4. Symfony Router achemine vers Controller/State Processor
   ↓
5. JWT validation + Voters (contrôle accès)
   ↓
6. API Platform / Controller traite la requête
   ↓
7. Doctrine ORM exécute queries
   ↓
8. PostgreSQL retourne résultats
   ↓
9. Backend sérialise JSON response
   ↓
10. Frontend Fetch reçoit réponse
   ↓
11. React met à jour state
   ↓
12. Composant re-render, affiche résultat utilisateur
```

## Architecture en Couches

```
┌─────────────────────────────────────────┐
│     FRONTEND TIER (port 3000)            │
│  Next.js Pages → Components → Hooks     │
└────────────┬────────────────────────────┘
             │ HTTP REST JSON
┌────────────▼────────────────────────────┐
│     API TIER (port 8000)                 │
│  Symfony Router                         │
│    ├─ Controllers (custom endpoints)    │
│    ├─ API Platform (auto CRUD)          │
│    ├─ State Processors (business)       │
│    └─ Security Voters (authorization)   │
└────────────┬────────────────────────────┘
             │ SQL
┌────────────▼────────────────────────────┐
│  PERSISTENCE TIER (port 5432)           │
│  PostgreSQL                             │
│    ├─ Users table                       │
│    ├─ Games table                       │
│    ├─ GameRegistrations table           │
│    ├─ EmergencyContacts table           │
│    └─ AppSettings table                 │
└─────────────────────────────────────────┘
```

## Rôles d'Accès (RBAC)

| Rôle | Permissions |
|------|------------|
| **ROLE_USER** | Voir parties publiques, s'inscrire, voir ses inscriptions |
| **ROLE_ORGANIZER** | Créer/modifier parties, voir joueurs inscrits, marquer présence |
| **ROLE_ADMIN** | Tous droits, exports CSV, gestion paramètres |
| **ROLE_SUPER_ADMIN** | Tous droits + gestion rôles autres admins |

Implémentation :
- JWT tokens + Symfony Security
- Voters pour authorization fine-grained
- API Platform security declarations

## Infrastructure et Environnements

| Environnement | Données | Accès | Deployment |
|---------------|---------|-------|-----------|
| **Local** | Fixtures | Dev uniquement | `npm run dev` + `symfony serve` |
| **GitHub Actions** | Test DB | CI/CD | Tests automatiques |
| **Production** | Réelles | Utilisateurs | À définir (AWS, Heroku, etc.) |

## Ressources Estimées

| Composant | RAM | Disque | Notes |
|-----------|-----|--------|-------|
| Backend dev (PHP + Symfony) | 150 MB | 400 MB | Sans vendor/ |
| Frontend dev (Node + Next.js) | 300 MB | 800 MB | Sans node_modules/ |
| PostgreSQL | 200 MB | 500 MB | Données test |
| **Total dev** | **650 MB** | **1.7 GB** | Sans dépendances |
| **Total avec deps** | **~1 GB** | **~3 GB** | Avec vendor/ + node_modules/ |
