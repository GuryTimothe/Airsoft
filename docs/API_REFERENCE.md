# Référence API - Airsoft

## Vue d'ensemble

API REST construite avec Symfony + API Platform.

- Formats principaux: `application/ld+json` et `application/json`
- Version API Platform: `1.0.0`
- Pagination: `15` éléments/page sur `User` et `Game`

## Authentification

### Token CSRF (Public)

```http
GET /api/csrf/token
GET /api/csrf/login
```

Réponse:

```json
{
  "csrfToken": "<token>"
}
```

### Connexion (Public)

```http
POST /api/login
Content-Type: application/ld+json
X-CSRF-Token: <csrfToken>

{
  "email": "mail@gmail.com",
  "password": "motdepassesécurisé1234!"
}
```

Réponse (200):

```json
{
  "token": "<jwt>"
}
```

Notes:

- Sans header `X-CSRF-Token`, la réponse observée est `403` avec `{"message":"Requête invalide."}`.
- Le JWT est aussi défini dans le cookie httpOnly `ma_access_token`.
- Le throttling de connexion est actif (voir section Limitation de débit).

Exemple d'erreur de connexion (401/403 selon le cas):

```json
{
  "message": "Identifiants invalides."
}
```

### Inscription (Public)

```http
POST /api/register
Content-Type: application/ld+json

{
  "firstname": "firstname",
  "lastname": "lastname",
  "email": "mail@gmail.com",
  "password": "motdepassesécurisé1234!",
  "dateOfBirth": "2000-01-15",
  "pseudo": "pseudo",
  "phone": "0739664821",
  "emergencyContact": {
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "phone": "0739664821"
  }
}
```

Réponse (201): retourne la ressource `User` créée (pas de token dans la réponse).

```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/me",
  "@type": "User",
  "id": 67,
  "lastname": "lastname",
  "firstname": "firstname",
  "email": "mail@gmail.com",
  "dateOfBirth": "2000-01-15T00:00:00+00:00",
  "emergencyContact": {
    "@id": "/api/emergency_contacts/40",
    "@type": "EmergencyContact",
    "id": 40,
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "phone": "0739664821"
  },
  "pseudo": "pseudo",
  "phone": "0739664821",
  "role": "ROLE_USER",
  "canSeePrivate": false,
  "createdAt": "2026-07-22T21:27:22+00:00",
  "updatedAt": "2026-07-22T21:27:22+00:00",
  "emergencyContactLastname": "lastname",
  "emergencyContactFirstname": "firstname",
  "emergencyContactEmail": "mail@gmail.com",
  "emergencyContactPhone": "0739664821"
}
```

Notes:

- `emergencyContact` doit actuellement être envoyé comme une chaîne JSON. Un objet JSON brut retourne `400` avec `The input data is misformatted.`
- Le format legacy `"Nom - téléphone"` est aussi accepté côté backend.

### Déconnexion (Public)

```http
POST /api/logout
```

Réponse: `204 No Content`.

Notes:

- Supprime le cookie d'authentification.
- Si un JWT est présent, une révocation est tentée côté serveur.

### Requêtes authentifiées

Privilégier l'authentification Bearer:

```http
Authorization: Bearer <jwt>
```

Pour les requêtes API non-GET effectuées avec authentification par cookie (sans en-tête Bearer), la protection CSRF est imposée via `X-CSRF-Token` (sauf routes exemptées comme `/api/register` et `/api/logout`).

## Utilisateurs

### Endpoints utilisateurs

- `GET /api/users` - `ROLE_ADMIN` et `ROLE_SUPER_ADMIN` uniquement (`VIEW_ALL_USERS`)
- `GET /api/users/{id}` - `ROLE_ADMIN` et `ROLE_SUPER_ADMIN` uniquement (`VIEW_ALL_USERS`)
- `POST /api/users` - contrôle par rôle via voter (`CREATE_USER`)
- `PATCH /api/users/{id}` - contrôle par rôle via voter (`UPDATE_USER`)
- `DELETE /api/users/{id}` - contrôle par rôle via voter (`DELETE_USER`)

