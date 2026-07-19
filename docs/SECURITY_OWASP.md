# Dossier de conformité OWASP Top 10 2025

**Référence**: https://owasp.org/Top10/2025/
**Périmètre**: backend Symfony/API Platform, frontend Next.js, CI/CD

Ce document synthétise les contrôles de sécurité implémentés dans l'application Airsoft. Seules les implémentations complétées sont documentées ici.

---

## Résumé de couverture

| Risque OWASP | Points clés |
|--------------|------------|
| A01 - Broken Access Control | Deny-by-default, RBAC, voters métier, filtrage ownership, JWT revocation |
| A02 - Security Misconfiguration | Config env, CORS restreint, non-root containers, secrets sécurisés |
| A03 - Software Supply Chain | Lockfiles, versions explicites, scan Semgrep, Git protégé |
| A04 - Cryptographic Failures | Hashing bcrypt/argon, JWT signé, validation claims, random_bytes |
| A05 - Injection | ORM Doctrine, requêtes paramétrées, validation Symfony/Zod, pas de exec |
| A06 - Insecure Design | Contrôles métier explicites, RBAC, anti-abus (rate limiting), voters |
| A07 - Authentication Failures | JWT httpOnly, throttling, politique mot de passe, revocation/rotation |
| A08 - Data Integrity | Lockfiles, contraintes serveur, validation DTO, JWT immuable |
| A09 - Security Logging and Alerting | Politique logging, 8 composants SEC.*, alerting 6 règles, tests observabilité |
| A10 - Exceptional Conditions | Exceptions typées, validations strictes, retries, tests erreurs JWT |

---

## A01 - Broken Access Control

### Implémentations

#### 1. Authentification par défaut (Deny-by-Default)

L'API applique une stratégie deny-by-default sur `/api`:
- Toutes les routes `/api` exigent `IS_AUTHENTICATED_FULLY`
- Endpoints publics explicitement déclarés dans `security.yaml`:
  - `GET /api/games`, `GET /api/games/{id}`
  - `POST /api/login`, `POST /api/register`, `POST /api/logout`
  - `GET /api/csrf/*`

**Fichier**: `backend/config/packages/security.yaml`

#### 2. RBAC hiérarchique

Hiérarchie de rôles:
```
ROLE_SUPER_ADMIN (accès complet)
  └─ ROLE_ADMIN (gestion utilisateurs, exports, settings)
       └─ ROLE_ORGANIZER (création parties)
            └─ ROLE_USER (participation)
```

Restrictions par endpoint:
- `/api/users` (GET, DELETE): ADMIN+ seulement
- `/api/games` (POST, PATCH, DELETE): ADMIN+ seulement
- `/api/exports/*`: ADMIN+ seulement
- `/api/games/{id}/register`: USER+ (soumis aux voters)

**Fichier**: `backend/config/packages/security.yaml`

#### 3. Voters métier côté serveur

4 voters implémentés pour contrôles métier décentralisés:

| Voter | Ressource | Décision |
|-------|-----------|----------|
| `UserVoter` | Modification utilisateur | Bloque change role sauf par SUPER_ADMIN, bloque password via PATCH |
| `GameVoter` | Création/modification partie | Autorise création/modif selon rôle et ownership |
| `GameRegistrationVoter` | Inscription à partie | Valide visibilité, complétude, quotas, rôle |
| `AppSettingVoter` | Paramètres applicatifs | ADMIN+ uniquement |

**Fichiers**: `backend/src/Security/Voter/*.php`

#### 4. Protection IDOR et filtrage visibility

Ressources filtrées par le serveur:
- Games privées accessibles uniquement à propriétaire + ADMIN+
- GameRegistrations filtrées par utilisateur courant (sauf ADMIN)
- Endpoint `/api/me` pour auto-consultation

**Fichiers**:
- `backend/src/State/GameVisibilityExtension.php`
- `backend/src/State/GameRegistrationVisibilityExtension.php`
- `backend/src/State/MyGameRegistrationsProvider.php`

#### 5. Révocation et invalidation JWT

- **Logout**: Suppression cookie + révocation JTI dans Redis
- **Changement mot de passe**: Rotation nonce utilisateur → tokens anciens invalides
- **Validation robuste**: Claims iss/aud + signature + nonce de session
- **Storage immuable**: Revocation store Redis avec TTL aligné token_ttl

