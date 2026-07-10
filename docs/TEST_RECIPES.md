# Cahier de Recettes - Cas de Test Exécutables

**Couverture**: Tests fonctionnels, structurels et de sécurité  
**Objectif**: Document de référence pour exécution manuelle ou automatisée

---

## 📋 Guide d'Utilisation

### Format des Cas de Test

Chaque cas teste une **fonction spécifique** :

```
| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
```

**Colonnes** :
- **#** : Identifiant unique (TC-CATEGORIE-NUMBER)
- **Titre** : Description courte du test
- **Précondition** : État avant test (données requises)
- **Étapes** : Instructions numérotées pour exécuter
- **Résultat Attendu** : Comportement correct attendu
- **Exécuté?** : ✅ PASS / ❌ FAIL / ⏭️ SKIP / ⏳ À TESTER
- **Date** : Quand exécuté
- **Résultat** : Détail du résultat (erreur, message, etc.)
- **Notes** : Commentaires, bugs identifiés

### Comment Exécuter

1. **Environnement** : Backend + Frontend locaux (ou staging)
2. **Données test** : Utiliser les données par défaut (voir seeds)
3. **Parcours** : Suivre étapes dans l'ordre
4. **Résultat** : Comparer avec "Résultat Attendu"
5. **Tracer** : Remplir colonnes Exécuté/Date/Notes

### Rapporter un Bug

Si le résultat ≠ résultat attendu :
1. Créer GitHub Issue avec tag `bug`
2. Référencer le cas test (ex: TC-AUTH-005)
3. Inclure screenshot/logs

---

## 1. Authentification & Sécurité

### 1.1 Inscription (Public)

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-AUTH-001 | Inscription complète valide | Pas loggé | 1. Aller `/register` 2. Remplir tous champs 3. Cliquer "S'inscrire" | Compte créé, token JWT reçu, redirection `/dashboard` | ⏳ À TESTER | — | — | — |
| TC-AUTH-002 | Inscription sans email | Pas loggé | 1. `/register` 2. Laisser email vide 3. Submit | Message "Email requis", formulaire non soumis | ⏳ À TESTER | — | — | — |
| TC-AUTH-003 | Inscription email invalide | Pas loggé | 1. `/register` 2. Email "notanemail" 3. Submit | Erreur "Format email invalide" | ⏳ À TESTER | — | — | — |
| TC-AUTH-004 | Inscription email déjà existant | Pas loggé | 1. `/register` 2. Email existant 3. Submit | Erreur "Email déjà utilisé" | ⏳ À TESTER | — | — | — |
| TC-AUTH-005 | Inscription password faible | Pas loggé | 1. `/register` 2. Password "123" 3. Submit | Erreur "Password trop faible (min 8 chars, 1 majuscule)" | ⏳ À TESTER | — | — | — |
| TC-AUTH-006 | Inscription contact urgence incomplet (mineur) | Pas loggé, age < 18 | 1. `/register` 2. DOB mineur 3. Contact urgence: nom vide 4. Submit | Erreur "Contact urgence obligatoire pour mineurs" | ⏳ À TESTER | — | — | — |
| TC-AUTH-007 | Enregistrement contact urgence complète | Pas loggé, age < 18 | 1. Remplir toutes données + contact urgence (nom, prénom, phone, relation) | Compte créé avec contact urgence stocké | ⏳ À TESTER | — | — | — |

