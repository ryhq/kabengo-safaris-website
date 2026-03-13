# 03 — Server Environment Setup

Install Java 21, MySQL 8, and Nginx on the Droplet.

---

## 1. Install Java 21

Spring Boot 3.5.7 requires Java 21.

```bash
apt install -y openjdk-21-jre-headless
```

Verify:

```bash
java -version
# Expected: openjdk version "21.x.x"
```

> **Why `jre-headless`?** The server only needs the Java Runtime Environment, not the full JDK. This saves ~200 MB of disk space.

---

## 2. Install MySQL 8

```bash
apt install -y mysql-server
```

### Secure the Installation

```bash
mysql_secure_installation
```

Follow the prompts:
- Set a root password
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database: **Yes**
- Reload privilege tables: **Yes**

### Create the Application Database and User

```bash
mysql -u root -p
```

```sql
CREATE DATABASE springboot_itineraryledger_kabengosafaris
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'kabengosafaris'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';

GRANT ALL PRIVILEGES ON springboot_itineraryledger_kabengosafaris.* TO 'kabengosafaris'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

> Replace `YOUR_STRONG_PASSWORD_HERE` with a secure password. This password will be set as `DB_PASSWORD` in the systemd service file.

### Verify MySQL is Running

```bash
systemctl status mysql
# Should show: active (running)
```

---

## 3. Install Nginx

```bash
apt install -y nginx
```

Verify:

```bash
systemctl status nginx
# Should show: active (running)

# Test from your browser or curl:
curl http://164.92.191.175
# Should return the default Nginx welcome page
```

---

## 4. Install Certbot (for SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

Certbot will be used in [05-nginx-ssl.md](05-nginx-ssl.md) to obtain Let's Encrypt SSL certificates.

---

## Installed Software Summary

| Software | Version | Purpose |
|----------|---------|---------|
| Java 21 (JRE) | 21.x | Run Spring Boot JAR |
| MySQL 8 | 8.x | Application database |
| Nginx | latest | Reverse proxy + SSL termination |
| Certbot | latest | Automated SSL certificate management |

---

## Next Step

Proceed to [04 — Spring Boot Deployment](04-spring-boot-deployment.md) to deploy the backend application.