**Fichiers**:
- `backend/src/Controller/LogoutController.php`
- `backend/src/Security/Jwt/JwtRevocationStore.php`
- `backend/src/Security/Jwt/TokenVersionSubscriber.php`
- `backend/src/State/MePasswordUpdateProcessor.php`

#### 6. Tests de couverture

Batteries de tests couvrant contrôles d'accès:

| Test | Scope |
|------|-------|
| `UserVoterTest`, `GameVoterTest`, etc. | Logique voters (15+ scénarios) |
| `*VisibilityExtensionTest` | Filtrage ownership/visibility |
| `AdminExportControllerTest` | Tests 401/403 sur exports |
| `GameApiTest`, `GameRegistrationApiTest` | Tests API full-flow |

**Fichiers**: `backend/tests/Security/Voter/*.php`, `backend/tests/Api/*.php`

---

## A02 - Security Misconfiguration

### Implémentations

#### 1. Configuration par environnement (variables d'env)

Tous les secrets/paramètres sensibles externalisés:
- `APP_SECRET`, `DATABASE_URL`, `REDIS_URL`
- `JWT_SECRET_KEY`, `JWT_PUBLIC_KEY`, `JWT_PASSPHRASE`
- `JWT_ISSUER`, `JWT_AUDIENCE`
- `CORS_ALLOW_ORIGIN`

Documentation dans `.env.example`.

**Fichiers**: `backend/.env.example`, `docker-compose.yaml`

#### 2. CORS restreint par route

CORS non ouvert en wildcard. Configuration par routes:
- Origines pilotées par regex via `CORS_ALLOW_ORIGIN` env
- Méthodes et headers minimisés par route:
  - `/api/csrf`: GET seulement
  - `/api/login`: POST seulement
  - `/api`: GET/POST/PUT/PATCH/DELETE selon besoin

**Fichier**: `backend/config/packages/nelmio_cors.yaml`

#### 3. Exécution non-root

Conteneurs backend et frontend exécutent des utilisateurs non-root:
- Backend: utilisateur `www-data` (PHP-FPM)
- Frontend: utilisateur `node` (Node.js)

**Fichiers**: `backend/Dockerfile`, `frontend/Dockerfile`

#### 4. Isolation des services

Docker Compose utilise un réseau interne:
- Backend accessible via `backend:9000`
- Frontend accessible via `frontend:3000`
- PostgreSQL/Redis internes au réseau (non exposés)

**Fichier**: `docker-compose.yaml`

#### 5. Messages d'erreur génériques

Login et auth renvoient messages génériques:
- `401 Unauthorized` (pas de distinction "user not found" vs "wrong password")
- Codes HTTP typés (401/403/429 selon contexte)

**Fichier**: `backend/src/Security/GenericAuthenticationFailureHandler.php`

---

## A03 - Software Supply Chain

### Implémentations

#### 1. Verrouillage des dépendances

Lockfiles présents et audités:
- `backend/composer.lock` (PHP/Symfony)
- `frontend/package-lock.json` (npm, avec integrity hashes)

**Commandes d'audit**:
```bash
composer audit
npm audit
```

**Fichiers**: `backend/composer.lock`, `frontend/package-lock.json`

#### 2. Versions de base explicites

Versions déclarées et figées:
- Symfony 7.4.*
- Next.js 16.2.6, React 19.2.4
- PHP >=8.4
- Node.js 20-alpine (Docker)

**Fichiers**: `backend/composer.json`, `frontend/package.json`, `backend/Dockerfile`, `frontend/Dockerfile`

#### 3. Scan statique de sécurité (Semgrep)

Workflow GitHub Actions dédié:
- Règles OWASP + secrets (Semgrep Pro)
- Scan regexps critiques (secrets, patterns dangereux)

**Fichier**: `.github/workflows/security-scanner.yml`

#### 4. Branche principale protégée

Dépôt GitHub configuré:
- Branche `main` protégée (force PR)
- Commits conventionnels (type: scope: message)
- Builds CI avant merge

**Configuration**: GitHub dépôt

#### 5. Installation déterministe

- Backend: `composer install` depuis `composer.lock`
- Frontend: `npm ci` (deterministic install)

**Fichiers**: `backend/Dockerfile`, `frontend/Dockerfile`

---

## A04 - Cryptographic Failures

### Implémentations

#### 1. Hashage des mots de passe

