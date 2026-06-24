
# Airsoft — CI / CD & Release Guide

Ce document décrit le fonctionnement automatique mis en place pour le CI/CD, la génération des releases (release-please), le formatage avec Prettier, et les bonnes pratiques pour les développeurs.

**Où chercher**:
- Configuration release: [.release-pleaserc.json](.release-pleaserc.json)
- Workflow principal: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml#L1)
- Workflow réutilisable de release: [.github/workflows/release.yml](.github/workflows/release.yml#L1)
- Prettier config: `./.prettierrc` et `./.prettierignore`

**Résumé**
- Les jobs `frontend` et `backend` s'exécutent (lint, tests, format check) sur les branches `dev` et `main`.
- La job `release` est déclenchée automatiquement sur `push` vers `main` et appelle le workflow réutilisable `release.yml`.
- `release-please` génère les changelogs et éventuellement une PR de release. Nous formatons ensuite les changelogs automatiquement et poussons les corrections si nécessaire.
- Les fichiers Markdown (`*.md`) sont exclus des validations Prettier en CI via `./.prettierignore`.

**Détails techniques**

- Release automation
	- L'action `googleapis/release-please-action@v4` est utilisée pour détecter les versions à bump à partir des commits (conventional commits).
	- La configuration des packages et des sections de changelog est dans [.release-pleaserc.json](.release-pleaserc.json).
	- Après génération, le workflow exécute `prettier --write CHANGELOG.md "**/CHANGELOG.md"` et pousse un commit formaté sur `main` si des modifications apparaissent (le push se fait via le secret `RELEASE_GITHUB_TOKEN`).

- Permissions et token
	- Le workflow réutilisable ne demande pas de permissions écriture globales (pour être compatible avec les règles GitHub Actions). Le push est effectué via le secret `RELEASE_GITHUB_TOKEN` transmis par l'appelant.
	- Si vous gérez les droits, assurez-vous que le secret `RELEASE_GITHUB_TOKEN` dispose des droits `repo` nécessaires pour pusher sur `main`.

- Prettier
	- La config globale de Prettier est dans `./.prettierrc`. Gardez-la pour assurer un formatage cohérent du code (JS/TS/CSS/JSON, ...).
	- Les fichiers Markdown sont ignorés en CI via `./.prettierignore` (contient `*.md`). Cela évite que des fichiers générés automatiquement cassent les checks.

**Bonnes pratiques pour les développeurs**

- Commit messages
	- Utilisez les conventions de commit (Conventional Commits) : `feat:`, `fix:`, `chore:`, `refactor:`, etc. `release-please` s'appuie dessus pour calculer les versions et remplir le changelog.

- Avant d'ouvrir une PR
	- Frontend :
		- Lancer le lint :
			```bash
			cd frontend
			npm install
			npm run lint
			```
		- Lancer le formatage ou vérification Prettier :
			```bash
			npm run format       # applique le format
			npm run format:check # vérifie le format
			```

	- Backend : exécuter les tests et linters selon la configuration backend (ex. `composer install` puis `vendor/bin/phpunit`).

- Sur la branche `main`
	- Ne poussez pas manuellement de changelogs générés. Laissez `release-please` créer la PR/les fichiers. Si le workflow formate un changelog, il poussera un commit automatique.

- Si vous préférez revue humaine
	- Si une revue humaine est souhaitée : le push automatique peut être remplacé par l'ouverture d'une PR contenant les corrections de format. Configurez le workflow pour créer une PR au lieu de pusher directement.

**Débogage & tests locaux**
- Pour simuler les étapes GitHub Actions localement, utilisez `act` ou exécutez manuellement les commandes listées ci-dessus.
