# Airsoft — Plateforme de Gestion Parties Airsoft

> Plateforme web pour gérer les parties airsoft : création, inscriptions joueurs, tracking présence, et exports administrateur.

**Stack** : Symfony 7.4 (PHP 8.4) | API Platform | PostgreSQL | Next.js 16 (TypeScript) | Tailwind CSS

---

## 📚 Documentation


### 🧑‍💻 Développeur

| Document | Contenu |
|----------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | **Démarrer en 5 min** (installation, commandes essentielles) |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | **Stack technique** (Symfony, Next.js, PostgreSQL, dépendances) |
| [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) | **53 endpoints REST** (auth, users, games, registrations, exports) |
| [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) | **Setup détaillé** (PHP 8.4, Node 18, PostgreSQL, tools) |

### 👥 Utilisateurs

| Document | Contenu |
|----------|---------|
| [USER_MANUAL.md](./USER_MANUAL.md) | **Guide complet** (créer compte, naviguer, par rôle: joueur/orga/admin) |

### 🧪 QA / Testing

| Document | Contenu |
|----------|---------|
| [docs/TEST_RECIPES.md](./docs/TEST_RECIPES.md) | **84 cas de test** (fonctionnels, sécurité, perf, a11y) |
| [docs/QUALITY_CRITERIA.md](./docs/QUALITY_CRITERIA.md) | **Critères qualité** (coverage, linting, perf thresholds) |
| [docs/ACCESSIBILITY_PERFORMANCE.md](./docs/ACCESSIBILITY_PERFORMANCE.md) | **Lighthouse + WCAG** (Core Web Vitals, accessibilité) |

### 🔒 Sécurité

| Document | Contenu |
|----------|---------|
| [docs/SECURITY_OWASP.md](./docs/SECURITY_OWASP.md) | **OWASP Top 10** (analyse implémentation + gaps) |

### 🚀 DevOps / Déploiement

| Document | Contenu |
|----------|---------|
| [docs/DEPLOYMENT_PROTOCOL.md](./docs/DEPLOYMENT_PROTOCOL.md) | **CI/CD complet** (GitHub Actions, release automation, rollback) |

---

## 🚀 Démarrage Rapide (5 min)

**Voir [QUICKSTART.md](./QUICKSTART.md) pour détails complets.**

```bash
# Backend (Terminal 1)
cd backend && composer install && cp .env .env.local
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
symfony serve

# Frontend (Terminal 2)
cd frontend && npm install && npm run dev
```

| Service | URL | Commande |
|---------|-----|----------|
| **API Backend** | `http://localhost:8000/api` | `symfony serve` |
| **Frontend App** | `http://localhost:3000` | `npm run dev` |
| **Tests Backend** | — | `php bin/console test` |
| **Tests Frontend** | — | `npm test` |

---

## 🏗️ Architecture

```
Frontend (Next.js 16 + TypeScript)
    ├─ Pages (public, login, dashboard)
    ├─ Components (UI + business logic)
    └─ API Client (lib/api)
         ↓ REST JSON
Backend (Symfony 7.4 + API Platform)
    ├─ Entities (User, Game, GameRegistration, etc.)
    ├─ Controllers (custom endpoints)
    ├─ State Processors (business logic)
    ├─ Security (JWT + RBAC)
    └─ Repositories (queries)
         ↓ SQL
PostgreSQL 16 (Database)
    ├─ users, games, game_registrations
    ├─ emergency_contacts, app_settings
    └─ Migrations history
```

**Rôles** (4 niveaux) : `USER` → `ORGANIZER` → `ADMIN` → `SUPER_ADMIN`

---

## 🛠️ Choix Technologiques

### Pourquoi ces technologies?

