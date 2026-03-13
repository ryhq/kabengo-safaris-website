# Kabengo Safaris — Deployment Guide

Complete guide for deploying the Kabengo Safaris platform from scratch.

## Architecture

```
                   Namecheap DNS
                   (ryhqtech.com)
                        |
          +-------------+-------------+
          |                           |
   A Record                    A Record (or cPanel)
   api.kabengosafaris           next.kabengosafaris
   .ryhqtech.com                .com (cPanel hosting)
          |                           |
   DigitalOcean Droplet         cPanel + Passenger
   (164.92.191.175)             (Node.js Selector)
          |                           |
   Nginx reverse proxy          Next.js 16 standalone
   + Let's Encrypt SSL          (server.js via Passenger)
          |
   Spring Boot 3.5.7
   (Java 21, port 4450)
          |
   MySQL 8 Database
```

## Guide Index

| # | Guide | Description |
|---|-------|-------------|
| 01 | [Namecheap DNS Configuration](01-namecheap-dns.md) | Setting up A records and subdomains |
| 02 | [DigitalOcean Droplet Setup](02-digitalocean-droplet.md) | Creating and configuring the VPS |
| 03 | [Server Environment Setup](03-server-environment.md) | Java 21, MySQL, Nginx installation |
| 04 | [Spring Boot Deployment](04-spring-boot-deployment.md) | Deploying the backend as a systemd service |
| 05 | [Nginx Reverse Proxy & SSL](05-nginx-ssl.md) | HTTPS with Let's Encrypt for the API |
| 06 | [MySQL Database Import](06-database-import.md) | Exporting local DB and importing to production |
| 07 | [Next.js Frontend Deployment](07-nextjs-cpanel.md) | Deploying to cPanel with Node.js Selector |
| 08 | [CI/CD with GitHub Actions](08-cicd-github-actions.md) | Automated build & deploy for Spring Boot backend |
| 09 | [CI/CD: Next.js to cPanel](09-cicd-nextjs-cpanel.md) | Automated build & deploy for Next.js website |
| 10 | [CI/CD: React Management to cPanel](10-cicd-react-management-cpanel.md) | Automated build & deploy for React management dashboard |

## Tech Stack

- **Backend**: Spring Boot 3.5.7 / Java 21 / Maven
- **Frontend**: Next.js 16.1.6 / React 19 / TypeScript / Tailwind CSS 4
- **Database**: MySQL 8
- **Hosting**: DigitalOcean Droplet (backend) + cPanel shared hosting (frontend)
- **DNS**: Namecheap
- **Management Dashboard**: React 19 / Vite / Material-UI / JavaScript
- **CI/CD**: GitHub Actions (3 pipelines: backend → Droplet, Next.js → cPanel, React → cPanel)
- **SSL**: Let's Encrypt (Certbot)

## Multi-Project Droplet

The Droplet is designed to host multiple backend projects on a single server:

| Subdomain | Project | Port |
|-----------|---------|------|
| `api.kabengosafaris.ryhqtech.com` | Kabengo Safaris | 4450 |
| `api.nguserosdachurch.ryhqtech.com` | Nguseros Da Church | TBD |
| `api.pocketledger.ryhqtech.com` | Pocket Ledger | TBD |

Each project gets its own Nginx server block, systemd service, and MySQL database.
