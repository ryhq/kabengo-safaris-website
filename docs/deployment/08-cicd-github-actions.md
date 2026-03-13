# 08 — CI/CD with GitHub Actions

Automate the Spring Boot backend build and deployment using GitHub Actions. Every push to `main` automatically builds the JAR and deploys it to the Droplet.

---

## How It Works

```
Developer pushes to main
        ↓
GitHub Actions triggers
        ↓
1. Checkout code
2. Set up Java 21
3. Build JAR with Maven
        ↓
4. SCP JAR to Droplet
        ↓
5. SSH into Droplet:
   - Rename JAR → app.jar
   - Restart systemd service
   - Verify service is active
```

---

## 1. Generate a Deploy SSH Key

On your local machine, create a dedicated key pair for GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_ryhqtech
```

- Press Enter for no passphrase (required for automated deployment)
- This creates `~/.ssh/deploy_ryhqtech` (private) and `~/.ssh/deploy_ryhqtech.pub` (public)

### Copy the Public Key to the Droplet

```bash
ssh-copy-id -i ~/.ssh/deploy_ryhqtech.pub root@164.92.191.175
```

Or manually:

```bash
cat ~/.ssh/deploy_ryhqtech.pub | ssh root@164.92.191.175 "cat >> ~/.ssh/authorized_keys"
```

### Verify SSH Access

```bash
ssh -i ~/.ssh/deploy_ryhqtech root@164.92.191.175 "echo 'SSH key works'"
```

---

## 2. Add GitHub Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these three secrets:

| Secret Name | Value |
|-------------|-------|
| `DROPLET_HOST` | `164.92.191.175` |
| `DROPLET_SSH_KEY` | Contents of `~/.ssh/deploy_ryhqtech` (the **private** key) |

To get the private key:

```bash
cat ~/.ssh/deploy_ryhqtech
```

Copy the **entire** output including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

---

## 3. Create the Workflow File

Create `.github/workflows/deploy.yml` in your Spring Boot project:

```yaml
name: Build & Deploy to Droplet

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Java 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: maven

      - name: Build JAR
        run: ./mvnw clean package -DskipTests

      - name: Deploy to Droplet
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: root
          key: ${{ secrets.DROPLET_SSH_KEY }}
          source: target/kabengosafaris-0.0.1-SNAPSHOT.jar
          target: /opt/kabengosafaris/
          strip_components: 1

      - name: Rename JAR and restart service
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: root
          key: ${{ secrets.DROPLET_SSH_KEY }}
          script: |
            mv /opt/kabengosafaris/kabengosafaris-0.0.1-SNAPSHOT.jar /opt/kabengosafaris/app.jar
            systemctl restart kabengosafaris
            sleep 5
            systemctl is-active kabengosafaris
```

### Workflow Breakdown

| Step | Action | Purpose |
|------|--------|---------|
| Checkout | `actions/checkout@v4` | Clone the repo |
| Java Setup | `actions/setup-java@v4` | Install Temurin JDK 21 with Maven caching |
| Build | `./mvnw clean package -DskipTests` | Compile and package the JAR |
| Deploy (SCP) | `appleboy/scp-action@v0.1.7` | Upload JAR to `/opt/kabengosafaris/` |
| Restart (SSH) | `appleboy/ssh-action@v1.0.3` | Rename JAR, restart service, verify health |

### Key Details

- **`cache: maven`**: Caches `~/.m2/repository` between runs, speeding up builds significantly
- **`strip_components: 1`**: Strips the `target/` prefix so the JAR lands directly in `/opt/kabengosafaris/`
- **`-DskipTests`**: Skips tests during CI build (add a separate test job if needed)
- **`sleep 5`**: Gives Spring Boot time to start before the health check
- **`systemctl is-active`**: Final health check — fails the workflow if the service didn't start

---

## 4. Commit and Push

```bash
cd ~/Documents/SPRING\ BOOT\ PROJECTS/kabengosafaris
git add .github/workflows/deploy.yml
git commit -m "Add CI/CD deploy workflow"
git push origin main
```

This push triggers the first automated deployment.

---

## 5. Monitor the Deployment

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Click the running workflow to see real-time logs
4. Green checkmark = success, red X = failure

---

## Deployment Flow After Setup

```
1. Make code changes locally
2. git add, commit, push to main
3. GitHub Actions automatically:
   a. Builds the JAR (~2-3 min with cache)
   b. Uploads to Droplet (~30s-2min depending on JAR size)
   c. Restarts the service (~15s)