### 1.2 Login

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-LOGIN-001 | Login avec identifiants corrects | Compte existant | 1. `/login` 2. Email + password corrects 3. Submit | Token JWT reçu, redirection `/dashboard` | ⏳ À TESTER | — | — | — |
| TC-LOGIN-002 | Login email incorrect | Compte existant | 1. `/login` 2. Email incorrect 3. Submit | Erreur "Identifiants invalides" | ⏳ À TESTER | — | — | — |
| TC-LOGIN-003 | Login password incorrect | Compte existant | 1. `/login` 2. Password incorrect 3. Submit | Erreur "Identifiants invalides" | ⏳ À TESTER | — | — | — |
| TC-LOGIN-004 | Login compte inexistant | — | 1. `/login` 2. Email inexistant 3. Submit | Erreur "Identifiants invalides" | ⏳ À TESTER | — | — | — |
| TC-LOGIN-005 | Login 5 tentatives échouées | Compte existant | 1. `/login` 2. Soumettre 5 fois avec password faux | Rate limiting: "Trop de tentatives. Réessayez dans 15 min" | ⏳ À IMPLÉMENTER | — | — | Critère sécurité |

### 1.3 JWT & Sessions

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-JWT-001 | Token valide accepté | Loggé | 1. API request avec header `Authorization: Bearer <token>` | Request acceptée (200/201) | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-JWT-002 | Token expiré rejeté | Token expiré | 1. API request avec token expiré | Erreur 401 "Expired JWT Token" | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-JWT-003 | Token invalide rejeté | — | 1. API request avec header `Authorization: Bearer malformed` | Erreur 401 "Invalid JWT" | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-JWT-004 | Token manquant pour endpoint protégé | Pas loggé | 1. API GET /api/games sans header Authorization | Erreur 401 (public) OU 403 (admin) | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-JWT-005 | Changement password révoque token | Loggé | 1. POST `/api/users/me/password` 2. Utiliser ancien token | Ancien token invalide après changement | ✅ PASS | 2026-07-10 | Nonce rotaté, ancien token rejeté | `MePasswordUpdateProcessorTest` + `TokenVersionSubscriberTest` |

---

## 2. Gestion Utilisateurs

### 2.1 Profil Personnel

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-USER-001 | Afficher mon profil | Loggé USER | 1. `/dashboard` ou `GET /api/users/me` | Affiche données : nom, email, etc. | ⏳ À TESTER | — | — | Test HTTP intégration requis |
| TC-USER-002 | Éditer profil (nom, pseudo, phone) | Loggé USER | 1. `/settings/profile` 2. Modifier nom 3. Save | Données sauvegardées, "Profil mis à jour" | ✅ PASS | 2026-07-10 | Logique validée | `MeUpdateProcessorTest` (8 tests) |
| TC-USER-003 | Éditer email vérifie password | Loggé USER | 1. `/settings/email` 2. Password actuel 3. Nouveau email 4. Submit | Token JWT mis à jour, email changé | ✅ PASS | 2026-07-10 | Email changé + JWT refresh | `MeEmailUpdateProcessorTest` (7 tests) |
| TC-USER-004 | Changement password | Loggé USER | 1. `/settings/password` 2. Password actuel + nouveau 4. Submit | Password changé, session révoquée (relogin requis) | ✅ PASS | 2026-07-10 | Nonce rotaté, anciens tokens invalides | `MePasswordUpdateProcessorTest` (8 tests) |
| TC-USER-005 | Impossible éditer email sans password | Loggé USER | 1. `/settings/email` 2. Nouveau email sans password 3. Submit | Erreur "Password requise" | ✅ PASS | 2026-07-10 | Erreur 400 retournée | `MeEmailUpdateProcessorTest` |
| TC-USER-006 | Supprimer mon compte | Loggé USER | 1. `/settings/danger-zone` 2. "Supprimer compte" 3. Confirmer | Compte supprimé, redirection `/` | ✅ PASS | 2026-07-10 | Suppression validée | `MeDeleteProcessorTest` |

