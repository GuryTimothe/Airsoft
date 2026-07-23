# Critères de Qualité et Performance

## 1. Critères Code Quality

### 1.1 Couverture de Tests

**Cible** : > 70% couverture code

| Composant | Outil | Cible | Actuel | Statut |
|-----------|-------|-------|--------|--------|
| **Backend PHP** | PHPUnit | > 70% | **71,44%** | ✅ Atteint |
| **Frontend TS/React** | Jest | > 70% | **80,95%** | ✅ Dépassé |

**Exécution locale** :

```bash
# Backend avec report HTML
cd backend
php bin/console test --coverage

# Frontend avec report HTML
cd frontend
npm test -- --coverage
```

### 1.2 Analyse Statique (Linting)

| Outil | Composant | Seuil | Commande |
|-------|-----------|-------|----------|
| **PHPStan** | Backend | 0 erreur niveau 5 | `php ./vendor/bin/phpstan analyse src/ --level 5` |
| **ESLint** | Frontend | 0 erreur | `npm run lint` |
| **Prettier** | Frontend/Config | Format standard | `npm run format:check` |

**Configuration** :
- Backend: `phpstan.neon.dist` (level 5 = strict)
- Frontend: `.eslintrc.json` (Next.js config)
- Prettier: `.prettierrc` (2 spaces, etc.)

### 1.3 Vérifications Minimales

✓ **Type safety** :
- PHP 8.4+ mode strict
- TypeScript (no `any` sauf cas justifiés)

✓ **Complexité cyclomatique** :
- Maximum 10 par fonction
- PHPStan + ESLint appliquent seuil

✓ **Code review** :
- PR require 1 approval minimum
- Tous tests doivent passer

### 1.4 Documentation Code

| Élément | Standard | Obligatoire |
|---------|----------|------------|
| **Methods publiques** | JSDoc / PHPDoc | ✓ Classes publiques |
| **Complexes sections** | Commentaires inline | ✓ Si complexity > 10 |
| **Entités BD** | Entity comment block | ✓ Tous les entities |
| **API Endpoints** | API Platform docs | ✓ ApiResource #[Get], etc. |

## 2. Critères Performance

### 2.1 Performance API (Backend)

**Mesure** : Temps réponse HTTP

| Endpoint | Seuil | Outil | Fréquence |
|----------|-------|-------|-----------|
| **GET /api/games** | < 200 ms | Lighthouse / curl | À chaque merge |
| **POST /api/game_registrations** | < 500 ms | curl -w | À chaque merge |
| **Export CSV** | < 2 sec | curl | 1x semaine |
| **DB Query** | < 100 ms | Doctrine profiler | À chaque développement |

**Test local** :

```bash
# Mesurer temps réponse
time curl http://localhost:8000/api/games

# Avec plus de détails
curl -w "@-" -o /dev/null -s http://localhost:8000/api/games << 'EOF'
    time_connect: %{time_connect}
    time_starttransfer: %{time_starttransfer}
    time_total: %{time_total}
EOF
```

### 2.2 Performance Frontend (Web)

**Mesure** : Lighthouse + Core Web Vitals

| Métrique | Seuil | Outil | Cible |
|----------|-------|-------|-------|
| **Lighthouse Performance** | > 50 (baseline pragmatique) | Chrome DevTools | Prod |
| **First Contentful Paint (FCP)** | < 1.5 s | Web Vitals | < 1.5s |
| **Largest Contentful Paint (LCP)** | < 2.5 s | Web Vitals | < 2.5s |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Web Vitals | Stable |
| **Bundle size (JS)** | < 300 KB | webpack-bundle-analyzer | Gzip |
| **CSS size** | < 50 KB | webpack | Gzip |

**Audit local** :

```bash
# Build et test
cd frontend
npm run build

# Lighthouse via Chrome DevTools
# F12 → Lighthouse → Generate report
```

## 3. Critères Sécurité

## 3.1 OWASP Top 10

**Voir [SECURITY_OWASP.md](./SECURITY_OWASP.md) pour plus de détails**

---

# 3.2 Mesures de Sécurité Implémentées


## Authentification

L'application utilise une authentification basée sur JWT.

Mesures appliquées :

- Authentification via JWT Bearer Token.
- Validation des tokens côté backend.
- Expiration des tokens configurée.
- Hashage sécurisé des mots de passe via Symfony Password Hasher.
- Accès aux routes sensibles protégé.


## Autorisation

Les contrôles d'accès sont réalisés exclusivement côté backend.

Règles appliquées :

- Utilisation des Symfony Security Voters.
- Vérification des permissions selon les rôles utilisateurs.
- RBAC avec rôles applicatifs.
- Aucun contrôle de sécurité effectué uniquement côté frontend.


## Validation des données

Les données entrantes sont validées sur les deux couches.

Backend :

- Symfony Validator.
- Contraintes sur les entités et DTO.
- Validation avant traitement métier.

Frontend :

- Validation avec Zod.
- React Hook Form pour la gestion des formulaires.
- Amélioration de l'expérience utilisateur.


## Protection contre les injections

Mesures appliquées :

- Utilisation de Doctrine ORM.
- Requêtes paramétrées.
- Absence de SQL brut non contrôlé.
- Validation des entrées utilisateur.


## Protection frontend

Mesures appliquées :