### Endpoints utilisateur courant

- `GET /api/me` - authentifié
- `PATCH /api/me` - authentifié
- `PATCH /api/me/email` - authentifié
- `PATCH /api/me/password` - authentifié
- `DELETE /api/me` - authentifié

### Exemples de réponse JSON (Utilisateurs)

`GET /api/users` (200):

```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/users",
  "@type": "Collection",
  "totalItems": 32,
  "member": [
    {
      "@id": "/api/me",
      "@type": "User",
      "id": 1,
      "lastname": "lastname",
      "firstname": "firstname",
      "email": "mail@gmail.com",
      "dateOfBirth": "1990-01-01T00:00:00+00:00",
      "pseudo": "pseudo",
      "role": "ROLE_SUPER_ADMIN",
      "canSeePrivate": true,
      "createdAt": "2026-07-18T09:40:38+00:00",
      "updatedAt": "2026-07-19T11:06:51+00:00"
    }
  ]
}
```

`GET /api/users/{id}` (200):

```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/users/2",
  "@type": "User",
  "id": 2,
  "lastname": "lastname",
  "firstname": "firstname",
  "email": "mail@gmail.com",
  "dateOfBirth": "2003-11-15T00:00:00+00:00",
  "emergencyContact": {
    "@id": "/api/emergency_contacts/34",
    "@type": "EmergencyContact",
    "id": 34,
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "phone": "0739664821"
  },
  "pseudo": "pseudo",
  "role": "ROLE_USER",
  "canSeePrivate": false,
  "createdAt": "2026-07-18T14:37:12+00:00",
  "updatedAt": "2026-07-19T11:47:10+00:00",
  "emergencyContactLastname": "lastname",
  "emergencyContactFirstname": "firstname",
  "emergencyContactEmail": "mail@gmail.com",
  "emergencyContactPhone": "0739664821"
}
```

`POST /api/users` (201):

```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/users/24",
  "@type": "User",
  "id": 24,
  "firstname": "firstname",
  "lastname": "lastname",
  "email": "mail@gmail.com",
  "role": "ROLE_ORGANIZER",
  "canSeePrivate": true
}
```

`PATCH /api/users/{id}` (200):

```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/users/2",
  "@type": "User",
  "id": 2,
  "lastname": "lastname",
  "firstname": "firstname",
  "email": "mail@gmail.com",
  "dateOfBirth": "2003-11-15T00:00:00+00:00",
  "emergencyContact": {
    "@id": "/api/emergency_contacts/34",
    "@type": "EmergencyContact",
    "id": 34,
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "phone": "0739664821"
  },
  "pseudo": "pseudo",
  "phone": "0739664821",
  "role": "ROLE_USER",
  "canSeePrivate": true,
  "createdAt": "2026-07-18T14:37:12+00:00",
  "updatedAt": "2026-07-22T22:19:53+00:00",
  "emergencyContactLastname": "lastname",
  "emergencyContactFirstname": "firstname",
  "emergencyContactEmail": "mail@gmail.com",
  "emergencyContactPhone": "0739664821"
}
```

### Payloads de requête (Utilisateurs)

`POST /api/users`:

```json
{
  "firstname": "firstname",
  "lastname": "lastname",
  "email": "mail@gmail.com",
  "password": "motdepassesécurisé1234!",
  "dateOfBirth": "2000-01-15",
  "pseudo": "pseudo",
  "phone": "0739664821",
  "role": "ROLE_USER",
  "canSeePrivate": false,
  "emergencyContact": {
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "phone": "0739664821"
  }
}
```

`PATCH /api/users/{id}`:

```json
{
  "firstname": "firstname",
  "lastname": "lastname",
  "email": "mail@gmail.com",
  "pseudo": "pseudo",
  "phone": "0739664821",
  "canSeePrivate": true
}
```

