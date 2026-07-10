# API Reference - Airsoft

## Overview

REST API built with Symfony 7.4 + API Platform 4.3.15  
Base URL: `http://localhost:8000/api` (dev) | `https://api.production.com/api` (prod)

**Format**: JSON-LD (JSON Linked Data) with hydra namespace
**Authentication**: JWT Bearer tokens (Lexik JWT Authentication)
**Pagination**: 15 items per page (User, Game endpoints)

---

## Authentication

### Login (Public)

```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "role": "ROLE_USER"
  }
}
```

**Error (401 Unauthorized)**:
```json
{
  "code": 401,
  "message": "Invalid credentials"
}
```

### Register (Public)

```http
POST /api/register
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123",
  "dateOfBirth": "2000-01-15",
  "pseudo": "JohnD",
  "phone": "+33612345678",
  "emergencyContact": {
    "firstname": "Jane",
    "lastname": "Doe",
    "phone": "+33687654321",
    "relationship": "Mère"
  }
}
```

**Response (201 Created)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "john.doe@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "role": "ROLE_USER"
  }
}
```

### Authentication Headers

All authenticated requests require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/ld+json
```

---

## Users

### Get All Users (ADMIN only)

```http
GET /api/users?page=1
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "@context": "/api/contexts/User",
  "@id": "/api/users",
  "@type": "hydra:Collection",
  "hydra:member": [
    {
      "@id": "/api/users/1",
      "@type": "User",
      "id": 1,
      "email": "user@example.com",
      "firstname": "John",
      "lastname": "Doe",
      "pseudo": "JohnD",
      "phone": "+33612345678",
      "role": "ROLE_USER",
      "dateOfBirth": "2000-01-15",
      "createdAt": "2026-01-15T10:30:00+00:00",
      "updatedAt": "2026-01-15T10:30:00+00:00"
    }
  ],
  "hydra:totalItems": 42,
  "hydra:itemsPerPage": 15
}
```

### Get Single User (ADMIN only)

```http
GET /api/users/{id}
Authorization: Bearer <token>
```

### Update My Profile (Authenticated)

```http
PATCH /api/users/me
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "firstname": "John",
  "lastname": "Doe",
  "dateOfBirth": "2000-01-15",
  "pseudo": "JohnD",
  "phone": "+33612345678"
}
```

**Note**: `email` and `password` are NOT editable via this endpoint.

### Update My Email (Authenticated)

```http
PATCH /api/users/me/email
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "password": "CurrentPassword123",
  "newEmail": "newemail@example.com"
}
```

### Update My Password (Authenticated)

```http
PATCH /api/users/me/password
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "password": "CurrentPassword123",
  "newPassword": "NewPassword456"
}
```

**Security**: Triggers JWT token rotation (token nonce updated)

### Delete My Account (Authenticated)

```http
DELETE /api/users/me
Authorization: Bearer <token>
```

