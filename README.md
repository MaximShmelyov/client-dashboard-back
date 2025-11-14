# Client Dashboard Backend

A Node.js/TypeScript backend for the Client Dashboard application.  
Provides authentication, user management, order tracking, and integration with Bitrix24 CRM.  
Production-ready: Dockerized, rate-limited, scalable, and secure.

---

## Features

- **Authentication:** Register, login, activation, password reset, JWT-based access & refresh tokens.
- **User Management:** Profile info, password change, callback/calc requests.
- **Orders:** List and view detailed orders (integrated with Bitrix24 CRM).
- **Rate Limiting:** Redis-backed, per-endpoint.
- **Caching:** Bitrix24 API responses cached in Redis.
- **Database:** PostgreSQL (users), MongoDB (tokens, codes, logs).
- **File Uploads:** S3-compatible storage for calculation requests.
- **API Docs:** OpenAPI 3.1 (see `/docs` endpoint).
- **Production Ready:** Docker Compose, Nginx reverse proxy, HTTPS, CI/CD via GitHub Actions.

---

## Tech Stack

- **Node.js** (TypeScript)
- **Express.js**
- **Prisma** (PostgreSQL)
- **Mongoose** (MongoDB)
- **Redis** (rate limiting, caching)
- **Nginx** (reverse proxy, SSL)
- **AWS S3** (file uploads)
- **Bitrix24** (CRM integration)
- **OpenAPI** (API schema & validation)
- **Pino** (logging)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/maximshmelyov/client-dashboard-back.git
cd client-dashboard-back
```
### 2. Configure Environment
Copy and edit .env.local.docker (for Docker) or create your own .env.local for local development.
See .env.example (if available) for required variables.
Main variables:

- DATABASE_URL (PostgreSQL)
- MONGO_URI (MongoDB)
- REDIS_URL, REDIS_SECRET
- ACCESS_SECRET, REFRESH_SECRET
- S3_* (for file uploads)
- BITRIX_* (for CRM integration)
### 3. Run with Docker Compose
```bash
docker compose up --build
```

- Backend: http://localhost:4000
- Nginx proxy: http://localhost (HTTP/HTTPS)
- API docs: http://localhost/docs
### 4. Local Development
Install dependencies and run in watch mode:
```bash
npm ci
npm run dev
```

## API Documentation

- OpenAPI 3.1 spec: openapi/v1/schema.yaml
- Live docs: GET /docs (returns JSON spec)
- Use Swagger UI or Redoc to visualize.

## Project Structure
```
├── src/
│   ├── routes/           # Express routers (auth, users, orders)
│   ├── middleware/       # Auth, rate limiting, error handling, etc.
│   ├── services/         # Business logic (auth, Bitrix, S3, etc.)
│   ├── repositories/     # MongoDB models for tokens/codes
│   ├── utils/            # Helpers, logging, converters
│   ├── lib/              # Redis, caching, etc.
│   └── types/            # OpenAPI-generated types
├── prisma/               # Prisma schema
├── openapi/              # OpenAPI YAML schema
├── nginx/                # Nginx configs
├── docker-compose.yml    # Docker Compose setup
├── Dockerfile            # Multi-stage build
└── ...
```

## Deployment
### CI/CD

- GitHub Actions workflow: .github/workflows/deploy.yml
- On push to vpsdeploy branch:

  - Build & push Docker image to GHCR
  - SSH to VPS, update code, pull image, restart backend via Docker Compose

### Nginx

- Serves as reverse proxy (HTTP/HTTPS)
- See nginx/nginx.conf
- SSL via Let's Encrypt (certs expected at /etc/letsencrypt)

## Useful Scripts

- npm run build — Compile TypeScript
- npm run dev — Start in development mode
- npm run lint — Lint code
- npm run format — Format code with Prettier
- npm run generate:types — Generate TypeScript types from OpenAPI spec
- npm run generate:clientapi — Generate API client for frontend

## License
MIT (see LICENSE)

## Author
Maxim Shmelyov (Maksym Shmelov)

## Contributing
Pull requests and issues welcome!