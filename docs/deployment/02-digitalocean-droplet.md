# 02 — DigitalOcean Droplet Setup

This guide covers creating and initially configuring the DigitalOcean Droplet that hosts the Spring Boot backend.

---

## Droplet Specifications

| Setting | Value |
|---------|-------|
| Image | Ubuntu 24.04 (LTS) x64 |
| Plan | Basic (Shared CPU) |
| RAM | 1 GB |
| vCPUs | 1 |
| Storage | 25 GB SSD |
| Region | Frankfurt (FRA1) |
| IP | `164.92.191.175` |

---

## Steps

### 1. Create the Droplet

1. Log into [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Click **Create** → **Droplets**
3. Choose:
   - **Region**: Frankfurt (or closest to your users)
   - **Image**: Ubuntu 24.04 (LTS) x64
   - **Size**: Basic → Regular → $6/mo (1 GB RAM, 1 vCPU, 25 GB SSD)
   - **Authentication**: SSH Key (recommended) or Password
4. Set hostname (e.g., `ryhqtech-backend`)
5. Click **Create Droplet**

### 2. First-Time SSH Access

```bash
ssh root@164.92.191.175
```

If using password authentication, enter the password from the Droplet creation or the email DigitalOcean sent.

### 3. Update the System

```bash
apt update && apt upgrade -y
```

### 4. Set the Timezone

```bash
timedatectl set-timezone Africa/Dar_es_Salaam
# Or your preferred timezone:
# timedatectl set-timezone Europe/Berlin
```

### 5. Enable the Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

> **Note**: Do NOT open port 4450 externally. The Spring Boot app runs on localhost:4450 and is accessed only through the Nginx reverse proxy.

### 6. (Optional) Create a Non-Root User

For better security, create a deploy user instead of using root:

```bash
adduser deploy
usermod -aG sudo deploy

# Copy SSH keys to new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Then SSH in as `deploy@164.92.191.175` going forward. The remaining guides in this series use `root` for simplicity.

---

## Directory Structure

The Droplet uses this directory layout for applications:

```
/opt/
├── kabengosafaris/          # Kabengo Safaris backend
│   ├── app.jar              # Spring Boot JAR
│   ├── data/                # Uploaded files (images, documents, etc.)
│   ├── logs/                # Application logs
│   └── backups/             # Database & file backups
├── nguserosdachurch/        # (Future) Nguseros Da Church backend
└── pocketledger/            # (Future) Pocket Ledger backend
```

Create the directory:

```bash
mkdir -p /opt/kabengosafaris
```

---

## Droplet Resource Notes

With 1 GB RAM, the Droplet can comfortably run:

- 1–2 Spring Boot apps (each with `-Xms256m -Xmx512m`)
- MySQL 8 server
- Nginx reverse proxy
- Certbot for SSL

If hosting 3+ backends, consider upgrading to 2 GB RAM ($12/mo). Monitor memory usage with:

```bash
free -h
htop
```

---

## Next Step

Proceed to [03 — Server Environment Setup](03-server-environment.md) to install Java, MySQL, and Nginx.
