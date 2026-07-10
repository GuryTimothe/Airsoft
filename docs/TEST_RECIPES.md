# Cahier de Recettes - Cas de Test Exécutables

**Version**: 1.0.0  
**Date**: 2026-07-10  
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
| TC-JWT-001 | Token valide accepté | Loggé | 1. API request avec header `Authorization: Bearer <token>` | Request acceptée (200/201) | ⏳ À TESTER | — | — | — |
| TC-JWT-002 | Token expiré rejeté | Token expiré | 1. API request avec token expiré | Erreur 401 "Expired JWT Token" | ⏳ À TESTER | — | — | — |
| TC-JWT-003 | Token invalide rejeté | — | 1. API request avec header `Authorization: Bearer malformed` | Erreur 401 "Invalid JWT" | ⏳ À TESTER | — | — | — |
| TC-JWT-004 | Token manquant pour endpoint protégé | Pas loggé | 1. API GET /api/games sans header Authorization | Erreur 401 (public) OU 403 (admin) | ⏳ À TESTER | — | — | — |
| TC-JWT-005 | Changement password révoque token | Loggé | 1. POST `/api/users/me/password` 2. Utiliser ancien token | Ancien token invalide après changement | ⏳ À TESTER | — | — | — |

---

## 2. Gestion Utilisateurs

### 2.1 Profil Personnel

| # | Titre | Précondition | Étapes | Résultat attendu | Statut |
|---|-------|--------------|--------|------------------|--------|
| TC-USER-001 | Afficher mon profil | Loggé USER | 1. `/dashboard` ou `GET /api/users/me` | Affiche données : nom, email, avatar, etc. | ✓ À tester |
| TC-USER-002 | Éditer profil (nom, pseudo, phone) | Loggé USER | 1. `/settings/profile` 2. Modifier nom 3. Save | Données sauvegardées, message "Profil mis à jour" | ✓ À tester |
| TC-USER-003 | Éditer email requis de vérifier password | Loggé USER | 1. `/settings/email` 2. Saisir password actuel 3. Nouveau email 4. Submit | Token JWT mis à jour, email changé | ✓ À tester |
| TC-USER-004 | Changement password | Loggé USER | 1. `/settings/password` 2. Password actuel 3. Nouveau password 4. Submit | Password changé, session révoquée (relogin requis) | ✓ À tester |
| TC-USER-005 | Impossible éditer email sans password | Loggé USER | 1. `/settings/email` 2. Nouveau email sans password 3. Submit | Erreur "Password requise" | ✓ À tester |
| TC-USER-006 | Supprimer mon compte | Loggé USER | 1. `/settings/danger-zone` 2. "Supprimer compte" 3. Confirmer | Compte supprimé, redirection `/` non authentifié | ✓ À tester |

### 2.2 Gestion Utilisateurs (ADMIN)

| # | Titre | Précondition | Loggé ADMIN | Étapes | Résultat attendu | Statut |
|---|-------|--------------|----------|--------|------------------|--------|
| TC-ADMIN-USER-001 | Lister tous utilisateurs | - | OUI | 1. `/admin/users` | Table avec 15 users/page, pagination | ✓ À tester |
| TC-ADMIN-USER-002 | Filtrer utilisateurs par rôle | - | OUI | 1. `/admin/users` 2. Filter "ROLE_ORGANIZER" 3. Apply | Affiche seulement ORGANIZER | ✓ À tester |
| TC-ADMIN-USER-003 | Créer nouvel utilisateur | - | OUI | 1. `/admin/users/create` 2. Remplir formulaire 3. Save | User créé avec rôle USER ou ORGANIZER | ✓ À tester |
| TC-ADMIN-USER-004 | Éditer utilisateur (pseudo, role) | - | OUI | 1. `/admin/users/1/edit` 2. Modifier role 3. Save | User modifié | ✓ À tester |
| TC-ADMIN-USER-005 | Impossible assigner ROLE_SUPER_ADMIN | - | OUI (ADMIN) | 1. Try assign ROLE_SUPER_ADMIN | Erreur "Permission denied" | ✓ À tester |
| TC-ADMIN-USER-006 | SUPER_ADMIN peut promouvoir ADMIN | - | OUI (SUPER_ADMIN) | 1. Assign ROLE_ADMIN | Success | À implémenter |
| TC-ADMIN-USER-007 | Supprimer utilisateur | - | OUI | 1. `/admin/users/1/delete` 2. Confirm | User supprimé, cascade delete registrations | ✓ À tester |
| TC-ADMIN-USER-008 | Voir contact urgence mineur | - | OUI | 1. `/admin/users/5` (age < 18) | Affiche contact urgence | ✓ À tester |

