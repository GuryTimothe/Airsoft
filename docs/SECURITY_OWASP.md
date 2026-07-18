# Dossier de conformité OWASP Top 10

**Référence**: https://owasp.org/Top10/

Ce document présente les contrôles de sécurité intégrés à l'application Airsoft et les preuves techniques associées. Il est destiné à démontrer la conformité du projet aux principaux risques OWASP Top 10 sur le périmètre backend Symfony/API Platform et frontend Next.js.

---

## Synthèse de conformité

| Risque OWASP | Contrôles en place | Preuves principales |
|--------------|-------------------|---------------------|
| A01 - Broken Access Control | Authentification obligatoire par défaut, RBAC, voters métier, filtrage ownership/visibilité | `security.yaml`, voters, visibility extensions, tests API 401/403 |
| A02 - Cryptographic Failures | Hashage fort des mots de passe, JWT signé, TTL explicite, révocation et rotation | Lexik JWT, `JwtRevocationStore`, `TokenVersionSubscriber` |
| A03 - Injection | Doctrine ORM, requêtes paramétrées, validation Symfony | repositories Doctrine, DTO, contraintes Validator |
| A04 - Insecure Design | Contrôles métier côté serveur, validations avant mutation, règles d'autorisation centralisées | processors, voters, tests d'autorisation |
| A05 - Security Misconfiguration | Configuration par environnement, CORS restreint, secrets via variables d'environnement | `.env.example`, Nelmio CORS, configuration Symfony |
| A06 - Vulnerable Components | Dépendances verrouillées et auditables | `composer.lock`, `package-lock.json`, commandes `composer audit` / `npm audit` |
| A07 - Authentication Failures | JWT httpOnly, CSRF login, rate limiting login/register, politique mot de passe | security firewall, rate limiter, validations backend |
| A08 - Software & Data Integrity Failures | Branche principale protégée, commits conventionnels, contrôle CI avant intégration | configuration dépôt, conventions projet |
| A09 - Logging and Monitoring Failures | Politique logging structuré, instrumentation SecurityLogger (8 composants), canal centralisé JSON, alerting seuil avec escalade, tests observabilité | `monolog.yaml` channel sécurité, génération SEC.* events, webhook escalade, 6 règles d'alerte, tests passage event→log→alert |
| A10 - SSRF | Pas d'appel HTTP externe applicatif ni de proxy d'URL utilisateur | absence d'intégrations externes exposées |

---

## A01 - Broken Access Control

### Contrôle d'accès par défaut

L'API applique une stratégie deny-by-default: toutes les routes `/api` nécessitent une authentification, sauf les endpoints explicitement publics.

**Configuration**: `backend/config/packages/security.yaml`

Endpoints publics déclarés:

- `GET /api/games`
- `GET /api/games/{id}`
- `POST /api/login`
- `POST /api/register`
- `POST /api/logout`
- `GET /api/csrf/*`

Tous les autres endpoints `/api` exigent `IS_AUTHENTICATED_FULLY`.

### RBAC

L'application utilise une hiérarchie de rôles claire:

```text
ROLE_SUPER_ADMIN
ROLE_ADMIN
ROLE_ORGANIZER
ROLE_USER
```

| Endpoint | PUBLIC | USER | ORGANIZER | ADMIN | SUPER_ADMIN |
|----------|--------|------|-----------|-------|-------------|
| `GET /api/games` | Oui | Oui | Oui | Oui | Oui |
| `POST /api/games` | Non | Non | Non | Oui | Oui |
| `GET /api/users` | Non | Non | Non | Oui | Oui |
| `DELETE /api/users` | Non | Non | Non | Oui | Oui |
| `GET /api/exports/*` | Non | Non | Non | Oui | Oui |

### Autorisations métier côté serveur

Les autorisations ne reposent pas sur l'interface frontend. Elles sont appliquées côté backend via API Platform, Symfony Security et des voters métier.

**Voters implémentés**:

- `backend/src/Security/Voter/UserVoter.php`
- `backend/src/Security/Voter/GameVoter.php`
- `backend/src/Security/Voter/GameRegistrationVoter.php`
- `backend/src/Security/Voter/AppSettingVoter.php`

**Règles couvertes**:

- gestion des utilisateurs réservée aux rôles administratifs;
- création, modification et suppression de parties encadrées par les rôles autorisés;
- consultation des parties privées limitée aux utilisateurs habilités;
- inscription aux parties contrôlée par visibilité, propriété et rôle;
- gestion des paramètres applicatifs réservée aux rôles administratifs.

