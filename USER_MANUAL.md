# Manuel Utilisateur - Airsoft Plateforme

> Guide d'utilisation pour les utilisateurs finaux (joueurs, organisateurs, administrateurs)

**Version** : 1.0.0 | **Date** : 2026-07-10

---

## 🚀 Démarrage

### 1. Accéder à l'application

- **URL** : `https://airsoft.example.com`
- **Navigateur supportés** : Chrome, Firefox, Safari, Edge (versions récentes)
- **Responsive** : Fonctionne sur desktop, tablette, mobile

### 2. Créer un compte (Joueur)

1. Cliquer sur **"S'inscrire"** (haut-droit)
2. Remplir le formulaire :
   - **Prénom** : obligatoire
   - **Nom** : obligatoire
   - **Email** : adresse valide (reçoit confirmation)
   - **Date de naissance** : obligatoire (pour calcul majorité)
   - **Mot de passe** : min 8 caractères, 1 majuscule, 1 chiffre
   - **Pseudonyme** : optionnel (nom affiché en partie)
   - **Téléphone** : optionnel

3. **Si moins de 18 ans** : Contact d'urgence obligatoire
   - Nom, Prénom, Relation, Téléphone

4. Cliquer **"S'inscrire"**
5. ✅ Compte créé → Redirection vers **Tableau de bord**

---

## 👤 Profil Personnel

### Accéder à mon profil

1. Menu **"⚙️ Paramètres"** (haut-droit)
2. Voir mes informations personnelles

### Modifier mes données

**Profil** → Modifier (nom, prénom, pseudo, téléphone, avatar)

**Email** → Changer email (demande vérification mot de passe)

**Mot de passe** → Changer (ancien + nouveau mot de passe)

**Donnés d'urgence** (si mineur) → Mettre à jour contact

**Supprimer mon compte** → Section "Zone Danger" (irréversible)

---

## ⚽ Joueur - Participer aux Parties

### 1. Lister les parties disponibles

1. **Accueil** ou **"Parties"** → Voir toutes les parties publiques
2. Parties affichent :
   - 📅 Date et heure
   - 📍 Lieu
   - 💵 Prix
   - 👥 Places libres (ex: "12/20 places")
   - 🔴 Badge "COMPLÈTE" si plein

### 2. S'inscrire à une partie

1. Cliquer sur la partie → **"S'inscrire"**
2. Confirmer (vérifie si places dispo)
3. ✅ Inscription validée → Reçoit email de confirmation
4. Accès ticket : **"Mes inscriptions"** → Affiche QR code

### 3. Annuler son inscription

1. **"Mes inscriptions"** → Sélectionner partie
2. Cliquer **"Annuler l'inscription"**
3. ✅ Annulée → Email de confirmation envoyé

### 4. Mes inscriptions

- **"Mes inscriptions"** → Liste de toutes mes parties
- Affiche statut : À venir, En cours, Terminée, Annulée
- Télécharger ticket (PDF/image)

---

## 👨‍💼 Organisateur - Gérer une Partie

### 1. Créer une partie

1. Menu **"Mon Espace"** → **"Créer une partie"**
2. Remplir formulaire :
   - **Titre** : nom de la partie
   - **Description** : contexte/règles
   - **Date/Heure** : date future obligatoire
   - **Lieu** : adresse exacte
   - **Prix** : montant par joueur (0 = gratuit)
   - **Places max** : capacité
   - **Privée** : cochier si réservée (non visible joueurs)

3. Cliquer **"Créer"**
4. ✅ Partie créée → Redirection page détail

### 2. Voir les inscriptions

1. **"Mon Espace"** → Ma partie → **"Inscriptions"**
2. Liste complète des joueurs inscrits
3. Affiche : nom, email, téléphone, date inscription

### 3. Marquer la présence

1. **"Inscriptions"** → **"Marquer présence"**
2. Scanner QR code du joueur OU chercher nom
3. ✅ Présence enregistrée
4. Voir résumé : X présents / Y inscrits

### 4. Modifier une partie

1. **"Mon Espace"** → Ma partie → **"Éditer"**
2. Modifier infos (titre, date, prix, etc.)
3. Cliquer **"Sauvegarder"**

### 5. Annuler une partie

1. **"Mon Espace"** → Ma partie → **"Options"** → **"Annuler"**
2. Tous les joueurs reçoivent notification
3. Remboursement automatique si payé

---

## 🛡️ Administrateur - Gestion Globale

### 1. Accès Admin

- URL : `https://airsoft.example.com/admin`
- Réservé aux rôles : ADMIN, SUPER_ADMIN

### 2. Gestion Utilisateurs

**"Utilisateurs"** → Liste tous les joueurs

**Créer utilisateur** :
1. **"+ Créer"** → Remplir données
2. Assigner rôle : USER, ORGANIZER
3. ✅ Créé (lien activation envoyé par email)

**Éditer utilisateur** :
1. Cliquer sur user
2. Modifier rôle, données personnelles
3. Sauvegarder

**Voir contact d'urgence** (mineur) :
1. Sélectionner user < 18 ans
2. Onglet **"Contact Urgence"**

**Supprimer utilisateur** :
1. Sélectionner user
2. **"Supprimer"** (irréversible)

### 3. Gestion Parties

**"Parties"** → Liste toutes les parties (publiques + privées)

**Voir inscriptions** :
1. Cliquer partie → **"Inscriptions"**
2. Marquer présence, voir détails

**Exporter données** :
1. Sélectionner partie
2. **"Exporter CSV"** → Télécharge liste joueurs

### 4. Configuration App

**"Paramètres"** → Configurer defaults app

- Adresse siège
- Prix défaut nouvelle partie
- Capacité défaut nouvelle partie
- Horaires d'ouverture

### 5. Export Données

**"Rapports"** → Exporter données

- **Joueurs** : Liste tous users (nom, email, tél, rôle)
- **Parties** : Liste parties créées (titre, date, lieu, inscrits)
- **Inscriptions** : Détail inscriptions (joueur, partie, date, présence)

Format : CSV (Excel compatible)

---

## ❓ FAQ & Dépannage

### Je me suis trompé d'email lors de l'inscription

**Solution** : Aller **"Paramètres"** → **"Email"** → Changer email (vérifie password)

### Je ne reçois pas d'email de confirmation

1. Vérifier dossier **spam/courrier indésirable**
2. Vérifier email saisi lors inscription
3. Reclique **"Renvoyer email"** dans Paramètres

### J'ai oublié mon mot de passe

1. Page login → **"Mot de passe oublié?"**
2. Entrer email → Reçoit lien réinitialisation
3. Clique lien → Crée nouveau password

### J'ai pas assez de places pour ma partie

**Solution** : **"Mon Espace"** → Ma partie → **"Éditer"** → Augmenter "Places max"

### Comment exporter la liste des joueurs?

**Admin uniquement** : **"Rapports"** → **"Joueurs"** → **"Exporter CSV"**

### Un joueur ne peut pas s'inscrire (partie pleine)

**Comportement normal** : Quand places = max, bouton "S'inscrire" devient grisé

Attendre annulation d'une inscription ou augmenter capacité

### Comment marquer absence après une partie?

**Organisateur** : **"Inscriptions"** → Ne rien faire (absence = non marqué présent)

---

## 📱 Aide & Support

- **Email** : support@airsoft.example.com
- **Horaires** : Lun-Ven 9h-17h
- **Temps réponse** : < 24h

---

**Dernière mise à jour** : 2026-07-10
