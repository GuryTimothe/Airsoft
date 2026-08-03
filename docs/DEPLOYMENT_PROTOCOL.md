# Protocoles de Déploiement Continu et Intégration Continue

**Environnements :** Development local (`dev` via Docker), Production distante (HexaLabs, services séparés)

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
               ↓
          lighthouse.yml
               ↓
             pa11y.yml
               ↓
        (main uniquement)
          release.yml
               ↓
            deploy.yml
       

        [PASS] → Merge / Déploiement possible

        [FAIL] → Merge bloqué
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
| `lighthouse.yml` | Audit des performances frontend et vérification des budgets qualité | Après `frontend-ci.yml` |
| `pa11y.yml` | Tests automatisés d'accessibilité selon les critères WCAG | Après `lighthouse.yml` |
| `deploy.yml` | Déploiement automatique vers les environnements configurés | Après validation complète du pipeline sur la branche `main` uniquement |
| `release.yml` | Génération du changelog et gestion des versions | Branche `main` uniquement |

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

## 2.1 Versioning et Release Automation

### Outil utilisé

```bash
release-please (Google)
```

L'outil permet d'automatiser :

- la gestion des versions
- la génération du changelog
- la création des releases GitHub
- la création des tags Git

---

### Déclenchement

Une release est préparée après validation complète du pipeline CI sur la branche `main`

Le merge sur `main` déclenche deux mécanismes distincts et indépendants :
- **`release-please`** : génère la version, le changelog et le tag Git (opérationnel)
- **`deploy.yml`** : prépare un déploiement externe adapté à la cible d'hébergement

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

> La production distante est hébergée sur un environnement à services séparés et ne dépend pas de Docker Compose.

---

### 2.4.1 Production (`main`)

L'environnement production est destiné à contenir la version accessible aux utilisateurs.

**Déclenchement :**

- Merge vers `main`

**Actions prévues :**

```bash
- Build des applications backend et frontend
- Génération de la release (release-please)
- Déploiement des artefacts vers l'hébergement cible
```

---

## 2.5 Déploiement production

Le déploiement repose sur un transfert d'artefacts ou une procédure d'hébergement adaptée à la cible, plutôt que sur une conteneurisation.

**Fichier :**

```bash
.github/workflows/deploy.yml
```

**Étapes prévues :**

```bash
- Build des applications backend et frontend
- Publication des artefacts vers l'hébergement cible
- Redémarrage des services si nécessaire
```


# 3. Gestion des Releases

Les releases sont générées automatiquement grâce au système de versioning configuré.

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
│   ├── security-scanner.yml
│   ├── lighthouse.yml
│   ├── pa11y.yml
│   ├── deploy.yml
│   └── release.yml
│
├── release configuration
│
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
| GitHub Actions | Automatisation CI/CD |
| FTP | Transfert des fichiers vers le serveur cible |
| release-please | Gestion des versions |
| Semantic Versioning | Convention des releases |
| Conventional Commits | Automatisation changelog |

---