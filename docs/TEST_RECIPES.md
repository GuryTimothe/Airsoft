# Cahier de Recettes - Cas de Test Exécutables

**Couverture**: Tests fonctionnels, structurels et de sécurité  
**Objectif**: Document de référence pour exécution manuelle ou automatisée

---

## 📋 Guide d'Utilisation

### Format des Cas de Test

Chaque cas teste une **fonction spécifique** :


| # | Titre | Précondition | Étapes | Résultat Attendu | Status |


**Colonnes** :
- **#** : Identifiant unique (TC-CATEGORIE-NUMBER)
- **Titre** : Description courte du test
- **Précondition** : État avant test (données requises)
- **Étapes** : Instructions numérotées pour exécuter
- **Résultat Attendu** : Comportement correct attendu
- **Status** : ✅ PASS / ❌ FAIL / ⏭️ SKIP / ⏳ À TESTER

### Comment Exécuter

1. **Environnement** : Backend + Frontend locaux (ou staging)
2. **Données test** : Utiliser les données par défaut (voir seeds)
3. **Parcours** : Suivre étapes dans l'ordre
4. **Résultat** : Comparer avec "Résultat Attendu"
5. **Tracer** : Remplir colonne Status

### Rapporter un Bug

Si le résultat ≠ résultat attendu :
1. Créer GitHub Issue avec tag `bug`
2. Référencer le cas test (ex: TC-AUTH-005)
3. Inclure screenshot/logs

---

# 1. Authentification & Sécurité

## 1.1 Inscription (Public)

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-AUTH-001 | Inscription complète valide | Pas loggé | 1. Aller `/register` 2. Remplir tous champs 3. Cliquer "S'inscrire" | Compte créé, token JWT reçu, redirection `/dashboard` | ✅ PASS |
| TC-AUTH-002 | Inscription sans email | Pas loggé | 1. `/register` 2. Laisser email vide 3. Submit | Message "Email requis", formulaire non soumis | ✅ PASS |
| TC-AUTH-003 | Inscription email invalide | Pas loggé | 1. `/register` 2. Email "notanemail" 3. Submit | Erreur "Format email invalide" | ✅ PASS |
| TC-AUTH-004 | Inscription email déjà existant | Pas loggé | 1. `/register` 2. Email existant 3. Submit | Erreur "Email déjà utilisé" | ✅ PASS |
| TC-AUTH-005 | Inscription password faible | Pas loggé | 1. `/register` 2. Password "123" 3. Submit | Erreur "Password trop faible (min 8 chars, 1 majuscule)" | ✅ PASS |
| TC-AUTH-006 | Inscription contact urgence incomplet (mineur) | Pas loggé, age < 18 | 1. `/register` 2. DOB mineur 3. Contact urgence: nom vide 4. Submit | Erreur "Contact urgence obligatoire pour mineurs" | ✅ PASS |
| TC-AUTH-007 | Enregistrement contact urgence complète | Pas loggé, age < 18 | 1. Remplir toutes données + contact urgence (nom, prénom, phone, relation) | Compte créé avec contact urgence stocké | ✅ PASS |

---

## 1.2 Login

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-LOGIN-001 | Login avec identifiants corrects | Compte existant | 1. `/login` 2. Email + password corrects 3. Submit | Token JWT reçu, redirection `/dashboard` | ✅ PASS |
| TC-LOGIN-002 | Login email incorrect | Compte existant | 1. `/login` 2. Email incorrect 3. Submit | Erreur "Identifiants invalides" | ✅ PASS |
| TC-LOGIN-003 | Login password incorrect | Compte existant | 1. `/login` 2. Password incorrect 3. Submit | Erreur "Identifiants invalides" | ✅ PASS |
| TC-LOGIN-004 | Login compte inexistant | — | 1. `/login` 2. Email inexistant 3. Submit | Erreur "Identifiants invalides" | ✅ PASS |
| TC-LOGIN-005 | Login 5 tentatives échouées | Compte existant | 1. `/login` 2. Soumettre plusieurs fois avec password faux | Rate limiting: 429 + Retry-After | ✅ PASS |
| TC-LOGIN-006 | Inscription rate limitée | Pas loggé | 1. POST `/api/register` au-delà du quota | Rate limiting: 429 + message inscription | ✅ PASS |
| TC-LOGIN-007 | Pré-remplissage email login | Email dans query string | 1. Aller `/auth/login?email=user@example.com` | Champ email pré-rempli | ✅ PASS |
| TC-LOGIN-008 | Redirection admin après login organizer | Compte ROLE_ORGANIZER | 1. Login valide 2. Profil courant organizer | Redirection `/admin` + refresh router | ✅ PASS |
| TC-LOGIN-009 | Erreur login affichée | Identifiants invalides | 1. Login rejette une erreur | Message d'erreur affiché dans le formulaire | ✅ PASS |