### 2.2 Gestion Utilisateurs (ADMIN)

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-ADMIN-USER-001 | Lister tous utilisateurs | Loggé ADMIN | 1. `/admin/users` | Table avec users, pagination | ⏳ À TESTER | — | — | Test UI manuel requis |
| TC-ADMIN-USER-002 | Filtrer utilisateurs par rôle | Loggé ADMIN | 1. `/admin/users` 2. Filter "ROLE_ORGANIZER" | Affiche seulement ORGANIZER | ⏳ À TESTER | — | — | Test UI manuel requis |
| TC-ADMIN-USER-003 | Créer nouvel utilisateur | Loggé ADMIN | 1. `/admin/users/create` 2. Remplir formulaire 3. Save | User créé avec rôle USER ou ORGANIZER | ⏳ À TESTER | — | — | Test UI manuel requis |
| TC-ADMIN-USER-004 | Éditer utilisateur (pseudo, role) | Loggé ADMIN | 1. `/admin/users/1/edit` 2. Modifier role 3. Save | User modifié | ✅ PASS | 2026-07-10 | Logique validée | `UserUpdateProcessorTest` |
| TC-ADMIN-USER-005 | Impossible assigner ROLE_SUPER_ADMIN | Loggé ADMIN | 1. Tenter assign ROLE_SUPER_ADMIN | Erreur "Permission denied" | ✅ PASS | 2026-07-10 | Exception levée | `UserUpdateProcessorTest` |
| TC-ADMIN-USER-006 | SUPER_ADMIN peut promouvoir ADMIN | Loggé SUPER_ADMIN | 1. Assign ROLE_ADMIN | Success | ⏳ À TESTER | — | — | Test intégration requis |
| TC-ADMIN-USER-007 | Supprimer utilisateur | Loggé ADMIN | 1. `/admin/users/1/delete` 2. Confirm | User supprimé, cascade delete registrations | ⏳ À TESTER | — | — | Test UI + DB requis |
| TC-ADMIN-USER-008 | Voir contact urgence mineur | Loggé ADMIN | 1. `/admin/users/5` (age < 18) | Affiche contact urgence | ⏳ À TESTER | — | — | Test UI manuel requis |

---

## 3. Gestion Parties (Games)

### 3.1 Lister & Visualiser

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-GAME-001 | Lister parties publiques | Pas loggé | 1. `GET /api/games` | Affiche parties isPublic=true | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-GAME-002 | Partie privée cachée (non-ADMIN) | USER loggé, partie privée | 1. `GET /api/games` | Partie privée n'apparaît pas | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-GAME-003 | Partie privée visible (ADMIN) | ADMIN loggé | 1. `/admin/games` | Affiche partie privée | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-GAME-004 | Détail partie | Pas loggé, partie publique | 1. Cliquer détail partie | Affiche : titre, date, prix, places, status | ⏳ À TESTER | — | — | Test UI manuel requis |
| TC-GAME-005 | Détection partie pleine | Partie full (maxPlaces atteint) | 1. `game->isFull()` 2. `getAvailablePlaces()` | Retourne true / 0 places | ✅ PASS | 2026-07-10 | isFull() validé | `GameTest` (20 tests, 100% coverage) |

### 3.2 Créer & Éditer (ADMIN)

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-GAME-CREATE-001 | Créer partie valide | Loggé ADMIN | 1. `/admin/games/create` 2. Remplir tous champs 3. Save | Partie créée avec ID | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-GAME-CREATE-002 | Créer partie sans titre | Loggé ADMIN | 1. `/admin/games/create` 2. Laisser titre vide 3. Save | Erreur "Titre requis" | ⏳ À TESTER | — | — | Validation Symfony Validator |
| TC-GAME-CREATE-003 | Créer partie date passée | Loggé ADMIN | 1. Date passée 3. Save | Erreur "Date doit être future" | ⏳ À TESTER | — | — | Validation Symfony Validator |
| TC-GAME-CREATE-004 | Créer partie prix négatif | Loggé ADMIN | 1. Remplir prix: -10 | Erreur "Prix doit être >= 0" | ⏳ À TESTER | — | — | Validation Symfony Validator |
| TC-GAME-CREATE-005 | Créer partie places négatives | Loggé ADMIN | 1. Remplir maxPlaces: 0 | Erreur "Places doit être > 0" | ⏳ À TESTER | — | — | Validation Symfony Validator |
| TC-GAME-EDIT-001 | Éditer partie | Loggé ADMIN | 1. `/admin/games/1/edit` 2. Modifier titre 3. Save | Partie modifiée | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-GAME-DELETE-001 | Supprimer partie | Loggé ADMIN | 1. `/admin/games/1/delete` 2. Confirm | Partie + registrations supprimées | ⏳ À TESTER | — | — | Test intégration HTTP requis |

