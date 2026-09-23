# 🔧 TROUBLESHOOTING GUIDE - APP GEREJA

## 🚨 Common Issues & Solutions

### 1. ❌ "Login gagal" atau "Username atau password salah"

#### Cause A: Password belum di-hash dengan bcrypt
```
Symptom: Plaintext password di database, login selalu gagal
Solution:
  1. Generate hash: node scripts/generate-hash.mjs
  2. Update database dengan hash yang benar
  3. Jangan pernah insert plaintext password!
```

#### Cause B: Salah mengirim field
```
Frontend mengirim:   { email: "admin@gereja.com", password: "xxx" }
Backend expect:      { username: "admin@gereja.com", password: "xxx" }

✅ SUDAH DIPERBAIKI - Backend sekarang accept BOTH email & username
```

#### Cause C: Account inactive
```
Symptom: "Akun Anda telah dinonaktifkan"
Solution: 
  1. Check: SELECT is_active FROM users WHERE username = '...';
  2. Activate: UPDATE users SET is_active = 1 WHERE username = '...';
```

#### Cause D: Typo di username/email
```
Database punya: admin3@gereja.com
User input:     admin3@geraja.com (typo!)
Solution: Verify exact username in database
  npx wrangler d1 execute app_gereja_db --remote --command "SELECT username FROM users;"
```

---

### 2. ❌ "Token tidak ditemukan" atau "Login berhasil, tetapi token tidak ditemukan"

**Cause**: Backend tidak mengembalikan token

```bash
# Check response dari login endpoint
curl -X POST https://app-gereja-api.antonio-girsang.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin3@gereja.com","password":"Admin123"}'
```

**Expected Response**:
```json
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

If no token, check:
1. Backend logs at Cloudflare Workers dashboard
2. Verify JWT_SECRET env var is set
3. Verify generateToken() function in worker.mjs

---

### 3. ❌ "Gagal mengambil data dari server" (API error)

#### Cause A: Network connection
```bash
# Test connectivity
curl -i https://app-gereja-api.antonio-girsang.workers.dev/api

# Should return 200 OK with message
```

#### Cause B: CORS issue
```
Frontend (myApp running on localhost:3000)
Backend (https://app-gereja-api.workers.dev)
CORS: *  (Allow all origins)

✅ Already configured - should work
```

#### Cause C: Invalid authorization header
```javascript
// Frontend must send token correctly
headers: {
  "Authorization": "Bearer eyJhbGc..."  // ✅ Correct format
  // NOT: "Bearer: ..." or "JWT ..." or "Token ..."
}
```

#### Cause D: Token expired (7 days)
```
Solution: User must login again to get new token
Frontend should handle 401 response and redirect to login
```

---

### 4. ❌ Cannot create/update admin

#### Cause A: No Superadmin role
```
Endpoint: POST /api/admin/create
Required: Authorization header with Superadmin token

✅ Try with: superadmin account (seed.sql)
```

#### Cause B: Password too short
```
Validation: Password minimum 6 characters
Error: "Password minimal 6 karakter"

Solution: Use password >= 6 chars
```

#### Cause C: Username already exists
```
Validation: Username UNIQUE constraint
Error: "Username sudah terdaftar"

Solution: Choose different username/email
```

---

### 5. ❌ PDF upload fails

#### Cause A: File too large
```
Check: D1 database size limits
Solution: Use R2 (Cloudflare storage) for larger files
```

#### Cause B: Invalid file type
```
Expected: .pdf files
Solution: Upload only PDF files
```

#### Cause C: Missing required fields
```
Required: tanggal, file
Optional: lokasi (partangiangan-wijk/partangiangan-keluarga), waktu (partangiangan-wijk/partangiangan-keluarga)

Solution: Check request body format
```

---

### 6. ❌ Database connection error

**Symptom**: "D1 database unavailable" or "Cannot connect"

```bash
# Check if migration is running
npx wrangler d1 execute app_gereja_db --remote --command "SELECT 1;"

# If stuck in migration, might need to wait 5-10 minutes
# D1 automatically recovers
```

---

## 🔍 DEBUGGING TIPS

### View all users in database
```bash
npx wrangler d1 execute app_gereja_db --remote --command "SELECT id, username, role, is_active FROM users;"
```

### Check user password is hashed correctly
```bash
npx wrangler d1 execute app_gereja_db --remote --command "SELECT username, password FROM users WHERE id = 5;"

# Should see: $2b$10$aw8vH... (bcrypt hash)
# NOT:        Admin123 (plaintext)
```

### View all tables and structure
```bash
npx wrangler d1 execute app_gereja_db --remote --command "PRAGMA table_info(users);"
```

### Test backend endpoint directly
```bash
# Test login
curl -X POST https://app-gereja-api.antonio-girsang.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin3@gereja.com","password":"Admin123"}' | jq .

# Test get all sermons
curl https://app-gereja-api.antonio-girsang.workers.dev/api/minggu-batak | jq .

# Test admin list (need token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://app-gereja-api.antonio-girsang.workers.dev/api/admin | jq .
```

### Enable debug logging
```bash
# In frontend (React/JavaScript)
localStorage.setItem('DEBUG', 'app-gereja:*');

# In backend (worker.mjs)
console.error('Error:', error); // Will appear in Cloudflare Workers logs
```

---

## 📊 MONITORING & LOGS

### Cloudflare Workers Dashboard
1. Go to: https://dash.cloudflare.com
2. Navigate to Workers & Pages
3. Select "app-gereja-api"
4. View Real-time logs
5. Check error rates

### Local Development
```bash
# Frontend
npm start  # Will show console logs

# Backend
npm run dev  # Runs local development server
```

---

## ✅ QUICK CHECKLIST

When login fails:
- [ ] Password is bcrypt hashed (starts with $2b$10$)
- [ ] Username/email matches exactly (no typos)
- [ ] Account is active (is_active = 1)
- [ ] Backend is deployed and running
- [ ] Network connection is working
- [ ] Authorization header format is correct

When creating admin:
- [ ] Using Superadmin token (not AdminGereja)
- [ ] Password is >= 6 characters
- [ ] Username is unique (not already exists)
- [ ] Request body includes username and password

When updating content:
- [ ] User has AdminGereja or Superadmin role
- [ ] Token is not expired (< 7 days)
- [ ] Required fields are provided
- [ ] File upload has correct MIME type

---

## 📞 ADVANCED HELP

### Backend Internal Functions
- `login()` - Line 354: Handle authentication
- `createAdminGereja()` - Line 399: Create admin
- `requireRole()` - Check authorization
- `bcrypt.compare()` - Verify password against hash

### Frontend Imports
- `loginAdmin()` - in `constants/adminApi.js`
- `getAdminToken()` - Get stored JWT
- `setAdminToken()` - Save JWT to localStorage

### Database Constraints
- `username`: UNIQUE, NOT NULL
- `password`: NOT NULL
- `role`: CHECK(role IN ('Superadmin', 'AdminGereja'))
- `is_active`: NOT NULL DEFAULT 1

---

## 🎓 LEARNING RESOURCES

- **bcryptjs**: https://github.com/dcodeIO/bcrypt.js
- **JWT**: https://jwt.io/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **D1 Database**: https://developers.cloudflare.com/d1/
- **Expo Routing**: https://docs.expo.dev/routing/introduction/

---

**Last Updated**: May 4, 2026
**Status**: Comprehensive Guide
