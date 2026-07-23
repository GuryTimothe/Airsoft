# Quick Start Guide - Pour Commencer Rapidement

Cette page vous guide rapidement à travers les étapes essentielles pour démarrer avec Airsoft.

---

## Prérequis

| Outil | Version minimale | Installation |
|--------|------------------|--------------|
| **Docker** | 20.10+ | https://www.docker.com/products/docker-desktop/ |
| **Docker Compose** | v2+ | Inclus avec Docker Desktop |
| **Git** | 2.30+ | https://git-scm.com |


---

# Variables d'environnement

Le projet utilise un fichier `.env` situé à la racine du projet afin de configurer les différents services Docker :

- PostgreSQL
- Redis
- Backend Symfony
- Frontend Next.js
- Authentification JWT
- Création du compte SUPER_ADMIN initial

Pour créer le fichier d'environnement .env en copiant le .env.example.
Remplacer les valeurs des variables par celles voulues.

> Le fichier `.env` ne doit jamais être push dans le repo.

---

## PostgreSQL

Ces variables configurent le conteneur PostgreSQL.

```env
POSTGRES_DB=app
POSTGRES_USER=app
POSTGRES_PASSWORD=change-me-db-password
```

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | Nom de la base de données créée au démarrage |
| `POSTGRES_USER` | Utilisateur PostgreSQL utilisé par l'application |
| `POSTGRES_PASSWORD` | Mot de passe de l'utilisateur PostgreSQL |

La connexion utilisée par Symfony est définie avec :

```env
DATABASE_URL=postgresql://app:password@database:5432/app?serverVersion=18&charset=utf8
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL complète de connexion à PostgreSQL depuis le backend |

---

## Ports des services

```env
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

| Variable | Description | Valeur par défaut |
|----------|-------------|------------------|
| `BACKEND_PORT` | Port exposé pour l'API Symfony | `8000` |
| `FRONTEND_PORT` | Port exposé pour l'application Next.js | `3000` |

URLs accessibles après démarrage :

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000

---

## Configuration Symfony

```env
APP_DEBUG=1
APP_ENV=dev
APP_SECRET=change-me-app-secret
DEFAULT_URI=http://localhost:8000
```

| Variable | Description |
|----------|-------------|
| `APP_ENV` | Environnement Symfony (`dev`, `prod`) |
| `APP_DEBUG` | Active ou désactive le mode debug |
| `APP_SECRET` | Clé secrète utilisée par Symfony |
| `DEFAULT_URI` | URL principale du backend |

---

## CORS

```env
CORS_ALLOW_ORIGIN=^https?://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?$
```

Cette variable définit les domaines autorisés à communiquer avec l'API.

En développement, seules les applications locales sont autorisées.

En production, cette valeur doit être remplacée par les domaines utilisés par l'application.

Exemple :

```env
CORS_ALLOW_ORIGIN=^https://app.example.com$
```

---

## JWT

L'authentification utilise des tokens JWT signés avec une paire de clés RSA. [Génération des clés dans la partie Génération des clés JWT](#génération-des-clés-jwt)

```env
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=change-me-jwt-passphrase
```

| Variable | Description |
|----------|-------------|
| `JWT_SECRET_KEY` | Chemin vers la clé privée JWT |
| `JWT_PUBLIC_KEY` | Chemin vers la clé publique JWT |
| `JWT_PASSPHRASE` | Mot de passe protégeant la clé privée |

---

## Configuration des tokens JWT

```env
JWT_ISSUER=http://backend:8000
JWT_AUDIENCE=http://backend:8000
JWT_INACTIVITY_TIMEOUT=1800
LOGIN_CSRF_TOKEN_TTL=600
```

| Variable | Description |
|----------|-------------|
| `JWT_ISSUER` | Identifie l'émetteur du token JWT |
| `JWT_AUDIENCE` | Identifie le destinataire du token JWT |
| `JWT_INACTIVITY_TIMEOUT` | Durée d'inactivité avant expiration du token (secondes) |
| `LOGIN_CSRF_TOKEN_TTL` | Durée de validité du token CSRF (secondes) |

---

## Redis

```env
REDIS_URL=redis://redis:6379
```

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | URL de connexion au service Redis |

Redis est utilisé pour le cache et la gestion des données temporaires.

---

