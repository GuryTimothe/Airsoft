# Politique de Security Logging

Date: 2026-07-18
Perimetre: backend Symfony/API Platform, frontend Next.js, CI/CD
Version: 1.0

## 1. Objectif

Definir une politique commune de journalisation securite pour:

- detecter les incidents rapidement;
- faciliter l'investigation et la remediation;
- limiter le risque d'exposition de donnees personnelles;
- respecter des regles de retention et de purge reproductibles.

## 2. Portee

Cette politique s'applique a:

- toutes les actions d'authentification et d'autorisation;
- toutes les actions admin sensibles;
- tous les evenements de limitation anti-abus;
- toutes les erreurs techniques de securite (JWT, acces, exceptions critiques);
- les workflows CI/CD lies a la securite (build, scan, deploy).

## 3. Schema d'evenements (champs obligatoires)

Chaque evenement de securite DOIT etre emis en JSON structure avec les champs suivants:

| Champ | Type | Exemple | Regle |
|------|------|---------|-------|
| `timestamp` | string (ISO-8601 UTC) | `2026-07-18T10:33:27Z` | Obligatoire |
| `event_id` | string | `SEC.AUTH.LOGIN_FAILED` | Obligatoire |
| `event_category` | string | `authentication` | Obligatoire |
| `severity` | string | `INFO`, `WARNING`, `ERROR`, `CRITICAL` | Obligatoire |
| `outcome` | string | `success`, `failure`, `blocked` | Obligatoire |
| `action` | string | `login`, `access_check`, `role_change` | Obligatoire |
| `service` | string | `backend-api` | Obligatoire |
| `environment` | string | `dev`, `staging`, `prod` | Obligatoire |
| `request_id` | string | `req-8f2...` | Obligatoire |
| `correlation_id` | string | `corr-b71...` | Obligatoire |
| `actor_type` | string | `user`, `system`, `anonymous` | Obligatoire |
| `actor_id_hash` | string | `hmac_sha256(...)` | Obligatoire (pas d'ID brut) |
| `source_ip_masked` | string | `192.168.12.0/24` | Obligatoire |
| `http_method` | string | `POST` | Obligatoire si HTTP |
| `http_path` | string | `/api/login_check` | Obligatoire si HTTP |
| `http_status` | number | `401` | Obligatoire si HTTP |
| `message` | string | `Authentication failed` | Obligatoire, sans PII |

Champs recommandes:

- `target_type` (ex: `user`, `game`, `app_setting`)
- `target_id_hash`
- `rate_limiter` (nom du limiteur)
- `reason_code` (ex: `INVALID_CREDENTIALS`, `ACCESS_DENIED`)
- `app_version` (SHA commit ou version semver)

## 4. Catalogue minimal d'evenements a journaliser

Les evenements suivants sont obligatoires:

| Event ID | Severity | Description |
|---------|----------|-------------|
| `SEC.AUTH.LOGIN_FAILED` | WARNING | Echec de login |
| `SEC.AUTH.LOGIN_SUCCEEDED` | INFO | Login reussi |
| `SEC.AUTH.RATE_LIMITED` | WARNING | Limitation brute-force/abus |
| `SEC.AUTHZ.ACCESS_DENIED` | WARNING | Acces refuse par voter/regle |
| `SEC.ADMIN.ROLE_CHANGED` | WARNING | Changement de role utilisateur |
| `SEC.ADMIN.USER_DELETED` | WARNING | Suppression de compte |
| `SEC.JWT.TOKEN_REVOKED` | INFO | Invalidation de tokens |
| `SEC.JWT.INVALID_TOKEN` | WARNING | Jeton invalide/expire |
| `SEC.INPUT.VALIDATION_BLOCKED` | INFO | Entree bloquee pour raison de securite |
| `SEC.SYSTEM.SECURITY_EXCEPTION` | ERROR/CRITICAL | Exception securite technique |

## 5. Redaction PII et donnees sensibles

### 5.1 Donnees interdites en logs

Ne jamais logger en clair:

- mots de passe;
- tokens JWT complets;
- cles API/secrets;
- cookies de session;
- contenus de champs sensibles (notes privees, commentaires internes, etc.).

### 5.2 Regles de redaction obligatoires

- Email: masquer la partie locale, conserver le domaine.
  - Exemple: `j***@domaine.com`
- Telephone: conserver uniquement les 2 derniers chiffres.
  - Exemple: `********45`
- Identifiants metier: utiliser hash HMAC-SHA256 avec cle de log dediee.
- IP: stocker une forme masquee (`/24` en IPv4, `/48` en IPv6) dans les logs applicatifs.
- Messages: rester generiques, sans details exploitables (pas de stack trace brute en prod).

### 5.3 Exception et processus

Si un besoin legal impose un champ nominatif, il doit etre:

- valide par le responsable securite;
- documente dans une exception temporelle;
- purge automatiquement a echeance.

## 6. Retention, rotation et purge

| Type de log | Retention hot | Archive | Retention totale |
|------------|---------------|---------|------------------|
| Evenements securite critiques (`ERROR`, `CRITICAL`) | 90 jours | 275 jours | 365 jours |
| Evenements securite standards (`INFO`, `WARNING`) | 30 jours | 150 jours | 180 jours |
| Logs techniques non-securite (debug prod) | 14 jours | 0 | 14 jours |
| Logs dev locaux | 7 jours | 0 | 7 jours |

Regles operationnelles:

- Rotation quotidienne des fichiers locaux.
- Purge automatique hebdomadaire selon les seuils ci-dessus.
- Suspension de purge possible uniquement via procedure de legal hold.

## 7. Integrite et acces aux logs

- Centralisation recommandee: ELK/OpenSearch/SaaS observability.
- Acces restreint RBAC (lecture seule pour investigateurs, ecriture reservee aux services).
- Journalisation des acces aux journaux (qui consulte quoi, quand).
- Horodatage UTC synchronise (NTP) obligatoire.

Guide d'implementation centralisation:

- `docs/SECURITY_LOGGING_CENTRALIZATION.md`

## 8. Exemple d'evenement conforme

```json
{
  "timestamp": "2026-07-18T10:33:27Z",
  "event_id": "SEC.AUTH.LOGIN_FAILED",
  "event_category": "authentication",
  "severity": "WARNING",
  "outcome": "failure",
  "action": "login",
  "service": "backend-api",
  "environment": "prod",
  "request_id": "req-8f2c72",
  "correlation_id": "corr-11aa9b",
  "actor_type": "anonymous",
  "actor_id_hash": "hmac_sha256:2f5d...",
  "source_ip_masked": "203.0.113.0/24",
  "http_method": "POST",
  "http_path": "/api/login_check",
  "http_status": 401,
  "reason_code": "INVALID_CREDENTIALS",
  "message": "Authentication failed"
}
```

## 9. Gouvernance et responsabilites

- Owner politique: Security Lead (ou referent technique securite).
- Mainteneurs: equipe backend + DevOps.
- Revue minimale: trimestrielle et apres chaque incident majeur.

## 10. Checklist d'implementation

- [ ] Configurer un canal Monolog dedie `security`.
- [ ] Emettre les `event_id` du catalogue minimal dans les points critiques.
- [ ] Injecter `request_id` et `correlation_id` dans chaque log.
- [ ] Appliquer la redaction PII avant emission.
- [ ] Configurer retention/rotation/purge selon section 6.
- [ ] Documenter et tester les alertes sur seuils (401/403/429/5xx burst).

Runbook alerting:

- docs/SECURITY_ALERTING_ESCALATION.md
