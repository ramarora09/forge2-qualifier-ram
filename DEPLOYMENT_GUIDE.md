# Deployment Guide - KanbanFlow Platform

This guide describes the steps required to deploy the KanbanFlow platform to a production environment (Linux VPS, AWS EC2, or standard cloud hosts).

---

## 🏗️ Deployment Strategy

* **Frontend**: React/Vite builds into static HTML/JS/CSS assets that can be served via Nginx, Apache, or a cloud static host (AWS S3, Netlify, Vercel).
* **Backend**: Express API server runs as a background process using a Node.js process manager like **PM2**.
* **Database**: SQLite database remains in a local file (`backend/database.sqlite`). No independent database engine setup is required.

---

## 📦 Step-by-Step Production Setup

### Step 1: Clone and Configure Environment

1. Clone the repository onto your production server.
2. In the `backend` folder, create a `.env` file (if using environment variables) to override defaults:
   ```ini
   PORT=5000
   NODE_ENV=production
   ```

### Step 2: Build and Deploy the Frontend

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the production bundle:
   ```bash
   npm run build
   ```
   This generates a static `dist/` directory inside `frontend/`.

4. **Serve static files**:
   Configure Nginx or your preferred web server to serve the `frontend/dist/` directory. Here is an example Nginx configuration snippet that hosts the frontend and proxies `/api` calls to our Express backend:
   ```nginx
   server {
       listen 80;
       server_name kanban.yourdomain.com;

       location / {
           root /var/www/kanban/frontend/dist;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Step 3: Run the Backend Service

1. Navigate to the `backend` folder:
   ```bash
   cd ../backend
   ```
2. Install production dependencies (skipping dev dependencies):
   ```bash
   npm install --production
   ```
3. Install **PM2** globally to manage the Node process:
   ```bash
   npm install -g pm2
   ```
4. Start the Express API server under PM2 management:
   ```bash
   pm2 start src/app.js --name "kanban-api"
   ```
5. Configure PM2 to start automatically on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

---

## 💾 SQLite Database Management & Backup

Because SQLite writes database states directly to a single local file (`backend/database.sqlite`), backing up your production database is simple:

### 1. Simple Cron Backup
Run a shell backup script via `cron` to copy the database file to a backup folder daily:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/kanban-db"
mkdir -p "$BACKUP_DIR"
cp /var/www/kanban/backend/database.sqlite "$BACKUP_DIR/db-$(date +%F).sqlite"
# Delete backups older than 30 days
find "$BACKUP_DIR" -type f -mtime +30 -name "*.sqlite" -delete
```

### 2. Database Locking
If copying the SQLite file while the server is active, there is a minor risk of copying during a write operation. A safer method is to use the SQLite online backup utility:
```bash
sqlite3 /var/www/kanban/backend/database.sqlite ".backup '/var/backups/kanban-db/db-backup.sqlite'"
```