## Frontend Next.js

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://backend:8000
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL de l'API utilisée côté navigateur |
| `INTERNAL_API_URL` | URL utilisée côté serveur par Next.js dans Docker |

`INTERNAL_API_URL` utilise le nom du service Docker (`backend`) afin que les conteneurs puissent communiquer entre eux.

---

## SUPER_ADMIN initial

Un compte SUPER_ADMIN est créé automatiquement au démarrage du backend.

Configuration :

```env
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_FIRSTNAME=Admin
SUPER_ADMIN_LASTNAME=User
SUPER_ADMIN_PASSWORD=ChangeMe123!
```

| Variable | Description |
|----------|-------------|
| `SUPER_ADMIN_EMAIL` | Email du compte administrateur |
| `SUPER_ADMIN_FIRSTNAME` | Prénom du compte administrateur |
| `SUPER_ADMIN_LASTNAME` | Nom du compte administrateur |
| `SUPER_ADMIN_PASSWORD` | Mot de passe initial |

---

# Lancer le projet

## 1. Configurer l'environnement

Le projet utilise un fichier `.env` à la racine pour configurer les différents services Docker (base de données, backend Symfony, frontend Next.js, authentification JWT, etc.).

Copier le fichier d'exemple :

```bash
cp .env.example .env
```

Modifier les variables si nécessaire.

### 3. Démarrer les services

Depuis la racine du projet :

```bash
docker compose up --build
```

Le premier démarrage peut prendre plusieurs minutes (construction des images et installation des dépendances).

Une fois les conteneurs démarrés :

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000/api

Pour arrêter le projet :

```bash
docker compose down
```

---

## Génération des clés JWT

Le backend utilise une authentification JWT basée sur une paire de clés RSA.

Deux fichiers sont nécessaires pour le fonctionnement de l'authentification :

```
backend/
└── config/
    └── jwt/
        ├── private.pem
        └── public.pem
```

### Rôle des clés

| Fichier | Rôle |
|---------|------|
| `private.pem` | Clé privée utilisée par Symfony pour signer les tokens JWT |
| `public.pem` | Clé publique utilisée pour vérifier la validité des tokens JWT |

La clé privée permet de générer des tokens d'authentification valides. Elle doit donc rester secrète.

---

### Générer les clés JWT

Après avoir démarré les conteneurs Docker, générer une nouvelle paire de clés avec :

```bash
docker compose exec backend php bin/console lexik:jwt:generate-keypair
```

Cette commande va automatiquement créer :

```
backend/config/jwt/private.pem
backend/config/jwt/public.pem
```

---

### Environnements différents

Chaque environnement doit utiliser sa propre paire de clés :

- Développement → clés locales
- Staging → clés dédiées
- Production → clés dédiées et sécurisées

Ne jamais réutiliser les mêmes clés entre plusieurs environnements.

# Informations utiles

## Comptes de test

Les rôles disponibles sont :

- **USER** : utilisateur standard
- **ORGANIZER** : peut créer et gérer des parties
- **ADMIN** : administration de l'application
- **SUPER_ADMIN** : gestion des administrateurs et des rôles

Créer un compte via le formulaire d'inscription (le compte aura comme rôle **USER**)

Le compte **SUPER_ADMIN** est créé automatiquement à partir des variables suivantes dans le fichier `.env` :

```env
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

Via ce compte, vous pourrez créer des utilisateurs qui ont comme rôle **USER**, **ORGANIZER**, **ADMIN** ou **SUPER_ADMIN**.

## Services Docker

Le projet démarre automatiquement les services suivants :

- PostgreSQL
- Redis
- Backend Symfony
- Frontend Next.js

---

# Documentation

Une documentation plus détaillée est disponible dans le dossier `docs/`.

| Sujet | Fichier |
|--------|---------|
| Référence de l'API | [docs/API_REFERENCE.md](docs/API_REFERENCE.md) |
| Architecture du projet | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Déploiement et CI/CD | [docs/DEPLOYMENT_PROTOCOL.md](docs/DEPLOYMENT_PROTOCOL.md) |
| Sécurité (OWASP) | [docs/SECURITY_OWASP.md](docs/SECURITY_OWASP.md) |
| Tests | [docs/TEST_RECIPES.md](docs/TEST_RECIPES.md) |
| Accessibilité et performances | [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) |