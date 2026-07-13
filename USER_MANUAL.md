# Manuel Utilisateur - Airsoft Plateforme

> Guide d'utilisation pour les utilisateurs finaux (joueurs, organisateurs, administrateurs)


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
   - **Email** : adresse valide
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
3. ✅ Inscription validée

### 3. Annuler son inscription

1. **"Mes inscriptions"** → Sélectionner partie
2. Cliquer **"Annuler l'inscription"**
3. ✅ Inscription supprimée

### 4. Mes inscriptions

- **"Mes inscriptions"** → Liste de toutes mes parties

---

## 👨‍💼 Organisateur / Admin - Gérer une Partie

### 1. Créer une partie

1. Aller dans la section **"Parties"** → **"Créer une partie"**
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

1. Sélectionner une partie → **"Inscriptions"**
2. Liste complète des joueurs inscrits
3. Affiche : nom, email, date inscription

### 3. Marquer la présence

1. **"Inscriptions"** → Cocher la case présence du joueur
2. ✅ Présence enregistrée

### 4. Modifier une partie

1. Sélectionner une partie → **"Éditer"**
2. Modifier infos (titre, date, prix, etc.)
3. Cliquer **"Sauvegarder"**

### 5. Supprimer une partie

1. Sélectionner une partie → **"Supprimer"**
2. Confirmer la suppression

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
3. ✅ Utilisateur créé

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

**"Paramètres"** → Configurer les valeurs par défaut

- Adresse par défaut
- Prix par défaut nouvelle partie
- Capacité par défaut nouvelle partie

### 5. Export Données

**"Rapports"** → Exporter données

- **Joueurs** : Liste tous users (nom, email, tél, rôle)
- **Parties** : Liste parties créées (titre, date, lieu, inscrits)
- **Inscriptions** : Détail inscriptions (joueur, partie, date, présence)

Format : CSV (Excel compatible)

---

## ❓ FAQ & Dépannage

### J'ai pas assez de places pour ma partie

**Solution** : Aller sur la partie → **"Éditer"** → Augmenter "Places max"

### Comment exporter la liste des joueurs?

**Admin uniquement** : **"Rapports"** → **"Joueurs"** → **"Exporter CSV"**

### Un joueur ne peut pas s'inscrire (partie pleine)

**Comportement normal** : Quand places = max, bouton "S'inscrire" devient grisé

Attendre annulation d'une inscription ou augmenter capacité

### Comment marquer absence après une partie?

**Organisateur** : **"Inscriptions"** → Ne rien faire (absence = non marqué présent)
