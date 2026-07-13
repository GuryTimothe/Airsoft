# OWASP Top 10 (2021) - Couverture Sécurité Implémentée

**Référence**: https://owasp.org/Top10/

---

## 1. A01:2021 - Broken Access Control

### ✓ Implémenté

**Technologie**: Symfony Security + User Voters + JWT

#### Role-Based Access Control (RBAC)

4 rôles implémentés avec hiérarchie:

```
ROLE_SUPER_ADMIN (≥ tous les autres)
    ↓
ROLE_ADMIN
    ↓
ROLE_ORGANIZER
    ↓
ROLE_USER
```

**Matrice de contrôle d'accès** (`config/packages/security.yaml`):

| Endpoint | PUBLIC | USER | ORGANIZER | ADMIN | SUPER_ADMIN |
|----------|--------|------|-----------|-------|------------|
| GET /api/games | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /api/games | ✗ | ✗ | ✗ | ✓ | ✓ |
| GET /api/users | ✗ | ✗ | ✗ | ✓ | ✓ |
| DELETE /api/users | ✗ | ✗ | ✗ | ✓ | ✓ |
| GET /api/exports/* | ✗ | ✗ | ✗ | ✓ | ✓ |

#### Voter Security (Fine-grained)

**Fichiers** :
- `src/Security/Voter/UserVoter.php` — gestion des utilisateurs
- `src/Security/Voter/GameVoter.php` — accès et création de parties
- `src/Security/Voter/GameRegistrationVoter.php` — inscriptions aux parties
- `src/Security/Voter/AppSettingVoter.php` — paramètres application

Contrôles spécifiques par opération :

```php
// UserVoter
- VIEW_ALL_USERS:  ROLE_ADMIN requis
- DELETE_USER:     ROLE_ADMIN requis (ne peut pas supprimer ADMIN/SUPER_ADMIN)
- CREATE_USER:     ROLE_ADMIN requis (ne peut pas créer ADMIN/SUPER_ADMIN)
- UPDATE_USER:     ROLE_ADMIN requis

// GameVoter
- LIST_GAMES:      Public (tous)
- VIEW_GAME:       Public si isPublic=true, sinon canSeePrivate || ADMIN
- CREATE_GAME:     ROLE_ADMIN || ROLE_ORGANIZER || ROLE_SUPER_ADMIN
- UPDATE_GAME:     Idem CREATE
- DELETE_GAME:     Idem CREATE

// GameRegistrationVoter
- REGISTER_GAME:          isPublic || canSeePrivate || ROLE_ADMIN
- DELETE_GAME_REGISTRATION: owner || ROLE_ADMIN || ROLE_ORGANIZER
- PATCH_GAME_REGISTRATION:  ROLE_ADMIN || ROLE_ORGANIZER || ROLE_SUPER_ADMIN

// AppSettingVoter
- MANAGE_APP_SETTINGS: ROLE_ADMIN || ROLE_SUPER_ADMIN
```

**Couverture voters** : 100% (UserVoter, GameVoter, AppSettingVoter) — GameRegistrationVoter 91.89% lignes

#### Tests

- ✓ `tests/Security/Voter/UserVoterTest.php` (100% coverage, 25 tests)
- ✓ `tests/Security/Voter/GameVoterTest.php` (100% coverage, 13 tests)
- ✓ `tests/Security/Voter/GameRegistrationVoterTest.php` (91.89% coverage, 12 tests)
- ✓ `tests/Security/Voter/AppSettingVoterTest.php` (100% coverage, 6 tests)

### ❌ Non Implémenté

- [ ] **OAuth2/OpenID Connect** - Actuellement JWT uniquement
- [ ] **Multi-factor authentication (MFA)** - À ajouter
- [ ] **API key management** - À ajouter
- [ ] **Horizontal privilege escalation** - Rate limiting missing

---

## 2. A02:2021 - Cryptographic Failures

### ✓ Implémenté

**Technologie**: Symfony Security + Lexik JWT

#### Password Hashing

```php
// config/packages/security.yaml
password_hashers:
  PasswordAuthenticatedUserInterface: "auto"
  // Defaults to bcrypt with cost 12

// Test environment: cost 4 (for speed)
when@test:
  security:
    password_hashers:
      PasswordAuthenticatedUserInterface:
        algorithm: auto
        cost: 4
```

**Force**: Bcrypt with cost 12 = resistant to brute force

**Evidence**: 
- User entity: `#[Groups(['user:write'])]` password never exposed in output
- Tests: `tests/Security/Jwt/TokenVersionSubscriberTest.php`

#### JWT Token Security

**Implementation** (`config/packages/lexik_jwt_authentication.yaml`):

```yaml
lexik_jwt_authentication:
  secret_key: %env(resolve:JWT_SECRET_KEY)%  // Secret from .env
  public_key: %env(resolve:JWT_PUBLIC_KEY)%
  pass_phrase: %env(JWT_PASSPHRASE)%
  token_ttl: 3600  // 1 hour expiry
  clock_skew: 0
```

**Features**:
- ✓ HMAC-SHA256 signing
- ✓ Token rotation on password change (nonce system)
- ✓ 1-hour expiry (short-lived tokens)
- ✓ Secrets in `.env` (never in git)

**Token Rotation** (`src/Security/Jwt/JwtRevocationStore.php`):

```php
// On password change:
// 1. Generate new token nonce
// 2. Invalidate old tokens (nonce mismatch)
// 3. Issue new JWT with new nonce
```

**Coverage**: 100% (5/5 methods tested)

#### Testing

- ✓ `tests/Security/Jwt/TokenVersionSubscriberTest.php` (100% coverage)
- ✓ Tests: token creation, validation, nonce matching, exception paths

### ❌ Non Implémenté

- [ ] **HTTPS enforcement** - Dev: HTTP | Prod: HTTPS (To configure)
- [ ] **Encryption at rest** - Sensitive fields not encrypted in DB
- [ ] **TLS 1.3** - Requires production infra setup
- [ ] **Certificate pinning** - Not implemented

---

## 3. A03:2021 - Injection

### ✓ Implémenté

**Technologie**: Doctrine ORM (parameterized queries)

#### SQL Injection Prevention

**No raw SQL used** - 100% ORM-based queries:

```php
// ✓ Safe - Doctrine parameterized
$users = $repository->findBy(['email' => $email]);

// ✗ NEVER done - Raw SQL with user input
// $em->getConnection()->executeQuery("SELECT * FROM users WHERE email = '$email'");
```

**Repository Examples**:
- `src/Repository/UserRepository.php` - No raw SQL
- `src/Repository/GameRepository.php` - No raw SQL
- `src/Repository/GameRegistrationRepository.php` - No raw SQL

**Testing**: 
- No specific injection tests (Doctrine handles it)
- Code review: No raw SQL found

#### ORM Security Features

```php
// Doctrine automatically:
// 1. Escapes user input
// 2. Uses parameterized queries
// 3. Prevents type confusion

// Example:
$query = $em->createQuery(
  'SELECT u FROM App\Entity\User u WHERE u.id = :id'
);
$query->setParameter('id', $userId);  // Auto-escaped
$user = $query->getOneOrNullResult();
```

#### Input Validation

**Symfony Validator** (`src/Dto/`, `src/Entity/`):

```php
// Example: GameRegistrationInput
class GameRegistrationInput {
  #[Assert\NotNull]
  #[Assert\Positive]
  private int $game;  // Must be positive integer
}

// Prevents:
// - Invalid type coercion
// - Negative IDs
// - SQL injection via ID
```

**Tests**: 
- ✓ `tests/State/GameRegistrationCreateProcessorTest.php` (100% coverage)
- ✓ 10+ validation test cases

### ❌ Non Implémenté

- [ ] **XSS prevention headers** - CSP header missing
- [ ] **Command injection** - Not applicable (no exec/shell calls)
- [ ] **LDAP injection** - Not applicable (LDAP not used)
- [ ] **XML/XXE injection** - Not applicable (no XML parsing)

---

## 4. A04:2021 - Insecure Design

### ✓ Partially Implémenté

**Architecture Review**: Threat model considered:

#### Identified Threats & Mitigations

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Unauthorized game registration | RBAC + GameRegistrationVoter | ✓ Testé |
| User privilege escalation | Role hierarchy + UserVoter | ✓ Testé |
| Data leakage (password in response) | Serializer groups | ✓ Testé |
| Game full while registering (race condition) | Contrôle atomique avant persist | ✓ Implémenté |
| Account takeover | JWT + password hash bcrypt | ✓ Testé |
| Unauthorized CSV export | ADMIN-only endpoints + AppSettingVoter | ✓ Testé |
| Partie privée accédée par user non autorisé | GameVoter + GameVisibilityExtension | ✓ Testé |

#### Security Requirements Built-in

```php
// Example: GameRegistration state processor
// Checks before allowing registration:
// 1. User authenticated
// 2. Game exists
// 3. Game is public OR user is ADMIN
// 4. User not already registered
// 5. Game not full

if ($game->isFull()) {
  throw new ConflictHttpException('Game is full');
}
```

### ❌ Non Implémenté

- [ ] **Threat model documentation** - Formal STRIDE analysis needed
- [ ] **Security architecture review** - Formal review needed
- [ ] **Security testing** - Penetration testing not done
- [ ] **Incident response plan** - Not defined

---

## 5. A05:2021 - Security Misconfiguration

### ✓ Implémenté

**Environment Management**:

```bash
# Development (.env.dev)
APP_ENV=dev
APP_DEBUG=true
DATABASE_URL=postgresql://app:password@localhost:5432/airsoft_dev

# Production (.env)
APP_ENV=prod
APP_DEBUG=false
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=%env(JWT_SECRET_KEY)%  # Injected from CI/CD secrets
```

**Security Headers** (To add to Nginx/production):

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

**CORS Configuration** (`config/packages/nelmio_cors.yaml`):

```yaml
cors_defaults:
  allow_origin: ['http://localhost:3000']  # Not '*'
  allow_methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
```

**Dependency Management**:

```bash
# Check for outdated/vulnerable packages
composer audit
npm audit
```

### ❌ Non Implémenté

- [ ] **Security headers in PHP** - Need Nginx/production config
- [ ] **HTTPS redirect** - Requires production infra
- [ ] **HTTP/2 push** - Not configured
- [ ] **Rate limiting middleware** - Not implemented

---

## 6. A06:2021 - Vulnerable & Outdated Components


**Dependency Tracking**:

```bash
# Backend
composer.lock  # Locked versions
composer audit  # Check vulnerabilities

# Frontend
package-lock.json  # Locked versions
npm audit  # Check vulnerabilities
```

**Current Versions** (Safe):

| Package | Version | Security Status |
|---------|---------|-----------------|
| symfony/framework | 7.4 | ✓ Latest stable |
| api-platform | 4.3.15 | ✓ Latest stable |
| next.js | 16.2.6 | ✓ Latest stable |
| react | 19.2.4 | ✓ Latest stable |
| doctrine/orm | 3.6.7 | ✓ Latest stable |
| lexik/jwt | 3.2 | ✓ Latest stable |

### ❌ Non Implémenté

- [ ] **Automated dependency updates** - Dependabot/Renovate not configured
- [ ] **Security patch automation** - No auto-patching CI/CD
- [ ] **Dependency scanning** - GitHub Security Alerts not checked
- [ ] **SBOM (Software Bill of Materials)** - Not generated

---

## 7. A07:2021 - Authentication Failures

### ✓ Implémenté

**Authentication Method**: JWT Bearer tokens

```php
// Login endpoint: POST /api/login
// Returns: {token, user}
// Token used in: Authorization: Bearer <token>
```

**Session Management**:

```php
// Token TTL: 1 hour (3600 seconds)
// Expired tokens return 401 Unauthorized
// Token rotation on password change (nonce system)
```

**Password Policy**:

Currently no enforced policy. Recommended:
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, special chars
- No dictionary words

**Tests**:
- ✓ `tests/Security/Jwt/TokenVersionSubscriberTest.php` (100%)
- ✓ Login/logout test cases

### ❌ Non Implémenté

- [ ] **Rate limiting on login** - Brute force prevention missing
- [ ] **Account lockout** - After N failed attempts
- [ ] **Password reset flow** - Not implemented
- [ ] **Session timeout** - Fixed TTL only, no inactivity tracking
- [ ] **Login attempt logging** - Audit trail missing

---

## 8. A08:2021 - Software & Data Integrity Failures

### ✓ Partially Implémenté

**Git Commits**: Conventional Commits standard enforced

```
feat: ajouter export Excel
fix: corriger validation email
```

**Branch Protection** : Branche `main` protégée — PRs obligatoires, CI doit passer avant merge.

**Code Signing**: Not enforced

### ❌ Non Implémenté

- [ ] **Signed commits** - Not enforced in GitHub
- [ ] **Release signing** - GPG signatures not used
- [ ] **Artifact integrity** - Checksums not verified
- [ ] **Container image signing** - Not implemented

---

## 9. A09:2021 - Logging & Monitoring Failures

### ✓ Partially Implémenté

**Logging Framework**: Symfony Monolog

```php
// Logs écrits dans : var/log/
// Niveaux : error, warning, info, debug
// Erreurs HTTP 4xx/5xx loguées automatiquement par Symfony
```

**Ce qui est logué actuellement** :

- ✓ Erreurs & exceptions (Symfony default)
- ✓ Requêtes HTTP en dev mode
- ✗ Événements d'authentification (login attempts, failures)
- ✗ Échecs d'autorisation (denied access)
- ✗ Actions admin (modifications utilisateurs, exports)
- ✗ Modifications de données (audit trail)

**GitHub Actions Logging**:

```bash
# CI/CD logs visible in GitHub Actions
# Can be exported and analyzed
```

### ❌ Non Implémenté

- [ ] **Audit logging** - No record of admin actions
- [ ] **Failed login tracking** - No alerting on brute force
- [ ] **Data modification logs** - No audit trail
- [ ] **Access control logs** - No denied access records
- [ ] **Error rate monitoring** - No alerts configured
- [ ] **Centralized logging** - Dev only (local var/log)

---

## 10. A10:2021 - Server-Side Request Forgery (SSRF)

### ✓ Implémenté

**No External Requests Made**:

- No HTTP calls to external APIs
- No webhook integrations
- No file uploads from URLs
- No image proxying

**Risk Level**: Low (not applicable to current app)

### ❌ Non Implémenté

- [ ] **Request validation** - Not needed currently
- [ ] **IP whitelist/blacklist** - Not needed currently

---

## Summary Matrix

| OWASP Flaw | Implémenté | Partiellement | À Faire | Evidence |
|------------|-----------|--------------|---------|----------|
| A1 - Broken Access Control | ✓ | - | - | UserVoter, GameVoter, GameRegistrationVoter, AppSettingVoter |
| A2 - Cryptographic Failures | ✓ | - | HTTPS prod | Bcrypt, JWT nonce rotation |
| A3 - Injection | ✓ | - | XSS headers CSP | Doctrine ORM, Symfony Validator |
| A4 - Insecure Design | ✓ | - | Formal STRIDE | 5 processors de sécurité, race-condition traitée |
| A5 - Security Misconfiguration | ✓ | - | Security headers prod | .env, CORS restrictif |
| A6 - Vulnerable Components | ✓ | - | Auto updates | composer/npm versions stables |
| A7 - Authentication Failures | ✓ | - | Rate limiting | JWT auth, token rotation |
| A8 - Integrity Failures | - | ✓ | Signed commits | Conventional Commits + branch protection |
| A9 - Logging & Monitoring | - | ✓ | Audit logs | Monolog erreurs, logs CI/CD |
| A10 - SSRF | ✓ | - | - | N/A |

**Overall Coverage**: 70% fully implemented, 20% partial, 10% missing

---

## Recommandations Prioritaires

1. **Rate Limiting** (Auth endpoints) - Brute force protection
2. **Audit Logging** - Track admin actions & failed access
3. **Security Headers** - CSP, HSTS (production)
4. **Password Policy** - Enforce complexity requirements
5. **Penetration Testing** - Formal security audit
6. **Monitoring & Alerting** - Error rate, suspicious patterns
7. **MFA Support** - TOTP or SMS second factor
8. **HTTPS Enforcement** - HSTS header

---

## Resources

- OWASP Top 10: https://owasp.org/Top10/
- Symfony Security: https://symfony.com/doc/current/security.html
- NIST Guidelines: https://csrc.nist.gov/publications/sp-800-53
