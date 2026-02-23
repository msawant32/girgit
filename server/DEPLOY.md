# Deployment (Fly.io + Supabase)

## Environment Variables

Set these secrets on Fly.io:

```bash
fly secrets set DATABASE_URL="postgresql://postgres:[password]@[host].supabase.co:5432/postgres"
fly secrets set SESSION_SECRET=$(openssl rand -base64 32)
fly secrets set CLIENT_URL="https://your-app.netlify.app"
```

## Deploy

```bash
fly deploy
```

## Supabase Setup

See SUPABASE.md for full setup instructions.