`GET /api/me` (200):

```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/me",
  "@type": "User",
  "id": 1,
  "lastname": "lastname",
  "firstname": "firstname",
  "email": "mail@gmail.com",
  "dateOfBirth": "1990-01-01T00:00:00+00:00",
  "pseudo": "pseudo",
  "role": "ROLE_SUPER_ADMIN",
  "createdAt": "2026-07-18T09:40:38+00:00",
  "updatedAt": "2026-07-19T11:06:51+00:00"
}
```

`PATCH /api/me` (200):

```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/me",
  "@type": "User",
  "id": 69,
  "firstname": "firstname",
  "lastname": "lastname",
  "email": "mail@gmail.com",
  "dateOfBirth": "2000-02-20T00:00:00+00:00",
  "emergencyContact": {
    "@id": "/api/emergency_contacts/42",
    "@type": "EmergencyContact",
    "id": 42,
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "phone": "0739664821"
  },
  "pseudo": "pseudo",
  "phone": "0739664821",
  "role": "ROLE_USER",
  "canSeePrivate": false,
  "createdAt": "2026-07-22T22:17:27+00:00",
  "updatedAt": "2026-07-22T22:17:28+00:00",
  "emergencyContactLastname": "lastname",
  "emergencyContactFirstname": "firstname",
  "emergencyContactEmail": "mail@gmail.com",
  "emergencyContactPhone": "0739664821"
}
```

`PATCH /api/me/email` (200):

```json
{
  "@context": {
    "@vocab": "http://localhost:8000/api/docs.jsonld#",
    "hydra": "http://www.w3.org/ns/hydra/core#",
    "user": "MeUpdateOutput/user",
    "token": "MeUpdateOutput/token"
  },
  "@type": "MeUpdateOutput",
  "@id": "/api/.well-known/genid/...",
  "user": {
    "@id": "/api/me",
    "@type": "User",
    "id": 69,
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "dateOfBirth": "2000-02-20T00:00:00+00:00",
    "emergencyContact": {
      "@id": "/api/emergency_contacts/42",
      "@type": "EmergencyContact",
      "id": 42,
      "lastname": "lastname",
      "firstname": "firstname",
      "email": "mail@gmail.com",
      "phone": "0739664821"
    },
    "pseudo": "pseudo",
    "phone": "0739664821",
    "role": "ROLE_USER",
    "canSeePrivate": false,
    "createdAt": "2026-07-22T22:17:27+00:00",
    "updatedAt": "2026-07-22T22:17:29+00:00",
    "emergencyContactLastname": "lastname",
    "emergencyContactFirstname": "firstname",
    "emergencyContactEmail": "mail@gmail.com",
    "emergencyContactPhone": "0739664821"
  },
  "token": "<jwt>"
}
```

`PATCH /api/me/password` (200):

```json
{
  "@context": {
    "@vocab": "http://localhost:8000/api/docs.jsonld#",
    "hydra": "http://www.w3.org/ns/hydra/core#",
    "user": "MeUpdateOutput/user",
    "token": "MeUpdateOutput/token"
  },
  "@type": "MeUpdateOutput",
  "@id": "/api/.well-known/genid/...",
  "user": {
    "@id": "/api/me",
    "@type": "User",
    "id": 69,
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "dateOfBirth": "2000-02-20T00:00:00+00:00",
    "emergencyContact": {
      "@id": "/api/emergency_contacts/42",
      "@type": "EmergencyContact",
      "id": 42,
      "lastname": "lastname",
      "firstname": "firstname",
      "email": "mail@gmail.com",
      "phone": "0739664821"
    },
    "pseudo": "pseudo",
    "phone": "0739664821",
    "role": "ROLE_USER",
    "canSeePrivate": false,
    "createdAt": "2026-07-22T22:17:27+00:00",
    "updatedAt": "2026-07-22T22:17:29+00:00",
    "emergencyContactLastname": "lastname",
    "emergencyContactFirstname": "firstname",
    "emergencyContactEmail": "mail@gmail.com",
    "emergencyContactPhone": "0739664821"
  },
  "token": "<jwt>"
}
```

