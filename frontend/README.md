# 🎟️ GarbaPass

> A modern single-event Garba ticketing platform with online payments, QR tickets, and admin check-in.

## ✨ Features

- 🎫 Dynamic Single, Couple & Group passes
- 💳 PhonePe payment integration (UPI: PhonePe, GPay, Paytm, BHIM, Cards)
- 🔐 Secure webhook-based payment confirmation
- 🎟️ Automatic QR ticket generation
- 📱 Admin QR scanner & check-in
- 🚫 Duplicate ticket protection
- 📊 Admin dashboard, orders & check-in history

## 🛠️ Tech Stack

**Frontend:** React · Vite · Tailwind CSS · React Router · Motion  
**Backend:** Node.js · Express · MongoDB · Mongoose · PhonePe  
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

Create `backend/.env` with your MongoDB, JWT, and PhonePe credentials.

## 🔄 Flow

```text
Pass → Order → PhonePe → Webhook/Reconcile → Ticket + QR
                                               ↓
                                        Admin Scanner
                                               ↓
                                        Entry / Check-in
```
