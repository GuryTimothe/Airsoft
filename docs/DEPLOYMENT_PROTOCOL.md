# Protocoles de Déploiement Continu et Intégration Continue

**Environnements :** Development (`dev`), Production (`main`)

# 1. Protocole d'Intégration Continue (CI)

## 1.1 Architecture Générale

Le pipeline CI permet de valider automatiquement le code et sa qualité à chaque push, afin de détecter rapidement les erreurs et d'éviter l'introduction de régressions.

```bash
Developer Push
      ↓
GitHub Actions
      ↓
ci-cd.yml
      ↓
┌─────────────────────────────┐
│                             │
backend-ci.yml        frontend-ci.yml
│                             │
│       Exécution parallèle   │
│                             │
└──────────────┬──────────────┘
               ↓
        security-scanner.yml


        [PASS] → Merge possible

        [FAIL] → Merge bloqué


Le déploiement est indépendant de la CI : Coolify le déclenche
depuis son propre webhook git (voir section 2.5).
```

---

## 1.2 Déclenchement du Pipeline

Le pipeline est exécuté automatiquement lors de push sur GitHub.

### Workflows exécutés

| Workflow | Rôle | Exécution |
|----------|------|-----------|
| `ci-cd.yml` | Orchestration globale des différents jobs CI/CD | À chaque push et pull request |
| `backend-ci.yml` | Validation de l'application Symfony (linting, formatage, tests automatisés) | Parallèle |
| `frontend-ci.yml` | Validation de l'application Next.js (linting, formatage, tests automatisés) | Parallèle |
| `security-scanner.yml` | Analyse de sécurité, qualité du code et détection des vulnérabilités | Après `frontend-ci.yml` et `backend-ci.yml`|

> La CI s'arrête après l'analyse de sécurité. Les audits Lighthouse et Pa11y
> ainsi que l'automatisation des releases ont été retirés du pipeline puis du
> dépôt, et le déploiement ne passe plus par GitHub Actions.

### Résultat attendu

En cas de succès :

- Tous les workflows terminent correctement
- La modification peut être intégrée

En cas d'échec :

- Le merge est bloqué
- Une correction doit être effectuée avant intégration

---

## 1.3 Backend CI Workflow

**Fichier :**

```bash
.github/workflows/backend-ci.yml
```

Le workflow backend vérifie que l'application Symfony respecte les règles définies avant intégration.

### Étapes principales

| Étape | Outil | Objectif |
|-------|-------|----------|
| Setup PHP | `shivammathur/setup-php` | Installer PHP 8.4 |
| Composer Install | Composer | Installer les dépendances |
| PHP-CS-Fixer Check | PHP-CS-Fixer | Vérifier le formatage |
| PHPStan Analyse | PHPStan | Analyse statique du code |
| PHPUnit Tests | PHPUnit | Vérifier le comportement applicatif |

### Conditions de validation

Le pipeline backend est validé uniquement si :

- PHP-CS-Fixer ne détecte aucune erreur
- PHPStan termine sans erreur
- PHPUnit termine avec succès

---

## 1.4 Frontend CI Workflow

**Fichier :**

```bash
.github/workflows/frontend-ci.yml
```

Le workflow frontend vérifie que l'application Next.js peut être construite et validée automatiquement.

### Étapes principales

| Étape | Outil | Objectif |
|-------|-------|----------|
| Setup Node | Node.js 20 | Préparer l'environnement |
| npm install | npm | Installer les dépendances |
| ESLint Check | ESLint | Vérifier le code TypeScript/React |
| Prettier Check | Prettier | Vérifier le formatage |
| Jest Tests | Jest | Exécuter les tests frontend |

### Conditions de validation

Le pipeline frontend est validé uniquement si :

- ESLint ne retourne aucune erreur
- Prettier valide le formatage
- Les tests Jest réussissent
- Le build frontend fonctionne

---

## 1.5 Conditions Générales de Validation CI

Une modification peut être intégrée uniquement si :

- Le pipeline backend réussit
- Le pipeline frontend réussit
- Les audits automatiques configurés passent
- Aucun workflow obligatoire n'est en échec

### Actions en cas d'échec

En cas d'échec :

- Le merge est bloqué
- GitHub Actions affiche le détail de l'erreur
- Le développeur doit corriger le problème avant nouvelle validation

---

# 2. Protocole de Déploiement Continu (CD)

Le pipeline CD automatise la création des versions applicatives et prépare le déploiement.

---

## 2.1 Versioning

Le versioning suit le Semantic Versioning et s'appuie sur les Conventional
Commits (section 2.2).

L'automatisation `release-please` a été retirée du pipeline CI, et ses fichiers
de configuration (`.release-pleaserc.json`, `.release-please-manifest.json`) ont
été supprimés du dépôt. Les versions, le changelog et les tags sont donc gérés
manuellement ; les fichiers `CHANGELOG.md` conservent l'historique déjà publié.

---

### Déclenchement

Un push sur `main` déclenche deux mécanismes distincts et indépendants :
- **GitHub Actions** : valide le code (lint, tests, analyse de sécurité)
- **Coolify** : construit et redéploie la stack depuis son webhook git

## 2.2 Convention des Commits

Le projet utilise Conventional Commits afin de permettre l'automatisation des versions.

Format :

```bash
<type>(<scope>): <description>
```

### Types principaux

| Type | Utilisation |
|------|-------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation |
| `chore` | Maintenance technique |
| `refactor` | Refactorisation |

### Exemples

```bash
feat: ajouter export CSV joueurs

fix: corriger validation inscription

docs: mettre à jour documentation API
```

