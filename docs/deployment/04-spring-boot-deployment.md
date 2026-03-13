# 04 — Spring Boot Backend Deployment

Deploy the Spring Boot application as a systemd service on the Droplet.

---

## 1. Build the JAR Locally

From your local machine:

```bash
cd ~/Documents/SPRING\ BOOT\ PROJECTS/kabengosafaris
./mvnw clean package -DskipTests
```

The JAR is produced at:
```
target/kabengosafaris-0.0.1-SNAPSHOT.jar
```

---

## 2. Upload the JAR to the Droplet

```bash
scp target/kabengosafaris-0.0.1-SNAPSHOT.jar root@164.92.191.175:/opt/kabengosafaris/app.jar
```

Or if uploading with the snapshot name and renaming:

```bash
scp target/kabengosafaris-0.0.1-SNAPSHOT.jar root@164.92.191.175:/opt/kabengosafaris/
ssh root@164.92.191.175 "mv /opt/kabengosafaris/kabengosafaris-0.0.1-SNAPSHOT.jar /opt/kabengosafaris/app.jar"
```

---

## 3. Create the systemd Service

Create the service file:

```bash
nano /etc/systemd/system/kabengosafaris.service
```

Paste the following:

```ini
[Unit]
Description=Kabengo Safaris Spring Boot Application
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/kabengosafaris
ExecStart=/usr/bin/java -Xms256m -Xmx512m -jar /opt/kabengosafaris/app.jar
Restart=always
RestartSec=10

# Environment Variables
Environment=DB_USERNAME=kabengosafaris
Environment=DB_PASSWORD=YOUR_DB_PASSWORD_HERE
Environment=APP_BASE_URL=https://api.kabengosafaris.ryhqtech.com
Environment=APP_MANAGEMENT_URL=https://management.kabengosafaris.com
Environment=EMAIL_ENCRYPTION_KEY=YOUR_BASE64_KEY_HERE

[Install]
WantedBy=multi-user.target
```

> Replace `YOUR_DB_PASSWORD_HERE` and `YOUR_BASE64_KEY_HERE` with actual values.

### Key Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| `WorkingDirectory` | `/opt/kabengosafaris` | Relative paths (./data/, ./logs/) resolve from here |
| `-Xms256m -Xmx512m` | Min 256MB, Max 512MB heap | Fits within 1GB Droplet RAM |
| `Restart=always` | Auto-restart on crash | Keeps the service running |
| `RestartSec=10` | Wait 10s before restart | Prevents rapid restart loops |

---

## 4. Enable and Start the Service

```bash
# Reload systemd to pick up the new service file
systemctl daemon-reload

# Enable auto-start on boot
systemctl enable kabengosafaris

# Start the service
systemctl start kabengosafaris

# Check status
systemctl status kabengosafaris
```

Expected output:
```
● kabengosafaris.service - Kabengo Safaris Spring Boot Application
     Loaded: loaded (/etc/systemd/system/kabengosafaris.service; enabled)
     Active: active (running)
```

---

## 5. Verify the Application

Wait ~15 seconds for Spring Boot to start, then:

```bash
# Check if the port is listening
ss -tlnp | grep 4450

# Test the API locally
curl http://localhost:4450/api/public/homepage
```

---

## 6. View Logs

```bash
# systemd journal logs (real-time)
journalctl -u kabengosafaris -f

# Application log file
tail -f /opt/kabengosafaris/logs/application.log
```

---

## Common Service Commands

```bash
# Start / Stop / Restart
systemctl start kabengosafaris
systemctl stop kabengosafaris
systemctl restart kabengosafaris

# Check if running
systemctl is-active kabengosafaris

# View recent logs
journalctl -u kabengosafaris --since "10 minutes ago"
```

---

## Application Properties (Production)

The `application.properties` uses environment variables with fallback defaults:

```properties
# Database — reads from systemd Environment vars
spring.datasource.url=jdbc:mysql://${MYSQL_HOST:localhost}:3306/springboot_itineraryledger_kabengosafaris
spring.datasource.username=${DB_USERNAME:kabengosafaris}
spring.datasource.password=${DB_PASSWORD:}

# Server
server.port=4450

# URLs
app.base.url=${APP_BASE_URL:https://api.kabengosafaris.ryhqtech.com}
app.management.base.url=${APP_MANAGEMENT_URL:https://management.kabengosafaris.com}

# Logging
logging.level.root=WARN
logging.level.com.itineraryledger.kabengosafaris=INFO
logging.file.name=logs/application.log
```

All sensitive values (passwords, keys) come from environment variables in the systemd service file — never hardcoded in `application.properties`.

---

## Directory Structure After Deployment

```
/opt/kabengosafaris/
├── app.jar                     # Spring Boot application
├── data/                       # Created at runtime
│   ├── accommodation-images/
│   ├── accommodation-documents/
│   ├── park-images/
│   ├── park-documents/
│   ├── activity-images/
│   ├── activity-documents/
│   ├── itinerary-documents/
│   ├── safari-documents/
│   ├── email-signatures/
│   ├── email-templates/
│   └── pdf-templates/
├── logs/
│   └── application.log
└── backups/                    # Automated backups
```

---

## Next Step

Proceed to [05 — Nginx Reverse Proxy & SSL](05-nginx-ssl.md) to expose the API over HTTPS.
