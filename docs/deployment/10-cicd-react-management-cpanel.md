# 10 — CI/CD: React Management App to cPanel

Automate the React (Vite) management dashboard build and deployment to cPanel using GitHub Actions. Every push to `main` automatically builds the SPA and deploys it via SSH.

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
5. Build Vite SPA → dist/
        ↓
6. Add .htaccess for SPA routing
7. Create tar.gz archive
        ↓
8. SCP archive to cPanel
        ↓
9. SSH into cPanel:
   - Extract archive
   - Clean up
```

---

## 1. SSH Key Setup

Uses the **same cPanel SSH key** as the Next.js website deployment (see [09-cicd-nextjs-cpanel.md](09-cicd-nextjs-cpanel.md#1-generate-ssh-key-on-cpanel)).

If you already set up the key for the Next.js workflow, skip to step 2.

---

## 2. Add GitHub Repository Secrets

Go to `ryhq/kabengo-safaris-management` → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `CPANEL_HOST` | `kabengosafaris.com` |
| `CPANEL_USERNAME` | `kabengosafaris` |
| `CPANEL_SSH_KEY` | Full private key content (same key as Next.js repo) |
| `CPANEL_SSH_KEY_PASSPHRASE` | The passphrase set during key generation |
| `CPANEL_PORT` | `22` |
| `CPANEL_REACT_APP_PATH` | `/home/kabengosafaris/management.kabengosafaris.com` |
| `VITE_API_BASE_URL` | `https://api.kabengosafaris.ryhqtech.com/api` |

---

## 3. Workflow File

**Repository:** `ryhq/kabengo-safaris-management`
**Location:** `.github/workflows/deploy.yml`

```yaml
name: Build & Deploy React SPA to cPanel

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

      - name: Build Vite SPA
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
        run: npm run build

      - name: Add SPA fallback .htaccess
        run: |
          cat > dist/.htaccess << 'HTACCESS'
          <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteBase /
            RewriteRule ^index\.html$ - [L]
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule . /index.html [L]
          </IfModule>
          HTACCESS

      - name: Create deployment archive
        run: |
          cd dist
          tar -czf ../deploy.tar.gz .

      - name: Deploy to cPanel via SSH
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USERNAME }}
          key: ${{ secrets.CPANEL_SSH_KEY }}
          passphrase: ${{ secrets.CPANEL_SSH_KEY_PASSPHRASE }}
          port: ${{ secrets.CPANEL_PORT }}
          source: "deploy.tar.gz"
          target: ${{ secrets.CPANEL_REACT_APP_PATH }}

      - name: Extract on cPanel
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.CPANEL_HOST }}
          username: ${{ secrets.CPANEL_USERNAME }}
          key: ${{ secrets.CPANEL_SSH_KEY }}
          passphrase: ${{ secrets.CPANEL_SSH_KEY_PASSPHRASE }}
          port: ${{ secrets.CPANEL_PORT }}
          script: |
            cd ${{ secrets.CPANEL_REACT_APP_PATH }}
            tar -xzf deploy.tar.gz
            rm -f deploy.tar.gz
            echo "Deployment complete - React SPA updated"
```

### Workflow Breakdown

| Step | Action | Purpose |
|------|--------|---------|
| Checkout | `actions/checkout@v4` | Clone the repo |
| Node.js Setup | `actions/setup-node@v4` | Install Node.js 22 with npm caching |
| Install | `npm install` | Install dependencies |
| Lint | `npm run lint \|\| true` | Run ESLint (non-blocking) |
| Build | `npm run build` | Build Vite production bundle → `dist/` |
| .htaccess | `cat > dist/.htaccess` | Add Apache rewrite rules for SPA client-side routing |
| Archive | `tar -czf` | Create compressed deployment archive |
| Deploy (SCP) | `appleboy/scp-action@v0.1.7` | Upload archive to cPanel |
| Extract (SSH) | `appleboy/ssh-action@v1.2.0` | Extract and clean up |

### Key Details

- **`.htaccess` for SPA routing**: Ensures all routes (e.g., `/dashboard`, `/settings`) are handled by `index.html` instead of returning 404
- **No restart needed**: Unlike Next.js (which runs a Node.js server), this is a static SPA served directly by Apache
- **`VITE_API_BASE_URL`**: Baked into the build at compile time via `import.meta.env.VITE_API_BASE_URL`
- **Lint is non-blocking**: `|| true` ensures lint warnings don't prevent deployment

---

## 4. Deployment Flow

```
1. Make code changes locally
2. git add, commit, push to main
3. GitHub Actions automatically:
   a. Installs dependencies (~10s with cache)
   b. Builds Vite SPA (~15-30s)
   c. Uploads to cPanel (~10s)
   d. Extracts files (~5s)
4. Dashboard is live with new changes
```

Total deployment time: **~2 minutes** from push to live.

---

## 5. cPanel Directory Structure

After deployment, the app directory on cPanel looks like:

```
/home/kabengosafaris/management.kabengosafaris.com/
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
├── .htaccess          ← SPA routing rules
├── index.html         ← Entry point
├── vite.svg
└── ... (other static assets)
```

---

## 6. Differences from Next.js Deployment

| Aspect | Next.js Website | React Management |
|--------|----------------|-----------------|
| Build output | Standalone (Node.js server) | Static files (SPA) |
| Runtime | Passenger (Node.js) | Apache (static) |
| Restart required | Yes (`touch tmp/restart.txt`) | No |
| Routing | Server-side + client-side | Client-side only (`.htaccess`) |
| Build time | ~60-90s | ~15-30s |
| Env var prefix | `NEXT_PUBLIC_` | `VITE_` |

---

## Troubleshooting

### 404 on page refresh

The `.htaccess` file is missing or not being applied:
- Check that `mod_rewrite` is enabled on the cPanel server
- Verify `.htaccess` exists in the app root after deployment
- Check if there's a parent `.htaccess` that overrides the rules

### SSH connection fails

Same troubleshooting as [Next.js deployment](09-cicd-nextjs-cpanel.md#troubleshooting).

### API requests fail (CORS)

The Spring Boot backend must allow the management app's origin:
```java
corsConfiguration.setAllowedOrigins(List.of(
    "https://management.kabengosafaris.com",
    "http://localhost:3000"
));
```

### Build fails with dependency errors

- Run `npm install` locally and commit the updated `package-lock.json`
- Ensure the lock file is in sync with `package.json`

---

## Security Notes

- The management dashboard should be behind authentication (it manages backend data)
- The same SSH key is used for both Next.js and React deployments to the same cPanel server
- `VITE_API_BASE_URL` is not sensitive (it's embedded in the JavaScript bundle)
