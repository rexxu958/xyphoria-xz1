# XYPHORIA

Tools, code and innovation — a self-hosted platform with a **local JSON file
database** (no GitHub, no external DB required) and a 3D model viewer on the
homepage.

## Architecture

- **Framework**: Next.js 16 (App Router, TypeScript, Tailwind)
- **Database**: flat JSON files under `data/`, created automatically on first run
- **File storage**: `data/files/{tools,images,projects,other}/`, UUID filenames on disk
- **Auth**: single owner account, bcrypt password hash + JWT session cookie
- **3D viewer**: `@react-three/fiber` + `@react-three/drei`, renders `public/models/model.glb`

See `data/` layout, `src/lib/db/`, `src/lib/storage/` for the abstraction
layers (`DatabaseProvider`, `StorageProvider`) that let you swap in
Postgres/SQLite or S3 later without rewriting the app.

## 1. Local setup

```bash
npm install
cp .env.example .env.local
```

Generate the two secrets you need:

```bash
# Owner password hash (bcrypt) — paste the result into OWNER_PASSWORD_HASH
node scripts/hash-password.js "your-strong-password"

# Session signing secret — paste the result into SESSION_SECRET
node scripts/gen-secret.js
```

Edit `.env.local`:

```env
OWNER_USERNAME=admin
OWNER_PASSWORD_HASH=$2b$12$...          # from hash-password.js, NOT plaintext
SESSION_SECRET=<64+ char random hex>     # from gen-secret.js
NEXT_PUBLIC_SITE_URL=https://xyphoria.nusantaracloud.web.id
DATA_DIRECTORY=./data
MAX_UPLOAD_SIZE=209715200                # 200MB, adjust as needed
```

The owner account is auto-seeded from `OWNER_USERNAME`/`OWNER_PASSWORD_HASH`
into `data/users.json` the first time anyone logs in — you never hand-edit
that file.

```bash
npm run dev
```

Visit `http://localhost:3000`, log in at `/login`, and use the dashboard at
`/dashboard`.

## 2. What's already verified working

Tested end-to-end in development before hand-off:

- `data/` and every JSON file (`tools.json`, `categories.json`, `users.json`,
  `statistics.json`, `settings.json`, `activity.json`) auto-create with valid
  defaults on first boot — including under **concurrent** first requests
  (fixed a race condition in the atomic-write init logic).
- Owner login (correct/incorrect password), session cookie, protected
  `/dashboard` and `/api/admin/*` routes (redirect / 401 when logged out).
- Category create → tool upload (multipart, real file) → tool appears on the
  public homepage and `/api/tools` → download via `/api/download/:slug`
  streams the exact original file (MD5 verified) and increments the download
  counter in both `statistics.json` and the tool's own metadata.
- Path traversal attempts on the download endpoint return 404 and never
  touch the filesystem outside `data/files/`.
- Manual backup creation, listing, and restore.
- Production build (`npm run build`) completes cleanly.

**Known limitation to be aware of:** backups snapshot the six JSON files
only, not the uploaded file blobs in `data/files/`. If you restore a backup
after deleting a tool's file, the tool's metadata comes back but the file
itself is gone (download correctly returns a clean 404 instead of crashing —
this was tested). If you need full backups, also snapshot `data/files/`
alongside the JSON backup, e.g. `tar -czf files-backup.tar.gz data/files`.

## 3. Deploying to your VPS

You already have the subdomain pointed at `139.59.97.124`
(`xyphoria.nusantaracloud.web.id`). These steps run **on the VPS itself** —
SSH in first.

### 3.1 Get the code onto the VPS

Pick one:

```bash
# Option A: scp the zip from your machine
scp xyphoria.zip user@139.59.97.124:/var/www/
ssh user@139.59.97.124
cd /var/www && unzip xyphoria.zip && cd xyphoria

# Option B: push this project to a private git repo, then on the VPS:
git clone <your-repo-url> /var/www/xyphoria
cd /var/www/xyphoria
```

### 3.2 Install Node.js (if not already present)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node -v   # confirm v20+
```

### 3.3 Install dependencies and configure environment

```bash
npm install
cp .env.example .env.local
node scripts/hash-password.js "your-strong-production-password"   # -> OWNER_PASSWORD_HASH
node scripts/gen-secret.js                                        # -> SESSION_SECRET
nano .env.local   # fill in the values, set NODE_ENV=production
```

Also set, either in `.env.local` or your process manager's env:

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://xyphoria.nusantaracloud.web.id
```

### 3.4 Build and run persistently

```bash
npm run build

# Install PM2 once, globally:
sudo npm install -g pm2

pm2 start npm --name xyphoria -- start -- -p 3000
pm2 save
pm2 startup   # follow the printed instructions to survive reboots
```

### 3.5 Nginx reverse proxy for the subdomain

```nginx
# /etc/nginx/sites-available/xyphoria.nusantaracloud.web.id
server {
    listen 80;
    server_name xyphoria.nusantaracloud.web.id;

    client_max_body_size 200M;   # match MAX_UPLOAD_SIZE

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/xyphoria.nusantaracloud.web.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# HTTPS (recommended, free):
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d xyphoria.nusantaracloud.web.id
```

### 3.6 Persistence warning (read this)

`data/` lives on the VPS's local disk. This is **fine on a normal VPS**
(persistent disk, like your Digital Ocean droplet at `139.59.97.124`
appears to be) but would **not** be fine on an ephemeral-filesystem platform
(some container/serverless hosts wipe local disk on every redeploy). Since
you're on a VPS with a persistent disk, you're fine — just make sure:

- You don't `rm -rf` or redeploy in a way that wipes `/var/www/xyphoria/data`
- You take regular backups (dashboard → Backup, plus periodically archive
  `data/files/` — see the known limitation above)
- Ideally, back up `data/` off-box too (e.g. a nightly `rsync`/`tar` to
  another machine or object storage), since a single-disk VPS is still a
  single point of failure

### 3.7 Redeploying after code changes

```bash
cd /var/www/xyphoria
git pull                 # or re-upload + unzip
npm install
npm run build
pm2 restart xyphoria
```

`data/` is untouched by this process — your tools, categories, users, and
settings persist across redeploys as long as the `data/` directory itself
isn't deleted.

## 4. Project structure

```
src/
  lib/
    db/            # JsonFileDatabase, CollectionRepository, per-entity services
    storage/        # StorageProvider abstraction + LocalFileStorage
    auth/           # session.ts (pure JWT, used by middleware) + auth.ts (DB-aware)
    security/       # sanitize.ts, rateLimit.ts
    types.ts
  middleware.ts     # protects /dashboard and /api/admin/*
  app/
    page.tsx, tools/[slug]/page.tsx     # public site
    login/page.tsx
    dashboard/...                        # owner dashboard (12 pages)
    api/
      tools, categories, search, download/[slug]    # public API
      auth/login, auth/logout
      admin/...                                       # owner-only API
  components/
    ModelViewer.tsx  # 3D glTF viewer (react-three-fiber)
data/                # auto-created, gitignored — the actual database + files
public/models/model.glb
scripts/
  hash-password.js
  gen-secret.js
```

## 5. Security notes

- Never commit `.env.local` or `data/` (already gitignored).
- `MAX_UPLOAD_SIZE` in `.env.local` and `client_max_body_size` in Nginx
  should match.
- The owner account is a single account by design (per your spec). If you
  need multiple admin users later, extend `users.json` + the login route —
  the schema already supports a `role` field.
- Rate limiting is in-memory and per-process. If you ever run more than one
  Node process behind the load balancer, move it to Redis.
