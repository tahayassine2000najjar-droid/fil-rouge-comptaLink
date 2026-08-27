# ComptaLink Backend API

Backend API for the ComptaLink project, an application built to serve as a comprehensive link between accounting firms (cabinets) and enterprises. Built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (Entreprise, Cabinet, Admin).
- **CRUD Operations**: Complete CRUD for Entreprises and Cabinets profiles.
- **Validation**: Data validation using Zod schemas.
- **Security**: Password hashing with bcrypt, rate limiting, helmet, and secure routing.
- **File Uploads**: Supports uploading documents.

## Requirements

- Node.js (v18 or v20)
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional for containerized deployment)

## Installation

1. Clone the repository and navigate into the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment configuration file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your specific configuration (e.g., `MONGO_URI`, `JWT_ACCESS_SECRET`).

## Configuration (.env)

- `NODE_ENV`: development or production
- `PORT`: Port to run the server on (default: 4000)
- `MONGO_URI`: MongoDB connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Secrets for signing tokens
- `SMTP_*`: Email configuration for sending verification emails

## Utilisation

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

**Run Tests:**
```bash
npm test
```

## Déploiement (Guide)

### Option 1: Docker Compose

The project includes a `docker-compose.yml` that sets up both the API and MongoDB.

```bash
docker-compose up -d --build
```

### Option 2: CI/CD & Cloud Hosting (e.g., Render, Railway, Vercel)

1. Connect your GitHub repository to Render/Railway.
2. Set the build command to `npm install` and start command to `npm start`.
3. Add the environment variables from your `.env` file to the platform's dashboard.
4. The project uses GitHub Actions `.github/workflows/ci.yml` for continuous integration (testing on push/PR).

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user (entreprise or cabinet)
- `POST /api/auth/login` - Authenticate and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/me` - Get current user profile
- `PATCH /api/me` - Update current user profile

### Entreprise
- `GET /api/entreprise/me` - Get current entreprise profile
- `PATCH /api/entreprise/me` - Update entreprise profile
- `DELETE /api/entreprise/me` - Delete entreprise profile

### Cabinet
- `GET /api/cabinets` - List approved cabinets
- `GET /api/cabinets/:id` - Get specific cabinet
- `GET /api/cabinet/me` - Get current cabinet profile
- `PATCH /api/cabinet/me` - Update cabinet profile
- `POST /api/cabinet/me/documents` - Upload document
- `DELETE /api/cabinet/me/documents/:docId` - Delete document
