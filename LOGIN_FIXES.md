# APP GEREJA - Login Fixes & Documentation

## ✅ MASALAH YANG DIPERBAIKI

### Issue #1: Plaintext Password dalam Database
**Masalah**: Password `'Admin123'` disimpan sebagai plaintext, bukan bcrypt hash
**Solusi**: 
- Generate bcrypt hash: `$2b$10$aw8vHzeiMjae4urRSPNe8.VpIPeUr43KsL1lUjHLVp9wYpD07A/qi`
- Insert ke database dengan hash yang benar

**Database Credentials** (Test/Login):
- Username: `admin3@gereja.com`
- Password: `Admin123`
- Role: `AdminGereja`

### Issue #2: Mismatch Request Format
**Masalah**: 
- Frontend mengirim: `{ email, password }`
- Backend expect: `{ username, password }`

**Solusi**:
- Update backend untuk accept BOTH `email` dan `username`
- Backend akan treat keduanya sebagai credential yang sama

---

## 🔑 ADMIN ACCOUNTS TERSEDIA

| ID | Username | Password | Role | Status |
|----|----------|----------|------|--------|
| 1 | superadmin | - | Superadmin | Active (seed) |
| 2 | admingereja | - | AdminGereja | Active (seed) |
| 3 | admingereja@gmail.com | - | AdminGereja | Active (terdahulu) |
| 5 | admin3@gereja.com | Admin123 | AdminGereja | Active (BARU - FIX) |

*Note: Password untuk ID 1-3 ada di seed.sql*

---

## 📝 HOW TO CREATE NEW ADMIN

### Option 1: Via API
```bash
POST /api/admin/create
Content-Type: application/json
Authorization: Bearer {superadmin_token}

{
  "username": "newadmin@gereja.com",
  "password": "StrongPassword123"
}
```

Backend akan otomatis hash password dengan bcrypt.

### Option 2: Direct Database Insert
```bash
# First, generate hash
node scripts/generate-hash.mjs

# Then insert
npx wrangler d1 execute app_gereja_db --remote --file=./migrations/add_new_admin.sql
```

---

## 🧪 TEST LOGIN

### Test dengan curl/Postman
```bash
POST https://app-gereja-api.antonio-girsang.workers.dev/api/auth/login
Content-Type: application/json

{
  "email": "admin3@gereja.com",
  "password": "Admin123"
}
```

**Expected Response**:
```json
{
  "message": "Login berhasil",
  "token": "eyJhbGc...",
  "user": {
    "id": 5,
    "username": "admin3@gereja.com",
    "role": "AdminGereja"
  }
}
```

---

## 🚀 DEPLOYMENT STATUS

- ✅ Backend deployed: v39496240-4c41-4879-84ad-e1b080e80493
- ✅ Database migrated: 0003_fix_admin_password.sql
- ✅ Admin account created: admin3@gereja.com
- ⏳ Frontend test needed: Try login now!

---

## 📋 FILES MODIFIED

1. `d:\app_gereja\src\worker.mjs` - Login function updated
2. `d:\app_gereja\migrations\0003_fix_admin_password.sql` - Created
3. `d:\app_gereja\scripts\generate-hash.mjs` - Created helper script

---

## ✨ KEY IMPROVEMENTS

1. **Flexible Auth**: Backend sekarang accept email OR username
2. **Secure Passwords**: All passwords harus di-hash dengan bcrypt
3. **Helper Script**: Tool untuk generate password hash dengan mudah
4. **Database Migration**: Proper migration file untuk tracking changes

---

## ⚠️ PENTING

- Jangan pernah insert plaintext password langsung ke database
- Selalu gunakan bcrypt untuk hash password
- Gunakan helper script `generate-hash.mjs` atau API `/api/admin/create`
