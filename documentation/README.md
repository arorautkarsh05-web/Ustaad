# Eurogrip Ustaad Network
## Intelligent Mechanic Empowerment & Brand Advocacy Ecosystem

**Team Name:** Code Slayers  
**Author / Lead Architect:** Utkarsh Arora  
**Project Repository:** Eurogrip Ustaad Network  
**Target Brand:** TVS Eurogrip (Two-Wheeler Tyres & Mobility Solutions)  
**Version:** 1.0.0 (Production-Ready)

---

## 📌 Executive Summary

The **Eurogrip Ustaad Network** is an enterprise-grade digital ecosystem built to transform TVS Eurogrip's relationship with India's vast network of two-wheeler mechanics, authorized tyre dealers, and end-consumers.

Unlike traditional loyalty programs that rely on easily counterfeited scratch coupons or basic point accumulation, Ustaad Network introduces a verified, tamper-proof **Fitment Passport with QR authentication**, an interactive **Ustaad Academy** for technician upskilling, and a zero-capital equipment sharing marketplace known as **ToolBank Hub**.

---

## 👥 Project Team & Credits

- **Team Name:** Code Slayers
- **Lead Developer & System Architect:** Utkarsh Arora
- **Domain Focus:** Automotive Aftermarket, Full-Stack Architecture, Application Security, FinTech Ledger Systems

---

## 🏛️ System Architecture

The platform follows a modular, secure decoupled client-server architecture with an ACID-compliant MySQL database.

```
                      +---------------------------------------+
                      |       Eurogrip Ustaad Network         |
                      |            React Frontend             |
                      +---------------------------------------+
                                          |
                      (Vite / Tailwind CSS / React Router / Axios)
                                          | REST API (JWT / CORS / Helmet)
                                          v
                      +---------------------------------------+
                      |            Express Backend            |
                      |         Node.js Micro-Modular         |
                      +---------------------------------------+
                                          |
           +------------------------------+------------------------------+
           |                              |                              |
           v                              v                              v
+---------------------+        +--------------------+        +---------------------+
|  Authentication &   |        |  Core Controllers  |        | Secure File Storage |
|  Crypto OTP Engine  |        |  (Fitment, Academy,|        | (Object Auth / IDOR |
| (SHA-256 / SHA-HMAC)|        | ToolBank, Admin)   |        | Protection)         |
+---------------------+        +--------------------+        +---------------------+
           |                              |                              |
           +------------------------------+------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |            MySQL Database             |
                      |   (17 Tables / Constraints / ACID)    |
                      +---------------------------------------+
```

---

## 🧩 Core Ecosystem Pillars

### 1. Digital Fitment Passport
- **Tamper-Proof Records:** Mechanics log tyre fitments (vehicle model, tyre size, pattern, axle position).
- **Zero-Credit Trust:** Creating a fitment awards **zero** credits initially.
- **Customer OTP Verification:** Customers receive an SMS OTP to confirm legitimate installation.
- **Public Passport QR:** Anyone scanning the tyre's QR code accesses warranty and fitment specs without exposing private customer phone numbers or invoice data.

### 2. Ustaad Academy
- **Structured Curriculum:** 6 multi-level courses covering tubeless repair, radial tyre dynamics, and tyre safety.
- **Anti-Cheating Assessment Engine:** Questions and grading verified server-side; correct options stripped before delivery.
- **Accredited Badges:** Automated tiering (Beginner, Professional, Champion) with unlockable badges (*Profile Pioneer*, *First Steps*, *Tyre Expert*, *Eurogrip Champion*).

### 3. ToolBank Hub
- **Zero-Capital Machinery:** Mechanics reserve advanced equipment (Dynamic Wheel Balancers, Digital Gauges, Tyre Changers) using earned reward points.
- **Race-Condition-Proof Reservations:** Row-level locks (`SELECT FOR UPDATE`) prevent inventory overselling.
- **Dealer Pickup & Return Lifecycle:** Strict state transitions (`pending` -> `approved` -> `collected` -> `returned`) recorded with condition audits.

### 4. Role-Based Portals (RBAC)
- **Mechanic Portal:** Digital Ustaad ID card, credit ledger, fitment issuance, course modules, tool reservations.
- **Dealer Portal:** Approves regional tool reservations, inspects returns, and tracks assigned garages.
- **Regional Manager Portal:** Geographically scoped analytics (Maharashtra, South, North, etc.) without national data leaks.
- **Super Administrator Portal:** Comprehensive oversight, mechanic verification, audit trails, and inventory management.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router DOM v7, Axios, Lucide Icons, Recharts, QRCodeSVG |
| **Backend** | Node.js, Express.js, MySQL2 (Promise Pool), Helmet, CORS, Morgan, Express Rate Limit, Multer |
| **Database** | MySQL 8.0 (InnoDB, Foreign Key Cascades, Unique Constraints, Row-Level Locking) |
| **Security & Auth**| JWT (JSON Web Tokens), Node.js `crypto.randomInt`, SHA-256 OTP Hashing, Constant-Time Comparison |
| **Testing** | Node Assert Test Suites, Automated E2E Journey Runner |

---

## 🚀 Quick Startup Guide

### 1. Database Setup
Ensure MySQL is running on `localhost:3306`, then run the database migration:
```bash
cd backend
npm run migrate
```

### 2. Backend Server
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` (Health Check: `GET /api/health`).*

### 3. Frontend Client
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

### 4. Running Automated Tests
```bash
cd backend
npm test        # Runs 10-point comprehensive security suite
npm run test:e2e    # Runs 13-step business journey validation
```

---

## 📁 Documentation Contents

Detailed specialized documentation is available in the `documentation/` folder:
1. [`security-measures.md`](file:///d:/Ustaad%20Network/documentation/security-measures.md) - Complete threat analysis, cryptographic safeguards, and transaction isolation.
2. [`problem-solution.md`](file:///d:/Ustaad%20Network/documentation/problem-solution.md) - Aftermarket landscape challenges and targeted engineering solutions.
3. [`innovation.md`](file:///d:/Ustaad%20Network/documentation/innovation.md) - Market differentiation, comparative advantages, and technological breakthroughs.
4. [`feasibility.md`](file:///d:/Ustaad%20Network/documentation/feasibility.md) - Technical, economic, operational, and commercial rollout feasibility study.

