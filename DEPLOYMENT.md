# Full deployment guide – Contabo server (MySQL, phpMyAdmin, backend)

Step-by-step from a clean server to a working MySQL database, phpMyAdmin UI, and backend using it. Includes problems we ran into and how we fixed them.

---

## Where to start

- You have a Contabo VPS (Ubuntu) and SSH access as `root` or a sudo user.
- Your backend is already deployed (e.g. Node/NestJS); you only need to set up the database and (optionally) phpMyAdmin.
- You were using XAMPP/MySQL on localhost before; now we move to MySQL on the server.

---

## Part 1: MySQL on the server

### 1.1 Install MySQL Server

```bash
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 1.2 Secure MySQL

```bash
sudo mysql_secure_installation
```

When prompted:

| Prompt | What to enter |
|--------|----------------|
| Password validation policy (0=LOW, 1=MEDIUM, 2=STRONG) | **1** (MEDIUM). Do **not** type your password here. |
| Set root password? | **Y**, then enter your root password (e.g. `Nitin@123`). |
| Remove anonymous users? | **Y** |
| Disallow root login remotely? | **Y** |
| Remove test database? | **Y** |
| Reload privilege tables? | **Y** |

**Problem we hit:** At the first screen we typed the password instead of the policy number. The first question asks for **0, 1, or 2**; only later does it ask for the actual password.

### 1.3 Create database and app user

```bash
sudo mysql -u root -p
```

Enter the MySQL root password. In the `mysql>` prompt run:

```sql
CREATE DATABASE yelo_backend CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'yelo_app'@'localhost' IDENTIFIED BY 'Nitin@123';

GRANT ALL PRIVILEGES ON yelo_backend.* TO 'yelo_app'@'localhost';

FLUSH PRIVILEGES;

EXIT;
```

**Important:** The **username** is `yelo_app`. The **database name** is `yelo_backend`. Do not use `yelo_backend` as the login username in phpMyAdmin or in your app.

**Problem we hit later:** We had run `CREATE USER` during initial setup but the user didn’t exist (e.g. typo or different session). When we tried `ALTER USER 'yelo_app'@'localhost' IDENTIFIED BY 'Nitin@123';` it failed with **ERROR 1396: Operation ALTER USER failed**. Fix: check if the user exists with `SELECT user, host FROM mysql.user WHERE user = 'yelo_app';`. If **Empty set**, create the user with the `CREATE USER` and `GRANT` commands above.

---

## Part 2: Import your data

### 2.1 Export from XAMPP (on your Windows PC)

```bash
cd C:\xampp\mysql\bin
mysqldump -u root -p yelo_backend > D:\yelo_backend_export.sql
```

### 2.2 Copy dump to the server

From your PC (PowerShell or Git Bash):

```bash
scp D:\yelo_backend_export.sql root@YOUR_SERVER_IP:/tmp/
```

Or use FileZilla / WinSCP to upload to `/tmp/`.

### 2.3 Import on the server

```bash
mysql -u yelo_app -p yelo_backend < /tmp/yelo_backend_export.sql
```

Enter password `Nitin@123` when prompted.

**Alternative:** If you only need sample data, copy `sample-business-inserts.sql` to the server and run:

```bash
mysql -u yelo_app -p yelo_backend < sample-business-inserts.sql
```

Or from the project directory: `node scripts/run-sample-inserts.js` (uses `.env` for DB credentials).

---

## Part 3: Backend .env on the server

In your backend project directory on the server (e.g. `~/yelo_app_backend`), create or edit `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=yelo_app
DB_PASSWORD=Nitin@123
DB_DATABASE=yelo_backend