### Create User (ADMIN only)

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "firstname": "Jane",
  "lastname": "Smith",
  "email": "jane.smith@example.com",
  "password": "SecurePassword123",
  "dateOfBirth": "1995-05-20",
  "role": "ROLE_ORGANIZER"
}
```

**Note**: Only ADMIN can assign `ROLE_USER` or `ROLE_ORGANIZER`. `ROLE_SUPER_ADMIN` assignment restricted.

### Update User (ADMIN only)

```http
PATCH /api/users/{id}
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "firstname": "Jane",
  "pseudo": "JaneS",
  "role": "ROLE_ORGANIZER"
}
```

**Note**: Cannot modify `email`, `password`, or `dateOfBirth` via this endpoint.

### Delete User (ADMIN only)

```http
DELETE /api/users/{id}
Authorization: Bearer <token>
```

---

## Games

### Get All Games (Public)

```http
GET /api/games?page=1
```

**Response (200 OK)**:
```json
{
  "@context": "/api/contexts/Game",
  "@id": "/api/games",
  "@type": "hydra:Collection",
  "hydra:member": [
    {
      "@id": "/api/games/1",
      "@type": "Game",
      "id": 1,
      "title": "CQB Night Session",
      "description": "Indoor close quarters battle scenario",
      "startDateTime": "2026-07-15T20:00:00+00:00",
      "address": "Terrain Nord, Paris 75",
      "price": 10.0,
      "maxPlaces": 24,
      "registrationCount": 12,
      "availablePlaces": 12,
      "full": false,
      "isPublic": true,
      "image": "/uploads/games/cqb.jpg",
      "createdAt": "2026-01-10T14:30:00+00:00",
      "updatedAt": "2026-01-10T14:30:00+00:00"
    }
  ],
  "hydra:totalItems": 5,
  "hydra:itemsPerPage": 15
}
```

**Public games**: Visible to all without authentication  
**Private games**: Only visible to ADMIN/ORGANIZER

### Get Single Game (Public)

```http
GET /api/games/{id}
```

### Create Game (ADMIN only)

```http
POST /api/games
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "title": "New Scenario",
  "description": "New game description",
  "startDateTime": "2026-07-20T19:00:00+00:00",
  "address": "Terrain Nord, Paris 75",
  "price": 15.0,
  "maxPlaces": 30,
  "isPublic": true
}
```

### Update Game (ADMIN only)

```http
PUT /api/games/{id}
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "title": "Updated Title",
  "price": 12.0,
  "maxPlaces": 32
}
```

### Delete Game (ADMIN only)

```http
DELETE /api/games/{id}
Authorization: Bearer <token>
```

---

## Game Registrations

### Get My Registrations (Authenticated)

```http
GET /api/game_registrations/mine
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
[
  {
    "id": 5,
    "gameId": 1,
    "gameTite": "CQB Night Session",
    "userId": 2,
    "userFirstname": "John",
    "userLastname": "Doe",
    "userEmail": "john@example.com",
    "userAge": 24,
    "isPresent": false,
    "createdAt": "2026-01-12T15:45:00+00:00"
  }
]
```

### Get All Registrations (ADMIN only)

```http
GET /api/game_registrations?page=1
Authorization: Bearer <token>
```

### Get Single Registration (ADMIN or own registration)

```http
GET /api/game_registrations/{id}
Authorization: Bearer <token>
```

### Register to Game (Authenticated)

```http
POST /api/game_registrations
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "game": "/api/games/1"
}
```

**Validation**:
- User must be authenticated
- Game must exist
- Game must be public or user is ADMIN
- User cannot be already registered
- Game must not be full

**Response (201 Created)**:
```json
{
  "id": 10,
  "gameId": 1,
  "userId": 2,
  "isPresent": false,
  "createdAt": "2026-01-13T10:00:00+00:00"
}
```

### Mark Presence (ADMIN only)

```http
PATCH /api/game_registrations/{id}
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "isPresent": true
}
```

### Delete Registration (ADMIN or owner)

```http
DELETE /api/game_registrations/{id}
Authorization: Bearer <token>
```

---

## Emergency Contacts

### Get Emergency Contacts by User (ADMIN only)

```http
GET /api/emergency_contacts?user.id={userId}
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "@context": "/api/contexts/EmergencyContact",
  "@id": "/api/emergency_contacts",
  "@type": "hydra:Collection",
  "hydra:member": [
    {
      "@id": "/api/emergency_contacts/1",
      "@type": "EmergencyContact",
      "id": 1,
      "firstname": "Jane",
      "lastname": "Doe",
      "phone": "+33687654321",
      "relationship": "Mère"
    }
  ]
}
```

### Get Emergency Contact (ADMIN only)

```http
GET /api/emergency_contacts/{id}
Authorization: Bearer <token>
```

**Note**: Emergency contacts are embedded in User entity via `emergencyContact` field.

---

## App Settings

### Get Settings (ADMIN only)

```http
GET /api/app_settings
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "@context": "/api/contexts/AppSetting",
  "@id": "/api/app_settings",
  "@type": "hydra:Collection",
  "hydra:member": [
    {
      "@id": "/api/app_settings/1",
      "@type": "AppSetting",
      "id": 1,
      "defaultAddress": "Terrain Principal, Paris 75",
      "defaultPrice": 10.0,
      "defaultMaxPlaces": 24,
      "createdAt": "2026-01-01T00:00:00+00:00",
      "updatedAt": "2026-01-01T00:00:00+00:00"
    }
  ]
}
```

### Create Settings (ADMIN only)

```http
POST /api/app_settings
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "defaultAddress": "Terrain Principal, Paris 75",
  "defaultPrice": 10.0,
  "defaultMaxPlaces": 24
}
```

### Update Settings (ADMIN only)

```http
PATCH /api/app_settings/{id}
Authorization: Bearer <token>
Content-Type: application/ld+json