4. API is live with new changes
```

Total deployment time: **~3-5 minutes** from push to live.

---

## Troubleshooting

### Workflow succeeds but service is not responding

The GitHub Actions workflow may show green (success) but the application isn't accessible. This can happen because the service takes time to start or crashed after deployment.

**Step 1: Check if the service is running**

```bash
ssh -i ~/.ssh/deploy_ryhqtech root@164.92.191.175 "systemctl status kabengosafaris"
```

This shows:
- `Active: active (running)` — service is up, check logs for errors
- `Active: failed` — service crashed, check logs for the cause
- `Active: activating (auto-restart)` — service is crash-looping

**Step 2: Check recent logs for errors**

```bash
ssh -i ~/.ssh/deploy_ryhqtech root@164.92.191.175 "journalctl -u kabengosafaris --since '5 minutes ago' | grep -E 'Started|ERROR|Exception|port|Tomcat' | tail -10"
```

This filters for the most relevant log lines:
- `Started` — confirms the application finished starting (Spring Boot startup takes ~60-120 seconds on the 1GB Droplet)
- `ERROR` / `Exception` — application errors after startup
- `port` / `Tomcat` — port binding issues

**Step 3: View full recent logs (if filtered output isn't enough)**

```bash
ssh -i ~/.ssh/deploy_ryhqtech root@164.92.191.175 "journalctl -u kabengosafaris --since '10 minutes ago' --no-pager"
```

**Common scenarios:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Started KabengosafarisApplication in X seconds` but API returns 401 | JWT tokens invalidated after restart | Log out and log back in to get a fresh token |
| `Active: failed` with `OutOfMemoryError` | 1GB Droplet running low on RAM | Check memory: `free -h`, consider reducing `-Xmx` or adding swap |
| `Address already in use: bind` | Port 4450 still held by old process | `kill $(lsof -t -i:4450)` then `systemctl start kabengosafaris` |
| `Communications link failure` | MySQL not running or wrong credentials | `systemctl status mysql`, check `application.properties` |
| No `Started` line after 3+ minutes | Application stuck during startup | Check full logs for the blocking initializer |

**Step 4: Restart the service manually (if needed)**

```bash
ssh -i ~/.ssh/deploy_ryhqtech root@164.92.191.175 "systemctl restart kabengosafaris && sleep 5 && systemctl is-active kabengosafaris"
```

### Workflow fails at SCP step

- Verify the `DROPLET_SSH_KEY` secret contains the **full private key** (including header/footer lines)
- Verify the public key is in the Droplet's `~/.ssh/authorized_keys`
- Test SSH locally: `ssh -i ~/.ssh/deploy_ryhqtech root@164.92.191.175`

### Workflow fails at "systemctl is-active"

The JAR uploaded but the service crashed on restart:

```bash
# SSH into Droplet and check logs
ssh -i ~/.ssh/deploy_ryhqtech root@164.92.191.175 "journalctl -u kabengosafaris --since '5 minutes ago'"
```

Common causes:
- Database connection failure (wrong password, MySQL not running)
- Port 4450 already in use
- Missing environment variables in the systemd service file

### Build fails

- Check that `./mvnw` has execute permissions: `git update-index --chmod=+x mvnw`
- Ensure `pom.xml` is valid and dependencies resolve

### Adding a Test Step

To run tests before deploying, add a step before the build:

```yaml
      - name: Run tests
        run: ./mvnw test
```

Or create a separate job that must pass before the deploy job runs:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: maven
      - run: ./mvnw test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      # ... deploy steps
```

---

## Security Notes

- The SSH private key is stored as a GitHub Secret (encrypted at rest, never exposed in logs)
- Use a **dedicated deploy key** — not your personal SSH key
- The deploy key should only be authorized on the Droplet, not on other servers
- Consider restricting the deploy key to specific commands using `command=` in `authorized_keys` for extra security
