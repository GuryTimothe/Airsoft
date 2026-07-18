# Security Logging Centralization (A09)

Date: 2026-07-18
Perimetre: backend Symfony/API Platform + Docker

## 1. Objectif

Centraliser les journaux de securite pour:

- detection rapide des incidents;
- investigation avec correlation inter-services;
- conservation conforme a la politique de retention.

Reference interne:

- `docs/SECURITY_LOGGING_POLICY.md`
- `backend/config/packages/monolog.yaml`

## 2. Sortie des logs applicatifs

Le backend emet les logs de securite en JSON via le canal Monolog `security`.

- En `prod`, les logs sont envoyes vers `stderr` (format JSON), compatible avec les collecteurs conteneur.
- En `dev`/`test`, les logs sont aussi ecrits dans `var/log/<env>.security.log`.

## 3. Transport via Docker

Le service backend applique une rotation locale du driver Docker `json-file`:

- `max-size: 10m`
- `max-file: 5`

Fichier:

- `docker-compose.yaml` (service `backend`)

## 4. Pipeline type (OpenSearch/ELK)

### 4.1 Collecte

Option standard:

1. Le conteneur backend ecrit des lignes JSON sur `stderr`.
2. Un agent (Filebeat/Fluent Bit/Vector) collecte les logs Docker.
3. L'agent enrichit les champs (host, service, environment).
4. Les logs sont indexes dans OpenSearch/Elasticsearch.

### 4.2 Mapping recommande

Indexer au minimum:

- `@timestamp` <- `datetime` ou timestamp d'ingestion
- `event_id`
- `event_category`
- `severity`
- `outcome`
- `action`
- `service`
- `environment`
- `request_id`
- `correlation_id`
- `actor_type`
- `actor_id_hash`
- `http_method`
- `http_path`
- `http_status`
- `reason_code`

### 4.3 Convention d'index

Exemple:

- `security-events-backend-YYYY.MM.DD`

Retention recommandee:

- hot: 30-90 jours
- archive: 180-365 jours

(aligner avec `docs/SECURITY_LOGGING_POLICY.md` section retention)

## 5. Requetes utiles (detection)

### Brute-force login

Filtre:

- `event_id = SEC.AUTH.LOGIN_FAILED`
- agrerger par `source_ip_masked` et fenetre 5 minutes

Alerte recommande:

- seuil >= 20 evenements / 5 min / IP

### Acces refuses anormaux

Filtre:

- `event_id = SEC.AUTHZ.ACCESS_DENIED`

Alerte recommande:

- seuil >= 50 evenements / 10 min / actor_id_hash

### Erreurs JWT/revocation

Filtre:

- `event_id in (SEC.JWT.INVALID_TOKEN, SEC.JWT.REVOCATION_ERROR)`

Alerte recommande:

- tout `SEC.JWT.REVOCATION_ERROR` en priorite haute

### Actions admin sensibles

Filtre:

- `event_id` prefixe `SEC.ADMIN.`

Alerte recommande:

- detection hors plage horaire ou volume inhabituel

## 6. Checklist de mise en prod

- [ ] Verifier `APP_ENV=prod` et `APP_DEBUG=0`.
- [ ] Verifier emission JSON sur stderr pour le canal `security`.
- [ ] Connecter l'agent de collecte (Filebeat/Fluent Bit/Vector).
- [ ] Creer index template et ILM/retention.
- [ ] Configurer alertes sur seuils A09.
- [ ] Tester un scenario de bout en bout (login fail -> index -> alerte).

## 7. Alerting operationnel

Runbook et regles d'escalade:

- docs/SECURITY_ALERTING_ESCALATION.md
- backend/config/security_alert_rules.yaml
- backend/bin/security_alert_check.php