- Échappement automatique React.
- Pas d'utilisation de `dangerouslySetInnerHTML` sans justification.
- Validation des formulaires avant envoi.
- Protection des routes sensibles côté serveur.


## Gestion des secrets

Règles :

- Aucun secret dans le dépôt Git.
- Variables sensibles dans `.env.local`.
- Secrets JWT stockés dans des fichiers protégés.
- Configuration différente entre développement et production.

## 4. Critères Fonctionnalité

### 4.1 User Stories Covered

| Feature | Rôle | Status | Tests |
|---------|------|--------|-------|
| Créer compte | Public | ✓ | Unit + Integration |
| S'inscrire partie | USER | ✓ | Unit + Integration |
| Annuler inscription | USER | ✓ | Unit + Integration |
| Voir ses inscriptions | USER | ✓ | Integration |
| Marquer présence | ADMIN | ✓ | Integration |
| Exporter CSV joueurs | ADMIN | ✓ | Integration |
| Configurer app settings | ADMIN | ✓ | Integration |
| Gestion utilisateurs | ADMIN | ✓ | Integration |
| Voir contacts urgence | ADMIN | ✓ | Integration (mineurs) |

### 4.2 Cas Limites Testés

| Cas | Expected | Status |
|-----|----------|--------|
| Inscription capacité pleine | Rejet (sauf admin) | ✓ Pass |
| Login données invalides | 401 Unauthorized | ✓ Pass |
| Accès ressource ajena | 403 Forbidden | ✓ Pass |
| Requête sans JWT token | 401 Unauthorized | ✓ Pass |
| Requête token expiré | 401 Unauthorized | ✓ Pass |
| POST données invalides | 422 Unprocessable | ✓ Pass |
| DB indisponible | 500 Server Error | ✓ Pass |
| Inscriptions concurrent | Unique constraint | ✓ Pass |

---

## 5. Plan de Tests

### 5.1 Niveaux de Test

| Niveau | Outil | Fréquence | Seuil Pass |
|--------|-------|-----------|-----------|
| **Unitaires** | PHPUnit, Jest | À chaque commit | 100% pass |
| **Intégration** | PHPUnit custom | À chaque push | 100% pass |
| **Smoke** | API calls simples | À chaque déploiement | 100% pass |
| **Performance** | Lighthouse, curl | 1x semaine | Seuils respectés |
| **Sécurité** | Manual + outils | 1x mois | 0 critique |

### 5.2 Matrice Tests Fonctionnels

```
┌────────────────────┬──────────────┬──────────┬─────────────┐
│ Test Case          │ Scénario     │ Expected │ Status      │
├────────────────────┼──────────────┼──────────┼─────────────┤
│ Register game      │ Valid user   │ 201      │ ✓ Pass      │
│ Register full      │ Capacity 0   │ 409      │ ✓ Pass      │
│ Cancel own reg     │ User owner   │ 204      │ ✓ Pass      │
│ Cancel other reg   │ Not owner    │ 403      │ ✓ Pass      │
│ Export CSV admin   │ JWT token    │ 200 CSV  │ ✓ Pass      │
│ Export CSV user    │ No JWT       │ 403      │ ✓ Pass      │
│ Toggle presence    │ ADMIN role   │ 200 OK   │ ✓ Pass      │
│ Toggle non-admin   │ USER role    │ 403      │ ✓ Pass      │
└────────────────────┴──────────────┴──────────┴─────────────┘
```

### 5.3 Exécution Tests

```bash
# Backend
cd backend
php bin/console test --coverage

# Frontend
cd frontend
npm test -- --coverage

# CI/CD (GitHub Actions)
# Automatique sur chaque push
```

---

## 6. Reporting et Dashboards

### 6.1 Métriques Tracées (GitHub Actions)

Chaque workflow affiche :
- ✓ Test results (pass/fail count)
- ✓ Build time
- ✓ Lint violations
- ✓ All logs

**Accès** : GitHub → Actions tab → Dernier run

### 6.2 Alertes

| Condition | Action | Escalade |
|-----------|--------|----------|
| Tests fail | PR blocked | Notif GitHub |
| Coverage drop | Warning | PR comment |
| Build slow | Advisory | Slack/Email |

---

## 7. Configuration Fichiers

| Fichier | Rôle | Localisation |
|---------|------|-------------|
| `phpunit.dist.xml` | Tests backend config | `backend/` |
| `phpstan.neon.dist` | PHPStan config | `backend/` |
| `.php-cs-fixer.dist.php` | Code style PHP | `backend/` |
| `jest.config.js` | Jest config | `frontend/` |
| `tsconfig.json` | TypeScript config | `frontend/` |
| `.eslintrc.json` | ESLint config | `frontend/` |
| `.prettierrc` | Prettier config | Root |
| `.prettierignore` | Prettier exclusions | Root |

---

## 8. Commands Rapides

```bash
# Tous les checks avant push
cd backend && php ./vendor/bin/phpstan analyse src/ --level 5 && php bin/console test

cd frontend && npm run lint && npm test

# Coverage reports
cd backend && php bin/console test --coverage
cd frontend && npm test -- --coverage
```

---

## 9. Accessibilité  - WCAG 2.1 AA Conforme

**Voir [ACCESSIBILITY.md](./ACCESSIBILITY.md) pour plus de détails**

------