---

## 1.3 JWT & Sessions

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-JWT-001 | Token valide accepté | Loggé | 1. API request avec header `Authorization: Bearer <token>` | Request acceptée (200/201) | ✅ PASS |
| TC-JWT-002 | Token expiré rejeté | Token expiré | 1. API request avec token expiré | Erreur 401 "Expired JWT Token" | ✅ PASS |
| TC-JWT-003 | Token invalide rejeté | — | 1. API request avec header `Authorization: Bearer malformed` | Erreur 401 "Invalid JWT" | ✅ PASS |
| TC-JWT-004 | Token manquant pour endpoint protégé | Pas loggé | 1. API GET /api/games sans header Authorization | Erreur 401 (public) OU 403 (admin) | ✅ PASS |
| TC-JWT-005 | Changement password révoque token | Loggé | 1. POST `/api/users/me/password` 2. Utiliser ancien token | Ancien token invalide après changement | ✅ PASS |
| TC-JWT-006 | Génération token CSRF login | Pas loggé | 1. GET `/api/csrf/token` | JSON contient `csrfToken` | ✅ PASS |
| TC-JWT-007 | CSRF API protégé manquant | Requête navigateur POST `/api/*` | 1. POST API sans Bearer ni CSRF | 403 `Requête invalide.` | ✅ PASS |
| TC-JWT-008 | CSRF API protégé valide | Requête navigateur POST `/api/*` | 1. POST API avec `X-CSRF-Token` valide | Requête acceptée par le subscriber | ✅ PASS |
| TC-JWT-009 | Cookie JWT posé au login | Login réussi | 1. Auth success handler retourne token | Cookie `ma_access_token` httpOnly créé | ✅ PASS |
| TC-JWT-010 | Logout révoque token JWT | Token valide | 1. POST `/api/logout` | 204, cookie effacé, jti révoqué | ✅ PASS |
| TC-JWT-011 | Logout token malformé | Token sans `exp` valide | 1. POST `/api/logout` | 204, activité révoquée, warning sécurité | ✅ PASS |

---

# 2. Gestion Utilisateurs

## 2.1 Profil Personnel

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-USER-001 | Afficher mon profil | Loggé USER | 1. `/dashboard` ou `GET /api/users/me` | Affiche données : nom, email, etc. | ✅ PASS |
| TC-USER-002 | Éditer profil (nom, pseudo, phone) | Loggé USER | 1. `/settings/profile` 2. Modifier nom 3. Save | Données sauvegardées, "Profil mis à jour" | ✅ PASS |
| TC-USER-003 | Éditer email vérifie password | Loggé USER | 1. `/settings/email` 2. Password actuel 3. Nouveau email 4. Submit | Token JWT mis à jour, email changé | ✅ PASS |
| TC-USER-004 | Changement password | Loggé USER | 1. `/settings/password` 2. Password actuel + nouveau 4. Submit | Password changé, session révoquée (relogin requis) | ✅ PASS |
| TC-USER-005 | Impossible éditer email sans password | Loggé USER | 1. `/settings/email` 2. Nouveau email sans password 3. Submit | Erreur "Password requise" | ✅ PASS |
| TC-USER-006 | Supprimer mon compte | Loggé USER | 1. `/settings/danger-zone` 2. "Supprimer compte" 3. Confirmer | Compte supprimé, redirection `/` | ✅ PASS |
| TC-USER-007 | Chargement profil frontend | Loggé USER | 1. Ouvrir page profil | Informations utilisateur affichées | ✅ PASS |
| TC-USER-008 | Erreur chargement profil frontend | API profil indisponible | 1. Ouvrir page profil | Message erreur affiché | ✅ PASS |
| TC-USER-009 | Modale email profil | Loggé USER | 1. Cliquer "Modifier email" | Modale avec email + password actuel | ✅ PASS |
| TC-USER-010 | Modale password profil | Loggé USER | 1. Cliquer "Modifier mot de passe" | Modale avec ancien/nouveau/confirmation | ✅ PASS |
| TC-USER-011 | Supprimer contact urgence adulte | USER majeur avec contact | 1. Cliquer suppression contact | Contact supprimé via API profil | ✅ PASS |
| TC-USER-012 | Bloquer suppression contact mineur | USER mineur avec contact | 1. Voir bouton suppression contact | Bouton désactivé | ✅ PASS |
| TC-USER-013 | Supprimer compte frontend | Loggé USER | 1. Ouvrir confirmation 2. Confirmer | Token effacé, redirection login | ✅ PASS |

