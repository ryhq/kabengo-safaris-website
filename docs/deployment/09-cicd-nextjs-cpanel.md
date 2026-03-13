# 09 — CI/CD: Next.js Website to cPanel

Automate the Next.js website build and deployment to cPanel using GitHub Actions. Every push to `main` automatically builds the standalone output and deploys it via SSH.

---

## How It Works

```
Developer pushes to main
        ↓
GitHub Actions triggers
        ↓
1. Checkout code
2. Set up Node.js 22
3. npm install
4. Lint (non-blocking)
5. Build standalone output
        ↓
6. Copy static assets + public folder
7. Create tar.gz archive
        ↓
8. SCP archive to cPanel
        ↓
9. SSH into cPanel:
   - Extract archive
   - Clean up
   - touch tmp/restart.txt (Passenger restart)
```

---

## 1. Generate SSH Key on cPanel

cPanel requires a passphrase-protected key:

1. Log into **cPanel** → **Security** → **SSH Access** → **Manage SSH Keys**
2. Click **"Generate a New Key"**
3. Fill in:
   - **Key Name:** `management_kabengo_safaris_github_actions` (or any name)
   - **Key Password:** Use the Password Generator (must meet strength requirements)
   - **Key Type:** RSA
   - **Key Size:** 4096
4. Click **"Generate Key"**
5. **Authorize** the public key (click "Manage" → "Authorize")
6. **Download** the private key (View/Download under Private Keys)

> **Important:** Save the passphrase — you'll need it for the GitHub Secret.

---

## 2. Add GitHub Repository Secrets

Go to `ryhq/kabengo-safaris-website` → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `CPANEL_HOST` | `kabengosafaris.com` |
| `CPANEL_USERNAME` | `kabengosafaris` |
| `CPANEL_SSH_KEY` | Full private key content (including `-----BEGIN/END OPENSSH PRIVATE KEY-----`) |
| `CPANEL_SSH_KEY_PASSPHRASE` | The passphrase set during key generation |
| `CPANEL_PORT` | `22` |
| `CPANEL_NEXTJS_APP_PATH` | `/home/kabengosafaris/kabengosafaris_app` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.kabengosafaris.ryhqtech.com/api` |

---

## 3. Workflow File

**Location:** `.github/workflows/deploy.yml`

```yaml
name: Build & Deploy Next.js to cPanel

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Lint
        run: npm run lint || true

      - name: Build Next.js (standalone)
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.NEXT_PUBLIC_API_BASE_URL }}
        run: npm run build

      - name: Prepare standalone package
        run: |
          cp -r .next/static .next/standalone/.next/static
          cp -r public .next/standalone/public

      - name: Create deployment archive
        run: |
          cd .next/standalone
          tar -czf ../../deploy.tar.gz .

      - name: Deploy to cPanel via SSH
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USERNAME }}
          key: ${{ secrets.CPANEL_SSH_KEY }}
          passphrase: ${{ secrets.CPANEL_SSH_KEY_PASSPHRASE }}
          port: ${{ secrets.CPANEL_PORT }}
          source: "deploy.tar.gz"
          target: ${{ secrets.CPANEL_NEXTJS_APP_PATH }}

      - name: Extract and restart on cPanel
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USERNAME }}
          key: ${{ secrets.CPANEL_SSH_KEY }}
          passphrase: ${{ secrets.CPANEL_SSH_KEY_PASSPHRASE }}
          port: ${{ secrets.CPANEL_PORT }}
          script: |
            cd ${{ secrets.CPANEL_NEXTJS_APP_PATH }}
            tar -xzf deploy.tar.gz
            rm -f deploy.tar.gz
            mkdir -p tmp
            touch tmp/restart.txt
            echo "Deployment complete - Next.js app restarted"
```

### Workflow Breakdown

| Step | Action | Purpose |
|------|--------|---------|
| Checkout | `actions/checkout@v4` | Clone the repo |
| Node.js Setup | `actions/setup-node@v4` | Install Node.js 22 with npm caching |
| Install | `npm install` | Install dependencies |
| Lint | `npm run lint \|\| true` | Run ESLint (non-blocking) |
| Build | `npm run build` | Build Next.js standalone output |
| Prepare | `cp -r` | Copy static assets and public folder into standalone |
| Archive | `tar -czf` | Create compressed deployment archive |
| Deploy (SCP) | `appleboy/scp-action@v0.1.7` | Upload archive to cPanel |
| Restart (SSH) | `appleboy/ssh-action@v1.2.0` | Extract, clean up, restart Passenger |

### Key Details

- **`npm install` vs `npm ci`**: Using `npm install` for compatibility across Node versions (avoids lock file sync issues)
- **`NEXT_PUBLIC_API_BASE_URL`**: Baked into the build at compile time — changing it requires a rebuild
- **`touch tmp/restart.txt`**: Tells Phusion Passenger to restart the Node.js application
- **Lint is non-blocking**: `|| true` ensures lint warnings don't prevent deployment
- **Standalone output**: `.next/standalone/` contains a minimal, self-contained build with only necessary node_modules

---

## 4. Deployment Flow

```
1. Make code changes locally
2. git add, commit, push to main
3. GitHub Actions automatically:
   a. Installs dependencies (~10s with cache)
   b. Builds Next.js (~60-90s)
   c. Uploads to cPanel (~30s)
   d. Restarts Passenger (~5s)
4. Website is live with new changes
```

Total deployment time: **~3 minutes** from push to live.

---

## 5. cPanel Directory Structure

After deployment, the app directory on cPanel looks like:

```
/home/kabengosafaris/kabengosafaris_app/
├── .next/
│   ├── server/
│   └── static/
├── node_modules/
├── public/
├── tmp/
│   └── restart.txt
├── package.json
└── server.js          ← Passenger startup file
```

---

## Troubleshooting

### SSH connection fails

- Verify the SSH key is **authorized** in cPanel → SSH Access → Manage SSH Keys
- Verify `CPANEL_SSH_KEY_PASSPHRASE` matches the passphrase set during key generation
- Check if your hosting provider allows SSH access (some shared hosts restrict port 22)
- Verify `CPANEL_PORT` — some hosts use non-standard ports

### Build fails with dependency errors

- Check that `package-lock.json` is committed and up to date
- Try running `npm install` locally and committing the updated lock file

### Site shows old content after deploy

- Passenger may cache the old process. SSH in and run:
  ```bash
  cd /home/kabengosafaris/kabengosafaris_app
  touch tmp/restart.txt
  ```
- Hard refresh the browser (Ctrl+Shift+R)

### Environment variables not taking effect

- `NEXT_PUBLIC_*` variables are embedded at **build time**, not runtime
- Changing the API URL requires updating the `NEXT_PUBLIC_API_BASE_URL` secret and re-running the workflow
- Non-prefixed env vars are read at runtime from cPanel's Node.js App environment settings

---

## Security Notes

- The SSH private key is stored as a GitHub Secret (encrypted at rest, never exposed in logs)
- The passphrase adds an extra layer of protection for the SSH key
- The same cPanel SSH key can be shared across repos deploying to the same server
- `NEXT_PUBLIC_API_BASE_URL` is not sensitive (it's visible in the browser anyway)
