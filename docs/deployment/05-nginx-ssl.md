# 05 — Nginx Reverse Proxy & SSL

Configure Nginx to reverse-proxy `api.kabengosafaris.ryhqtech.com` to the Spring Boot app on `localhost:4450`, with HTTPS via Let's Encrypt.

---

## Prerequisites

- DNS A record for `api.kabengosafaris.ryhqtech.com` → `164.92.191.175` (see [01-namecheap-dns.md](01-namecheap-dns.md))
- Nginx and Certbot installed (see [03-server-environment.md](03-server-environment.md))
- Spring Boot running on `localhost:4450` (see [04-spring-boot-deployment.md](04-spring-boot-deployment.md))

---

## 1. Create the Nginx Server Block

```bash
nano /etc/nginx/sites-available/api.kabengosafaris.ryhqtech.com
```

Paste the following:

```nginx
server {
    listen 80;
    server_name api.kabengosafaris.ryhqtech.com;

    # Max upload size (for image/document uploads)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4450;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Key Settings

| Directive | Value | Purpose |
|-----------|-------|---------|
| `server_name` | `api.kabengosafaris.ryhqtech.com` | Match incoming requests for this subdomain |
| `proxy_pass` | `http://localhost:4450` | Forward to Spring Boot |
| `client_max_body_size` | `50M` | Allow large file uploads |
| `X-Forwarded-Proto` | `$scheme` | Tell Spring Boot whether request is HTTP or HTTPS |

---

## 2. Enable the Server Block

```bash
ln -s /etc/nginx/sites-available/api.kabengosafaris.ryhqtech.com /etc/nginx/sites-enabled/
```

Test the configuration:

```bash
nginx -t
# Expected: syntax is ok / test is successful
```

Reload Nginx:

```bash
systemctl reload nginx
```

Verify HTTP access:

```bash
curl http://api.kabengosafaris.ryhqtech.com/api/public/homepage
```

---

## 3. Obtain SSL Certificate with Certbot

```bash
certbot --nginx -d api.kabengosafaris.ryhqtech.com
```

Certbot will:
1. Ask for your email address (for renewal notices)
2. Ask you to agree to the Terms of Service
3. Automatically obtain the certificate
4. Modify the Nginx config to add SSL directives
5. Set up auto-redirect from HTTP → HTTPS

After Certbot completes, the Nginx config is automatically updated to something like:

```nginx
server {
    server_name api.kabengosafaris.ryhqtech.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4450;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/api.kabengosafaris.ryhqtech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kabengosafaris.ryhqtech.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = api.kabengosafaris.ryhqtech.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name api.kabengosafaris.ryhqtech.com;
    return 404;
}
```

---

## 4. Verify HTTPS

```bash
curl https://api.kabengosafaris.ryhqtech.com/api/public/homepage
```

You can also visit `https://api.kabengosafaris.ryhqtech.com/swagger-ui/index.html` in a browser to confirm the Swagger UI loads.

---

## 5. SSL Auto-Renewal

Certbot installs a systemd timer that auto-renews certificates before they expire (every 90 days). Verify the timer is active:

```bash
systemctl list-timers | grep certbot
```

Test renewal:

```bash
certbot renew --dry-run
```

---

## Adding More Subdomains (Multi-Project)

For each additional backend project, repeat the same process:

### Example: `api.nguserosdachurch.ryhqtech.com`

```bash
# Create server block
nano /etc/nginx/sites-available/api.nguserosdachurch.ryhqtech.com
```

```nginx
server {
    listen 80;
    server_name api.nguserosdachurch.ryhqtech.com;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4451;  # Different port for each app
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable and get SSL
ln -s /etc/nginx/sites-available/api.nguserosdachurch.ryhqtech.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d api.nguserosdachurch.ryhqtech.com
```

### Port Allocation

| Project | Port |
|---------|------|
| Kabengo Safaris | 4450 |
| Nguseros Da Church | 4451 |
| Pocket Ledger | 4452 |

---

## Troubleshooting

### 502 Bad Gateway

Spring Boot is not running or not listening on port 4450:

```bash
systemctl status kabengosafaris
ss -tlnp | grep 4450
```

### Certificate renewal fails

Check that port 80 is open and Nginx is running:

```bash
ufw status
systemctl status nginx
```

---

## Next Step

Proceed to [06 — MySQL Database Import](06-database-import.md) to migrate your local database.