Hashing via Symfony Security:
```yaml
password_hashers:
  PasswordAuthenticatedUserInterface: "auto"
```

Algorithme adaptatif (bcrypt/argon selon PHP/config). Coûts réduits en test pour rapidité.

**Fichier**: `backend/config/packages/security.yaml`

#### 2. JWT signé et validé

Lexik JWT Authentication Bundle:
- Clés privée/publique externalisées (env)
- Token TTL: 3600 secondes
- Extraction par cookie httpOnly ou header Bearer

**Configuration**: `backend/config/packages/lexik_jwt_authentication.yaml`

```yaml
lexik_jwt_authentication:
  secret_key: "%env(JWT_SECRET_KEY)%"
  public_key: "%env(JWT_PUBLIC_KEY)%"
  pass_phrase: "%env(JWT_PASSPHRASE)%"
  token_ttl: 3600
```

#### 3. Validation avancée des claims

TokenVersionSubscriber valide:
- Claims `iss` (issuer) et `aud` (audience)
- JTI (JWT ID) unique + immuable
- Signature liée au hash password (impossibilité reuse post-password-change)
- Nonce de session (impossibilité reuse cross-device)

**Fichier**: `backend/src/Security/Jwt/TokenVersionSubscriber.php`

#### 4. Génération aléatoire cryptographique

Identifiants générés via `random_bytes()`:
- JTI token: `bin2hex(random_bytes(16))`
- Nonce utilisateur: `bin2hex(random_bytes(32))`

**Fichiers**: 
- `backend/src/Security/Jwt/JwtRevocationStore.php`
- `backend/src/State/MePasswordUpdateProcessor.php`

#### 5. Cookie durci

