# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Fill in:
   - **Name:** girgit
   - **Database password:** (save this — you'll need it)
   - **Region:** pick closest to your Fly.io region (`iad` = US East)
4. Click **Create new project** and wait ~2 minutes

## Step 2: Get Your Connection String

1. In your Supabase project, go to **Project Settings** (gear icon) → **Database**
2. Scroll to **Connection string** → select **URI** tab
3. Copy the string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the password you set in Step 1

## Step 3: Set Secret on Fly.io

```bash
fly secrets set DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
fly secrets set SESSION_SECRET=$(openssl rand -base64 32)
```

> Tables are created **automatically** on first server start — no manual SQL needed.

## Step 4: Deploy

```bash
cd server
fly deploy
```

## Step 5: Verify

```bash
fly logs
```

You should see:
```
Database schema initialized
🎮 Girgit Game Server v1.0.0
💾 Database: PostgreSQL (Supabase)
```

## Local Development

Create `server/.env`:
```
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
SESSION_SECRET=any-local-secret
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:5173
```

Then:
```bash
cd server && npm run dev
```

## Viewing Data in Supabase

Go to your Supabase project → **Table Editor** to see:
- `active_games` — live game states
- `game_history` — completed games
- `game_players` — per-game player scores
- `game_rounds` — round details
- `player_scores` — cumulative leaderboard
- `session` — express sessions (auto-created by connect-pg-simple)
