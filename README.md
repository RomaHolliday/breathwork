# Breathwork

Daily breathing exercise tracker. Syncs across devices via Supabase.

## Setup

### 1. Supabase — create the table

In your Supabase project, go to **SQL Editor** and run:

```sql
create table breathwork_logs (
  id bigint generated always as identity primary key,
  date date not null unique,
  short_count integer not null default 0,
  long_done boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 2. GitHub — push this repo

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/breathwork.git
git push -u origin main
```

### 3. Railway — deploy

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your `breathwork` repo
3. Go to **Variables** and add:
   - `SUPABASE_URL` — from Supabase: Settings → API → Project URL
   - `SUPABASE_ANON_KEY` — from Supabase: Settings → API → anon/public key
4. Railway will auto-deploy. Your URL will be something like `https://breathwork-production.up.railway.app`

That's it — open the URL on any device and your data syncs automatically.
