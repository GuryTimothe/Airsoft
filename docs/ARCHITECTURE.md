# Architecture Technique et Outils

## Vue d'Ensemble

Application web full-stack avec séparation nette entre **backend API** et **frontend web**, déployée via GitHub Actions CI/CD.

```
┌─────────────────────────────────────────────┐
│        Environnement Docker Compose         │
│                                             │
│        ┌──────────────────────────┐         │
│        │  FRONTEND (WEB)          │         │
│        │  Next.js 16 / React 19   │         │
│        │  TypeScript 5.0+         │         │ 
│        │  Port 3000               │         │
│        └────────┬─────────────────┘         │    
│                 │                           │
│        ┌────────▼───────────────────────┐   │
│        │   API REST (HTTP/JSON)         │   │
│        │   Symfony 7.4 + API Platform   │   │
│        │   Port 8000                    │   │
│        └────────┬───────────────────────┘   │
│                 │                           │   
│        ┌────────▼──────────────────┐        │
│        │   BASE DE DONNÉES         │        │
│        │   PostgreSQL 18-alpine    │        │
│        │   Port 5432               │        │
│        └───────────────────────────┘        │
└─────────────────────────────────────────────┘

```

## Composants Principaux

### 1. Backend - API REST

| Composant | Technologie | Rôle | Version |
|-----------|-------------|------|---------|
| **Framework API** | Symfony | Framework web + routing | 7.4 |
| **API REST** | API Platform | CRUD REST automatisé | 4.3.15 |
| **ORM** | Doctrine | Mapping objet-relationnel | 3.6.7 |
| **BDD** | PostgreSQL | Stockage données | 18-alpine |
| **Auth** | JWT (Lexik) | Authentification tokens | 3.2 |
| **Validation** | Symfony Validator | Validation données | Built-in |
| **Sécurité** | Symfony Security | Contrôle accès + Voters | Built-in |
| **Cache** | Redis | Cache applicatif, données temporaires et gestion de sessions | 7-alpine |
| **Migrations** | Doctrine Migrations | Versionning schéma BDD | 3.7 |
| **Package Manager** | composer | Gestion des dépendances PHP | 2.5+ |
| **Langue** | PHP | Langage serveur | 8.4+ |

**Fichiers clés** :
- `src/Entity/` - Modèles de données (User, Game, GameRegistration, etc.)
- `src/Controller/` - Contrôleurs custom (AdminExportController, etc.)
- `src/State/` - Processors/Providers API Platform (business logic)
- `src/Repository/` - Requêtes personnalisées BDD
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
| **Components** | shadcn/ui | Composants réutilisables | 4.8.1 |
| **Forms** | React Hook Form | Gestion formulaires | 7.76.1 |
| **Validation** | Zod | Validation schémas | 4.4.3 |
| **HTTP Client** | Fetch API | Requêtes HTTP | Built-in |
| **Build Tool** | Webpack | Bundling (via Next.js) | Via Next.js |
| **Package Manager** | npm | Gestion dépendances | 10.0+ |
| **Runtime** | Node.js | Runtime JavaScript | 20 |

**Fichiers clés** :
- `src/app/` - Pages et layout
- `src/components/` - Composants React
- `src/lib/` - Utilitaires et API clients
- `next.config.ts` - Configuration Next.js
- `tailwind.config.ts` - Configuration Tailwind
- `jest.config.js` - Configuration tests
- `tsconfig.json` - Configuration TypeScript

### 3. Infrastructure - Conteneurisation

| Composant | Technologie | Rôle | Version |
|-----------|-------------|------|---------|
| **Conteneurisation** | Docker | Isolation et exécution des service | 20.10+  |
| **Orchestration locale** | Docker Compose | Gestion des services multi-conteneurs | v2+ |


### 4. Gestion de Versions et CI/CD

| Composant | Outil | Rôle | Configuration |
|-----------|-------|------|---------------|
| **VCS** | Git | Contrôle version code | Branches: main, dev, feature/-, fix/- |
| **Repository** | GitHub | Hébergement code | https://github.com |
| **Commits** | Conventional Commits | Traçabilité commits | feat:, fix:, chore:, refactor: |
| **CI/CD** | GitHub Actions | Tests, build, deploy automatiques | .github/workflows/ |
| **Release** | release-please | Version automation + changelog | .release-pleaserc.json |