REDIS_HOST=localhost
PORT=3050
```

Then restart your app (e.g. `pm2 restart all` or `npm run build && node dist/main.js`). No code changes are required; the app already reads these variables.

---

## Part 4: phpMyAdmin (optional – to view/edit DB in browser)

### 4.1 Install phpMyAdmin

```bash
sudo apt install phpmyadmin -y
```

During installation:

| Prompt | What to choose |
|--------|----------------|
| Configure database for phpmyadmin with dbconfig-common? | **Yes** |
| Connection method for MySQL | **Unix socket** (same server) |
| Authentication plugin for MySQL | **default** |
| MySQL username for phpmyadmin | Leave **phpmyadmin** (or `phpmyadmin@localhost`) |
| Password for phpmyadmin config DB | Choose a strong password. **Problem we hit:** MySQL password policy rejected it (ERROR 1819). We chose **&lt;ignore&gt;** so the installer finished; phpMyAdmin still works for logging in as `yelo_app`. Alternatively, temporarily set `validate_password.policy = 0` in MySQL, reconfigure phpmyadmin, then set policy back. |

**Problem we hit:** “Your password does not satisfy the current policy requirements.” We tried `Phpmyadmin@1`, `Nq4@vR7w` – still failed (STRONG policy can reject dictionary-like words). **Solution:** Select **&lt;ignore&gt;** and continue; you will log into phpMyAdmin as `yelo_app` anyway, so the internal phpmyadmin config user is not required for normal use.

### 4.2 Nginx: serve phpMyAdmin

The server was already using **Nginx** (not Apache). phpMyAdmin does not configure Nginx by default.

**Problem we hit:** Opening `http://SERVER_IP/phpadmin` gave **404 Not Found**.  
**Fix 1:** Use the correct URL: **`/phpmyadmin`** (with “my”), not `/phpadmin`.

**Fix 2:** If you still get 404, add a location inside your Nginx `server` block. Edit the default site:

```bash
sudo nano /etc/nginx/sites-available/default
```

**Problem we hit:** We added a `location` block in the wrong place and got: **"location" directive is not allowed here** at line 95, and **nginx: configuration file test failed**.  
**Fix:** The `location` block must be **inside** the main `server { ... }` block (same level as other `location` blocks). Remove any misplaced block, then add this **inside** the `server { }`:

```nginx
    location /phpmyadmin {
        alias /usr/share/phpmyadmin;
        index index.php;
        location ~ ^/phpmyadmin/(.+\.php)$ {
            alias /usr/share/phpmyadmin/$1;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }
```

Check the PHP-FPM socket name:

```bash
ls /var/run/php/
```

Use the actual socket (e.g. `php8.2-fpm.sock` or `php8.3-fpm.sock`) in the `fastcgi_pass` line. Then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Problem we hit:** After fixing 404, we got **502 Bad Gateway**.  
**Cause:** PHP-FPM was not running or the socket path was wrong.  
**Fix:** Install PHP-FPM, use the correct socket in the config above, and start it:

```bash
sudo apt install php-fpm php-mysql -y
sudo systemctl start php8.3-fpm
sudo systemctl enable php8.3-fpm
```

### 4.3 Log in to phpMyAdmin

- URL: **`http://YOUR_SERVER_IP/phpmyadmin`**
- **Username:** **yelo_app** (not `yelo_backend`)
- **Password:** **Nitin@123**

**Problem we hit:** “Cannot log in to the MySQL server” and “Access denied for user 'yelo_backend'@'localhost'”. We had put **yelo_backend** (the database name) in the Username field. **Fix:** Use **yelo_app** as the username; **yelo_backend** is only the database you select after login.

**Problem we hit:** “Operation ALTER USER failed for 'yelo_app'@'localhost'”. We tried to set the password with `ALTER USER` but the user did not exist. **Fix:** Run `SELECT user, host FROM mysql.user WHERE user = 'yelo_app';`. If Empty set, create the user:

```sql
CREATE USER 'yelo_app'@'localhost' IDENTIFIED BY 'Nitin@123';
GRANT ALL PRIVILEGES ON yelo_backend.* TO 'yelo_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

After that, phpMyAdmin login with **yelo_app** / **Nitin@123** works. Select the **yelo_backend** database in the left sidebar to view and edit tables.

---

## Commands summary (start to end)

**On the server (in order):**

```bash
# 1. MySQL
sudo apt update
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation

