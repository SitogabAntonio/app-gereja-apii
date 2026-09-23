# 📱 APP GEREJA - Complete Project Overview

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Expo React Native)             │
│                    d:\Frontend\myApp                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Login screens (Admin & Public)                     │   │
│  │ - Dashboard (Admin & Jemaat)                         │   │
│  │ - CRUD management for content                        │   │
│  │ - PDF viewer & download                              │   │
│  │ - Responsive UI with Expo Router                     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ API Calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         BACKEND (Cloudflare Workers + D1)                    │
│              d:\app_gereja                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - REST API endpoints                                 │   │
│  │ - Authentication & JWT                               │   │
│  │ - File management (PDF storage)                       │   │
│  │ - CRUD operations for all resources                  │   │
│  │ - Role-based access control                          │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │  DATABASE (D1 SQLite)  │
          │  app_gereja_db         │
          │  (Cloudflare)          │
          └────────────────────────┘
```

---

## 📁 FOLDER STRUCTURE

### Frontend: `d:\Frontend\myApp`
```
myApp/
├── app/                    # Pages & Screens (Expo Router)
│   ├── _layout.jsx        # Root layout & navigation
│   ├── index.jsx          # Splash/Home screen
│   ├── loginadmin.jsx     # Admin login
│   ├── dashboardadmin.jsx # Admin dashboard
│   ├── dashboardjemaat.jsx # Public dashboard
│   ├── acarabahasabatak.jsx    # Activities (Batak)
│   ├── acarabahasaindonesia.jsx # Activities (Indonesian)
│   ├── [ADMIN] admin*.jsx      # Admin management screens
│   ├── [PUBLIC] minggu*.jsx    # Public views
│   └── pdfviewer.jsx      # PDF viewer component
├── components/            # Reusable components
│   ├── AdminPdfManagerScreen.jsx
│   ├── PublicPdfListScreen.jsx
│   └── ui/               # UI components
├── constants/            # API & Config
│   ├── adminApi.js       # Admin API calls
│   ├── publicApi.js      # Public API calls
│   └── theme.ts          # Theme colors
├── hooks/                # Custom React hooks
├── assets/images         # Images & logos
└── package.json          # Dependencies
```

### Backend: `d:\app_gereja`
```
app_gereja/
├── src/
│   ├── worker.mjs        # Main Cloudflare Worker
│   ├── config/           # Configuration
│   ├── middlewares/       # Auth & CORS
│   └── utils/            # Helper functions
├── migrations/           # Database migrations
│   ├── 0001_initial.sql          # Create tables
│   ├── 0002_file_assets.sql       # File storage
│   ├── 0003_fix_admin_password.sql # NEW: Fix password hashing
│   └── seed.sql                    # Seed data
├── scripts/
│   ├── generate-hash.mjs # Generate bcrypt hashes
│   └── test-login.sh     # Test script
├── wrangler.toml         # Cloudflare config
└── package.json          # Dependencies
```

---

## 🔐 AUTHENTICATION FLOW

### 1. Login Process
```
┌─ User Input (Email + Password)
│
├─ Frontend: POST /api/auth/login { email, password }
│
├─ Backend: 
│  ├─ Find user by email/username
│  ├─ Verify password with bcrypt.compare()
│  ├─ Generate JWT token (7 days expiry)
│  └─ Return token + user info
│
├─ Frontend:
│  ├─ Store token in localStorage
│  ├─ Add to Authorization header: `Bearer {token}`
│  └─ Redirect to dashboard
│
└─ Subsequent Requests: Use token for auth
```

### 2. Database Schema
```sql
users table:
├── id (INTEGER, PK)
├── username (TEXT, UNIQUE, NOT NULL)
├── password (TEXT, NOT NULL) -- MUST be bcrypt hash!
├── role (TEXT, NOT NULL) -- 'Superadmin' or 'AdminGereja'
├── is_active (INTEGER, default: 1)
├── created_at (TEXT, default: CURRENT_TIMESTAMP)
└── updated_at (TEXT, default: CURRENT_TIMESTAMP)
```

### 3. Available Roles
- **Superadmin**: Full access (create/delete admins, manage all content)
- **AdminGereja**: Limited access (manage own content)

---

## 📡 API ENDPOINTS

### Authentication
```
POST /api/auth/login
  Request: { username or email, password }
  Response: { message, token, user }