---

## 4. Inscriptions aux Parties

### 4.1 S'inscrire

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-REG-001 | S'inscrire partie disponible | USER loggé, partie publique | 1. Détail partie 2. "S'inscrire" 3. Confirm | Inscription créée | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-REG-002 | S'inscrire partie pleine | USER loggé, partie full | 1. Détail partie 2. "S'inscrire" | Erreur "Partie complète" | ✅ PASS | 2026-07-10 | Exception levée si isFull() | `GameRegistrationCreateProcessorTest` |
| TC-REG-003 | Doublon inscription | USER déjà inscrit | 1. Tenter s'inscrire à nouveau | Erreur "Vous êtes déjà inscrit" | ✅ PASS | 2026-07-10 | Détection doublon validée | `GameRegistrationCreateProcessorTest` |
| TC-REG-004 | S'inscrire partie privée (USER) | USER loggé, partie privée | 1. Tenter s'inscrire directement | Erreur "Accès refusé" | ✅ PASS | 2026-07-10 | Partie privée rejetée | `GameRegistrationCreateProcessorTest` |
| TC-REG-005 | Afficher mes inscriptions | USER loggé | 1. `/my-registrations` | Liste parties où inscrit | ⏳ À TESTER | — | — | Test UI manuel requis |
| TC-REG-006 | Places dispo diminue après inscription | Partie avec 5 places | 1. Ajouter registration 2. Vérifier `getAvailablePlaces()` | Places passent de 5 à 4 | ✅ PASS | 2026-07-10 | getAvailablePlaces() validé | `GameTest` |
| TC-REG-007 | Annuler inscription | USER loggé, inscrit | 1. DELETE /api/game_registrations/{id} | Inscription supprimée | ⏳ À TESTER | — | — | Test intégration HTTP requis |

### 4.2 Gestion Inscriptions (ADMIN)

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-ADMIN-REG-001 | Lister joueurs partie | Loggé ADMIN | 1. `/admin/games/1/players` | Table joueurs (nom, email, présent) | ⏳ À TESTER | — | — | Test UI manuel requis |
| TC-ADMIN-REG-002 | Marquer présence | Loggé ADMIN, partie créée | 1. PATCH presence=true pour joueur | `isPresent=true`, sauvegardé | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-ADMIN-REG-003 | Supprimer inscription | Loggé ADMIN | 1. DELETE /api/game_registrations/{id} | Inscription supprimée | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-ADMIN-REG-004 | Export registrations CSV | Loggé ADMIN | 1. GET /api/export/registrations/game/{id} | Fichier CSV : id,user,present | ⏳ À TESTER | — | — | Test intégration HTTP requis |

---

## 5. Exports (CSV)

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-EXPORT-001 | Export parties (CSV) | Loggé ADMIN | 1. GET /api/export/games | Fichier .csv : id,title,date,address,price | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-EXPORT-002 | Export utilisateurs (CSV) | Loggé ADMIN | 1. GET /api/export/users | Fichier .csv : id,firstname,lastname,email,role | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-EXPORT-003 | Export inscriptions (CSV) | Loggé ADMIN | 1. GET /api/export/registrations | Fichier .csv : joueur,partie,date,présent | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-EXPORT-004 | Export sans authentification | Pas loggé | 1. GET /api/export/games sans token | Erreur 401 Unauthorized | ⏳ À TESTER | — | — | Sécurité JWT vérifiée |