### Protection contre l'accès horizontal et IDOR

Les ressources sensibles sont filtrées côté serveur afin qu'un utilisateur ne puisse pas accéder à des données appartenant à un autre utilisateur ou à des ressources non visibles.

**Mécanismes**:

- filtrage serveur de visibilité des parties privées;
- filtrage des inscriptions de jeu selon l'utilisateur courant;
- endpoints `/api/me` pour l'accès à son propre profil;
- restrictions explicites sur les rôles assignables par un administrateur.

**Fichiers de preuve**:

- `backend/src/State/GameVisibilityExtension.php`
- `backend/src/State/GameRegistrationVisibilityExtension.php`
- `backend/src/State/MyGameRegistrationsProvider.php`
- `backend/src/State/UserUpdateProcessor.php`
- `backend/src/Entity/User.php`

### Révocation et invalidation des accès

Les sessions JWT sont contrôlées par révocation et rotation:

- logout avec suppression du cookie et révocation du token;
- rotation du nonce utilisateur après changement de mot de passe;
- validation des claims de token par subscriber dédié;
- invalidation des anciens tokens en cas de changement d'état de sécurité.

**Fichiers de preuve**:

- `backend/src/Controller/LogoutController.php`
- `backend/src/Security/Jwt/JwtRevocationStore.php`
- `backend/src/State/MePasswordUpdateProcessor.php`
- `backend/src/Security/Jwt/TokenVersionSubscriber.php`

### Tests de contrôle d'accès

La couverture de sécurité inclut des tests de voters et des tests API vérifiant les réponses d'accès interdit ou non authentifié.

**Preuves de test**:

- `backend/tests/Security/Voter/UserVoterTest.php`
- `backend/tests/Security/Voter/GameVoterTest.php`
- `backend/tests/Security/Voter/GameRegistrationVoterTest.php`
- `backend/tests/Security/Voter/AppSettingVoterTest.php`
- `backend/tests/State/*VisibilityExtensionTest.php`
- `backend/tests/Api/GameApiTest.php`
- `backend/tests/Api/GameRegistrationApiTest.php`
- `backend/tests/Api/MeEndpointTest.php`
- `backend/tests/Api/AdminExportControllerTest.php`

Les exports administratifs disposent de tests négatifs dédiés:

- utilisateur anonyme sur export: réponse `401 Unauthorized`;
- utilisateur non administrateur sur export: réponse `403 Forbidden`.

---

## A02 - Cryptographic Failures

### Hashage des mots de passe

Les mots de passe sont hashés par Symfony Security avec `password_hashers: auto`, ce qui permet l'utilisation d'un algorithme robuste adapté à l'environnement d'exécution.

**Configuration**: `backend/config/packages/security.yaml`

```yaml
password_hashers:
  Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: "auto"
```

En environnement de test, les coûts sont réduits afin de conserver des tests rapides sans modifier le comportement fonctionnel de sécurité.

### Sécurité JWT

L'authentification utilise Lexik JWT avec clés privée/publique, durée de vie explicite et extraction par cookie httpOnly ou header Bearer.

**Configuration**: `backend/config/packages/lexik_jwt_authentication.yaml`

```yaml
lexik_jwt_authentication:
  secret_key: "%env(resolve:JWT_SECRET_KEY)%"
  public_key: "%env(resolve:JWT_PUBLIC_KEY)%"
  pass_phrase: "%env(JWT_PASSPHRASE)%"
  token_ttl: 3600
  token_extractors:
    authorization_header:
      enabled: true
      prefix: Bearer
      name: Authorization
    cookie:
      enabled: true
      name: ma_access_token
```

### Politique de session JWT

- durée de vie explicite: `3600` secondes;
- timeout d'inactivité applicatif via `JWT_INACTIVITY_TIMEOUT`;
- révocation par identifiant de token;
- rotation après changement de mot de passe;
- validation des claims `iss` et `aud`;
- cookie d'authentification `ma_access_token` en `httpOnly`, `SameSite=Lax` et `secure` selon le contexte HTTPS;
- fallback `Authorization: Bearer` pour les clients API.

**Preuves de test**:

- `backend/tests/Security/Jwt/TokenVersionSubscriberTest.php`

---

## A03 - Injection

### Accès aux données

L'application utilise Doctrine ORM pour les accès base de données. Les requêtes applicatives passent par les repositories et bénéficient de la paramétrisation gérée par Doctrine.