Cookie d'authentification `ma_access_token`:
- `httpOnly=true` (pas d'accès JS)
- `SameSite=Lax` (CSRF protection)
- `secure=true` en contexte HTTPS

**Fichier**: `backend/src/Security/Jwt/TokenVersionSubscriber.php`

#### 6. Timeout applicatif

Inactivité JWT gérée via `JWT_INACTIVITY_TIMEOUT` env. Revocation implicite après inactivité.

**Fichier**: `backend/src/Security/Jwt/TokenVersionSubscriber.php`

#### 7. Tests cryptographiques

Tests robustes sur révocation, nonce, invalidation, expiration:

**Fichiers**:
- `backend/tests/Security/Jwt/TokenVersionSubscriberTest.php`
- `backend/tests/Security/Jwt/JwtRevocationStoreTest.php`

---

## A05 - Injection

### Implémentations

#### 1. ORM Doctrine (protection SQL injection)

Toutes requêtes base via Doctrine QueryBuilder:
- Paramétrage automatique via `setParameter()`
- Pas de concaténation SQL utilisateur
- Repositories centralisés

**Exemples**:
```php
$repository->createQueryBuilder('u')
  ->where('u.username = :username')
  ->setParameter('username', $input)
  ->getQuery();
```

**Fichiers**: `backend/src/Repository/*.php`

#### 2. Validation Symfony Validator

Contraintes strictes sur DTO/entités:
- `NotBlank`, `Length`, `Email`, `Choice`, `Regex`
- Validation avant persistance (processor level)
- Rejet de données invalides → exception

**Fichiers**: `backend/src/Dto/*.php`, `backend/src/Entity/*.php`

#### 3. Validation frontend Zod + react-hook-form

Filtrage amont côté client:
- Schemas Zod définissant types/formats
- Validation live via react-hook-form
- Rejet données malformées avant submit

**Fichiers**: `frontend/src/lib/schemas/*.ts`, `frontend/src/components/**/*.tsx`

#### 4. Pas d'exec/eval/unserialize

Scan codebase:
- Zéro occurrence `exec()`, `shell_exec()`, `system()`, `eval()`, `unserialize()`
- Pas de RCE surface applicatif

#### 5. Pas de XSS React

- Pas d'usage `dangerouslySetInnerHTML`
- Pas d'innerHTML direct
- React échappe sorties texte par défaut

**Vérification**: `grep -r "dangerouslySetInnerHTML\|innerHTML" frontend/src` → 0 matches

#### 6. Scan statique Semgrep

Workflow CI détecte patterns injection:
- SQLi payloads
- XSS patterns
- Secrets (API keys, passwords)

**Fichier**: `.github/workflows/security-scanner.yml`

---

## A06 - Insecure Design

### Implémentations

#### 1. Contrôles métier explicites (Voters + Processors)

Règles métier centralisées et testées:

| Risque métier | Contrôle |
|---------------|----------|
| Inscription après complétude | `GameRegistrationCreateProcessor` valide capacité avant persist |
| Élévation privilège utilisateur | `UserVoter` bloque change role sauf SUPER_ADMIN |
| Exposition mot de passe | Groupes sérialisation exclude password en output |
| Visibilité ressource | `GameVisibilityExtension` filtre parties privées |

**Fichiers**: `backend/src/Security/Voter/*.php`, `backend/src/State/*.php`

#### 2. Validations multi-couches

- Frontend: Zod schemas + react-hook-form
- Backend: Symfony Validator constraints
- Processor level: Métier validations avant persist

Exemple inscription:
```php
// Validation DTO
$validator->validate($dto);

// Voter check
$this->authorizationChecker->isGranted('REGISTER_GAME', $game);

// Processor métier
if ($game->isAtCapacity()) throw new BadRequestHttpException();
```

**Fichiers**: `backend/src/Dto/*.php`, `backend/src/State/*.php`

#### 3. Anti-abus (Rate Limiting)

Throttling sur endpoints d'entrée:
- Login: max 3 tentatives / 5 minutes (429 + Retry-After)
- Register: max 10 requêtes / 10 minutes
- Implémenté via Symfony Rate Limiter + subscriber

**Fichiers**:
- `backend/config/packages/rate_limiter.yaml`
- `backend/src/Security/LoginRequestRateLimiterSubscriber.php`
- `backend/src/EventListener/RegisterRequestRateLimiterSubscriber.php`

#### 4. Fail-closed sur erreurs

Exceptions typées et traitement défensif:
- Redis indisponibilité → revocation inaccessible → 503 Service Unavailable
- Validations strictes bloquent avant mutations
- Pas de fallbacks silencieux

**Fichier**: `backend/src/Security/Jwt/JwtRevocationStore.php`

#### 5. Tests d'autorisation métier

Couverture sur workflows sensibles:

| Test | Cas couverts |
|------|------------|
| `GameRegistrationCreateProcessorTest` | Inscription complète, partie privée non-visible, capacité atteinte |
| Voter tests | Créateur only, ADMIN override, ownership checks |
| API tests | Flux end-to-end avec assertions 400/401/403 |

**Fichiers**: `backend/tests/State/*.php`, `backend/tests/Security/Voter/*.php`

---

## A07 - Authentication Failures

### Implémentations

#### 1. Authentification centralisée JWT

L'authentification repose sur Lexik JWT:
- Firewall login sur `/api/login` (extraction credentials)
- Firewall JWT sur `/api` (validation bearer/cookie)
- Deux modes transport: cookie httpOnly + Bearer header

**Configuration**: `backend/config/packages/security.yaml`

#### 2. Protection anti-bruteforce

Login throttling multi-couches:
- Firewall `login_throttling`: max 3 tentatives / 5 minutes
- Rate limiter supplémentaire (429 + Retry-After)
- Subscription sur requête pour tracking IP/utilisateur

**Fichiers**:
- `backend/config/packages/security.yaml`
- `backend/config/packages/rate_limiter.yaml`
- `backend/src/Security/LoginRequestRateLimiterSubscriber.php`

#### 3. Politique mot de passe forte

Validations backend strictes:
- Longueur minimale: 12 caractères
- Majuscule, minuscule, chiffre, symbole obligatoires
- Hashage via `password_hashers: auto` (bcrypt/argon)

**Fichier**: `backend/src/Dto/RegistrationInputDto.php`

#### 4. Messages d'erreur non-verbeux

Anti-énumération utilisateurs:
- Login fail: message unique "Invalid credentials" (pas de distinction user not found vs bad password)
- Codes HTTP standardisés (401/403/429)

**Fichier**: `backend/src/Security/GenericAuthenticationFailureHandler.php`

#### 5. Gestion avancée JWT

- **JTI unique**: Chaque token a identifiant immuable
- **Nonce session**: Signature liée nonce + hash password
- **Revocation store**: Redis avec JTI → TTL aligné token_ttl
- **Rotation post-password-change**: Nonce forcé → tokens anciens rejetés
- **Timeout inactivité**: Applicatif `JWT_INACTIVITY_TIMEOUT`

**Fichiers**:
- `backend/src/Security/Jwt/TokenVersionSubscriber.php`
- `backend/src/Security/Jwt/JwtRevocationStore.php`

#### 6. Cookie httpOnly + SameSite

Cookie d'authentification sécurisé:
- `httpOnly=true` (pas d'accès JavaScript)
- `SameSite=Lax` (protection CSRF)
- `secure=true` en HTTPS

**Fichier**: `backend/src/Security/Jwt/TokenVersionSubscriber.php`

#### 7. Tests robustes JWT

Couverture complète sur scénarios critiques:

| Test | Validation |
|------|-----------|
| `TokenVersionSubscriberTest` | Validation claims iss/aud/nonce, rejet token invalide/expiré |
| `JwtRevocationStoreTest` | Revocation, TTL, Redis errors |
| `GenericAuthenticationFailureHandlerTest` | Emission log, 401 response |

**Fichiers**: `backend/tests/Security/Jwt/*.php`

---

## A08 - Data Integrity

### Implémentations

#### 1. Lockfiles (verrouillage versions)

Dépendances figées pour reproductibilité:
- `backend/composer.lock`: PHP/Symfony
- `frontend/package-lock.json`: npm

Installation déterministe:
- Backend: `composer install` (pas de update)
- Frontend: `npm ci` (deterministic)

**Fichiers**: `backend/Dockerfile`, `frontend/Dockerfile`

#### 2. Allow-plugins Composer

Whitelist explicite des plugins Composer autorisés:
```json
"allow-plugins": {
  "symfony/flex": true,
  "symfony/runtime": true,
  ...
}
```

Limite surface d'exécution de plugins non approuvés.

**Fichier**: `backend/composer.json`

#### 3. Contraintes serveur sur données critiques

Modifications utilisateur contrôlées côté serveur:
- Register: rôle forcé à `ROLE_USER`, `canSeePrivate` forcé à `false`
- Update utilisateur: changement rôle validé par voters
- Pas de modification password via PATCH (endpoint dédié)

**Fichiers**:
- `backend/src/State/UserCreateProcessor.php`
- `backend/src/State/UserUpdateProcessor.php`

#### 4. Validation avant persistance

DTO + Validator strict:
- Validation DTO sur input
- Validation entité sur persist
- Rejet données menant à états incohérents

**Fichiers**: `backend/src/Dto/*.php`, `backend/src/Entity/*.php`

#### 5. Intégrité JWT avancée

Token inclut:
- JTI unique + immuable (pas de reuse)
- Signature liée nonce utilisateur
- Claims iss/aud pour contexte
- Rejet complet si payload invalide

**Fichier**: `backend/src/Security/Jwt/TokenVersionSubscriber.php`

#### 6. Gestion transactions explicite

Doctrine gère transactions implicites:
- Persist/flush = transaction atomique
- Rollback automatique en exception
- Pas de state partiellement persisté

---

## A09 - Security Logging and Alerting

### Implémentations

#### 1. Politique de logging sécurité

**Document**: [docs/SECURITY_LOGGING_POLICY.md](../docs/SECURITY_LOGGING_POLICY.md)

Schéma obligatoire en JSON:
```json
{
  "timestamp": "2026-07-18T15:30:45.123Z",
  "event_id": "SEC.AUTH.LOGIN_FAILED",
  "event_category": "authentication",
  "severity": "WARNING",
  "actor_id_hash": "sha256(user_id)",
  "source_ip_masked": "192.168.1.0/24",
  "http_status": 401,
  "service": "airsoft-api"
}
```

Redaction PII stricte:
- Mots de passe: exclus
- Emails: masqués
- IPs: /24 masquée
- Identifiants: hachés SHA256

Rétention par tier:
- Logs critiques (4xx): 90 jours
- Logs sécurité (auth, admin): 1 an
- Logs applicatifs (5xx): 365 jours

#### 2. Instrumentation 8 composants SEC.*

Événements émis vers canal Monolog `security`:

| Composant | Événement | Condition |
|-----------|----------|-----------|
| GenericAuthenticationFailureHandler | SEC.AUTH.LOGIN_FAILED | Login échoué |
| AccessDeniedLoggingSubscriber | SEC.AUTHZ.ACCESS_DENIED | Accès refusé (403) |
| TokenVersionSubscriber | SEC.JWT.INVALID_TOKEN | Token invalide/expiré/révoqué |
| TokenVersionSubscriber | SEC.JWT.REVOCATION_ERROR | Erreur revocation store |
| LogoutController | SEC.JWT.TOKEN_REVOKED | Logout réussi |
| UserUpdateProcessor | SEC.ADMIN.ROLE_CHANGED | Rôle utilisateur modifié |
| AppSettingUpdateProcessor | SEC.ADMIN.SETTINGS_UPDATED | Paramètres applicatifs modifiés |
| AdminExportController | SEC.ADMIN.EXPORT_* | Exports CSV admin |
| GameRegistrationPresenceController | SEC.ADMIN.PRESENCE_UPDATED | Présence modifiée |

**Injection dépendance**: `#[Autowire(service: 'monolog.logger.security')]`

**Fichiers**:
- `backend/src/Security/GenericAuthenticationFailureHandler.php`
- `backend/src/EventListener/AccessDeniedLoggingSubscriber.php`
- `backend/src/Security/Jwt/TokenVersionSubscriber.php`
- `backend/src/Controller/LogoutController.php`
- `backend/src/State/UserUpdateProcessor.php`
- `backend/src/State/AppSettingUpdateProcessor.php`
- `backend/src/Controller/AdminExportController.php`
- `backend/src/Controller/GameRegistrationPresenceController.php`

#### 3. Centralisation JSON via Monolog

**Configuration**: `backend/config/packages/monolog.yaml`

Canal sécurité dédié:
```yaml
monolog:
  channels: [security]
  handlers:
    security:
      type: stream
      path: "%kernel.logs_dir%/security.log"
      formatter: monolog.formatter.json
      channels: [security]
```

Format JSON unifié pour tous les événements SEC.*.

**Docker rotation**:
- Driver `json-file`
- Options: `max-size=10m`, `max-file=5`
- Prod: logs → stderr → collecteur Docker → SIEM

#### 4. Alerting avec 6 règles de seuil

**Script**: `backend/bin/security_alert_check.php` (250 lignes)

Règles d'évaluation sliding-window:

| Règle | Seuil | Fenêtre | Escalade |
|-------|-------|---------|----------|
| BRUTE_FORCE_LOGIN_IP | ≥20 LOGIN_FAILED | 5 min | security-oncall |
| ACCESS_DENIED_BURST_ACTOR | ≥50 ACCESS_DENIED | 10 min | security-ops |
| RATE_LIMIT_BURST_IP | ≥10 RATE_LIMITED | 5 min | security-ops |
| JWT_REVOCATION_ERROR_ANY | ≥1 REVOCATION_ERROR | 10 min | security-oncall |
| SECURITY_5XX_BURST | ≥5 SEC.* (500-599) | 10 min | security-oncall |
| ADMIN_ACTION_VOLUME | ≥20 SEC.ADMIN.* | 15 min | security-oncall |

**Webhook escalade**:
- POST JSON à `SECURITY_ALERT_WEBHOOK_URL`
- Contient: alert_id, severity, count, affected_resources, sample_logs

**Exit codes**:
- 0: Pas d'alerte
- 2: Alerte(s) détectée(s)
- 3: Erreur escalade webhook

**Configuration**: `backend/config/security_alert_rules.yaml`

#### 5. Tests d'observabilité (event → log → alert)

**GenericAuthenticationFailureHandlerTest**:
```php
public function testAuthenticationFailureProducesSecurityLogAnd401Response()
{
  // Assert: logger emitted SEC.AUTH.LOGIN_FAILED
  // Assert: response 401
}
```

**SecurityAlertCheckTest**:
1. `testCriticalJwtRevocationErrorTriggersExpectedAlert`
   - Injecte SEC.JWT.REVOCATION_ERROR dans logs
   - Script évalué
   - Vérifie exit code 2 + alerte JWT_REVOCATION_ERROR_ANY

2. `testNoAlertWhenThresholdIsNotReached`
   - Unique SEC.AUTH.LOGIN_FAILED
   - Vérifie exit code 0 (pas d'alerte)

**Résultat**: 3/3 tests ✅, 13 assertions, couverture chain complète

**Fichiers**:
- `backend/tests/Security/Jwt/GenericAuthenticationFailureHandlerTest.php`
- `backend/tests/Security/SecurityAlertCheckTest.php`

#### 6. Documentation centralisée

Manuels opérationnels:

| Document | Contenu |
|----------|---------|
| `docs/SECURITY_LOGGING_POLICY.md` | Schéma, PII, rétention, gouvernance |
| `docs/SECURITY_LOGGING_CENTRALIZATION.md` | Pipeline ELK/OpenSearch, index, requêtes, checklist prod |
| `docs/SECURITY_ALERTING_ESCALATION.md` | 6 règles détaillées, SLA, webhook format, test commands |

---

## A10 - Exceptional Conditions

### Implémentations

#### 1. Exceptions typées et fail-closed

Exceptions HTTP sémantiques:
- `400 BadRequestHttpException`: Données invalides
- `401 UnauthorizedHttpException`: Auth manquante/invalide
- `403 ForbiddenHttpException`: Authorization échouée
- `409 ConflictHttpException`: Unique constraint, état incohérent
- `429 TooManyRequestsHttpException`: Rate limit
- `503 ServiceUnavailableHttpException`: Dépendance critique indisponible (Redis)

**Exemple Redis indisponible**:
```php
try {
  $this->revocationStore->check($token);
} catch (RedisException $e) {
  throw new ServiceUnavailableHttpException(null, "Revocation store unavailable");
}
```

**Fichiers**: `backend/src/Security/Jwt/*.php`, `backend/src/State/*.php`

#### 2. Validations strictes en amont

Rejet données invalides avant traitement:
- DTO validation strict (NotBlank, Length, Email)
- Entité validation pre-persist
- Rejet immédiat → exception → client reçoit 400

Prévient états partiellement persistés.

**Fichiers**: `backend/src/Dto/*.php`, `backend/src/Entity/*.php`

#### 3. Anti-abus (throttling)

Rate limiting sur endpoints à risque:
- Login: 3 tentatives / 5 minutes → 429
- Register: 10 requêtes / 10 minutes
- Retry-After header
- Limite pression sur chemins d'erreurs

**Fichier**: `backend/config/packages/rate_limiter.yaml`

#### 4. Gestion defensive des erreurs infrastructure

JWT errors traités explicitement:
- Token expiré → 401 + message clair
- Redis unavailable → 503 (pas fallback silencieux)
- Decode error → 401 (malformé)

**Fichier**: `backend/src/Security/Jwt/TokenVersionSubscriber.php`

#### 5. Retries côté frontend

Next.js client HTTP robuste:
- Retries exponentiels sur 5xx/timeout
- Distinction 4xx (pas de retry) vs 5xx (retry)
- Exponential backoff

**Fichier**: `frontend/src/lib/api-client.ts`

#### 6. Error boundary Next.js

`error.tsx` global pour UI crashes:
- Affiche message user-friendly
- Log erreur console
- Fallback UI opérationnel

**Fichier**: `frontend/src/app/error.tsx`

#### 7. Tests sur cas d'erreurs critiques

Couverture scénarios exceptionnels:

| Test | Scénario |
|------|----------|
| `JwtRevocationStoreTest` | Redis unavailable, TTL errors |
| `TokenVersionSubscriberTest` | Token invalide, claims manquants, signature invalide |
| Integration tests | Workflows complets avec erreurs injectées |

**Fichiers**: `backend/tests/Security/Jwt/*.php`

---

## Commandes de validation

Exécuter tests/vérifications:

```bash
# Tests sécurité (backend)
cd backend
php bin/phpunit tests/Security/ --display-skipped

# Tests voters
php bin/phpunit tests/Security/Voter/ -v

# Tests API
php bin/phpunit tests/Api/ -v

# Audit dépendances
composer audit
npm audit

# Scan statique (local si Semgrep installé)
semgrep --config=p/owasp-top-ten backend/src/

# Tests observabilité A09
php bin/phpunit tests/Security/Jwt/GenericAuthenticationFailureHandlerTest.php tests/Security/SecurityAlertCheckTest.php -v

# Validation alertes
docker compose exec backend php bin/security_alert_check.php --file /app/var/log/dev.security.log --rules /app/config/security_alert_rules.yaml
```

---

## Ressources

- [OWASP Top 10 2025](https://owasp.org/Top10/2025/)
- [Symfony Security](https://symfony.com/doc/current/security.html)
- [API Platform Security](https://api-platform.com/docs/core/security/)
- [Lexik JWT Authentication](https://github.com/lexik/LexikJWTAuthenticationBundle)
- [Monolog Logger](https://seldaek.github.io/monolog/)

---