---

## 2.2 Gestion Utilisateurs (ADMIN)

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-ADMIN-USER-001 | Lister tous utilisateurs | Loggé ADMIN | 1. `/admin/users` | Table avec users, pagination | ✅ PASS |
| TC-ADMIN-USER-002 | Filtrer utilisateurs par rôle | Loggé ADMIN | 1. `/admin/users` 2. Filter "ROLE_ORGANIZER" | Affiche seulement ORGANIZER | ✅ PASS |
| TC-ADMIN-USER-003 | Créer nouvel utilisateur | Loggé ADMIN | 1. `/admin/users/create` 2. Remplir formulaire 3. Save | User créé avec rôle USER ou ORGANIZER | ✅ PASS |
| TC-ADMIN-USER-004 | Éditer utilisateur (pseudo, role) | Loggé ADMIN | 1. `/admin/users/1/edit` 2. Modifier role 3. Save | User modifié | ✅ PASS |
| TC-ADMIN-USER-005 | Impossible assigner ROLE_SUPER_ADMIN | Loggé ADMIN | 1. Tenter assign ROLE_SUPER_ADMIN | Erreur "Permission denied" | ✅ PASS |
| TC-ADMIN-USER-006 | SUPER_ADMIN peut promouvoir ADMIN | Loggé SUPER_ADMIN | 1. Assign ROLE_ADMIN | Success | ✅ PASS |
| TC-ADMIN-USER-007 | Supprimer utilisateur | Loggé ADMIN | 1. `/admin/users/1/delete` 2. Confirm | User supprimé, cascade delete registrations | ✅ PASS |
| TC-ADMIN-USER-008 | Voir contact urgence mineur | Loggé ADMIN | 1. `/admin/users/5` (age < 18) | Affiche contact urgence | ✅ PASS |

---

# 3. Gestion Parties (Games)

## 3.1 Lister & Visualiser

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-GAME-001 | Lister parties publiques | Pas loggé | 1. `GET /api/games` | Affiche parties isPublic=true | ✅ PASS |
| TC-GAME-002 | Partie privée cachée (non-ADMIN) | USER loggé, partie privée | 1. `GET /api/games` | Partie privée n'apparaît pas | ✅ PASS |
| TC-GAME-003 | Partie privée visible (ADMIN) | ADMIN loggé | 1. `/admin/games` | Affiche partie privée | ✅ PASS |
| TC-GAME-004 | Détail partie | Pas loggé, partie publique | 1. Cliquer détail partie | Affiche : titre, date, prix, places, status | ✅ PASS |
| TC-GAME-005 | Détection partie pleine | Partie full (maxPlaces atteint) | 1. `game->isFull()` 2. `getAvailablePlaces()` | Retourne true / 0 places | ✅ PASS |
| TC-GAME-006 | Liste parties frontend chargée | Parties publiques/privées mockées | 1. Afficher composant liste parties | Cartes + bannière affichées | ✅ PASS |
| TC-GAME-007 | Erreur chargement parties frontend | API games indisponible | 1. Charger liste parties | Message erreur affiché | ✅ PASS |
| TC-GAME-008 | Aucune partie à venir frontend | Seulement parties passées | 1. Charger liste parties | Etat vide affiché | ✅ PASS |

---

## 3.2 Créer & Éditer (ADMIN)

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-GAME-CREATE-001 | Créer partie valide | Loggé ADMIN | 1. `/admin/games/create` 2. Remplir tous champs 3. Save | Partie créée avec ID | ✅ PASS |
| TC-GAME-CREATE-002 | Créer partie sans titre | Loggé ADMIN | 1. `/admin/games/create` 2. Laisser titre vide 3. Save | Erreur "Titre requis" | ✅ PASS |
| TC-GAME-CREATE-003 | Créer partie date passée | Loggé ADMIN | 1. Date passée 3. Save | Erreur "Date doit être future" | ✅ PASS |
| TC-GAME-CREATE-004 | Créer partie prix négatif | Loggé ADMIN | 1. Remplir prix: -10 | Erreur "Prix doit être >= 0" | ✅ PASS |
| TC-GAME-CREATE-005 | Créer partie places négatives | Loggé ADMIN | 1. Remplir maxPlaces: 0 | Erreur "Places doit être > 0" | ✅ PASS |
| TC-GAME-EDIT-001 | Éditer partie | Loggé ADMIN | 1. `/admin/games/1/edit` 2. Modifier titre 3. Save | Partie modifiée | ✅ PASS |
| TC-GAME-DELETE-001 | Supprimer partie | Loggé ADMIN | 1. `/admin/games/1/delete` 2. Confirm | Partie + registrations supprimées | ✅ PASS |

