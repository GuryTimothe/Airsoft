# Security Alerting and Escalation (A09)

Date: 2026-07-18
Perimetre: backend Symfony/API Platform + security logs

## 1. Objectif

Definir des alertes actionnables, mesurables et escaladables a partir des evenements de securite structures.

## 2. Regles d'alerte activees

Source de verite:

- backend/config/security_alert_rules.yaml

Regles:

1. BRUTE_FORCE_LOGIN_IP
Seuil: >= 20 events SEC.AUTH.LOGIN_FAILED en 5 min par source_ip_masked.
Escalade: security-oncall.

2. ACCESS_DENIED_BURST_ACTOR
Seuil: >= 50 events SEC.AUTHZ.ACCESS_DENIED en 10 min par actor_id_hash.
Escalade: security-ops.

3. RATE_LIMIT_BURST_IP
Seuil: >= 10 events SEC.AUTH.RATE_LIMITED en 5 min par source_ip_masked.
Escalade: security-ops.

4. JWT_REVOCATION_ERROR_ANY
Seuil: >= 1 event SEC.JWT.REVOCATION_ERROR en 10 min.
Escalade: security-oncall.

5. SECURITY_5XX_BURST
Seuil: >= 5 events SEC.* avec http_status 500-599 en 10 min par service.
Escalade: security-oncall.

6. ADMIN_ACTION_VOLUME
Seuil: >= 20 events SEC.ADMIN.* en 15 min par actor_id_hash.
Escalade: security-oncall.

## 3. Mecanisme d'evaluation

Script:

- backend/bin/security_alert_check.php

Fonctionnement:

- lit le fichier de logs JSON (par defaut var/log/dev.security.log);
- evalue les regles sur fenetres glissantes;
- affiche les alertes detectees au format JSON;
- retourne un code de sortie non-zero si alertes trouvees;
- peut envoyer une escalation webhook si SECURITY_ALERT_WEBHOOK_URL est defini.

Codes de sortie:

- 0: aucune alerte
- 1: erreur d'execution
- 2: alerte(s) detectee(s)
- 3: alerte(s) detectee(s) mais echec escalation webhook

## 4. Commandes d'execution

Depuis backend:

php bin/security_alert_check.php --file var/log/dev.security.log --rules config/security_alert_rules.yaml

Depuis docker compose:

docker compose exec backend php bin/security_alert_check.php --file /app/var/log/dev.security.log --rules /app/config/security_alert_rules.yaml

## 5. Canal d'escalade

Variable d'environnement:

- SECURITY_ALERT_WEBHOOK_URL

Format d'escalade:

- POST JSON contenant source, generated_at, alerts_count et la liste alerts.

Canaux cibles possibles:

- Slack webhook
- Microsoft Teams webhook
- PagerDuty events gateway
- endpoint interne SecOps

## 6. SLA d'escalade (recommande)

1. critical
Ack <= 5 min
Triage <= 15 min
Incident commander: security-oncall

2. high
Ack <= 15 min
Triage <= 30 min
Owner: security-oncall / SRE

3. medium
Ack <= 4 h
Triage <= 1 jour ouvre
Owner: security-ops

## 7. Validation rapide

1. Generer des events de test (ex: login failed).
2. Lancer le script.
3. Verifier que les alertes attendues apparaissent.
4. Activer SECURITY_ALERT_WEBHOOK_URL et verifier reception du payload.

## 8. Liens

- docs/SECURITY_LOGGING_POLICY.md
- docs/SECURITY_LOGGING_CENTRALIZATION.md
- backend/config/packages/monolog.yaml

## 9. Tests d'observabilite securite

Tests automatisees ajoutees:

- backend/tests/Security/Jwt/GenericAuthenticationFailureHandlerTest.php
- backend/tests/Security/SecurityAlertCheckTest.php

Execution ciblee:

```bash
cd backend
php bin/phpunit tests/Security/Jwt/GenericAuthenticationFailureHandlerTest.php tests/Security/SecurityAlertCheckTest.php
```

Objectif de verification:

- un evenement critique produit bien un log structure (`SEC.AUTH.LOGIN_FAILED`),
- un evenement critique de revocation (`SEC.JWT.REVOCATION_ERROR`) declenche l'alerte attendue (`JWT_REVOCATION_ERROR_ANY`).