### Notes payload

`PATCH /api/me` attend par exemple:

```json
{
  "firstname": "firstname",
  "lastname": "lastname",
  "dateOfBirth": "2000-02-20",
  "pseudo": "pseudo",
  "phone": "0739664821",
  "emergencyContact": {
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "phone": "0739664821"
  }
}
```

`PATCH /api/me/email` attend:

```json
{
  "email": "mail@gmail.com",
  "currentPassword": "motdepassesécurisé1234!"
}
```

`PATCH /api/me/password` attend:

```json
{
  "currentPassword": "motdepassesécurisé1234!",
  "newPassword": "motdepassesécurisé1234!"
}
```

`/api/me/email` et `/api/me/password` retournent un objet contenant les données utilisateur mises à jour et un nouveau token.

`PATCH /api/me` retourne directement la ressource `User` mise à jour.

### Règles de rôle

- `ROLE_SUPER_ADMIN` peut créer/supprimer/modifier les utilisateurs via les voters.
- `ROLE_ADMIN` peut créer/supprimer uniquement des utilisateurs dont le rôle cible est `ROLE_USER` ou `ROLE_ORGANIZER`.
- `ROLE_ADMIN` ne peut pas attribuer `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`.
- Les changements de mot de passe sont bloqués sur `PATCH /api/users/{id}` (utiliser `/api/me/password`).

## Parties

### Endpoints parties

- `GET /api/games` - public
- `GET /api/games/{id}` - public
- `POST /api/games` - `ROLE_ORGANIZER`, `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`
- `PUT /api/games/{id}` - `ROLE_ORGANIZER`, `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`
- `DELETE /api/games/{id}` - `ROLE_ORGANIZER`, `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`

### Exemples de réponse JSON (Parties)

`GET /api/games` (200):

```json
{
  "@context": "/api/contexts/Game",
  "@id": "/api/games",
  "@type": "Collection",
  "totalItems": 2,
  "member": [
    {
      "@id": "/api/games/1",
      "@type": "Game",
      "id": 1,
      "title": "Titre",
      "description": "",
      "startDateTime": "2026-07-31T17:08:00+00:00",
      "address": "Terrain principal",
      "price": 10,
      "maxPlaces": 24,
      "createdAt": "2026-07-19T11:16:26+00:00",
      "updatedAt": "2026-07-19T11:16:26+00:00",
      "public": true,
      "registrationCount": 2,
      "availablePlaces": 22,
      "full": false
    }
  ]
}
```

`GET /api/games/{id}` (200):

```json
{
  "@context": "/api/contexts/Game",
  "@id": "/api/games/1",
  "@type": "Game",
  "id": 1,
  "title": "Titre",
  "description": "",
  "startDateTime": "2026-07-31T17:08:00+00:00",
  "address": "Terrain principal",
  "price": 10,
  "maxPlaces": 24,
  "createdAt": "2026-07-19T11:16:26+00:00",
  "updatedAt": "2026-07-19T11:16:26+00:00",
  "public": true,
  "registrationCount": 2,
  "availablePlaces": 22,
  "full": false
}
```

`POST /api/games` (201) / `PUT /api/games/{id}` (200):

```json
{
  "@context": "/api/contexts/Game",
  "@id": "/api/games/7",
  "@type": "Game",
  "id": 7,
  "title": "Titre",
  "address": "Terrain principal",
  "isPublic": false,
  "price": 15,
  "maxPlaces": 20
}
```

### Payloads de requête (Parties)

`POST /api/games`:

```json
{
  "title": "Titre",
  "description": "",
  "startDateTime": "2026-07-31T17:08:00+00:00",
  "address": "Terrain principal",
  "price": 10,
  "maxPlaces": 24,
  "isPublic": true
}
```