---

# 4. Inscriptions aux Parties

## 4.1 S'inscrire

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-REG-001 | S'inscrire partie disponible | USER loggé, partie publique | 1. Détail partie 2. "S'inscrire" 3. Confirm | Inscription créée | ✅ PASS |
| TC-REG-002 | S'inscrire partie pleine | USER loggé, partie full | 1. Détail partie 2. "S'inscrire" | Erreur "Partie complète" | ✅ PASS |
| TC-REG-003 | Doublon inscription | USER déjà inscrit | 1. Tenter s'inscrire à nouveau | Erreur "Vous êtes déjà inscrit" | ✅ PASS |
| TC-REG-004 | S'inscrire partie privée (USER) | USER loggé, partie privée | 1. Tenter s'inscrire directement | Erreur "Accès refusé" | ✅ PASS |
| TC-REG-005 | Afficher mes inscriptions | USER loggé | 1. `/my-registrations` | Liste parties où inscrit | ⏳ À TESTER |
| TC-REG-006 | Places dispo diminue après inscription | Partie avec 5 places | 1. Ajouter registration 2. Vérifier `getAvailablePlaces()` | Places passent de 5 à 4 | ✅ PASS |
| TC-REG-007 | Annuler inscription | USER loggé, inscrit | 1. DELETE /api/game_registrations/{id} | Inscription supprimée | ✅ PASS |
| TC-REG-008 | Inscription frontend réussie | USER loggé, partie disponible | 1. Cliquer "S'inscrire" | Appel API register et rafraîchissement état | ✅ PASS |
| TC-REG-009 | Erreur inscription frontend | USER loggé, API register échoue | 1. Cliquer "S'inscrire" | Message erreur affiché | ✅ PASS |
| TC-REG-010 | Annulation frontend réussie | USER déjà inscrit | 1. Cliquer "Annuler l'inscription" | Appel API cancel et état mis à jour | ✅ PASS |
| TC-REG-011 | Refresh auth state inscriptions | Changement auth frontend | 1. Event `auth-state-changed` | Inscriptions utilisateur rechargées | ✅ PASS |

---

## 4.2 Gestion Inscriptions (ADMIN)

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-ADMIN-REG-001 | Lister joueurs partie | Loggé ADMIN | 1. `/admin/games/1/players` | Table joueurs (nom, email, présent) | ✅ PASS |
| TC-ADMIN-REG-002 | Marquer présence | Loggé ADMIN, partie créée | 1. PATCH presence=true pour joueur | `isPresent=true`, sauvegardé | ✅ PASS |
| TC-ADMIN-REG-003 | Supprimer inscription | Loggé ADMIN | 1. DELETE /api/game_registrations/{id} | Inscription supprimée | ✅ PASS |
| TC-ADMIN-REG-004 | Export registrations CSV | Loggé ADMIN | 1. GET /api/export/registrations/game/{id} | Fichier CSV : id,user,present | ✅ PASS |

---

# 5. Exports (CSV)

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-EXPORT-001 | Export parties (CSV) | Loggé ADMIN | 1. GET /api/export/games | Fichier .csv : id,title,date,address,price | ✅ PASS |
| TC-EXPORT-002 | Export utilisateurs (CSV) | Loggé ADMIN | 1. GET /api/export/users | Fichier .csv : id,firstname,lastname,email,role | ✅ PASS |
| TC-EXPORT-003 | Export inscriptions (CSV) | Loggé ADMIN | 1. GET /api/export/registrations | Fichier .csv : joueur,partie,date,présent | ✅ PASS |
| TC-EXPORT-004 | Export sans authentification | Pas loggé | 1. GET /api/export/games sans token | Erreur 401 Unauthorized | ✅ PASS |

---

# 6. Paramètres Application (ADMIN)

| # | Titre | Précondition | Étapes | Résultat Attendu | Status |
|---|---|---|---|---|---|
| TC-SETTINGS-001 | Afficher paramètres | Loggé ADMIN | 1. `/admin/settings` | Affiche : defaultAddress, defaultPrice, defaultMaxPlaces | ✅ PASS |
| TC-SETTINGS-002 | Modifier paramètres | Loggé ADMIN | 1. Edit defaultPrice: 15 2. Save | Paramètres mis à jour | ✅ PASS |
| TC-SETTINGS-003 | Valeurs par défaut valides | ADMIN | 1. `new AppSetting()` 2. Check defaults | Objet créé avec valeurs valides | ✅ PASS |

