# 🚌 Gestion du Pointage Mensuel des Bus — Yazaki / SRTG

Application web de gestion des navettes quotidiennes entre **Yazaki** et les destinations du gouvernorat de **Gafsa**, développée avec **Next.js**, **MySQL** et **Prisma**.

---

## 📋 Table des matières

- [Aperçu du projet](#-aperçu-du-projet)
- [Technologies utilisées](#-technologies-utilisées)
- [Prérequis](#-prérequis)
- [Installation et démarrage](#-installation-et-démarrage)
- [Variables d'environnement](#-variables-denvironnement)
- [Base de données](#-base-de-données)
- [Comptes de test](#-comptes-de-test)
- [Rôles et permissions](#-rôles-et-permissions)
- [Pages de l'application](#-pages-de-lapplication)
- [Routes API](#-routes-api)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Schéma de la base de données](#-schéma-de-la-base-de-données)
- [Destinations desservies](#-destinations-desservies)
- [Système de tarification](#-système-de-tarification)
- [Structure du projet](#-structure-du-projet)

---

## 🎯 Aperçu du projet

Ce projet est un système de gestion du transport par navettes entre l'usine **Yazaki** et les différentes délégations du gouvernorat de Gafsa. Il permet de :

- **Yazaki** : créer des demandes de navettes pour transporter les employés
- **SRTG** (Société Régionale de Transport de Gafsa) : planifier les trajets, affecter les bus et chauffeurs, et suivre les recettes
- **Administrateur** : gérer les utilisateurs, bus, chauffeurs, et la grille tarifaire

Tous les trajets partent de **Yazaki** vers les destinations du gouvernorat de Gafsa.

---

## 🛠 Technologies utilisées

| Technologie | Version | Rôle |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16.2.2 | Framework React fullstack (App Router) |
| [React](https://react.dev/) | 19.2.4 | Bibliothèque UI |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Typage statique |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Stylisation (utilitaire CSS) |
| [Prisma](https://www.prisma.io/) | 5.22.0 | ORM pour MySQL |
| [MySQL](https://www.mysql.com/) | 8.x | Base de données relationnelle |
| [NextAuth.js](https://next-auth.js.org/) | 5.0 (beta) | Authentification (JWT) |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.0.3 | Hachage des mots de passe |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | Génération de rapports PDF |
| [Lucide React](https://lucide.dev/) | 1.7.0 | Icônes SVG |

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 18 (recommandé : v22)
- **npm** >= 9
- **MySQL** >= 8.0 (ex : via [XAMPP](https://www.apachefriends.org/), [WampServer](https://www.wampserver.com/), ou [MySQL Workbench](https://dev.mysql.com/downloads/workbench/))

---

## 🚀 Installation et démarrage

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd bus-tracking
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Créer un fichier `.env` à la racine du projet :

```env
DATABASE_URL="mysql://root:@localhost:3306/bus_tracking"
NEXTAUTH_SECRET="votre-clé-secrète-ici"
NEXTAUTH_URL="http://localhost:3000"
```

> **Note** : Adaptez `DATABASE_URL` selon votre configuration MySQL (utilisateur, mot de passe, port).

### 4. Créer la base de données

Dans MySQL, créez la base de données :

```sql
CREATE DATABASE bus_tracking;
```

### 5. Synchroniser le schéma Prisma

```bash
npx prisma db push
```

### 6. Insérer les données de test

```bash
npx tsx prisma/seed.ts
```

Ou en une seule commande :

```bash
npm run db:setup
```

### 7. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur **http://localhost:3000**

---

## 🔐 Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL de connexion MySQL | `mysql://root:@localhost:3306/bus_tracking` |
| `NEXTAUTH_SECRET` | Clé secrète pour chiffrer les sessions JWT | `une-chaine-aleatoire-longue` |
| `NEXTAUTH_URL` | URL de base de l'application | `http://localhost:3000` |

---

## 🗄 Base de données

### Commandes utiles

| Commande | Description |
|---|---|
| `npx prisma db push` | Synchroniser le schéma avec la BDD |
| `npx tsx prisma/seed.ts` | Remplir la BDD avec les données de test |
| `npm run db:setup` | Push + Seed en une seule commande |
| `npx prisma studio` | Ouvrir l'interface graphique Prisma Studio |
| `npx prisma db push --force-reset` | Réinitialiser complètement la BDD |

---

## 👤 Comptes de test

Après avoir exécuté le seed, les comptes suivants sont disponibles :

| Nom d'utilisateur | Mot de passe | Nom complet | Rôle |
|---|---|---|---|
| `admin` | `admin123` | Administrateur Système | **ADMIN** |
| `yazaki` | `yazaki123` | Ghada Ben Salah | **YAZAKI** |
| `yazaki2` | `yazaki123` | Amira Khelifi | **YAZAKI** |
| `srtg` | `srtg123` | Agent SRTG | **SRTG** |

---

## 🔑 Rôles et permissions

### ADMIN — Administrateur

L'administrateur gère les ressources du système :

- **Utilisateurs** : créer, modifier, supprimer les comptes utilisateurs
- **Bus** : ajouter, modifier, activer/désactiver les bus
- **Chauffeurs** : ajouter, modifier, activer/désactiver les chauffeurs
- **Tarifs** : configurer les prix par destination et type de bus
- **Rapports** : consulter et exporter les rapports PDF
- **Tableau de bord** : vue d'ensemble avec statistiques globales

### YAZAKI — Demandeur de navettes

Les employés Yazaki gèrent les demandes de transport :

- **Nouvelle demande** : créer une demande avec date, destination(s), nombre de bus, type de bus et horaire
- **Mes demandes** : suivre le statut de ses demandes (En attente → Approuvée / Rejetée)
- **Tarifs** : consulter la grille tarifaire (lecture seule)
- **Tableau de bord** : vue d'ensemble de ses demandes récentes

### SRTG — Agent de planification

L'agent SRTG planifie et gère les trajets :

- **Planning** : créer des plannings à partir des demandes approuvées
- **Affectations** : assigner un bus et un chauffeur à chaque ligne de demande
- **Confirmation** : valider les plannings (déclenche le calcul des recettes)
- **Recettes** : consulter les revenus générés par trajet
- **Rapports** : consulter et exporter les rapports PDF
- **Tableau de bord** : vue d'ensemble avec statistiques de planning

---

## 📄 Pages de l'application

| URL | Rôle(s) | Description |
|---|---|---|
| `/login` | Tous | Page de connexion |
| `/dashboard` | Tous | Tableau de bord adapté au rôle |
| `/requests` | YAZAKI | Liste des demandes de navettes |
| `/requests/new` | YAZAKI | Formulaire de nouvelle demande |
| `/planning` | SRTG | Gestion des plannings et affectations |
| `/revenue` | SRTG | Suivi des recettes |
| `/reports` | ADMIN, SRTG | Génération de rapports PDF |
| `/buses` | ADMIN | Gestion des bus (CRUD) |
| `/drivers` | ADMIN | Gestion des chauffeurs (CRUD) |
| `/users` | ADMIN | Gestion des utilisateurs (CRUD) |
| `/tariffs` | ADMIN, YAZAKI | Gestion / consultation des tarifs |

---

## 🔌 Routes API

| Route | Méthodes | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | Authentification NextAuth.js |
| `/api/requests` | GET, POST | Liste et création des demandes |
| `/api/planning` | GET, POST, PUT | Gestion des plannings |
| `/api/assignments` | POST, DELETE | Affectation bus/chauffeur aux lignes |
| `/api/buses` | GET, POST, PUT, DELETE | CRUD des bus |
| `/api/drivers` | GET, POST, PUT, DELETE | CRUD des chauffeurs |
| `/api/users` | GET, POST, PUT, DELETE | CRUD des utilisateurs |
| `/api/tariffs` | GET, POST, PUT, DELETE | CRUD des tarifs |
| `/api/revenue` | GET | Données de recettes |
| `/api/reports` | GET | Données pour les rapports |
| `/api/stats` | GET | Statistiques du tableau de bord |

---

## ⚙ Fonctionnalités principales

### 1. Gestion des demandes (Yazaki)

- Formulaire intuitif avec sélection de la destination, type de bus, nombre de bus et horaire
- Aperçu du prix en temps réel basé sur la grille tarifaire
- Calcul automatique du coût total estimé
- Suivi du statut : **En attente** → **Approuvée** / **Rejetée**

### 2. Planification (SRTG)

- Visualisation des demandes approuvées
- Création de planning avec affectation bus + chauffeur par ligne
- Détection de conflits : un bus ou chauffeur ne peut pas être affecté deux fois au même horaire et date
- Barre de progression indiquant le taux d'affectation
- Confirmation du planning uniquement quand toutes les lignes sont complètes

### 3. Tarification

- Grille tarifaire par **destination** × **type de bus** (Standard, Grand, Mini)
- 12 destinations × 3 types = 36 tarifs configurables
- Calcul automatique des recettes lors de la confirmation des affectations
- Vue en lecture seule pour Yazaki, édition complète pour l'admin

### 4. Tableau de bord

- Statistiques adaptées au rôle connecté
- Cartes de synthèse (demandes, plannings, bus, chauffeurs, recettes)
- Dernières demandes et derniers plannings en temps réel
- Badges colorés pour le statut et le type de bus

### 5. Rapports PDF

- Génération de rapports exportables en PDF
- Données de planning, affectations et recettes

### 6. Gestion des ressources (Admin)

- CRUD complet pour les bus, chauffeurs et utilisateurs
- Activation / désactivation des bus et chauffeurs
- Affectation d'un chauffeur à un bus (relation 1:1)

---

## 🗃 Schéma de la base de données

```
User (1) ──── (N) Request (1) ──── (N) RequestLine
                      │                      │
                      │ (1:1)                │ (1:N)
                      ▼                      ▼
                  Planning (1) ──── (N) Assignment (1:1) ── Revenue
                                        │        │
                                        │        │
                                        ▼        ▼
                                      Bus      Driver

Tariff (destination × busType → pricePerTrip)
```

### Modèles

| Modèle | Description | Champs clés |
|---|---|---|
| **User** | Utilisateur du système | username, password (hashé), fullName, role |
| **Bus** | Véhicule de transport | busNumber, busType, capacity, isActive, assignedDriverId |
| **Driver** | Chauffeur | matricule, fullName, phone, isActive |
| **Request** | Demande de navette | userId, date, status (PENDING/APPROVED/REJECTED) |
| **RequestLine** | Ligne de demande (trajet) | station, numberOfBuses, busType, shuttleTime |
| **Planning** | Planification | requestId, date, status (DRAFT/CONFIRMED) |
| **Assignment** | Affectation bus+chauffeur | planningId, requestLineId, busId, driverId |
| **Tariff** | Tarif par destination | destination, busType, pricePerTrip |
| **Revenue** | Recette générée | assignmentId, date, amount |

---

## 🗺 Destinations desservies

Toutes les navettes partent de **Yazaki** vers les délégations du gouvernorat de Gafsa :

| # | Destination | Distance relative |
|---|---|---|
| 1 | Gafsa Nord | Proche |
| 2 | Gafsa Sud | Proche |
| 3 | El Ksar | Proche |
| 4 | Sidi Aïch | Proche |
| 5 | Mdhilla | Moyenne |
| 6 | El Guettar | Moyenne |
| 7 | Sened | Moyenne |
| 8 | Zannouch | Moyenne |
| 9 | Belkhir | Moyenne |
| 10 | Metlaoui | Éloignée |
| 11 | Moulares | Éloignée |
| 12 | Redeyef | Éloignée |

---

## 💰 Système de tarification

Les tarifs sont définis par **destination** et **type de bus** :

| Type de bus | Capacité | Gamme de prix (TND / trajet) |
|---|---|---|
| **Standard** | 40 places | 120 – 200 TND |
| **Grand** | 55 places | 180 – 300 TND |
| **Mini** | 20 places | 80 – 140 TND |

> Les prix varient selon la distance de la destination. L'administrateur peut modifier la grille tarifaire à tout moment.

---

## 📁 Structure du projet

```
bus-tracking/
├── prisma/
│   ├── schema.prisma          # Schéma de la base de données
│   └── seed.ts                # Données de test
├── src/
│   ├── app/
│   │   ├── api/               # Routes API (REST)
│   │   │   ├── auth/          # Authentification NextAuth
│   │   │   ├── assignments/   # Affectations
│   │   │   ├── buses/         # Bus
│   │   │   ├── drivers/       # Chauffeurs
│   │   │   ├── planning/      # Plannings
│   │   │   ├── reports/       # Rapports
│   │   │   ├── requests/      # Demandes
│   │   │   ├── revenue/       # Recettes
│   │   │   ├── stats/         # Statistiques
│   │   │   ├── tariffs/       # Tarifs
│   │   │   └── users/         # Utilisateurs
│   │   ├── buses/             # Page gestion des bus
│   │   ├── dashboard/         # Tableau de bord
│   │   ├── drivers/           # Page gestion chauffeurs
│   │   ├── login/             # Page de connexion
│   │   ├── planning/          # Page planning
│   │   ├── reports/           # Page rapports
│   │   ├── requests/          # Pages demandes
│   │   │   └── new/           # Nouvelle demande
│   │   ├── revenue/           # Page recettes
│   │   ├── tariffs/           # Page tarifs
│   │   └── users/             # Page utilisateurs
│   ├── components/
│   │   ├── DashboardLayout.tsx # Layout principal avec sidebar
│   │   └── Sidebar.tsx        # Barre de navigation latérale
│   └── lib/
│       ├── auth.ts            # Configuration NextAuth
│       ├── prisma.ts          # Instance Prisma
│       └── stations.ts        # Liste des destinations
├── .env                       # Variables d'environnement
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 🧪 Comment tester l'application

### Scénario complet de test

1. **Connexion Admin** → `admin` / `admin123`
   - Vérifier le tableau de bord avec les statistiques
   - Ajouter/modifier un bus, un chauffeur, un utilisateur
   - Consulter et modifier la grille tarifaire

2. **Connexion Yazaki** → `yazaki` / `yazaki123`
   - Créer une nouvelle demande de navette :
     - Choisir une date, une destination, un type de bus, un horaire
     - Observer l'aperçu du prix en temps réel
   - Vérifier que la demande apparaît dans "Mes demandes" avec le statut **En attente**
   - Consulter la grille tarifaire (lecture seule)

3. **Connexion Admin** → `admin` / `admin123`
   - Aller dans les demandes et **approuver** la demande créée

4. **Connexion SRTG** → `srtg` / `srtg123`
   - Aller dans **Planning**
   - Créer un planning à partir de la demande approuvée
   - Affecter un bus et un chauffeur à chaque ligne
   - Confirmer le planning (les recettes sont calculées automatiquement)
   - Vérifier les recettes dans **Recettes**
   - Générer un rapport PDF dans **Rapports**

---

## 📝 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Lancer le serveur de développement |
| `npm run build` | Compiler pour la production |
| `npm run start` | Lancer le serveur de production |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run db:push` | Synchroniser le schéma Prisma → MySQL |
| `npm run db:seed` | Insérer les données de test |
| `npm run db:setup` | Push + Seed (initialisation complète) |

---

## 📌 Notes techniques

- **Langue** : Interface entièrement en **français**
- **Mode** : Thème **clair uniquement** (pas de mode sombre)
- **Responsive** : Optimisé pour **desktop** (résolution ≥ 1280px)
- **Authentification** : Sessions JWT via NextAuth.js, mots de passe hashés avec bcrypt
- **Devise** : Dinar Tunisien (**TND**)
- **Conflits** : Vérification automatique des conflits d'affectation (un bus/chauffeur ne peut pas être affecté deux fois au même horaire et date)

---

## 📄 Licence

Projet de fin d'études (PFE) — Usage académique.
