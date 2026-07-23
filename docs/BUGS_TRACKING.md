# Gestion des Bogues

## 1. Signaler un bug

### Processus rapide

1. Verifier que le bug n'existe pas deja (Notion ou GitHub Issues).
2. Creer un ticket.
3. Renseigner:
   - Description claire du probleme
   - Etapes de reproduction
   - Resultat attendu vs resultat observe
   - Environnement (navigateur, version)
4. Assigner les labels (`bug`, `severity:critical`, etc.).
5. Notifier l'equipe.

### Template de ticket

```text
Title: [TYPE] Description concise

Description:
- Comportement observé
- Comportement attendu
- Etapes pour reproduire

Environnement:
- Navigateur (si frontend)
- Version de l'application

Screenshots/Logs:
- Captures d'écrans ou logs erreur
```

## 2. Classification

| Severité | Exemples | Impact utilisateur |
|----------|----------|--------------------|
| Critical | Perte de donnees, API down, acces non autorise, crash app | Total |
| Major | Feature en panne, bug securite, donnees incorrectes | Bloquant |
| Minor | UI glitch, message manquant, perf legerement degradee | Non-bloquant |
| Trivial | Typo, cosmethique, suggestion | Cosmethique |

## 3. Workflow de correction

1. Triage
   - Confirmer la reproduction
   - Estimer l'impact
   - Prioriser
   - Assigner un developpeur
2. Développement
   - Créer branche `fix/nom-du-ticket`
   - Écrire un test qui reproduit le bug
   - Corriger le code
   - Commit conventionnel (`fix(scope): message`)
3. Code review et validation
   - Ouvrir PR liée au bug
   - Éxecuter CI/CD
   - Faire une review (au moins 1 dev)
4. Release et suivi
   - Intégrer dans la prochaine version
   - Déployer
   - Cloturer le bug si stable

## 4. Détection des anomalies

| Methode | Outil | Frequence | Seuil d'alerte |
|---------|-------|-----------|----------------|
| Tests CI/CD | GitHub Actions | A chaque push | 1 test en echec |
| Couverture | Jest + PHPUnit | A chaque merge | < 70% |
| Lint | ESLint + PHPStan | A chaque push | > 0 erreur |
| Performance | Lighthouse CI (workflow `lighthouse.yml`) | A chaque push via `ci-cd.yml` après le frontend | Performance > 50, Accessibility > 80 |
| Logs | Symfony Monolog | Production | Error rate > 1% |

## 5. Analyse des échecs de tests

Lorsqu'un test échoue, une analyse est réalisée afin d'identifier l'origine du problème avant toute correction.

### Étapes d'analyse

1. Identifier le test en échec et le message d'erreur.
2. Vérifier si l'échec est reproductible localement.
3. Déterminer la cause :
   - régression du code
   - données de test, mocks ou fixtures incorrects
   - problème d'environnement ou de configuration
   - test instable
4. Corriger le code ou le test selon la cause identifiée.

### Validation

Après la correction :

- relancer le test concerné ;
- exécuter la suite de tests associée ;
- vérifier le succès des tests en local et dans la CI/CD afin de prévenir toute régression.