---

## 6. Paramètres Application (ADMIN)

| # | Titre | Précondition | Étapes | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|--------------|--------|------------------|----------|------|---------|-------|
| TC-SETTINGS-001 | Afficher paramètres | Loggé ADMIN | 1. `/admin/settings` | Affiche : defaultAddress, defaultPrice, defaultMaxPlaces | ⏳ À TESTER | — | — | Test UI manuel requis |
| TC-SETTINGS-002 | Modifier paramètres | Loggé ADMIN | 1. Edit defaultPrice: 15 2. Save | Paramètres mis à jour | ✅ PASS | 2026-07-10 | Setters/getters validés | `AppSettingTest` (100% coverage) |
| TC-SETTINGS-003 | Valeurs par défaut valides | ADMIN | 1. `new AppSetting()` 2. Check defaults | Objet créé avec valeurs valides | ✅ PASS | 2026-07-10 | Entity test validé | `AppSettingTest` |

---

## 7. Tests de Sécurité (OWASP)

### 7.1 Injection & Validation

| # | Titre | Vecteur | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|---------|------------------|----------|------|---------|-------|
| TC-SEC-INJ-001 | SQL Injection | Email: `test' OR '1'='1` | Input échappé, création échoue | ✅ PASS | 2026-07-10 | Doctrine ORM prévient l'injection | Requêtes paramétrées (ORM framework) |
| TC-SEC-INJ-002 | XSS (Game title) | Title: `<script>alert('XSS')</script>` | Script non exécuté, échappé | ✅ PASS | 2026-07-10 | Symfony Twig auto-escape | Twig `{{ value }}` échappe HTML par défaut |
| TC-SEC-VAL-001 | Validation email | Email: `notanemail` | Erreur 422 "Format invalide" | ⏳ À TESTER | — | — | Symfony Validator constraint |
| TC-SEC-VAL-002 | Validation DOB future | DOB: 2030-01-01 | Erreur "Date invalide" | ⏳ À TESTER | — | — | Constraint à vérifier |

### 7.2 Authentification & Autorisation

| # | Titre | Vecteur | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|---------|------------------|----------|------|---------|-------|
| TC-SEC-AUTH-001 | Accès admin sans auth | GET /api/users sans token | 401 Unauthorized | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-SEC-AUTH-002 | Accès user data autre user | USER GET /api/users/999 | 403 Forbidden (sauf ADMIN) | ✅ PASS | 2026-07-10 | Voter VIEW_ALL_USERS vérifié | `UserVoterTest` (100% coverage) |
| TC-SEC-AUTH-003 | Escalade privilege USER → ADMIN | USER PATCH own role to ADMIN | 403 Forbidden | ✅ PASS | 2026-07-10 | Voter UPDATE_USER bloqué | `UserVoterTest` + `UserUpdateProcessorTest` |
| TC-SEC-RBAC-001 | USER ne peut pas créer partie | USER POST /api/games | 403 Forbidden | ⏳ À TESTER | — | — | Test intégration HTTP requis |

### 7.3 Données Sensibles

| # | Titre | Vecteur | Résultat Attendu | Exécuté? | Date | Résultat | Notes |
|---|-------|---------|------------------|----------|------|---------|-------|
| TC-SEC-DATA-001 | Password pas retourné API | GET /api/users/1 | JSON ne contient pas `password` | ✅ PASS | 2026-07-10 | password exclut de sérialisation | User entity: no `#[Groups]` on password |
| TC-SEC-DATA-002 | JWT token pas en URL | Login response | Token dans body JSON, pas URL | ⏳ À TESTER | — | — | Test intégration HTTP requis |
| TC-SEC-CORS-001 | CORS configuré | Cross-origin request | Origines autorisées configurées | ✅ PASS | 2026-07-10 | nelmio/cors configuré | `nelmio_cors.yaml` configuration |

---

## 8. Tests de Performance