# 2. Create DB and user (then run the SQL block in section 1.3)
sudo mysql -u root -p

# 3. Import data (after copying dump to /tmp)
mysql -u yelo_app -p yelo_backend < /tmp/yelo_backend_export.sql

# 4. Backend .env (create/edit in project dir)
# DB_HOST=localhost, DB_USERNAME=yelo_app, DB_PASSWORD=Nitin@123, DB_DATABASE=yelo_backend

# 5. phpMyAdmin (optional)
sudo apt install phpmyadmin -y

# 6. PHP-FPM for phpMyAdmin
sudo apt install php-fpm php-mysql -y
ls /var/run/php/
sudo systemctl start php8.3-fpm
sudo systemctl enable php8.3-fpm

# 7. Nginx config: add location /phpmyadmin inside server { }, then:
sudo nginx -t
sudo systemctl reload nginx
```

**Where to end:** Open `http://YOUR_SERVER_IP/phpmyadmin`, log in as **yelo_app** / **Nitin@123**, select **yelo_backend**, and confirm your backend can connect using the same credentials in `.env`.

---

## Upload folder / images return 404 (not resolved on server)

### What the issue is

- **Symptom:** Browser or app requests an image at `http://SERVER_IP:3050/upload/filename.png` and gets **404 Not Found** with JSON: `{"message":"Cannot GET /upload/xxx.png","error":"Not Found","statusCode":404}`.
- **On the server:** The file exists (e.g. `ls ~/yelo_app_backend/upload/` shows the `.png` file). So the problem is not “file missing” but “app not serving it”.

### Why it happens

- The Nest app serves the `upload` directory via `useStaticAssets()`. The path to that directory is resolved at **runtime**.
- If the app was started from a different working directory (e.g. PM2 run from another folder), or the path was built from `__dirname` (which points to `dist/` after build), the resolved path can point to the wrong place and no file is found, so Nest returns 404.
- It is **not** caused by skipping `npx tsc` or by the presence of the `upload` folder alone; it is a **runtime path + deploy/restart** issue.

### What was changed in code

- In `src/main.ts`, the static assets middleware was updated to use **`process.cwd()`** so the `upload` folder is always taken relative to the **current working directory** (the directory from which the Node process was started):
  - `const uploadPath = join(process.cwd(), 'upload');`
  - `app.useStaticAssets(uploadPath, { prefix: '/upload' });`
- For this to work, the app **must** be started from the project root (where the `upload` folder lives next to `dist/`).

### What to do on the server (if still not resolved)

1. **Pull latest code and rebuild**
   ```bash
   cd ~/yelo_app_backend
   git pull
   npm run build
   ```

2. **Ensure PM2 runs from the project root**  
   Check where the process is started from:
   ```bash
   pm2 show yelo
   ```
   The **exec cwd** (or equivalent) should be `/root/yelo_app_backend` (or your actual project path). If it is not, restart PM2 from the project root so that `process.cwd()` is that directory:
   ```bash
   cd ~/yelo_app_backend
   pm2 delete yelo
   pm2 start dist/main.js --name yelo
   ```

3. **Restart the app after any code or path change**
   ```bash
   pm2 restart yelo
   ```

4. **Verify**  
   Open `http://YOUR_SERVER_IP:3050/upload/83ad0d0b3b6b866e0a687268.png` (or any file you know exists in `upload/`). If it still returns 404, confirm the `upload` folder exists next to `dist/` and that PM2’s cwd is the project root.

---

## Quick reference

| Item | Value |
|------|--------|
| MySQL root | (password you set in mysql_secure_installation) |
| DB name | yelo_backend |
| DB user (for app and phpMyAdmin) | yelo_app |
| DB password | Nitin@123 |
| phpMyAdmin URL | http://YOUR_SERVER_IP/phpmyadmin |