---

# 7. Tests de Sécurité (OWASP)

## 7.1 Injection & Validation

| # | Titre | Vecteur | Résultat Attendu | Status |
|---|---|---|---|---|
| TC-SEC-INJ-001 | SQL Injection | Email: `test' OR '1'='1` | Input échappé, création échoue | ✅ PASS |
| TC-SEC-INJ-002 | XSS (Game title) | Title: `<script>alert('XSS')</script>` | Script non exécuté, échappé | ✅ PASS |
| TC-SEC-VAL-001 | Validation email | Email: `notanemail` | Erreur 422 "Format invalide" | ✅ PASS |
| TC-SEC-VAL-002 | Validation DOB future | DOB: 2030-01-01 | Erreur "Date invalide" | ✅ PASS |

---

## 7.2 Authentification & Autorisation

| # | Titre | Vecteur | Résultat Attendu | Status |
|---|---|---|---|---|
| TC-SEC-AUTH-001 | Accès admin sans auth | GET /api/users sans token | 401 Unauthorized | ✅ PASS |
| TC-SEC-AUTH-002 | Accès user data autre user | USER GET /api/users/999 | 403 Forbidden (sauf ADMIN) | ✅ PASS |
| TC-SEC-AUTH-003 | Escalade privilege USER → ADMIN | USER PATCH own role to ADMIN | 403 Forbidden | ✅ PASS |
| TC-SEC-RBAC-001 | USER ne peut pas créer partie | USER POST /api/games | 403 Forbidden | ✅ PASS |
| TC-SEC-AUTH-004 | CSRF manquant sur API protégée | POST `/api/games` sans Bearer ni CSRF | 403 Forbidden | ✅ PASS |
| TC-SEC-AUTH-005 | Client Bearer exempt CSRF | POST `/api/games` avec Bearer | Pas de blocage CSRF | ✅ PASS |
| TC-SEC-AUTH-006 | Logs accès refusé anonymes | AccessDenied sur route admin | Log SEC.AUTHZ.ACCESS_DENIED avec IP masquée | ✅ PASS |
| TC-SEC-AUTH-007 | Logs accès refusé utilisateur | AccessDenied avec USER authentifié | Log acteur user hashé + IP IPv6 masquée | ✅ PASS |

---

## 7.3 Données Sensibles

| # | Titre | Vecteur | Résultat Attendu | Status |
|---|---|---|---|---|
| TC-SEC-DATA-001 | Password pas retourné API | GET /api/users/1 | JSON ne contient pas `password` | ✅ PASS |
| TC-SEC-DATA-002 | JWT token pas en URL | Login response | Token dans body JSON, pas URL | ✅ PASS |
| TC-SEC-CORS-001 | CORS configuré | Cross-origin request | Origines autorisées configurées | ✅ PASS |

---

# 8. Tests de Performance

| # | Titre | Condition | Critère | Status |
|---|---|---|---|---|
| TC-PERF-001 | GET /api/games < 500ms | 100 games DB | Temps réponse | ❌ FAIL |
| TC-PERF-002 | POST inscription < 200ms | DB normal | Temps création | ❌ FAIL |
| TC-PERF-003 | Export CSV < 2s | 1000 users | Temps génération | ✅ PASS |
| TC-PERF-004 | Lighthouse Performance > 80 | Build prod | Score CI/CD | ✅ PASS |
| TC-PERF-005 | Lighthouse Accessibilité > 90 | Build prod | Score CI/CD | ✅ PASS |

---

# 9. Tests d'Accessibilité (WCAG 2.1 AA)

| # | Titre | Composant | Critère | Status |
|---|---|---|---|---|
| TC-A11Y-001 | Contraste texte | Tous boutons | Ratio 4.5:1 | ✅ PASS |
| TC-A11Y-002 | Labels formulaires | Auth form | Label associé input | ✅ PASS |
| TC-A11Y-003 | Navigation clavier | Toutes pages | Tab navigation | ✅ PASS |
| TC-A11Y-004 | Erreurs inline ARIA | Formulaires | aria-describedby | ✅ PASS |
| TC-A11Y-005 | Images alt text | Game images | Alt descriptif | ✅ PASS |
| TC-A11Y-006 | Heading hierarchy | Toutes pages | h1, h2, h3 correct | ✅ PASS |

---