```

### Admin Management (Superadmin only)
```
POST /api/admin/create              # Create new admin
GET  /api/admin                     # List all admins
PUT  /api/admin/:id/activate        # Activate admin
PUT  /api/admin/:id/deactivate      # Deactivate admin
DELETE /api/admin/:id               # Delete admin
PUT  /api/admin/change-password     # Change password
```

### Public Resources
```
GET /api/sejarah                    # Get history
GET /api/minggu-batak              # Get Batak sermons
GET /api/minggu-indonesia          # Get Indonesian sermons
GET /api/partangiangan-wijk        # Get wijk prayer meetings
GET /api/partangiangan-keluarga    # Get family prayer meetings
GET /api/kontemporer               # Get contemporary
GET /api/tingting                  # Get bells
```

### Admin Resources (AdminGereja+)
```
POST   /api/{resource}             # Create
GET    /api/{resource}             # List
GET    /api/{resource}/:id         # Get detail
PUT    /api/{resource}/:id         # Update
DELETE /api/{resource}/:id         # Delete
GET    /api/{resource}/:id/view    # View file
GET    /api/{resource}/:id/download# Download file
```

---

## 🛠️ KEY TECHNOLOGIES

### Frontend
- **Expo 54**: React Native framework
- **Expo Router**: File-based routing
- **React Native**: Mobile UI components
- **JavaScript/JSX**: Language

### Backend
- **Cloudflare Workers**: Serverless compute
- **D1**: SQLite database
- **bcryptjs**: Password hashing
- **JWT**: Token-based auth

### Database
- **SQLite**: Database engine
- **SQL Migrations**: Schema versioning

---

## 🔄 DEVELOPMENT WORKFLOW

### Frontend (Expo)
```bash
cd d:\Frontend\myApp

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

### Backend (Cloudflare Workers)
```bash
cd d:\app_gereja

# Local development
npm run dev

# Deploy to production
npm run deploy

# Database operations
npm run cf:d1:migrate      # Run migrations
npm run cf:d1:seed         # Seed data
```

---

## 📋 CONTENT RESOURCES

### PDF Resources (File-based)
- **minggu-batak**: Sunday sermons (Batak)
- **minggu-indonesia**: Sunday sermons (Indonesian)
- **partangiangan-wijk**: Wijk prayer meetings
- **partangiangan-keluarga**: Family prayer meetings
- **kontemporer**: Contemporary messages
- **tingting**: Bell/Announcements

Fields:
- `tanggal`: Date (YYYY-MM-DD)
- `file`: File path (uploaded to D1 or R2)
- `lokasi`: Location (partangiangan-wijk and partangiangan-keluarga only)
- `waktu`: Time (partangiangan-wijk and partangiangan-keluarga only)

### JSON Resources (Data-based)
- **sejarah**: Church history

Fields:
- `deskripsi`: Description (rich text)
- `gambar`: Image reference

---

## 🔑 CURRENT ADMIN ACCOUNTS

| Username | Password | Role | Status |
|----------|----------|------|--------|
| superadmin | *(seed)* | Superadmin | ✅ Active |
| admingereja | *(seed)* | AdminGereja | ✅ Active |
| admin3@gereja.com | Admin123 | AdminGereja | ✅ Active |

*Seed passwords di: d:\app_gereja\migrations\seed.sql*

---

## 🚀 DEPLOYMENT

### Frontend Deployment
- Expo can export to web/native
- Can be hosted on:
  - Expo Go (for testing)
  - Apple App Store
  - Google Play Store
  - Web platforms

### Backend Deployment
- Already deployed on Cloudflare Workers
- URL: `https://app-gereja-api.antonio-girsang.workers.dev`
- Database: Cloudflare D1 (app_gereja_db)

**Recent Deployment**:
- Version: 39496240-4c41-4879-84ad-e1b080e80493
- Status: ✅ Active
- Changes: Login endpoint updated to accept email/username

---

## ⚠️ SECURITY NOTES

1. **Passwords**: Always use bcrypt hashing (salt rounds: 10)
2. **JWT Tokens**: Expiry: 7 days
3. **CORS**: Allow all origins (should be restricted in production)
4. **Role-based Access**: Enforce at backend (do not trust frontend)
5. **File Upload**: Validate file types & size
6. **Database**: Use parameterized queries (already implemented)

---

## 🐛 KNOWN ISSUES & FIXES

### Issue 1: Plaintext Password ✅ FIXED
- Database: Password must be bcrypt hashed
- Fix: Use `scripts/generate-hash.mjs` to generate hash
- Migration: `0003_fix_admin_password.sql`

### Issue 2: Email vs Username Mismatch ✅ FIXED
- Frontend sends: `{ email, password }`
- Backend now accepts: both `email` and `username`
- Change: Updated login() function in worker.mjs

---

## 📞 SUPPORT

For more info on:
- **Frontend**: See `d:\Frontend\myApp\README.md`
- **Backend**: See `d:\app_gereja\README.md`
- **Expo**: https://docs.expo.dev
- **Cloudflare Workers**: https://developers.cloudflare.com/workers
- **D1**: https://developers.cloudflare.com/d1

---

**Last Updated**: May 4, 2026
**Status**: ✅ Production Ready
