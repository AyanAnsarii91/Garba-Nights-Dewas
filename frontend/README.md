from pathlib import Path

readme = """# 🎟️ GarbaPass

> A modern single-event Garba ticketing platform with online payments, QR tickets, and admin check-in.

## ✨ Features

- 🎫 Dynamic Single, Couple & Group passes
- 💳 Razorpay payment integration
- 🔐 Secure webhook-based payment confirmation
- 🎟️ Automatic QR ticket generation
- 📱 Admin QR scanner & check-in
- 🚫 Duplicate ticket protection
- 📊 Admin dashboard, orders & check-in history

## 🛠️ Tech Stack

**Frontend:** React · Vite · Tailwind CSS · React Router · Motion  
**Backend:** Node.js · Express · MongoDB · Mongoose · Razorpay  
**Auth:** JWT · bcrypt  
**QR:** QRCode · html5-qrcode

## 🚀 Setup

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Create `backend/.env` with your MongoDB, JWT, Razorpay and SMTP credentials.

## 🔄 Flow

```text
Pass → Order → Razorpay → Webhook → Ticket + QR
                                      ↓
                              Admin Scanner
                                      ↓
                              Entry / Check-in
```

## 👨‍💼 Admin

```text
/admin/login
/admin
/admin/passes
/admin/orders
/admin/scanner
/admin/checkins
```

Create an admin:

```bash
npm run admin:create
```

## 📅 Event

**25 October 2026**

> The backend is the source of truth for payments, inventory, tickets and check-ins.
"""

gitignore = """# Dependencies
node_modules/

# Environment
.env
.env.*
!.env.example

# Logs
*.log
logs/

# Build
dist/
build/

# Coverage
coverage/

# IDE / OS
.vscode/
.idea/
.DS_Store
Thumbs.db

# Temporary
tmp/
temp/
.cache/

# Secrets
*.pem
*.key
"""

Path("/mnt/data/README.md").write_text(readme, encoding="utf-8")
Path("/mnt/data/.gitignore").write_text(gitignore, encoding="utf-8")
print("Updated concise README.md and backend .gitignore")
