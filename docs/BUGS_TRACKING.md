# Gestion des Bogues

## 1. Signaler un bug

### Processus rapide

1. Si le bug provient d'un utilisateur, celui-ci est signalé via le formulaire dédié puis automatiquement enregistré dans Trello.
2. Vérifier que l'anomalie n'existe pas déjà dans Notion afin d'éviter les doublons.
3. Reproduire et valider l'anomalie.
4. Créer ou mettre à jour un ticket Notion contenant les informations techniques.
5. Renseigner :
   - Description claire du problème
   - Étapes de reproduction
   - Résultat attendu et résultat observé
   - Environnement (navigateur, version de l'application, système d'exploitation)
   - Captures d'écran, logs ou rapports d'erreur si disponibles
6. Attribuer un niveau de sévérité (`critical`, `major`, `minor`, `trivial`).
7. Notifier l'équipe de développement.

> Les tickets Trello sont destinés au suivi des retours utilisateurs. Les analyses techniques sont réalisées dans Notion afin d'éviter de divulguer des informations sensibles (logs, détails de sécurité, architecture interne, pistes de correction). Chaque ticket Notion référence, lorsque nécessaire, le ticket Trello correspondant afin d'assurer la traçabilité.

### Template de ticket

```text
Titre : [TYPE] Description concise

Source :
- Utilisateur
- Développeur
- Sentry
- Tests

Description :
- Comportement observé
- Comportement attendu
- Étapes de reproduction

Environnement :
- Système d'exploitation
- Navigateur (si frontend)
- Version de l'application

Preuves :
- Captures d'écran
- Logs
- Rapports Sentry
```

## 2. Classification

| Sévérité | Exemples | Impact utilisateur |
|----------|----------|--------------------|
| Critical | Perte de données, API indisponible, accès non autorisé, crash de l'application | Total |
| Major | Fonctionnalité indisponible, faille de sécurité, données incorrectes | Bloquant |
| Minor | Défaut d'interface, message manquant, légère dégradation des performances | Non bloquant |
| Trivial | Coquille, amélioration esthétique, suggestion | Cosmétique |

## 3. Workflow de correction

1. Qualification
   - Reproduire l'anomalie
   - Vérifier son impact
   - Déterminer son niveau de sévérité
   - Assigner le ticket à un développeur

2. Développement
   - Développer le correctif
   - Ajouter ou mettre à jour les tests si nécessaire
   - Commit conventionnel (`fix(scope): message`)

3. Validation
   - Vérifier le bon fonctionnement en local
   - Exécuter la CI/CD
   - Vérifier qu'aucune régression n'est détectée

4. Déploiement
   - Intégrer le correctif à la prochaine version
   - Déployer l'application
   - Clôturer le ticket une fois la correction validée

## 4. Détection des anomalies

| Méthode | Outil | Fréquence | Seuil d'alerte |
|---------|-------|-----------|----------------|
| Tests CI/CD | GitHub Actions | À chaque push | 1 test en échec |
| Couverture | Jest + PHPUnit | À chaque merge | < 70 % |
| Lint | ESLint + PHPStan | À chaque push | > 0 erreur |
| Performance | Lighthouse CI (workflow `lighthouse.yml`) | À chaque push via `ci-cd.yml` | Performance < 50, Accessibility < 80 |
| Logs | Symfony Monolog | Production | Error rate > 1 % |
| Monitoring applicatif | Sentry | Temps réel | Nouvelle exception détectée |

## 5. Analyse des échecs de tests

Lorsqu'un test échoue, une analyse est réalisée afin d'identifier l'origine du problème avant toute correction.

### Étapes d'analyse

1. Identifier le test en échec et le message d'erreur.
2. Vérifier si l'échec est reproductible localement.
3. Déterminer la cause :
   - régression du code ;
   - données de test, mocks ou fixtures incorrects ;
   - problème d'environnement ou de configuration ;
   - test instable.
4. Corriger le code ou le test selon la cause identifiée.

### Validation

Après la correction :

- relancer le test concerné ;
- exécuter la suite de tests associée ;
- vérifier le succès des tests en local et dans la CI/CD afin de prévenir toute régression.