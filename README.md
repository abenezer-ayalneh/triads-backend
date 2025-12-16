# 🎯 Triads Backend

A robust NestJS backend API for the **Triads** word association game. This application provides endpoints for managing triads (word groups with clues), triad groups, game logic, and bulk data import capabilities.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Memory Optimization](#-memory-optimization)
- [Development](#-development)
- [Production Deployment](#-production-deployment)

---

## ✨ Features

### Game Logic

- **Get Cues**: Retrieve all available cues for triads
- **Get Hints**: Get hints for specific triads
- **Check Solution**: Validate if provided cues match a triad
- **Check Answer**: Verify if an answer matches the correct triad keyword
- **Fourth Triad Cues**: Get cues for finding the fourth triad in a group

### Triad Groups Management

- **List Groups**: Paginated listing with search functionality
- **Get Group Triads**: Retrieve all triads in a specific group
- **Create Group**: Create new triad groups
- **Update Group**: Modify existing triad groups
- **Delete Group**: Remove triad groups
- **Toggle Active Status**: Activate/deactivate triad groups

### Data Import

- **Excel Import**: Bulk import triads from Excel files (`.xlsx`)
- File size limit: 10MB
- Supports structured data import for efficient data management

---

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Language**: TypeScript
- **Database**: PostgreSQL 16.3
- **ORM**: Prisma
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston with daily rotation
- **Security**: Helmet, CORS, Throttler
- **Process Management**: PM2
- **Containerization**: Docker Compose

---

## 📦 Prerequisites

- **Node.js** >= 18.x
- **pnpm** (recommended) or npm
- **PostgreSQL** 16.3+ (or use Docker Compose)
- **Docker** & **Docker Compose** (optional, for database)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd triads-backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Application
APP_PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/triads_db?connection_limit=5&pool_timeout=20"

# PostgreSQL (for Docker Compose)
POSTGRES_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Throttler
THROTTLER_TTL=60000
THROTTLER_LIMIT=100
```

### 4. Start Database (Docker Compose)

```bash
docker compose up -d postgres
```

### 5. Run Database Migrations

```bash
pnpm prisma migrate dev
```

### 6. Seed Database (Optional)

```bash
pnpm prisma db seed
```

### 7. Start Development Server

```bash
pnpm start:dev
```

The API will be available at `http://localhost:3000`

---

## 📚 API Documentation

Once the server is running, access the interactive Swagger documentation at:

**http://localhost:3000/docs**

### API Endpoints Overview

All endpoints are prefixed with `/api`

#### Triads Endpoints

- `GET /api/triads/cues` - Get all cues
- `GET /api/triads/hint` - Get hint for a triad
- `GET /api/triads/check-triad` - Check if cues match a triad
- `GET /api/triads/check-answer` - Validate an answer
- `GET /api/triads/fourth-triad-cues` - Get fourth triad cues

#### Triad Groups Endpoints

- `GET /api/triads/groups` - List triad groups (with pagination & search)
- `GET /api/triads/groups/:id/triads` - Get triads in a group
- `POST /api/triads/groups` - Create a new triad group
- `PUT /api/triads/groups/:id` - Update a triad group
- `PATCH /api/triads/groups/:id/status` - Toggle active status
- `DELETE /api/triads/groups/:id` - Delete a triad group

#### Import Endpoints

- `POST /api/import/triads` - Import triads from Excel file

---

## 🗄 Database Schema

### Triad Model

- `id`: Unique identifier
- `keyword`: The main word/keyword
- `cues`: Array of clue words (String[])
- `fullPhrases`: Array of full phrases (String[])

### TriadGroup Model

- `id`: Unique identifier
- `triad1Id`, `triad2Id`, `triad3Id`, `triad4Id`: References to four triads
- `active`: Boolean flag for active/inactive status (default: true)

Each triad group consists of four related triads that share a common connection.

---

## 🔧 Environment Variables

| Variable               | Description                          | Default       |
| ---------------------- | ------------------------------------ | ------------- |
| `APP_PORT`             | Application port                     | `3000`        |
| `NODE_ENV`             | Environment (development/production) | `development` |
| `DATABASE_URL`         | PostgreSQL connection string         | Required      |
| `POSTGRES_PORT`        | PostgreSQL port (Docker)             | `5432`        |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins      | Required      |
| `THROTTLER_TTL`        | Throttler time window (ms)           | `60000`       |
| `THROTTLER_LIMIT`      | Max requests per TTL                 | `100`         |

---

## 💾 Memory Optimization

This application has been optimized for low-memory environments (2GB RAM VPS):

### Optimizations Implemented

1. **Database Connection Management**
    - PrismaService properly closes connections on module destroy
    - Connection pooling configured via `DATABASE_URL`

2. **Query Limits**
    - All `findMany` queries have limits to prevent loading excessive data
    - Pagination implemented for list endpoints

3. **Logging**
    - Production logging level set to `info` instead of `silly`
    - Daily log rotation to manage disk space

4. **Lodash Optimization**
    - Only imports specific functions instead of the entire library
    - Reduces bundle size

5. **Excel Import**
    - File size limits (10MB max)
    - Row processing limits to prevent memory spikes

6. **PM2 Configuration**
    - Watch mode disabled in production
    - Memory restart limit set to 1GB
    - Automatic restart on memory threshold

### Database Connection Pooling

For optimal performance on limited resources, configure your `DATABASE_URL` with connection pool parameters:

```env
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=5&pool_timeout=20"
```

**Recommendation**: Set `connection_limit` to 3-5 for 2GB RAM VPS.

---

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm start:dev          # Start with hot reload
pnpm start:debug        # Start with debugger

# Building
pnpm build              # Build for production

# Code Quality
pnpm lint               # Run ESLint
pnpm format             # Format with Prettier

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Run tests in watch mode
pnpm test:cov           # Run with coverage
pnpm test:e2e           # Run end-to-end tests

# Database
pnpm prisma migrate dev # Run migrations
pnpm prisma generate    # Generate Prisma Client
pnpm prisma studio      # Open Prisma Studio
pnpm prisma db seed     # Seed database
```

### Code Quality Tools

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **Commitlint**: Conventional commit message validation
- **Husky**: Git hooks for pre-commit checks
- **Lint-staged**: Run linters on staged files

---

## 🚢 Production Deployment

### 1. Build the Application

```bash
pnpm build
```

### 2. Set Production Environment Variables

Ensure all environment variables are set correctly for production.

### 3. Run Database Migrations

```bash
pnpm prisma migrate deploy
```

### 4. Start with PM2

```bash
pm2 start ecosystem.config.js --env production
```

### 5. Monitor Application

```bash
pm2 status
pm2 logs triads-backend
pm2 monit
```

### PM2 Configuration

The `ecosystem.config.js` includes:

- Memory limit: 1GB (auto-restart if exceeded)
- Watch mode: Disabled in production
- Auto-restart: Enabled
- Logging: Enabled with timestamps

---

## 📝 Additional Notes

### Logging

Logs are stored in the `logs/` directory:

- `combined/`: All logs (daily rotation)
- `error/`: Error logs only (daily rotation)

### Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable allowed origins
- **Throttler**: Rate limiting to prevent abuse
- **Validation**: Input validation with class-validator
- **Global Exception Filter**: Centralized error handling

---

<div align="center">

**Happy Coding! 🎉**

</div>