---

## 2.3 Stratégie de Version

Le projet utilise le Semantic Versioning.

Format :

```bash
MAJOR.MINOR.PATCH
```

Exemple :

```bash
1.0.0 → 1.0.1 → 1.1.0 → 2.0.0
```

| Partie | Signification |
|--------|---------------|
| MAJOR | Modification incompatible |
| MINOR | Nouvelle fonctionnalité compatible |
| PATCH | Correction ou amélioration mineure |

## 2.4 Déploiement par Environnement

L'hébergement est assuré par **Coolify**, une plateforme auto-hébergée qui
construit et exécute les images Docker du projet.

---

### 2.4.1 Production (`main`)

L'environnement production est destiné à contenir la version accessible aux utilisateurs.

**Déclenchement :**

- Merge vers `main`

**Actions :**

```bash
- Validation du code par la CI (lint, tests, analyse de sécurité)
- En parallèle, Coolify reçoit le webhook git
- Build des images et redémarrage de la stack par Coolify
```

> La CI et le déploiement sont indépendants : un échec de la CI n'empêche pas
> Coolify de déployer. Protéger `main` par une règle exigeant des checks verts
> avant merge est le moyen de couvrir ce cas.

---

## 2.5 Déploiement via Coolify

Le déploiement est conteneurisé et **entièrement piloté par Coolify**. GitHub
Actions n'intervient pas : aucun workflow ne contacte la production.

Coolify s'abonne au dépôt via un webhook git. À chaque push sur la branche
suivie, il récupère les sources, construit les images et redémarre la stack.

**Fichier :**

```bash
docker-compose.coolify.yml       # stack déployée par Coolify
```

**Étapes :**

```bash
- Push sur la branche suivie
- GitHub notifie Coolify via le webhook
- Coolify clone le dépôt et construit les images
- Redémarrage de la stack, healthcheck /health du backend avant mise en service
```

### Configuration Coolify

Créer une ressource de type **Docker Compose** pointant sur le dépôt, avec
`docker-compose.coolify.yml` comme fichier de composition.

Le proxy interne de Coolify n'est pas utilisé. La stack publie un seul port sur
l'hôte, `FRONTEND_PORT`, vers lequel le reverse proxy de l'infrastructure
redirige le trafic.

Le navigateur appelle le serveur Next.js, qui relaie `/api/*` vers le backend via
le réseau interne (`next.config.ts`). Le backend n'est donc pas publié et n'a
besoin ni de domaine ni d'exposition CORS.

**Secrets GitHub requis :** aucun. Le déploiement ne passant plus par GitHub
Actions, les secrets `VPS_*` et `COOLIFY_*` peuvent être supprimés du dépôt.

**Variables d'environnement à définir dans Coolify :**

| Variable | Description |
|----------|-------------|
| `FRONTEND_PORT` | Port publié sur l'hôte pour le reverse proxy (défaut `3000`) |
| `PUBLIC_URL` | Origine publique servie par le proxy, sans slash final |
| `CORS_ALLOW_ORIGIN` | Regex ancrée autorisant cette origine |
| `APP_SECRET` | Secret applicatif Symfony |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `JWT_PASSPHRASE` | Passphrase protégeant la clé privée RSA |
| `MAILER_DSN`, `MAILER_FROM` | Configuration SMTP |
| `SUPER_ADMIN_*` | Compte super administrateur initial |

La paire de clés JWT est générée automatiquement au premier démarrage du
conteneur backend et conservée dans le volume `backend_jwt`. Elle ne doit pas
être régénérée : tous les tokens émis seraient invalidés.


# 3. Gestion des Releases

Les releases sont créées manuellement depuis GitHub, en suivant le Semantic
Versioning décrit en section 2.3.

## Contenu d'une release

Une release contient :

- Numéro de version
- Changelog généré automatiquement
- Liste des modifications
- Tag Git associé

Exemple :

```bash
Release v1.2.0

Added:
- Nouvelle fonctionnalité

Fixed:
- Correction de bugs

Changed:
- Modifications techniques
```


# 4. Structure des Fichiers de Déploiement

Les fichiers utilisés pour le déploiement sont organisés comme suit :

```bash
.github/
│
├── workflows/
│   ├── ci-cd.yml
│   ├── backend-ci.yml
│   ├── frontend-ci.yml
│   └── security-scanner.yml
│
docker-compose.coolify.yml
backend/
frontend/
```


# 5. Ressources

## Documentation interne

| Sujet | Fichier |
|--------|---------|
| Référence de l'API | [docs/API_REFERENCE.md](docs/API_REFERENCE.md) |
| Architecture du projet | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Sécurité (OWASP) | [docs/SECURITY_OWASP.md](docs/SECURITY_OWASP.md) |
| Tests | [docs/TEST_RECIPES.md](docs/TEST_RECIPES.md) |
| Manuel de mise à jour | [docs/UPDATE_MANUAL.md](docs/UPDATE_MANUAL.md) |
| Gestion des bugs et des erreurs | [docs/BUGS_TRACKING.md](docs/UPDATE_MANUAL.md) | 
| Accessibilité et performances | [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) |

## Outils utilisés

| Outil | Utilisation |
|-------|-------------|
| GitHub Actions | Validation du code (lint, tests, analyse de sécurité) |
| Coolify | Build des images et déploiement via webhook git |
| FrankenPHP | Serveur applicatif PHP du conteneur backend |
| Semantic Versioning | Convention de versionnage |
| Conventional Commits | Convention de messages de commit |

---