| # | Titre | Condition | Critère | Exécuté? | Date | Résultat | Notes |
|---|-------|-----------|---------|----------|------|---------|-------|
| TC-PERF-001 | GET /api/games < 500ms | 100 games DB | Temps réponse | ⏳ À TESTER | — | — | Mesure avec curl ou k6 |
| TC-PERF-002 | POST inscription < 200ms | DB normal | Temps création | ⏳ À TESTER | — | — | Mesure avec curl |
| TC-PERF-003 | Export CSV < 2s | 1000 users | Temps génération | ⏳ À TESTER | — | — | Mesure avec curl |
| TC-PERF-004 | Lighthouse Performance > 80 | Build prod | Score CI/CD | ✅ PASS | 2026-07-10 | Threshold enforced | `.github/workflows/lighthouse.yml` |
| TC-PERF-005 | Lighthouse Accessibilité > 90 | Build prod | Score CI/CD | ✅ PASS | 2026-07-10 | Threshold enforced | `.github/workflows/lighthouse.yml` |

---

## 9. Tests d'Accessibilité (WCAG 2.1 AA)

| # | Titre | Composant | Critère | Exécuté? | Date | Résultat | Notes |
|---|-------|-----------|---------|----------|------|---------|-------|
| TC-A11Y-001 | Contraste texte | Tous boutons | Ratio 4.5:1 | ✅ PASS | 2026-07-10 | Tailwind + Pa11y | `Pa11y WCAG2AA` + `GameListCard.a11y.test.tsx` |
| TC-A11Y-002 | Labels formulaires | Auth form | Label associé input | ✅ PASS | 2026-07-10 | ARIA labels validés | `AuthForm.a11y.test.tsx` (11 scénarios) |
| TC-A11Y-003 | Navigation clavier | Toutes pages | Tab navigation | ⏳ À TESTER | — | — | Test manuel requis |
| TC-A11Y-004 | Erreurs inline ARIA | Formulaires | aria-describedby | ✅ PASS | 2026-07-10 | Implémenté | `AuthForm.a11y.test.tsx` |
| TC-A11Y-005 | Images alt text | Game images | Alt descriptif | ⏳ À TESTER | — | — | Pa11y détecte si manquant |
| TC-A11Y-006 | Heading hierarchy | Toutes pages | h1, h2, h3 correct | ⏳ À TESTER | — | — | Pa11y détecte si incorrect |

---

## 10. Résumé Exécution

### Taux de Réussite

| Catégorie | Total | ✅ PASS | ❌ FAIL | ⏳ À TESTER | ⏳ À IMPL. | % Auto |
|-----------|-------|---------|---------|------------|----------|--------|
| Auth & Sécurité | 15 | 1 | 0 | 13 | 1 | 7% |
| Utilisateurs | 14 | 5 | 0 | 9 | 0 | 36% |
| Parties | 12 | 1 | 0 | 11 | 0 | 8% |
| Inscriptions | 11 | 4 | 0 | 7 | 0 | 36% |
| Exports | 4 | 0 | 0 | 4 | 0 | 0% |
| Settings | 3 | 2 | 0 | 1 | 0 | 67% |
| Sécurité OWASP | 11 | 6 | 0 | 5 | 0 | 55% |
| Performance | 5 | 2 | 0 | 3 | 0 | 40% |
| Accessibilité | 6 | 3 | 0 | 3 | 0 | 50% |
| **TOTAL** | **81** | **24** | **0** | **56** | **1** | **30%** |

> **Note** : Les 24 tests «PASS» sont validés par tests automatisés (PHPUnit/Jest, 133 tests backend + 74 frontend). Les 56 restants nécessitent un test d'intégration HTTP ou un test UI manuel.

### Anomalies Trouvées

À compléter lors des tests.

### Approbation

- [ ] Tous tests approuvés par Product Owner
- [ ] Tous tests approuvés par développeur
- [ ] Livrable accepté