| Stack | Choix | Justification |
|-------|-------|--------------|
| **Backend API** | Symfony 7.4 + API Platform | Framework PHP solide et reconnu en production. API Platform fournit une API REST fiable, maintenable et bien documentée |
| **Frontend Web** | Next.js 16 + TypeScript | Framework React moderne, facilement manipulable, fiable et performant pour une UX interactive |
| **Database** | PostgreSQL 16 | SGBD relationnel très solide et performant, excellent pour requêtes complexes et données structurées |
| **Langage Backend** | PHP 8.4 | Dernière version stable à date, meilleures performances et sécurité comparé aux versions antérieures |
| **Authentication** | JWT (Lexik) + RBAC | Approche scalable et stateless, idéale pour une API REST distribuée |

---

## 🐛 Gestion des Bogues

### Signaler un Bug

1. Vérifier qu'il n'existe pas déjà (rechercher sur notion)
2. Créer un nouveau ticket sur notion
3. Remplir le ticket avec :
   - Description claire du problème
   - Étapes pour reproduire
   - Résultat attendu vs réel
   - Environnement (OS, navigateur, version)

### Classification & SLA

| Severity | Exemples | SLA Triage | SLA Fix |
|----------|----------|-----------|---------|
| **🔴 Critical** | Perte de données, accès non autorisé, API down | 24h | 3 jours |
| **🟠 Major** | Fonctionnalité ne fonctionne pas, bug sécurité | 3 jours | 1 semaine |
| **🟡 Minor** | UI glitch, message d'erreur manquant | 1 semaine | 2 semaines |
| **🟢 Improvement** | Typo, amélioration cosmétique | Ad-hoc | Ad-hoc |

### Workflow

1. **Triage** : Vérifier, catégoriser (severity), assigner
2. **Développement** : Créer branche, fix, PR avec tests
3. **Validation** : Code review, tests, merge
4. **Release** : Inclus dans prochaine version

---

## ✅ Fonctionnalités

### Joueurs
- Créer compte (inscription publique)
- S'inscrire à une partie
- Voir ses inscriptions
- Annuler inscription

### Organisateurs
- Créer/modifier parties
- Voir liste joueurs inscrits
- Marquer présence/absence

### Administrateurs
- Accès complet (users, games, registrations)
- Exporter CSV (joueurs, parties, inscriptions)
- Configurer paramètres app

### Super-Administrateurs
- Gérer rôles utilisateurs
- Tous droits admins

---

## 📊 État du Projet

| Élément | Status | Details |
|---------|--------|---------|
| **Tests Backend** | 71.73% | 269 tests passing (cible: 70% ✅) |
| **Tests Frontend** | 78.73% | 227 tests passing (cible: 70% ✅) |
| **CI/CD** | ✓ Active | GitHub Actions (backend + frontend + lighthouse + pa11y) |
| **API Documentation** | ✓ Complete | 53 endpoints documentés |
| **Lighthouse** | 90+ | Performance, accessibility, best practices |
| **PHPStan** | Level 5 | 0 errors |
| **ESLint** | ✓ 0 errors | Frontend linting |



---

## � Plan de Gestion des Bogues (C2.3.2)

### 1. Signaler un Bug

**Processus** :

1. **Vérifier** que le bug n'existe pas déjà (rechercher sur GitHub Issues ou Notion)
2. **Créer ticket** avec template standard :
   ```
   Title: [TYPE] Description concise
   
   Description:
   - Comportement observé
   - Comportement attendu
   - Étapes pour reproduire
   
   Environnement:
   - OS
   - Navigateur (si frontend)
   - Version app
   
   Screenshots/Logs:
   - Attacher captures écran ou logs erreur
   ```
3. **Assigner label** : `bug`, `severity:critical`, etc.
4. **Notifier équipe** : mentionner développeurs

### 2. Classification et SLA