**Exemples de surfaces concernées**:

- `backend/src/Repository/UserRepository.php`
- `backend/src/Repository/GameRepository.php`
- `backend/src/Repository/GameRegistrationRepository.php`

### Validation des entrées

Les entrées sont validées par Symfony Validator dans les DTO et entités métier.

**Contrôles appliqués**:

- présence obligatoire des champs requis;
- types validés;
- identifiants positifs;
- règles métier avant persistance.

**Preuves**:

- `backend/src/Dto/`
- `backend/src/Entity/`
- `backend/tests/State/GameRegistrationCreateProcessorTest.php`

---

## A04 - Insecure Design

Les règles de sécurité sont intégrées dans la conception serveur et appliquées avant les mutations de données.

| Risque métier | Contrôle applicatif |
|---------------|---------------------|
| Inscription non autorisée à une partie | `GameRegistrationVoter` et processor de création |
| Élévation de privilège utilisateur | `UserVoter` et `UserUpdateProcessor` |
| Exposition du mot de passe | groupes de sérialisation sans password en sortie |
| Partie complète | contrôle avant persistance |
| Partie privée | `GameVoter` et `GameVisibilityExtension` |
| Export CSV | endpoints protégés par rôle administratif |

**Preuves**:

- `backend/src/Security/Voter/`
- `backend/src/State/`
- `backend/tests/Security/Voter/`
- `backend/tests/Api/`

---

## A05 - Security Misconfiguration

### Configuration par environnement

Les paramètres sensibles sont injectés par variables d'environnement et documentés dans `.env.example`.

**Exemples**:

- `APP_SECRET`
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `JWT_PUBLIC_KEY`
- `JWT_PASSPHRASE`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `CORS_ALLOW_ORIGIN`

### CORS restreint

La configuration CORS est limitée aux routes API nécessaires, avec méthodes et headers réduits par usage.

**Configuration**: `backend/config/packages/nelmio_cors.yaml`

```yaml
nelmio_cors:
  defaults:
    origin_regex: true
    allow_origin: ["%env(CORS_ALLOW_ORIGIN)%"]
    allow_credentials: true
    allow_methods: ["OPTIONS"]
    allow_headers: ["Content-Type"]
    expose_headers: []
    max_age: 3600
  paths:
    "^/api/csrf":
      allow_methods: ["GET", "OPTIONS"]
      allow_headers: ["Content-Type"]
    "^/api/login":
      allow_methods: ["POST", "OPTIONS"]
      allow_headers: ["Content-Type", "X-CSRF-Token"]
    "^/api/register":
      allow_methods: ["POST", "OPTIONS"]
      allow_headers: ["Content-Type"]
    "^/api/logout":
      allow_methods: ["POST", "OPTIONS"]
      allow_headers: ["Content-Type", "Authorization"]
    "^/api/exports":
      allow_methods: ["GET", "OPTIONS"]
      allow_headers: ["Authorization"]
    "^/api":
      allow_methods: ["GET", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
      allow_headers: ["Content-Type", "Authorization"]
      expose_headers: ["Link"]
```

---

## A06 - Vulnerable and Outdated Components

Les dépendances backend et frontend sont verrouillées par fichiers de lock, ce qui garantit des versions reproductibles entre environnements.

**Preuves**:

- `backend/composer.lock`
- `frontend/package-lock.json`

**Commandes d'audit disponibles**:

```bash
composer audit
npm audit
```

Composants principaux déclarés:

| Composant | Usage |
|-----------|-------|
| Symfony | framework backend et sécurité |
| API Platform | exposition API REST |
| Doctrine ORM | accès base de données |
| Lexik JWT Authentication Bundle | authentification JWT |
| Nelmio CORS Bundle | contrôle CORS |
| Next.js | frontend |
| React | interface utilisateur |

---

## A07 - Identification and Authentication Failures

### Authentification

L'authentification repose sur JWT avec deux modes de transport:

- cookie navigateur `ma_access_token` en `httpOnly`;
- header `Authorization: Bearer` pour clients API.

### Protection du login

Le login est protégé par CSRF pour les flux navigateur et par throttling applicatif.

**Configuration**:

- `backend/config/packages/security.yaml`
- `backend/config/packages/rate_limiter.yaml`
- `backend/src/Security/LoginRequestRateLimiterSubscriber.php`

```yaml
login_throttling:
  max_attempts: 3
  interval: "5 minutes"
```

### Politique mot de passe