`PUT /api/games/{id}`:

```json
{
  "title": "Titre",
  "description": "",
  "startDateTime": "2026-07-31T17:08:00+00:00",
  "address": "Terrain principal",
  "price": 10,
  "maxPlaces": 24,
  "isPublic": true
}
```

### Visibilité

- Les parties publiques sont visibles par tout le monde.
- Les parties privées sont visibles par les utilisateurs avec `ROLE_ADMIN` ou avec `canSeePrivate = true`.

## Inscriptions aux parties

### Endpoints inscriptions

- `GET /api/game_registrations` - authentifié (filtré automatiquement par extension de visibilité)
- `GET /api/game_registrations/mine` - authentifié, utilisateur courant uniquement
- `POST /api/game_registrations` - authentifié + voter `REGISTER_GAME` (partie publique pour tous les authentifiés, partie privée: `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`, `ROLE_ORGANIZER` ou `canSeePrivate=true`)
- `PATCH /api/game_registrations/{id}` - `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`, `ROLE_ORGANIZER` (mise à jour présence)
- `DELETE /api/game_registrations/{id}` - `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`, `ROLE_ORGANIZER`, ou propriétaire de l'inscription (voter `DELETE_GAME_REGISTRATION`)

Note: sur l'instance observée, `GET /api/game_registrations/{id}` retourne `404` avec `This route does not aim to be called.`

### Exemples de réponse JSON (Inscriptions)

`GET /api/game_registrations` (200):

```json
{
  "@context": "/api/contexts/GameRegistration",
  "@id": "/api/game_registrations",
  "@type": "Collection",
  "totalItems": 3,
  "member": [
    {
      "@id": "/api/game_registrations/2",
      "@type": "GameRegistration",
      "id": 2,
      "createdAt": "2026-07-19T15:26:14+00:00",
      "gameId": 1,
      "userId": 2,
      "userFirstname": "firstname",
      "userLastname": "lastname",
      "userEmail": "mail@gmail.com",
      "userAge": 22
    }
  ]
}
```

`GET /api/game_registrations/mine` (200):

```json
{
  "@context": "/api/contexts/GameRegistration",
  "@id": "/api/game_registrations/mine",
  "@type": "hydra:Collection",
  "hydra:member": [
    {
      "@id": "/api/game_registrations/10",
      "@type": "GameRegistration",
      "id": 10,
      "gameId": 1,
      "userId": 12,
      "isPresent": false
    }
  ],
  "hydra:totalItems": 1
}
```

`POST /api/game_registrations` (201):

```json
{
  "@context": "/api/contexts/GameRegistration",
  "@id": "/api/game_registrations/5",
  "@type": "GameRegistration",
  "id": 5,
  "createdAt": "2026-07-22T21:28:52+00:00",
  "gameId": 4,
  "userId": 1,
  "userFirstname": "firstname",
  "userLastname": "lastname",
  "userEmail": "mail@gmail.com",
  "userAge": 36
}
```

`PATCH /api/game_registrations/{id}` (200):

```json
{
  "@context": "/api/contexts/GameRegistration",
  "@id": "/api/game_registrations/7",
  "@type": "GameRegistration",
  "id": 7,
  "createdAt": "2026-07-22T22:19:54+00:00",
  "gameId": 1,
  "userId": 1,
  "userFirstname": "firstname",
  "userLastname": "lastname",
  "userEmail": "mail@gmail.com",
  "userAge": 36
}
```

### Payloads de requête

`POST /api/game_registrations`:

```json
{
  "game": "/api/games/1"
}
```

`PATCH /api/game_registrations/{id}`:

```json
{
  "isPresent": true
}
```

(`present` est aussi accepté.)

### Règles d'inscription