---

## 3. Gestion Parties (Games)

### 3.1 Lister & Visualiser

| # | Titre | Précondition | Étapes | Résultat attendu | Statut |
|---|-------|--------------|--------|------------------|--------|
| TC-GAME-001 | Lister parties publiques | Pas loggé | 1. `GET /api/games` | Affiche parties isPublic=true | ✓ À tester |
| TC-GAME-002 | Partie privée cachée (non-ADMIN) | USER loggé, partie privée existe | 1. `GET /api/games` | Partie privée n'apparaît pas | ✓ À tester |
| TC-GAME-003 | Partie privée visible (ADMIN) | ADMIN loggé, partie privée existe | 1. `/admin/games` | Affiche partie privée | ✓ À tester |
| TC-GAME-004 | Détail partie | Pas loggé, partie publique | 1. Cliquer détail partie | Affiche : titre, address, date, prix, places dispo, status | ✓ À tester |
| TC-GAME-005 | Détail partie pleine | Partie full | 1. Voir détail partie pleine | Badge "COMPLÈTE" visible | ✓ À tester |

### 3.2 Créer & Éditer (ADMIN)

| # | Titre | Précondition | Étapes | Résultat attendu | Statut |
|---|-------|--------------|--------|------------------|--------|
| TC-GAME-CREATE-001 | Créer partie valide | Loggé ADMIN | 1. `/admin/games/create` 2. Remplir tous champs 3. Save | Partie créée avec ID, redirection détail | ✓ À tester |
| TC-GAME-CREATE-002 | Créer partie sans titre | Loggé ADMIN | 1. `/admin/games/create` 2. Laisser titre vide 3. Save | Erreur "Titre requis" | ✓ À tester |
| TC-GAME-CREATE-003 | Créer partie date passée | Loggé ADMIN | 1. `/admin/games/create` 2. Date passée 3. Save | Erreur "Date doit être future" | ✓ À tester |
| TC-GAME-CREATE-004 | Créer partie prix négatif | Loggé ADMIN | 1. Remplir prix: -10 | Erreur "Prix doit être >= 0" | ✓ À tester |
| TC-GAME-CREATE-005 | Créer partie places négatives | Loggé ADMIN | 1. Remplir maxPlaces: 0 | Erreur "Places doit être > 0" | ✓ À tester |
| TC-GAME-EDIT-001 | Éditer partie | Loggé ADMIN | 1. `/admin/games/1/edit` 2. Modifier titre 3. Save | Partie modifiée | ✓ À tester |
| TC-GAME-DELETE-001 | Supprimer partie | Loggé ADMIN | 1. `/admin/games/1/delete` 2. Confirm | Partie + ses registrations supprimées | ✓ À tester |

---

## 4. Inscriptions aux Parties

### 4.1 S'inscrire

| # | Titre | Précondition | Étapes | Résultat attendu | Statut |
|---|-------|--------------|--------|------------------|--------|
| TC-REG-001 | S'inscrire partie disponible | USER loggé, partie publique | 1. Détail partie 2. Bouton "S'inscrire" 3. Confirm | Inscription créée, statut "Inscription confirmée" | ✓ À tester |
| TC-REG-002 | S'inscrire partie pleine | USER loggé, partie full | 1. Détail partie 2. "S'inscrire" | Erreur "Partie complète" | ✓ À tester |
| TC-REG-003 | Doublon inscription | USER déjà inscrit | 1. Tenter s'inscrire à nouveau | Erreur "Vous êtes déjà inscrit" | ✓ À tester |
| TC-REG-004 | S'inscrire partie privée (USER) | USER loggé, partie privée | 1. Tenter s'inscrire directement | Erreur "Accès refusé partie privée" | ✓ À tester |
| TC-REG-005 | Afficher mes inscriptions | USER loggé | 1. `/my-registrations` | Listes parties où inscrit | ✓ À tester |
| TC-REG-006 | Places dispo diminue après inscription | Partie avec 5 places | 1. USER1 s'inscrit 2. Vérifier places | Places passent de 5 à 4 | ✓ À tester |