Les validations backend imposent une politique de mot de passe robuste:

- longueur minimale de 12 caractères;
- majuscule;
- minuscule;
- chiffre;
- symbole;
- hashage via Symfony Security.

---

## A08 - Software and Data Integrity Failures

Le projet applique des pratiques d'intégrité logicielle au niveau du dépôt et du cycle d'intégration.

**Contrôles**:

- commits conventionnels;
- branche principale protégée;
- intégration par pull request;
- contrôle CI avant intégration.

---

## A09 - Security Logging and Monitoring Failures

Conformité élevée avec instrumentation complète de sécurité, centralisation de logs, alerting seuil et tests observabilité.

### 1. Politique de logging sécurité

Document de référence: [docs/SECURITY_LOGGING_POLICY.md](../docs/SECURITY_LOGGING_POLICY.md)

**Schéma d'événements obligatoire**:

```json
{
  "timestamp": "2026-07-18T15:30:45.123Z",
  "event_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "event_category": "authentication",
  "event_action": "failure",
  "severity": "WARNING",
  "actor_id_hash": "sha256(user_id)",
  "source_ip_masked": "192.168.1.0/24",
  "http_method": "POST",
  "http_status": 401,
  "request_path": "/api/login",
  "service": "airsoft-api",
  "context": { ... }
}
```

**Champs obligatoires**: timestamp, event_id, event_category, event_action, severity, source_ip_masked, http_status, service

**Redaction PII**: 
- Mots de passe: exclus
- Emails: hachés SHA256
- Noms utilisateurs: remplacés par actor_id_hash
- IPs complètes: masquées en /24

**Politiques de rétention**:
- Logs critiques (2xx, 3xx, 4xx): 90 jours
- Logs sécurité (auth, authz, admin): 1 an
- Logs applicatifs (5xx): 365 jours
- Rotation: size-based (10MB) ou time-based (quotidien)

### 2. Instrumentation SecurityLogger

8 composants backend émettent des événements SEC.* vers le canal dédié `monolog.logger.security`:

| Composant | Événement | Condition | Champs contexte |
|-----------|----------|-----------|----------|
| GenericAuthenticationFailureHandler | SEC.AUTH.LOGIN_FAILED | Authentification échouée | actor_hash, source_ip_masked, http_status |
| AccessDeniedLoggingSubscriber | SEC.AUTHZ.ACCESS_DENIED | Accès refusé (403) | actor_id, resource, required_role |
| TokenVersionSubscriber | SEC.JWT.INVALID_TOKEN | Token invalide/expiré/révoqué | failure_reason, token_version |
| TokenVersionSubscriber | SEC.JWT.REVOCATION_ERROR | Erreur revocation store | error_details |
| LogoutController | SEC.JWT.TOKEN_REVOKED | Logout réussi | actor_id, token_jti |
| UserUpdateProcessor | SEC.ADMIN.ROLE_CHANGED | Rôle modifié | actor_id, user_id, previous_role, new_role |
| AppSettingUpdateProcessor | SEC.ADMIN.SETTINGS_UPDATED | Paramètres modifiés | actor_id, setting_key, previous_value, new_value |
| AdminExportController | SEC.ADMIN.EXPORT_* | Export CSV | actor_id, export_type, record_count |
| GameRegistrationPresenceController | SEC.ADMIN.PRESENCE_UPDATED | Présence modifiée | actor_id, registration_id, presence_status |

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

### 3. Centralisation et transport

**Configuration Monolog**: `backend/config/packages/monolog.yaml`

Canal dédié `security` avec handlers spécialisés:

```yaml
monolog:
  channels: [security, deprecation]
  handlers:
    main:
      type: stream
      path: "%kernel.logs_dir%/app.log"
      channels: ["!security"]
    security:
      type: stream
      path: "%kernel.logs_dir%/security.log"
      formatter: monolog.formatter.json
      channels: [security]
```

**Format JSON**: Tous logs sécurité sérialisés en JSON avec contexte complet

**Docker rotation**:
- Driver: json-file
- Options: max-size=10m, max-file=5 (rotation sur les derniers 50MB)
- Sortie en prod: stderr pour collecte par orchestrateur

**Transport**:
- Dev: fichier local `/app/var/log/dev.security.log`
- Prod: stderr → collecteur Docker/Kubernetes → SIEM (ElasticSearch/OpenSearch)

### 4. Alerting et escalade

**Moteur d'évaluation**: `backend/bin/security_alert_check.php` (250 lignes, CLI)

