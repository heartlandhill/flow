# ENV.md — Flow GTD Environment & Infrastructure

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16
- A running ntfy instance (self-hosted or ntfy.sh)

## Environment Variables

Create a `.env` file in the project root. Never commit this file.

### Required

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/flow_gtd?schema=public"

# Auth
SESSION_SECRET="generate-a-random-64-char-hex-string"

# App URL (used for notification callback URLs)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Notifications (required for reminders to work)

```env
# ntfy
NTFY_BASE_URL="https://ntfy.sh"
NTFY_TOPIC_PREFIX="flow-your-random-prefix"

# Web Push (generate with: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"

# Internal API auth (for pg-boss worker → /api/notify)
INTERNAL_API_SECRET="generate-a-random-32-char-hex-string"
```

### Optional

```env
# Override default port
PORT=3000

# Prisma logging
PRISMA_LOG_LEVEL="warn"

# pg-boss monitoring (set to true for debug output)
PGBOSS_DEBUG="false"
```

## .env.example

Ship this in the repo (no secrets):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/flow_gtd?schema=public"
SESSION_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NTFY_BASE_URL="https://ntfy.sh"
NTFY_TOPIC_PREFIX=""
NEXT_PUBLIC_VAPID_KEY=""
VAPID_PRIVATE_KEY=""
INTERNAL_API_SECRET=""
```

## Local Development Setup

### 1. Clone and install

```bash
git clone <repo>
cd flow
pnpm install
```

### 2. Start PostgreSQL

If using Docker:

```bash
docker run -d \
  --name flow-postgres \
  -e POSTGRES_USER=flow \
  -e POSTGRES_PASSWORD=flow \
  -e POSTGRES_DB=flow_gtd \
  -p 5432:5432 \
  postgres:16
```

Set `DATABASE_URL="postgresql://flow:flow@localhost:5432/flow_gtd?schema=public"` in `.env`.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values

# Generate secrets
openssl rand -hex 32  # For SESSION_SECRET
openssl rand -hex 16  # For INTERNAL_API_SECRET

# Generate VAPID keys
npx web-push generate-vapid-keys
# Copy the public and private keys into .env
```

### 4. Initialize database

```bash
pnpm db:migrate    # Run Prisma migrations
pnpm db:seed       # Seed with sample data
```

### 5. Start dev server

```bash
pnpm dev
```

App runs at `http://localhost:3000`.

### 6. (Optional) ntfy setup for local testing

For local testing, you can use the public ntfy.sh instance:

1. Set `NTFY_BASE_URL="https://ntfy.sh"` in `.env`.
2. Set `NTFY_TOPIC_PREFIX="flow-local-test-$(openssl rand -hex 4)"`.
3. Install ntfy app on your phone and subscribe to `{prefix}-reminders`.

For self-hosted:

```bash
docker run -d \
  --name flow-ntfy \
  -p 8080:80 \
  binwiederhier/ntfy serve
```

Set `NTFY_BASE_URL="http://localhost:8080"`.

## Package Scripts

Defined in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "postinstall": "prisma generate"
  }
}
```

## Production Deployment

### Build

```bash
pnpm build
pnpm start
```

### Database

- Use managed PostgreSQL (e.g., Supabase, Neon, RDS, or your own).
- Run `pnpm db:migrate` targeting the production DATABASE_URL.
- Never use `db:push` in production.

### ntfy

- Self-host ntfy for privacy. Run behind your reverse proxy with HTTPS.
- Set `NTFY_BASE_URL` to your self-hosted URL.

### Web Push

- VAPID keys must stay consistent across deployments. Changing them invalidates all existing subscriptions.
- Store them in your secrets manager, not in the repo.

### pg-boss

- pg-boss runs in-process with the Next.js server. No separate worker process needed for SLC.
- In production with multiple server instances, only one should run pg-boss. Use an environment flag:

```env
PGBOSS_ENABLED="true"  # Only set on one instance
```

### HTTPS

Required for:
- Web Push API (service workers require secure context).
- ntfy callback URLs (snooze buttons POST back to your server).

### Recommended Infrastructure

The user has infrastructure in place. This app needs:
- One server running Next.js (Node.js)
- One PostgreSQL database
- One ntfy instance (can share the server)
- A reverse proxy with HTTPS (e.g., Caddy, nginx)

## Dependencies

### Runtime

```
next
react
react-dom
@prisma/client
pg-boss
web-push
bcryptjs
```

### Dev

```
typescript
@types/react
@types/node
@types/bcryptjs
prisma
tailwindcss
postcss
autoprefixer
eslint
eslint-config-next
```

## Gitignore

```
node_modules/
.next/
.env
*.env.local
prisma/migrations/migration_lock.toml
```
