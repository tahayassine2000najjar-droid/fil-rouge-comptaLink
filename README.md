# ComptaLink

> Plateforme web Full Stack de mise en relation entre entreprises et cabinets comptables.

## Aperçu

ComptaLink est une plateforme qui connecte les entreprises (startups, PME, entreprises individuelles) avec les cabinets comptables et experts-comptables. Elle permet de digitaliser la recherche de professionnels, la gestion des demandes de devis, et la communication entre les parties.

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Backend** | Node.js, Express, MongoDB (Mongoose), JWT, Zod, Swagger |
| **Frontend** | React 19, Vite, React Router, Tailwind CSS 4, Lucide Icons |
| **Déploiement** | Docker & Docker Compose |

## Structure du Projet

```
comptaLink/
├── backend/                 # API Node.js / Express
│   ├── src/
│   │   ├── config/          # Configuration (env, db, swagger)
│   │   ├── controllers/     # Logique métier (auth, entreprise, cabinet, quote)
│   │   ├── middleware/      # Auth, gestion d'erreurs
│   │   ├── models/          # Schémas Mongoose (User, Entreprise, Cabinet, Quote)
│   │   ├── routes/          # Définition des routes API
│   │   ├── services/        # Services métier
│   │   ├── utils/           # Utilitaires (tokens, notifications, erreurs)
│   │   └── tests/           # Tests d'intégration
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Application React / Vite
│   ├── src/
│   │   ├── components/      # Composants réutilisables (layout, ui)
│   │   ├── lib/             # Client API
│   │   ├── pages/           # Pages (auth, dashboard, cabinets, quotes, profile)
│   │   └── App.jsx          # Routeur principal
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml       # Orchestration des services
```

## Fonctionnalités Implémentées

### Authentification & Autorisation
- Inscription avec sélection du rôle (entreprise / cabinet)
- Connexion avec JWT (access token + refresh token)
- Vérification d'email
- Réinitialisation de mot de passe
- Contrôle d'accès basé sur les rôles (RBAC)

### Gestion des Profils
- **Entreprise** : création, consultation, modification, suppression du profil
- **Cabinet** : création, modification, recherche avec filtres (ville, service, note)
- Approbation des cabinets par un admin

### Système de Devis
- Une entreprise peut créer une demande de devis pour un cabinet
- Le cabinet peut accepter ou refuser la demande
- Messagerie intégrée entre les parties (après acceptation)
- Acceptation des conditions par les deux parties
- Statuts : `pending`, `accepted`, `declined`, `completed`, `cancelled`

### Recherche & Découverte
- Liste des cabinets avec pagination
- Filtres par ville, service, note moyenne
- Tri par note, nombre d'avis, ou date d'inscription

### Notifications
- Système de notifications (console, extensible par email)

## Démarrage Rapide

### Prérequis
- Node.js v18+
- MongoDB (local ou Atlas)
- Docker & Docker Compose (optionnel)

### Backend

```bash
cd backend
npm install
cp .env.example .env    # Configurer les variables d'environnement
npm run dev             # Mode développement
npm start               # Mode production
npm test                # Lancer les tests
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # Serveur de développement Vite
npm run build           # Build de production
```

### Docker (Full Stack)

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| API Docs (Swagger) | http://localhost:4000/api-docs |

## Configuration

### Variables d'environnement (backend/.env)

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement | `development` |
| `PORT` | Port du serveur | `4000` |
| `MONGO_URI` | URI de connexion MongoDB | `mongodb://127.0.0.1:27017/comptalink` |
| `JWT_ACCESS_SECRET` | Secret JWT access token | - |
| `JWT_REFRESH_SECRET` | Secret JWT refresh token | - |
| `ACCESS_TOKEN_TTL` | Durée de vie access token | `15m` |
| `REFRESH_TOKEN_TTL` | Durée de vie refresh token | `7d` |
| `APP_URL` | URL du frontend | `http://localhost:3000` |
| `API_URL` | URL de l'API | `http://localhost:4000` |
| `SMTP_HOST` | Serveur SMTP | - |
| `SMTP_PORT` | Port SMTP | `587` |
| `SMTP_USER` | Utilisateur SMTP | - |
| `SMTP_PASS` | Mot de passe SMTP | - |

## API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/refresh` | Rafraîchir le token |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/verify-email` | Vérification email |
| POST | `/api/auth/resend-verification` | Renvoyer l'email de vérification |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |
| POST | `/api/auth/reset-password` | Réinitialiser le mot de passe |

### Utilisateur
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/me` | Profil utilisateur courant |
| PATCH | `/api/me` | Mettre à jour le profil |

### Entreprise
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/entreprise` | Créer un profil entreprise |
| GET | `/api/entreprise/me` | Consulter son profil |
| PATCH | `/api/entreprise/me` | Modifier son profil |
| DELETE | `/api/entreprise/me` | Supprimer son profil |

### Cabinet
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/cabinets` | Lister les cabinets (filtres: city, service, minRating, sort) |
| GET | `/api/cabinets/:id` | Détail d'un cabinet |
| GET | `/api/cabinet/me` | Profil cabinet courant |
| PATCH | `/api/cabinet/me` | Modifier son profil cabinet |

### Devis
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/quotes` | Créer une demande de devis |
| GET | `/api/quotes` | Lister ses devis |
| GET | `/api/quotes/:id` | Détail d'un devis |
| PATCH | `/api/quotes/:id` | Modifier une demande |
| DELETE | `/api/quotes/:id` | Supprimer une demande |
| POST | `/api/quotes/:id/respond` | Répondre (cabinet) |
| POST | `/api/quotes/:id/messages` | Envoyer un message |
| POST | `/api/quotes/:id/accept-terms` | Accepter les conditions |
| POST | `/api/quotes/:id/cancel` | Annuler une demande |

## Modèles de Données

### User
- `email`, `password` (hashé), `fullName`, `role` (entreprise/cabinet/admin)
- `isEmailVerified`, `verificationToken`, `resetPasswordToken`
- `refreshTokenHashes`, `isActive`

### EntrepriseProfile
- `companyName`, `legalForm`, `siret`, `industry`, `size`
- `description`, `website`, `address`, `city`, `country`, `phone`, `logo`

### CabinetProfile
- `firmName`, `slug`, `tagline`, `description`
- `services`, `specialities`, `certifications`
- `experienceYears`, `teamSize`, `ratingAvg`, `reviewCount`
- `status` (pending/approved/rejected), `isFeatured`

### QuoteRequest
- `entreprise`, `cabinet`, `service`, `budget`, `timeline`
- `status` (pending/accepted/declined/completed/cancelled)
- `response` (price, duration, message)
- `messages` (thread de discussion)
- `terms` (acceptation par les deux parties)

## Améliorations Prévues

- [ ] Upload et génération de devis en PDF
- [ ] Système de rendez-vous (calendrier)
- [ ] Rate-limiting sur les endpoints sensibles
- [ ] Notifications par email (SMTP)
- [ ] Système d'avis et notation des cabinets
- [ ] Tableau de bord avec statistiques avancées
- [ ] Paiement en ligne
- [ ] Messagerie temps réel (WebSocket/Socket.io)

## Licence

MIT