### 4.2 Gestion Inscriptions (ADMIN)

| # | Titre | Précondition | Étapes | Résultat attendu | Statut |
|---|-------|--------------|--------|------------------|--------|
| TC-ADMIN-REG-001 | Lister joueurs partie | Loggé ADMIN | 1. `/admin/games/1/players` | Table joueurs (nom, email, inscrit, présent) | ✓ À tester |
| TC-ADMIN-REG-002 | Marquer présence | Loggé ADMIN, partie créée | 1. Cliquer checkbox "Présent" pour joueur | `isPresent=true`, sauvegardé | ✓ À tester |
| TC-ADMIN-REG-003 | Supprimer inscription | Loggé ADMIN | 1. Cliquer "Supprimer" sur ligne joueur | Inscription supprimée | ✓ À tester |
| TC-ADMIN-REG-004 | Export registrations CSV | Loggé ADMIN | 1. `/admin/games/1/export` 2. Format CSV | Fichier téléchargé : id,user,present | ✓ À tester |

---

## 5. Exports (CSV)

| # | Titre | Précondition | Étapes | Résultat attendu | Statut |
|---|-------|--------------|--------|------------------|--------|
| TC-EXPORT-001 | Export parties (CSV) | Loggé ADMIN | 1. `/admin/exports` 2. Télécharger "Games" | Fichier .csv avec colonnes : id,title,date,address,price | ✓ À tester |
| TC-EXPORT-002 | Export parties filtrées date | Loggé ADMIN | 1. Filter dateFrom=2026-01-01 dateTo=2026-12-31 2. Export | CSV seulement parties dans plage | ✓ À tester |
| TC-EXPORT-003 | Export utilisateurs (CSV) | Loggé ADMIN | 1. `/admin/exports` 2. Télécharger "Users" | Fichier .csv : id,firstname,lastname,email,role | ✓ À tester |
| TC-EXPORT-004 | Export utilisateurs mineurs | Loggé ADMIN | 1. Filter ageGroup="mineur" 2. Export | CSV seulement âge < 18 | ✓ À tester |
| TC-EXPORT-005 | Export sans authentification | Pas loggé | 1. Tenter accès /api/exports/games.csv | Erreur 401 Unauthorized | ✓ À tester |

---

## 6. Paramètres Application (ADMIN)

| # | Titre | Précondition | Étapes | Résultat attendu | Statut |
|---|-------|--------------|--------|------------------|--------|
| TC-SETTINGS-001 | Afficher paramètres | Loggé ADMIN | 1. `/admin/settings` | Affiche : defaultAddress, defaultPrice, defaultMaxPlaces | ✓ À tester |
| TC-SETTINGS-002 | Modifier paramètres | Loggé ADMIN | 1. Edit defaultPrice: 15 2. Save | Paramètres mis à jour | ✓ À tester |
| TC-SETTINGS-003 | Créer paramètres (première fois) | ADMIN, aucun setting | 1. `/admin/settings` 2. Create 3. Save | Settings créées | À tester |

---

## 7. Tests de Sécurité (OWASP)

### 7.1 Injection & Validation

| # | Titre | Vecteur | Résultat attendu | Statut |
|---|-------|---------|------------------|--------|
| TC-SEC-INJ-001 | SQL Injection (User creation) | Email: `test' OR '1'='1` | Input validé/échappé, création échoue | ✓ Doctrine ORM |
| TC-SEC-INJ-002 | XSS (Game title) | Title: `<script>alert('XSS')</script>` | Script non exécuté, échappé en HTML | ✓ Symfony Twig |
| TC-SEC-VAL-001 | Validation email | Email: `notanemail` | Erreur "Format invalide" | ✓ À tester |
| TC-SEC-VAL-002 | Validation age (DOB future) | DOB: 2030-01-01 | Erreur "Date invalide" | À implémenter |