| Severity | Examples | Impact User | SLA Triage | SLA Fix | SLA Deploy |
|----------|----------|-------------|-----------|---------|-----------|
| 🔴 **Critical** | Perte données, API down, accès non-autorisé, app crash | Total (aucun accès) | 24h | 3 jours | Immediate |
| 🟠 **Major** | Feature ne fonctionne pas, bug sécurité, données incorrectes | Bloquant (workaround possible) | 3 jours | 1 semaine | 1-2 jours |
| 🟡 **Minor** | UI glitch, message manquant, performance légèrement dégradée | Non-bloquant | 1 semaine | 2 semaines | À combiner |
| 🟢 **Trivial** | Typo, amélioration cosmétique, suggestion | Cosmétique | Ad-hoc | Ad-hoc | Backlog |

### 3. Workflow de Correction

```
┌─────────────────────────────────────────────┐
│ 1. BUG SIGNALÉ                              │
│    Issue créée + label severity             │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 2. TRIAGE (Jour 1-3 selon severity)         │
│    - Confirmer bug (repro steps OK?)        │
│    - Estimer impact                         │
│    - Assigner priorité                      │
│    - Assigner développeur                   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 3. DÉVELOPPEMENT                            │
│    - Créer branche: fix/ticket-id-slug     │
│    - Écrire test (reproduisant bug)        │
│    - Fixer le code                         │
│    - Commit conventional: fix(domain): msg │
│    - Pousser vers GitHub                   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 4. CODE REVIEW + VALIDATION                 │
│    - PR créée (auto-liée à issue)          │
│    - Tests automatiques (CI/CD)             │
│    - Review par au moins 1 dev              │
│    - QA valide dans staging (si major+)    │
│    - Approver + merge                       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│ 5. RELEASE ET MONITORING                    │
│    - Fix inclus dans prochaine version      │
│    - Déploiement production                 │
│    - Monitoring (error rate)                │
│    - Clôturer issue si stable               │
└─────────────────────────────────────────────┘
```

### 4. Analyse des Anomalies (Détection)

| Méthode | Outil | Fréquence | Seuil d'Alerte |
|---------|-------|-----------|----------------|
| **Tests CI/CD** | GitHub Actions | À chaque push | ✗ 1 test fail |
| **Couverture** | Jest + PHPUnit | À chaque merge | < 70% |
| **Lint** | ESLint + PHPStan | À chaque push | > 0 erreur |
| **Performance** | Lighthouse | 1x par semaine | < 50 Perf score |
| **Logs** | Symfony Monolog | En production | Error rate > 1% |
| **Monitoring** | GitHub Actions logs | Après deploy | ✗ Workflow fail |

### 5. Corrections et Améliorations Associées

Lors du fix :

1. **Amélioration de test** :
   - Ajouter cas limites testé + validé
   - Augmenter couverture si applicable
   - Documenter comportement attendu

2. **Documentation** :
   - Commenter pourquoi (business logic)
   - Linker issue dans commits
   - Ajouter à changelog si user-facing

3. **Prévention similaires** :
   - Audit code connexe pour patterns similaires
   - Proposer refactor si technique pourrie
   - Éduquer l'équipe (review comment)

### 6. Métriques de Suivi

Mesurer efficacité du processus :

```
- Mean Time To Triage (MTTT): Temps signalement → assignation
- Mean Time To Fix (MTTF): Temps signalement → merge fix
- Mean Time To Deploy (MTTD): Temps fix → production
- Bug Recurrence Rate: % bugs similaires futurs
- Severity Trend: Evolution bugs par mois
```

---

## �📝 Contribution

Avant de committer :

```bash
# Backend
cd backend
composer fix:check  # ou: vendor/bin/php-cs-fixer fix
php vendor/bin/phpstan analyse -c phpstan.neon.dist
php vendor/bin/phpunit

# Frontend
cd frontend
npm run lint
npm run format:check
npm test
```

Utilisez [Conventional Commits](https://www.conventionalcommits.org/) :
```
feat: add export CSV feature
fix: correct game capacity validation
chore: update dependencies
```

---
