# 06 — MySQL Database Import

Export the local development database and import it into the production Droplet.

---

## 1. Export from Local Machine

### If using XAMPP/LAMPP (MariaDB)

XAMPP installs its own MySQL/MariaDB, so use the XAMPP-bundled `mysqldump`:

```bash
/opt/lampp/bin/mysqldump -u root \
  --skip-routines \
  springboot_itineraryledger_kabengosafaris > kabengosafaris_dump.sql
```

> **`--skip-routines`**: Required if your local MariaDB has internal table structure differences that cause `mysql.proc` errors during dump.

### If using system MySQL

```bash
mysqldump -u root -p \
  --routines --triggers \
  springboot_itineraryledger_kabengosafaris > kabengosafaris_dump.sql
```

### Verify the Dump

```bash
head -20 kabengosafaris_dump.sql
# Should show MySQL dump header and CREATE TABLE statements

wc -l kabengosafaris_dump.sql
# Should show a reasonable number of lines
```

---

## 2. Upload the Dump to the Droplet

```bash
scp kabengosafaris_dump.sql root@164.92.191.175:/tmp/
```

---

## 3. Import on the Droplet

SSH into the Droplet:

```bash
ssh root@164.92.191.175
```

Import the dump:

```bash
mysql -u kabengosafaris -p springboot_itineraryledger_kabengosafaris < /tmp/kabengosafaris_dump.sql
```

Enter the database password when prompted.

### Verify the Import

```bash
mysql -u kabengosafaris -p -e "SHOW TABLES;" springboot_itineraryledger_kabengosafaris
```

You should see all your application tables listed.

---

## 4. Restart the Spring Boot Service

After importing, restart the application so Hibernate validates the schema:

```bash
systemctl restart kabengosafaris

# Wait for startup
sleep 10

# Verify it's running
systemctl is-active kabengosafaris

# Check logs for any schema issues
journalctl -u kabengosafaris --since "2 minutes ago" | grep -i error
```

---

## 5. Clean Up

```bash
rm /tmp/kabengosafaris_dump.sql
```

---

## Important Notes

### Hibernate DDL Auto-Update

The application uses `spring.jpa.hibernate.ddl-auto=update`, which means:
- Hibernate will automatically create any **missing** tables or columns
- It will **not** drop existing tables or columns
- If you deploy with an empty database, Hibernate creates the full schema automatically

This means you only need to import the dump if you have **existing data** to migrate. For a fresh deployment with no data, just start the app and Hibernate handles the schema.

### Data Directory

The database references file paths stored on disk (images, documents). After importing the database, you also need to copy the `data/` directory:

```bash
# From local machine
scp -r /path/to/local/data/ root@164.92.191.175:/opt/kabengosafaris/data/
```

Or upload via the management panel after deployment.

### Character Set

The database uses `utf8mb4` (full Unicode support including emoji). Ensure the production MySQL server has the same character set:

```sql
SHOW VARIABLES LIKE 'character_set_database';
-- Should show: utf8mb4
```

---

## Troubleshooting

### "Access denied" during import

Ensure the `kabengosafaris` user has full privileges on the database:

```bash
mysql -u root -p
```

```sql
GRANT ALL PRIVILEGES ON springboot_itineraryledger_kabengosafaris.* TO 'kabengosafaris'@'localhost';
FLUSH PRIVILEGES;
```

### "mysql.proc doesn't exist" or column count errors

This happens when dumping from MariaDB (XAMPP) with `--routines`. Use `--skip-routines` instead:

```bash
/opt/lampp/bin/mysqldump -u root --skip-routines springboot_itineraryledger_kabengosafaris > dump.sql
```

### Large dump file (slow upload)

Compress before uploading:

```bash
gzip kabengosafaris_dump.sql
scp kabengosafaris_dump.sql.gz root@164.92.191.175:/tmp/
ssh root@164.92.191.175 "gunzip /tmp/kabengosafaris_dump.sql.gz && mysql -u kabengosafaris -p springboot_itineraryledger_kabengosafaris < /tmp/kabengosafaris_dump.sql"
```

---

## Next Step

Proceed to [07 — Next.js Frontend Deployment](07-nextjs-cpanel.md) to deploy the frontend.
