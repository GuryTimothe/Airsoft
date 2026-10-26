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

**Tests unitaires** : tests Jest ciblés sur des composants (ex. `GameListCard.a11y.test.tsx`, `AuthForm.a11y.test.tsx`), exécutés à chaque push par `frontend-ci.yml`. C'est aujourd'hui le seul contrôle d'accessibilité automatisé.

**Audits manuels** : Pa11y a été retiré du dépôt. Plus aucun workflow ne
l'exécutait, et les URL de sa configuration ne correspondaient plus aux routes
réelles (`/register`, `/login`, `/dashboard` et `/settings` au lieu de
`/auth/register`, `/auth/login`, `/profil` et `/admin/settings`), de sorte que
son rapport ne mesurait rien.

Les audits ponctuels passent donc par Lighthouse dans Chrome
(F12 → Lighthouse), sur une build de production, comme décrit dans
[QUALITY_CRITERIA.md](./QUALITY_CRITERIA.md).

## 3. Mesures mises en œuvre

- **ARIA** : `aria-label`, `aria-invalid`/`aria-describedby` sur les erreurs de formulaire, `aria-live="polite"`, `aria-expanded`, `aria-hidden`
- **Sémantique HTML** : hiérarchie de titres cohérente, `<label>` associés, landmarks `<nav>`/`<main>`/`<footer>`
- **Clavier** : gestion du focus dans les modales, indicateurs de focus visibles, activation via Entrée/Espace
- **Contraste** : conforme WCAG AA (min. 4,5:1), statuts non signalés par la couleur seule