### 7.2 Authentification & Autorisation

| # | Titre | Vecteur | Résultat attendu | Statut |
|---|-------|---------|------------------|--------|
| TC-SEC-AUTH-001 | Accès admin sans auth | GET /api/users sans token | 401 Unauthorized | ✓ À tester |
| TC-SEC-AUTH-002 | Accès user data via autre user ID | USER tries GET /api/users/999/email | 403 Forbidden (sauf ADMIN) | ✓ À tester |
| TC-SEC-AUTH-003 | Escalade privilege (USER → ADMIN) | USER tries PATCH own role to ADMIN | 403 Forbidden | ✓ À tester |
| TC-SEC-RBAC-001 | USER ne peut pas créer partie | USER tries POST /api/games | 403 Forbidden | ✓ À tester |
| TC-SEC-RBAC-002 | ORGANIZER peut voir parties privées | ORGANIZER tries voir private game | Vérifier : peut-il ou non? À documenter | À tester |

### 7.3 Données Sensibles

| # | Titre | Vecteur | Résultat attendu | Statut |
|---|-------|---------|------------------|--------|
| TC-SEC-DATA-001 | Password pas retourné API | GET /api/users/1 | JSON ne contient pas `password` | ✓ À tester |
| TC-SEC-DATA-002 | JWT token pas en URL | Login response | Token en header/cookie, pas en URL | ✓ À tester |
| TC-SEC-CORS-001 | CORS non * | Frontend localhost:3000 | Rejet request de origin autre | À tester |

---

## 8. Tests de Performance

| # | Titre | Condition | Critère | Statut |
|---|-------|-----------|---------|--------|
| TC-PERF-001 | GET /api/games < 500ms | 100 games DB | Temps réponse | À mesurer |
| TC-PERF-002 | POST /api/game_registrations < 200ms | DB normal | Temps création inscription | À mesurer |
| TC-PERF-003 | Export CSV < 2s | 1000 users | Temps génération | À mesurer |
| TC-PERF-004 | Frontend Lighthouse score > 80 | Build prod | Perf score | ✓ GitHub Actions |
| TC-PERF-005 | Accessibilité > 90 | Build prod | A11y score | ✓ GitHub Actions |

---

## 9. Tests d'Accessibilité (WCAG 2.1 AA)

| # | Titre | Composant | Critère | Statut |
|---|-------|-----------|---------|--------|
| TC-A11Y-001 | Contraste texte | Tous buttons | Ratio 4.5:1 | ✓ Tailwind |
| TC-A11Y-002 | Labels formulaires | Auth form | Label associé input | ✓ à tester |
| TC-A11Y-003 | Navigation clavier | Tous pages | Tab navigation | À tester |
| TC-A11Y-004 | Erreurs inline | Formulaires | ARIA describedby | ✓ Implémenté |
| TC-A11Y-005 | Images alt text | Game images | Alt descriptif | À tester |
| TC-A11Y-006 | Heading hierarchy | Toutes pages | h1, h2, h3 correct | À tester |

---

## 10. Résumé Exécution

### Taux de Réussite

| Catégorie | Total | ✓ Passé | ✗ Échoué | ⏳ Skipped | % |
|-----------|-------|---------|----------|-----------|---|
| Auth & Sécurité | 15 | - | - | - | - |
| Utilisateurs | 15 | - | - | - | - |
| Parties | 13 | - | - | - | - |
| Inscriptions | 10 | - | - | - | - |
| Exports | 5 | - | - | - | - |
| Settings | 3 | - | - | - | - |
| Sécurité OWASP | 12 | - | - | - | - |
| Performance | 5 | - | - | - | - |
| Accessibilité | 6 | - | - | - | - |
| **TOTAL** | **84** | **0** | **0** | **0** | **0%** |

### Anomalies Trouvées

À compléter lors des tests.

### Approbation

- [ ] Tous tests approuvés par Product Owner
- [ ] Tous tests approuvés par développeur
- [ ] Livrable accepté
