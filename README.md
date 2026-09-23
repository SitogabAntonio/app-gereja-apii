# APP GEREJA API on Cloudflare

Backend ini sekarang berjalan dengan:

- `Cloudflare Workers` untuk hosting API
- `Cloudflare D1` untuk data relasional
- `Workers Assets` gratis untuk file PDF pada path `/uploads/...`

Hasilnya FE bisa konsumsi API dengan pola:

```text
GET https://app-gereja-api.antonio-girsang.workers.dev/api/...
```

## Base URL

```text
https://app-gereja-api.antonio-girsang.workers.dev
```

## Arsitektur

- Entry worker: `src/worker.mjs`
- Konfigurasi deploy: `wrangler.toml`
- Schema utama: `migrations/0001_initial.sql`
- Tabel asset D1: `migrations/0002_file_assets.sql`
- Seed data: `migrations/seed.sql`
- Script import asset ke D1: `scripts/upload-assets-to-d1.ps1`

## Resource Cloudflare

- Worker: `app-gereja-api`
- D1 database: `app_gereja_db`
- Secret: `JWT_SECRET`

## Endpoint penting

- `GET /`
- `GET /api`
- `POST /api/auth/login`
- `GET /api/sejarah`
- `GET /api/minggu-batak`
- `GET /api/minggu-indonesia`
- `GET /api/partangiangan-wijk`
- `GET /api/partangiangan-keluarga`
- `GET /api/kontemporer`
- `GET /api/tingting`
- `GET /api/<resource>/:id/view`
- `GET /api/<resource>/:id/download`

## Contoh konsumsi FE

```text
GET https://app-gereja-api.antonio-girsang.workers.dev/api/partangiangan-wijk
GET https://app-gereja-api.antonio-girsang.workers.dev/api/partangiangan-keluarga
GET https://app-gereja-api.antonio-girsang.workers.dev/api/minggu-batak
POST https://app-gereja-api.antonio-girsang.workers.dev/api/auth/login
```

## Akun awal

- `superadmin / superadmin123`
- `admingereja / admingereja123`

Password ini sebaiknya langsung diganti setelah deploy.

## Catatan

- Data API sudah menggunakan D1.
- File PDF publik sekarang tersedia dari domain Worker yang sama tanpa R2.
- Worker juga sudah disiapkan untuk penyimpanan file ke D1, tetapi saat ini fallback file live memakai Workers Assets agar tetap gratis dan stabil.
- Jika ingin membatasi origin FE tertentu saja, ubah `ALLOWED_ORIGINS` di `wrangler.toml` atau secret/env sesuai kebutuhan.
