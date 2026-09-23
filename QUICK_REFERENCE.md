# 🚀 QUICK REFERENCE - APP GEREJA

## 📋 CREDENTIALS (Updated May 4, 2026)

```
┌─────────────────────────────────────────────────┐
│ ADMIN ACCOUNTS                                  │
├─────────────────────────────────────────────────┤
│ Email/Username:  admin3@gereja.com              │
│ Password:        Admin123                       │
│ Role:            AdminGereja                    │
│ Status:          ✅ ACTIVE                      │
└─────────────────────────────────────────────────┘

Superadmin credentials: seed.sql (need to check)
```

---

## 🔗 IMPORTANT LINKS

| Item | URL |
|------|-----|
| Frontend | `d:\Frontend\myApp` |
| Backend | `d:\app_gereja` |
| API Base | `https://app-gereja-api.antonio-girsang.workers.dev` |
| Workers Dashboard | `https://dash.cloudflare.com` |
| D1 Database | `app_gereja_db` (in Cloudflare) |
| Deployed Version | `39496240-4c41-4879-84ad-e1b080e80493` |

---

## ⚡ QUICK COMMANDS

### Frontend (myApp)
```bash
cd d:\Frontend\myApp

npm start           # Start dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run web         # Run on web
npm run lint        # Check errors
```

### Backend (app_gereja)
```bash
cd d:\app_gereja

npm run dev         # Local development
npm run deploy      # Deploy to production
npm run cf:d1:seed  # Seed database
npm run cf:d1:migrate # Run migrations
```

### Database Operations
```bash
# View users
npx wrangler d1 execute app_gereja_db --remote \
  --command "SELECT id, username, role FROM users;"

# Generate password hash
node scripts/generate-hash.mjs

# Test login
curl -X POST https://app-gereja-api.antonio-girsang.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin3@gereja.com","password":"Admin123"}' | jq .
```

---

## 🔐 LOGIN ENDPOINT

```bash
POST /api/auth/login

Request:
{
  "email": "admin3@gereja.com",      # Or: "username"
  "password": "Admin123"
}

Response:
{
  "message": "Login berhasil",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 5,
    "username": "admin3@gereja.com",
    "role": "AdminGereja"
  }
}
```

---

## 📱 MAIN SCREENS (Frontend)

| Screen | Path | Purpose |
|--------|------|---------|
| Home | `/` | Splash/Landing |
| Admin Login | `/loginadmin` | Authentication |
| Admin Dashboard | `/dashboardadmin` | Admin control panel |
| Public Dashboard | `/dashboardjemaat` | Public content |
| PDF Manager | `/admin[resource]` | Upload/manage PDFs |
| Viewer | `/pdfviewer` | View PDFs |

---

## 📊 DATABASE TABLES

```
users
├── id (PK)
├── username (UNIQUE)
├── password (bcrypt hash!)
├── role (Superadmin, AdminGereja)
├── is_active
├── created_at
└── updated_at

minggu_batak, minggu_indonesia, partangiangan_wijk, partangiangan_keluarga, kontemporer, tingting
├── id (PK)
├── tanggal
├── file (path)
├── lokasi (partangiangan_wijk and partangiangan_keluarga only)
├── waktu (partangiangan_wijk and partangiangan_keluarga only)
├── created_at
└── updated_at

sejarah
├── id (PK)
├── deskripsi
├── gambar
├── created_at
└── updated_at

file_assets
├── asset_key (PK)
├── file_name
├── content_type
├── file_size
├── file_blob (BLOB)
├── created_at
└── updated_at
```

---

## 🔑 ROLES & PERMISSIONS

```
┌──────────────────┬─────────────┬────────────────┐
│ Action           │ Superadmin  │ AdminGereja    │
├──────────────────┼─────────────┼────────────────┤
│ Create Admin     │ ✅          │ ❌             │
│ Delete Admin     │ ✅          │ ❌             │
│ Create Content   │ ✅          │ ✅             │
│ Update Content   │ ✅          │ ✅             │
│ Delete Content   │ ✅          │ ✅             │
│ View Public Data │ ✅          │ ✅             │
│ Change Password  │ ✅          │ ❌ (only admin)|
└──────────────────┴─────────────┴────────────────┘
```

---

## 🆕 CREATE NEW ADMIN

### Via API
```bash
curl -X POST https://app-gereja-api.antonio-girsang.workers.dev/api/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SUPERADMIN_TOKEN}" \
  -d '{
    "username": "newadmin@gereja.com",
    "password": "SecurePass123"
  }'
```

### Via Database
```bash
# 1. Generate hash
node scripts/generate-hash.mjs

# 2. Insert manually (use hash from step 1)
npx wrangler d1 execute app_gereja_db --remote \
  --command "INSERT INTO users (username, password, role) VALUES ('newadmin@gereja.com', '\$2b\$10\$...', 'AdminGereja');"
```

---

## ⚠️ IMPORTANT RULES

1. **Password Hashing**: 
   - ✅ Use bcrypt (10 salt rounds)
   - ❌ NEVER plaintext in database

2. **Tokens**:
   - Format: `Bearer {token}`
   - Expiry: 7 days
   - Must send in Authorization header

3. **Request Format**:
   - Content-Type: `application/json`
   - Body: JSON string (not form-data)
   - Queries: Use URL params

4. **Error Handling**:
   - 400: Bad request (validation error)
   - 401: Unauthorized (invalid credentials/token)
   - 403: Forbidden (inactive account)
   - 404: Not found (resource doesn't exist)
   - 500: Server error

---

## 📁 KEY FILES

| File | Purpose |
|------|---------|
| `d:\Frontend\myApp\app\loginadmin.jsx` | Admin login UI |
| `d:\Frontend\myApp\constants\adminApi.js` | API calls |
| `d:\app_gereja\src\worker.mjs` | Backend logic |
| `d:\app_gereja\migrations\seed.sql` | Initial data |
| `d:\app_gereja\scripts\generate-hash.mjs` | Hash generator |

---

## 🆘 COMMON PROBLEMS

| Issue | Solution |
|-------|----------|
| Login fails | Check password is hashed, account active |
| No token returned | Check backend response, JWT_SECRET env |
| API returns 401 | Token expired, invalid, or incorrect format |
| File upload fails | Check file type, size, required fields |
| Database locked | Wait 5-10 min, D1 will recover |
| API returns 403 | Check user role, must be Superadmin/AdminGereja |

---

## 📖 DOCUMENTATION

- **Full Overview**: `PROJECT_OVERVIEW.md`
- **Login Fixes**: `LOGIN_FIXES.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **This File**: `QUICK_REFERENCE.md`

---

## 🔄 DEPLOYMENT CHECKLIST

- [x] Backend deployed (v39496240...)
- [x] Database migrated (0003_fix_admin_password.sql)
- [x] Admin account created (admin3@gereja.com)
- [ ] Frontend tested (TODO: Test now!)
- [ ] All screens verified
- [ ] Error handling tested
- [ ] Production ready? **ALMOST** ✅

---

## 👨‍💻 DEV NOTES

- Use `console.log()` in frontend for debugging
- Use `console.error()` in backend (appears in Workers logs)
- Local storage key for token: `adminToken`
- API timeouts: 30 seconds default
- CORS: Allow all origins (should restrict in prod)

---

**Status**: ✅ Ready for Testing
**Last Updated**: May 4, 2026
**Version**: 1.0.0