{
  "defaultPrice": 12.0
}
```

### Delete Settings (ADMIN only)

```http
DELETE /api/app_settings/{id}
Authorization: Bearer <token>
```

---

## Exports (CSV)

### Export Games (ADMIN only)

```http
GET /api/exports/games.csv?dateFrom=2026-01-01&dateTo=2026-12-31
Authorization: Bearer <token>
```

**Response**: CSV file
```
id,title,address,startDateTime,price,maxPlaces,registrationCount
1,"CQB Night Session","Terrain Nord, Paris 75","2026-07-15 20:00","10.00",24,12
```

### Export Users (ADMIN only)

```http
GET /api/exports/users.csv?ageGroup=tous&role=ROLE_USER&role=ROLE_ORGANIZER
Authorization: Bearer <token>
```

**Query Parameters**:
- `ageGroup`: `mineur`, `majeur`, `tous` (default: `tous`)
- `role`: Can specify multiple times (ROLE_USER, ROLE_ORGANIZER, ROLE_ADMIN)

**Response**: CSV file
```
id,firstname,lastname,email,pseudo,phone,dateOfBirth,role,createdAt
1,"John","Doe","john@example.com","JohnD","+33612345678","2000-01-15","ROLE_USER","2026-01-10 14:30"
```

### Export Game Registrations (ADMIN only)

```http
GET /api/exports/registrations.csv?gameId=1
Authorization: Bearer <token>
```

**Response**: CSV file
```
id,gameId,gameTitle,userId,userFirstname,userLastname,userEmail,isPresent
1,1,"CQB Night Session",2,"John","Doe","john@example.com",1
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "@context": "/api/contexts/ConstraintViolationList",
  "@type": "ConstraintViolationList",
  "hydra:title": "An error occurred",
  "hydra:description": "firstName: This value should not be blank.",
  "violations": [
    {
      "propertyPath": "firstName",
      "message": "This value should not be blank."
    }
  ]
}
```

**401 Unauthorized**:
```json
{
  "code": 401,
  "message": "Expired JWT Token"
}
```

**403 Forbidden**:
```json
{
  "code": 403,
  "message": "Access Denied"
}
```

**404 Not Found**:
```json
{
  "@context": "/api/contexts/Error",
  "@type": "hydra:Error",
  "hydra:title": "An error occurred",
  "hydra:description": "Not Found"
}
```

---

## Security Headers & CORS

**CORS Configuration** (dev):
- Allowed Origins: `http://localhost:3000`
- Allowed Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Allowed Headers: `Content-Type, Authorization`

**Recommended Production Headers**:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## Rate Limiting

Not implemented yet. Recommended:
- Auth endpoint: 5 attempts per 15 minutes per IP
- API endpoint: 100 requests per minute per user

---

## Versioning

API version: **1.0.0** (see `docs/DEPLOYMENT.md` for versioning strategy)

Future versions available via header:
```
Accept-Version: 2.0
```

---

## SDK / Client Libraries

**Frontend TypeScript Client** available at:
- `frontend/src/lib/game-api.ts`
- `frontend/src/lib/user-api.ts`
- `frontend/src/lib/auth.ts`
- `frontend/src/lib/export-api.ts`