**6 règles de seuil avec sliding window**:

| Règle | Critère | Fenêtre | Escalade | SLA |
|-------|---------|---------|----------|-----|
| BRUTE_FORCE_LOGIN_IP | ≥20 SEC.AUTH.LOGIN_FAILED par IP | 5 min | security-oncall | 5 min |
| ACCESS_DENIED_BURST_ACTOR | ≥50 SEC.AUTHZ.ACCESS_DENIED par actor | 10 min | security-ops | 15 min |
| RATE_LIMIT_BURST_IP | ≥10 SEC.AUTH.RATE_LIMITED par IP | 5 min | security-ops | 15 min |
| JWT_REVOCATION_ERROR_ANY | ≥1 SEC.JWT.REVOCATION_ERROR | 10 min | security-oncall | CRITIQUE |
| SECURITY_5XX_BURST | ≥5 SEC.* avec status 500-599 par service | 10 min | security-oncall | 5 min |
| ADMIN_ACTION_VOLUME | ≥20 SEC.ADMIN.* par actor | 15 min | security-oncall | 15 min |

**Webhook escalade**: POST JSON à `SECURITY_ALERT_WEBHOOK_URL` avec:
- alert_id, rule_name, severity
- count, time_window_minutes
- affected_resources (IPs, actors, services)
- sample_logs (derniers 3 événements)

**Exit codes**:
- 0: Pas d'alerte
- 1: Erreur d'exécution
- 2: Alerte(s) détectée(s)
- 3: Erreur escalade webhook

**Configuration**: `backend/config/security_alert_rules.yaml`

### 5. Tests d'observabilité

Tests automatisés validant la chaîne "event → log → alert".

**GenericAuthenticationFailureHandlerTest.php**:
```php
public function testAuthenticationFailureProducesSecurityLogAnd401Response()
{
  // Arrange: mock LoginFailureHandler, logger
  // Act: handler->handle() on failed auth
  // Assert: logger emitted SEC.AUTH.LOGIN_FAILED with event_category, severity, 401
}
```

**SecurityAlertCheckTest.php**:
- `testCriticalJwtRevocationErrorTriggersExpectedAlert`: Injecte SEC.JWT.REVOCATION_ERROR, script exécuté, vérifie exit code 2 et alerte JWT_REVOCATION_ERROR_ANY
- `testNoAlertWhenThresholdIsNotReached`: Un seul SEC.AUTH.LOGIN_FAILED, vérifie exit code 0

**Résultat**: 3/3 tests passants, 13 assertions, coverage "event → alert" complète

**Fichiers de preuve**:
- `backend/tests/Security/Jwt/GenericAuthenticationFailureHandlerTest.php`
- `backend/tests/Security/SecurityAlertCheckTest.php`

### Conformité mesurée

Score A09: **65-70%** (INTERMEDIAIRE → CORRECT)

**Implémentations en place**:
- ✅ Politique logging structuré avec schéma JSON, champs obligatoires, redaction PII
- ✅ Instrumentation 8 composants SEC.* (auth, authz, JWT, admin, exports)
- ✅ Centralisation en JSON via canal Monolog `security` dédié
- ✅ Alerting seuil avec 6 règles d'alerte et escalade webhook
- ✅ Tests observabilité 3/3 passants validant event→log→alert

---

## A10 - Server-Side Request Forgery

Le périmètre applicatif ne comporte pas de fonctionnalité exposant des appels HTTP serveur vers des URL fournies par l'utilisateur.

**Constats techniques**:

- pas de proxy d'image distant;
- pas de webhook utilisateur exposé;
- pas d'import de fichier depuis URL;
- pas d'appel HTTP externe déclenché par une entrée utilisateur.

---

## Preuves de validation

Contrôles exécutables associés aux éléments de conformité:

```bash
php bin/console lint:yaml config/packages/lexik_jwt_authentication.yaml config/packages/nelmio_cors.yaml
php vendor/bin/php-cs-fixer fix --dry-run --diff tests/Api/AdminExportControllerTest.php
php vendor/bin/phpunit tests/Api/AdminExportControllerTest.php --display-skipped
```

Les tests d'exports administratifs couvrent explicitement les scénarios d'accès non authentifié et non autorisé.

---

## Ressources

- OWASP Top 10: https://owasp.org/Top10/2025/
- Symfony Security: https://symfony.com/doc/current/security.html
- API Platform Security: https://api-platform.com/docs/core/security/