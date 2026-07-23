# Accessibilité


## 1. Référentiel choisi

**WCAG 2.1 Niveau AA** - équivalent à ~75 % du RGAA 4.1.

**Pourquoi ce choix :**
- Couvre les critères critiques et prioritaires du RGAA
- Permet un sem-audit automatisé et continu
- Alternative pragmatique à un audit manuel RGAA complet (plusieurs jours de consultant)

**Critères RGAA couverts automatiquement :**
- Couleurs et contraste
- Éléments interactifs (boutons, formulaires, liens)
- Labels et descriptions ARIA
- Navigation au clavier
- Structure sémantique (titres, points de repère)
- Validations de formulaires

**Critères nécessitant un audit manuel (hors périmètre automatisé) :**
- Transcriptions audio
- Sous-titres vidéo
- Signification portée uniquement par la forme
- Perte de sens en noir et blanc

## 2. Dispositif de validation continue

La conformité est contrôlée automatiquement à chaque push.

**Lighthouse CI** (`.github/workflows/lighthouse.yml`)
- Score d'accessibilité WCAG 2.1 AA calculé à chaque push
- Seuil de validation : score > 80
- Rapport en artefact GitHub Actions

**Pa11y CI** (`.github/workflows/pa11y.yml`)
- Conformité WCAG AA vérifiée via axe + htmlcs (`.pa11yci.json`)
- Scan des pages clés : accueil, connexion, inscription, tableau de bord, paramètres, admin
- Seuil : max 3 problèmes par page, sinon échec du pipeline
- Rapport détaillé : `pa11y-report.json`

**Tests unitaires** : tests Jest ciblés sur des composants (ex. `GameListCard.a11y.test.tsx`, `AuthForm.a11y.test.tsx`)

**Intérêt de l'approche** : toute régression d'accessibilité est détectée dès son introduction, sans dépendre d'une revue manuelle récurrente — contrôle systématique plutôt qu'a posteriori.

## 3. Mesures mises en œuvre

- **ARIA** : `aria-label`, `aria-invalid`/`aria-describedby` sur les erreurs de formulaire, `aria-live="polite"`, `aria-expanded`, `aria-hidden`
- **Sémantique HTML** : hiérarchie de titres cohérente, `<label>` associés, landmarks `<nav>`/`<main>`/`<footer>`
- **Clavier** : gestion du focus dans les modales, indicateurs de focus visibles, activation via Entrée/Espace
- **Contraste** : conforme WCAG AA (min. 4,5:1), statuts non signalés par la couleur seule