- L'utilisateur doit être authentifié.
- La partie ciblée doit exister.
- L'inscription à une partie privée nécessite un accès privé (`canSeePrivate`).
- Une inscription en doublon est rejetée (`409`).

### Filtre de visibilité

- `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`, `ROLE_ORGANIZER`: peuvent lister/lire toutes les inscriptions.
- Autres utilisateurs authentifiés: uniquement leurs propres inscriptions.

## Contacts d'urgence

Endpoint direct non exposé actuellement.

- `GET /api/emergency_contacts/{id}` retourne `404` avec `This route does not aim to be called.`

En pratique, les données de contact d'urgence sont consommées via les ressources utilisateur (`/api/me`, `/api/users/{id}`), sous cette forme:

```json
{
  "emergencyContact": {
    "@id": "/api/emergency_contacts/34",
    "@type": "EmergencyContact",
    "id": 34,
    "lastname": "lastname",
    "firstname": "firstname",
    "email": "mail@gmail.com",
    "phone": "0739664821"
  }
}
```

## Paramètres applicatifs

Endpoints singleton:

- `GET /api/app_settings` - `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`
- `PATCH /api/app_settings` - `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`

Exemple de réponse JSON `GET /api/app_settings` (200) / `PATCH /api/app_settings` (200):

```json
{
  "@context": "/api/contexts/AppSetting",
  "@id": "/api/app_settings",
  "@type": "AppSetting",
  "id": 1,
  "defaultAddress": "Terrain principal",
  "defaultPrice": 10,
  "defaultMaxPlaces": 24,
  "createdAt": "2026-07-18T09:40:38+00:00",
  "updatedAt": "2026-07-19T11:40:30+00:00"
}
```

Exemple de réponse observée sur une modification `PATCH /api/app_settings` (200):

```json
{
  "@context": "/api/contexts/AppSetting",
  "@id": "/api/app_settings",
  "@type": "AppSetting",
  "id": 1,
  "defaultAddress": "Terrain principal",
  "defaultPrice": 11,
  "defaultMaxPlaces": 25,
  "createdAt": "2026-07-18T09:40:38+00:00",
  "updatedAt": "2026-07-22T22:19:55+00:00"
}
```

### Payloads de requête (Paramètres applicatifs)

`PATCH /api/app_settings`:

```json
{
  "defaultAddress": "Terrain principal",
  "defaultPrice": 10,
  "defaultMaxPlaces": 24
}
```

## Exports CSV

### Export des parties

```http
GET /api/exports/games.csv
GET /api/exports/games.csv?dateFrom=2026-01-01&dateTo=2026-12-31
```

Accès: `ROLE_ORGANIZER`, `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`.

### Export des utilisateurs

```http
GET /api/exports/users.csv
GET /api/exports/users.csv?ageGroup=mineur&roles=ROLE_USER,ROLE_ORGANIZER
```

Accès: `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`.

Filtres:

- `ageGroup`: `mineur`, `majeur`, `tous` (accepte aussi `minor`, `major`, `all`)
- `roles`: liste séparée par virgules ou valeurs répétées

### Export des inscriptions par partie

```http
GET /api/exports/games/{id}/registrations.csv
```

Accès: `ROLE_ORGANIZER`, `ROLE_ADMIN` ou `ROLE_SUPER_ADMIN`.

## Limitation de débit

Configuration côté serveur:

- `login_request_limiter`: `3` requêtes / `5 minutes`
- `register_request_limiter`: `3` requêtes / `5 minutes`
- `login_attempt_limiter`: `3` tentatives / `5 minutes`

En cas de rejet: `429 Too Many Requests` + en-tête `Retry-After`.

## Erreurs courantes

- `400` payload invalide/erreur de validation
- `401` token d'authentification invalide ou manquant
- `403` permissions insuffisantes ou rejet CSRF (`{"message":"Requête invalide."}`)
- `404` ressource introuvable
- `409` conflit (ex: déjà inscrit)
- `429` limite de débit dépassée