**Workflows** :
- `ci-cd.yml` - Orchestration des différents jobs CI/CD
- `backend-ci.yml` - Linting, formatage, tests et scan automatisés du backend
- `frontend-ci.yml` - Linting, formatage et tests automatisés du frontend
- `deploy.yml` - Déploiement automatique vers les environnements configurés
- `lighthouse.yml` - Vérification des performances et du respect des budgets qualité
- `pa11y.yml` - Tests automatisés d'accessibilité WCAG
- `release.yml` - Génération du changelog et gestion des versions sur main
- `security-scanner.yml` - Analyse qualité du code et détection de vulnérabilités

### 5. Outils de Build et Compilation

#### Backend
| Outil | Rôle | Commande |
|-------|------|---------|
| **Composer** | Gestionnaire dépendances PHP | `composer install` |
| **Symfony Console** | CLI Symfony | `php bin/console` |
| **Doctrine** | Migrations BDD | `php bin/console doctrine:migrations:migrate` |
| **PHP** | Compilation runtime | Natif avec PHP 8.4+ |

#### Frontend
| Outil | Rôle | Commande |
|-------|------|---------|
| **npm** | Gestionnaire dépendances JS | `npm install` |
| **Webpack** | Bundler (via Next.js) | `npm run build` |
| **Next.js** | Build SSR/SSG | `npm run build` |
| **TypeScript** | Compilation TS → JS | `npx tsc --noEmit` |

### 6. Outils de Test et Qualité

| Outil | Type | Framework | Commande | Cible |
|-------|------|-----------|----------|-------|
| **PHPUnit** | Tests unitaires | Backend | `php bin/console test` | `tests/` |
| **Jest** | Tests unitaires | Frontend | `npm test` | `*.test.ts(x)` |
| **PHPStan** | Analyse statique | Backend | `php ./vendor/bin/phpstan analyse src/` | Type checking |
| **ESLint** | Linting | Frontend | `npm run lint` | Code quality |
| **Prettier** | Formatting | Frontend/Config | `npm run format` | Code style |
| **Lighthouse** | Audit qualité | Frontend | `lighthouse <url>` | Performance, accessibilité, SEO, bonnes pratiques |
| **Pa11y** | Tests d'accessibilité | Frontend | `npm run test:pa11y` | Accessibilité WCAG |

### 7. Serveurs d'Application

| Serveur | Environnement | Port | Utilisation |
|---------|---------------|------|-------------|
| **Symfony CLI** | Dev local | 8000 | `symfony serve` |
| **Node.js** | Dev local | 3000 | `npm run dev` |
| **PostgreSQL** | Docker Compose | 5432 | Service base de données |

### 8. Base de Données

| Composant | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| **SGBD** | PostgreSQL | 18-alpine | BDD relationnelle |
| **Migrations** | Doctrine Migrations | 3.7+ | Versionning schéma |
| **Connexion** | PDO/Doctrine | Built-in | Accès données |

**Fichiers clés** :
- `migrations/` - Historique migrations
- `.env` - Config BDD
- `compose.yaml` - Configuration des services Docker (backend, frontend, PostgreSQL, Redis)

## Flux de Données

```
Utilisateur
↓
Frontend Next.js
↓ HTTP/JSON
API Symfony + API Platform
↓
Validation + Authentification JWT
↓
Logique métier (Controllers / State Processors)
↓
Doctrine ORM
↓
PostgreSQL
```

## Infrastructure et Environnements

| Environnement | Données | Accès | Déploiement |
|---------------|---------|-------|-------------|
| **Local** | Fixtures | Développeurs | Docker Compose |
| **CI/CD** | Base de test | Automatisé | GitHub Actions |
| **Production** | Réelles | Utilisateurs | Non défini  |

---

## Patterns Transversaux

### Gestion des Erreurs

**Backend** :
- Exceptions métier converties en réponses HTTP adaptées
- Gestion centralisée des erreurs via Symfony

**Frontend** :
- Gestion des erreurs API
- Affichage de messages utilisateur adaptés

### Validation

- **Backend** : Symfony Validator Constraints dans les Entities et DTOs
- **Frontend** : Zod schemas avec React Hook Form

Les données sont validées côté client pour l'expérience utilisateur et côté serveur pour garantir l'intégrité des données.

### Sécurité

- **Authentification** : JWT Bearer Token
- **Autorisation** : Symfony Security avec Voters backend
- **Protection XSS** : Échappement automatique React, absence de `dangerouslySetInnerHTML`
- **Protection CSRF** : Protection adaptée au mécanisme d'authentification utilisé