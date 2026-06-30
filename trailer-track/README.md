# 🚛 Trailer Track

Production floor tracker for trailer manufacturing. Scan VINs at each station to track progress across your entire facility in real time.

---

## Step 1 — Set up the Supabase database

1. Go to [supabase.com](https://supabase.com) and open your project
2. Click **SQL Editor** in the left sidebar
3. Paste and run this SQL:

```sql
create table trailers (
  vin text primary key,
  type text,
  notes text,
  current_station text,
  created_at timestamptz default now()
);

create table trailer_history (
  id uuid default gen_random_uuid() primary key,
  vin text references trailers(vin) on delete cascade,
  station text,
  timestamp timestamptz default now()
);

alter table trailers enable row level security;
alter table trailer_history enable row level security;

create policy "allow all" on trailers for all using (true) with check (true);
create policy "allow all" on trailer_history for all using (true) with check (true);
```

---

## Step 2 — Deploy to Vercel

### Option A: Deploy via GitHub (recommended)

1. Create a free account at [github.com](https://github.com)
2. Create a new repository called `trailer-track`
3. Upload all these files to the repository
4. Go to [vercel.com](https://vercel.com) → **Add New Project**
5. Import your GitHub repository
6. Click **Deploy** — Vercel auto-detects Vite, no config needed
7. Your app is live at `https://trailer-track.vercel.app` (or similar)

### Option B: Deploy via Vercel CLI

```bash
npm install -g vercel
npm install
vercel
```

---

## Step 3 — Share with your team

- Send the Vercel URL to everyone on the production floor
- Works on any phone, tablet, or PC — no app install needed
- Dashboard auto-refreshes every 8 seconds across all locations

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project structure

```
trailer-track/
├── index.html          # HTML entry point
├── package.json        # Dependencies
├── vite.config.js      # Vite config
├── vercel.json         # Vercel deployment config
└── src/
    ├── main.jsx        # React entry point
    └── App.jsx         # Main application
```
