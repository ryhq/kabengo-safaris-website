# 01 — Namecheap DNS Configuration

This guide covers setting up DNS records on Namecheap to point subdomains to your DigitalOcean Droplet.

---

## Goal

Route `api.kabengosafaris.ryhqtech.com` to the Droplet's IP address (`164.92.191.175`).

---

## Steps

### 1. Log into Namecheap

Go to [namecheap.com](https://www.namecheap.com) and log into your account.

### 2. Open Domain Management

1. Click **Domain List** in the left sidebar
2. Find `ryhqtech.com` and click **Manage**

### 3. Go to Advanced DNS

Click the **Advanced DNS** tab at the top.

### 4. Add an A Record

Click **ADD NEW RECORD** and fill in:

| Field | Value |
|-------|-------|
| Type | **A Record** |
| Host | `api.kabengosafaris` |
| Value | `164.92.191.175` |
| TTL | Automatic |

Click the green checkmark to save.

### 5. Verify DNS Propagation

Wait 5–30 minutes for DNS propagation, then verify:

```bash
dig api.kabengosafaris.ryhqtech.com +short
# Expected output: 164.92.191.175

# Or use nslookup
nslookup api.kabengosafaris.ryhqtech.com
```

You can also check propagation at [dnschecker.org](https://dnschecker.org).

---

## Adding More Subdomains (Multi-Project)

For hosting multiple backends on the same Droplet, repeat step 4 for each project:

| Host | Value | Project |
|------|-------|---------|
| `api.kabengosafaris` | `164.92.191.175` | Kabengo Safaris |
| `api.nguserosdachurch` | `164.92.191.175` | Nguseros Da Church |
| `api.pocketledger` | `164.92.191.175` | Pocket Ledger |

All subdomains point to the same Droplet IP. Nginx handles routing each subdomain to the correct application (see [05-nginx-ssl.md](05-nginx-ssl.md)).

---

## DNS Record Summary

After setup, your Advanced DNS should look like this:

```
Type       Host                    Value              TTL
A Record   api.kabengosafaris      164.92.191.175     Automatic
A Record   api.nguserosdachurch    164.92.191.175     Automatic
A Record   api.pocketledger        164.92.191.175     Automatic
```

---

## Troubleshooting

### DNS not resolving

- Ensure there are no conflicting records (e.g., CNAME on the same host)
- Check that nameservers are set to Namecheap's defaults (`dns1.registrar-servers.com`, etc.)
- Wait up to 48 hours for full global propagation (usually much faster)

### Using Namecheap with external nameservers

If you're using Cloudflare or another DNS provider, you'll need to add the A records there instead of in Namecheap's Advanced DNS panel.
