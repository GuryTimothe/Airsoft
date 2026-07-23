# Manuel Utilisateur - Airsoft Plateforme

> Guide d'utilisation pour les utilisateurs finaux (joueurs, organisateurs, administrateurs)

---

## Démarrage

### 1. Accéder à l'application

**Voir [QUICKSTART.md](./QUICKSTART.md) pour démarrer l'application**

## Rôles d'Accès (RBAC)

| Rôle | Permissions |
|------|------------|
| **ROLE_USER** | Voir parties publiques, s'inscrire |
| **ROLE_ORGANIZER** | Créer/modifier parties, voir joueurs inscrits, marquer présence |
| **ROLE_ADMIN** | Tous droits, exports CSV, gestion paramètres |
| **ROLE_SUPER_ADMIN** | Tous droits + gestion rôles autres admins |

## Invités

### 1. Créer un compte

1. Cliquer sur **"Connexion"** (haut-droite)
2. Remplir le formulaire :
   - **Prénom** : obligatoire
   - **Nom** : obligatoire
   - **Email** : adresse valide
   - **Date de naissance** : obligatoire (pour calcul de majorité)
   - **Mot de passe** : min 12 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
   - **Pseudonyme** : optionnel (nom affiché en partie)
   - **Téléphone** : optionnel

3. **Si moins de 18 ans** : Contact d'urgence obligatoire
   - Nom
   - Prénom
   - Relation
   - Téléphone

4. Cliquer **"S'inscrire"**
5. Compte créé → Redirection vers la page d'**accueil**


## Tous les utilisateurs

### 1. Se connecter

1. Cliquer sur **"Connexion"** (haut-droite)
2. Remplir le formulaire :
   - **Email** : adresse valide
   - **Mot de passe** : mot de passe valide

3. Cliquer **"Se connecter"**
4. Redirection vers la page d'accueil

## Joueurs

### 1. Accéder à mon profil

1. Menu **"Mon profil"** (haut-droite)
2. Voir mes informations personnelles

### 2. Modifier mes données

**Profil** → Modifier :
- nom
- prénom
- pseudo
- téléphone
- avatar

**Email** → Modifier l'email (demande de vérification du mot de passe)

**Mot de passe** → Modifier :
- ancien mot de passe
- nouveau mot de passe

**Données d'urgence** (si mineur) → Mettre à jour le contact

**Supprimer mon compte** → Section "Zone Danger" (irréversible)


### 3. Lister les parties disponibles

1. Sur la page d'**accueil**, voir toutes les parties publiques
2. Les parties affichent :
   - Date et heure
   - Lieu
   - Prix de la place
   - Places libres (ex : "12/20 places")


### 4. S'inscrire à une partie

1. Sur la liste des parties, cliquer sur le bouton **"S'inscrire"** d'une partie
2. Confirmer que le bouton soit passé en **"Annuler l'inscription"**
3. Inscription validée


### 5. Annuler son inscription

1. Sur la liste des parties, cliquer sur le bouton **"Annuler l'inscription"** d'une partie
2. Confirmer que le bouton soit passé en **"S'inscrire"**
3. Annulation validée


## Organisateur - Admin - Super-admin

### 1. Accès Admin

- Bouton **"Panel admin"** (haut-droite)
- URL : `https://airsoft.example.com/admin`


### 2. Créer une partie

1. Aller dans la section **"Parties"** → **"Créer une partie"**
2. Remplir le formulaire :
   - **Titre** : nom de la partie
   - **Description** : contexte/règles
   - **Date/Heure** : date future obligatoire
   - **Lieu** : adresse exacte
   - **Prix** : montant par joueur (0 = gratuit)
   - **Places max** : capacité
   - **Privée** : cocher si réservée (non visible par les joueurs sans permission)

3. Cliquer **"Créer"**
4. Partie créée → Redirection vers la page **"Parties"**


### 3. Voir les informations

1. Sélectionner une partie → **"Voir"**
2. Liste complète des joueurs inscrits
3. Affiche :
   - informations de la partie
   - joueurs inscrits


### 4. Marquer la présence

1. **"Inscriptions"** → Cocher la case présence du joueur
2. Présence enregistrée


### 5. Modifier une partie

1. Sélectionner une partie → **"Modifier"**
2. Modifier les informations (titre, date, prix, etc.)
3. Cliquer **"Enregistrer"**


### 6. Supprimer une partie

1. Sélectionner une partie (voir ou modifier) → **"Supprimer"**
2. Confirmer la suppression


## Administrateur - Super administrateur

### 1. Liste Utilisateurs

**"Utilisateurs"** → Liste de tous les utilisateurs


### 2. Création Utilisateur

1. **"+ Créer"** → Remplir les données
2. Assigner un rôle :
   - USER
   - ORGANIZER

3. Utilisateur créé


### 3. Voir les informations

1. Sélectionner un utilisateur → **"Voir"**
2. Consulter ses informations


### 4. Modifier Utilisateur

1. Sélectionner un utilisateur → **"Modifier"**
2. Modifier :
   - rôle
   - données personnelles

3. Sauvegarder


### 5. Supprimer un utilisateur

1. Sélectionner un utilisateur
2. **"Supprimer"** (irréversible)


### 6. Configuration App

**"Paramètres"** → Configurer les valeurs par défaut

- Adresse par défaut
- Prix par défaut nouvelle partie
- Capacité par défaut nouvelle partie

### 7. Export Données

**"Rapports"** → Exporter les données

- **Joueurs** : Liste de tous les utilisateurs (nom, email, téléphone, rôle)
- **Parties** : Liste des parties créées (titre, date, lieu, inscrits)
- **Inscriptions** : Détail des inscriptions (joueur, partie, date, présence)

Format : CSV (Excel compatible)