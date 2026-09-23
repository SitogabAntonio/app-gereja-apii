import bcrypt from "bcryptjs";

const JWT_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;

const PDF_RESOURCES = {
  "minggu-batak": {
    tableName: "minggu_batak",
    storageFolder: "minggu-batak",
    fields: ["tanggal", "file"],
    requiredFields: ["tanggal", "file"],
    orderBy: "tanggal DESC, id DESC",
  },
  "minggu-indonesia": {
    tableName: "minggu_indonesia",
    storageFolder: "minggu-indonesia",
    fields: ["tanggal", "file"],
    requiredFields: ["tanggal", "file"],
    orderBy: "tanggal DESC, id DESC",
  },
  "partangiangan-wijk": {
    tableName: "partangiangan_wijk",
    storageFolder: "partangiangan-wijk",
    fields: ["tanggal", "lokasi", "waktu", "file"],
    requiredFields: ["tanggal", "lokasi", "waktu", "file"],
    orderBy: "tanggal DESC, id DESC",
  },
  "partangiangan-keluarga": {
    tableName: "partangiangan_keluarga",
    storageFolder: "partangiangan-keluarga",
    fields: ["tanggal", "lokasi", "waktu", "file"],
    requiredFields: ["tanggal", "lokasi", "waktu", "file"],
    orderBy: "tanggal DESC, id DESC",
  },
  kontemporer: {
    tableName: "kontemporer",
    storageFolder: "kontemporer",
    fields: ["tanggal", "file"],
    requiredFields: ["tanggal", "file"],
    orderBy: "tanggal DESC, id DESC",
  },
  tingting: {
    tableName: "tingting",
    storageFolder: "tingting",
    fields: ["tanggal", "file"],
    requiredFields: ["tanggal", "file"],
    orderBy: "tanggal DESC, id DESC",
  },
};

const JSON_RESOURCES = {
  sejarah: {
    tableName: "sejarah",
    storageFolder: "sejarah",
    fields: ["deskripsi", "gambar"],
    requiredFields: ["deskripsi", "gambar"],
    fileFields: ["gambar"],
    orderBy: "id DESC",
  },
};

export default {
  async fetch(request, env) {
    try {
      const response = await handleRequest(request, env);
      return withCors(request, env, response);
    } catch (error) {
      console.error("Unhandled request error:", error);
      const status = error.statusCode || 500;
      const message = error.message || "Terjadi kesalahan pada server";
      return jsonResponse(
        { message, error: String(error) },
        {
          status,
          headers: corsHeaders(request, env),
        }
      );
    }
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const pathName = trimTrailingSlash(url.pathname);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, env),
    });
  }

  try {
    // Route handlers
    if (request.method === "GET" && pathName === "") {
      return json(request, env, {
        message: "APP_GEREJA backend is running on Cloudflare Workers",
      });
    }

    if (request.method === "GET" && pathName === "/api") {
      return json(request, env, {
        message: "API APP_GEREJA siap digunakan",
        endpoints: {
          auth: {
            login: "POST /api/auth/login",
            admin: {
              create: "POST /api/admin/create",
              list: "GET /api/admin",
              activate: "PUT /api/admin/:id/activate",
              deactivate: "PUT /api/admin/:id/deactivate",
              delete: "DELETE /api/admin/:id",
              changePassword: "PUT /api/admin/change-password",
            },
          },
          public: {
            sejarah: "GET /api/sejarah",
            minggu_batak: "GET /api/minggu-batak",
            minggu_indonesia: "GET /api/minggu-indonesia",
            partangiangan_wijk: "GET /api/partangiangan-wijk",
            partangiangan_keluarga: "GET /api/partangiangan-keluarga",
            kontemporer: "GET /api/kontemporer",
            tingting: "GET /api/tingting",
          },
          adminOnly: {
            sejarah: "POST/PUT/DELETE /api/sejarah",
            minggu_batak: "POST/PUT/DELETE /api/minggu-batak",
            minggu_indonesia: "POST/PUT/DELETE /api/minggu-indonesia",
            partangiangan_wijk: "POST/PUT/DELETE /api/partangiangan-wijk",
            partangiangan_keluarga: "POST/PUT/DELETE /api/partangiangan-keluarga",
            kontemporer: "POST/PUT/DELETE /api/kontemporer",
            tingting: "POST/PUT/DELETE /api/tingting",
          },
        },
      });
    }

    if (request.method === "GET" && pathName.startsWith("/uploads/")) {
      return serveAsset(request, env, pathName.slice(1), "inline");
    }

    if (pathName === "/api/auth/login" && request.method === "POST") {
      return login(request, env);
    }

    if (pathName === "/api/admin" && request.method === "GET") {
      const user = await requireRole(request, env, ["Superadmin"]);
      return listAdminGereja(request, env, user);
    }

    if (pathName === "/api/admin/create" && request.method === "POST") {
      await requireRole(request, env, ["Superadmin"]);
      return createAdminGereja(request, env);
    }

    if (pathName === "/api/admin/change-password" && request.method === "PUT") {
      await requireRole(request, env, ["Superadmin"]);
      return changePassword(request, env);
    }

    if (pathName === "/api/admin/assets/import" && request.method === "POST") {
      await requireRole(request, env, ["Superadmin"]);
      return importAsset(request, env);
    }

    const activateMatch = pathName.match(/^\/api\/admin\/(\d+)\/activate$/);
    if (activateMatch && request.method === "PUT") {
      await requireRole(request, env, ["Superadmin"]);
      return activateAdminGereja(request, env, activateMatch[1]);
    }

    const deactivateMatch = pathName.match(/^\/api\/admin\/(\d+)\/deactivate$/);
    if (deactivateMatch && request.method === "PUT") {
      await requireRole(request, env, ["Superadmin"]);
      return deactivateAdminGereja(request, env, deactivateMatch[1]);
    }

    const deleteAdminMatch = pathName.match(/^\/api\/admin\/(\d+)$/);
    if (deleteAdminMatch && request.method === "DELETE") {
      await requireRole(request, env, ["Superadmin"]);
      return deleteAdminGereja(request, env, deleteAdminMatch[1]);
    }

    const jsonMatch = pathName.match(/^\/api\/(sejarah)(?:\/(\d+))?$/);
    if (jsonMatch) {
      return handleJsonResource(request, env, jsonMatch[1], jsonMatch[2] || null);
    }

    const pdfActionMatch = pathName.match(/^\/api\/([a-z-]+)\/(\d+)\/(view|download)$/);
    if (pdfActionMatch && PDF_RESOURCES[pdfActionMatch[1]]) {
      return handlePdfFileAction(request, env, pdfActionMatch[1], pdfActionMatch[2], pdfActionMatch[3]);
    }

    const pdfMatch = pathName.match(/^\/api\/([a-z-]+)(?:\/(\d+))?$/);
    if (pdfMatch && PDF_RESOURCES[pdfMatch[1]]) {
      return handlePdfResource(request, env, pdfMatch[1], pdfMatch[2] || null);
    }

    return notFound(request, env);
  } catch (error) {
    console.error("Request error:", error);
    const status = error.statusCode || 500;
    const message = error.message || "Terjadi kesalahan pada server";
    return json(request, env, { message, error: String(error) }, status);
  }
}

async function handleJsonResource(request, env, resourceName, id) {
  const config = JSON_RESOURCES[resourceName];

  if (request.method === "GET" && !id) {
    const rows = await queryAll(env.DB, `SELECT * FROM ${config.tableName} ORDER BY ${config.orderBy}`);
    return json(request, env, rows.map((row) => buildJsonResourceUrls(request, resourceName, row, config)));
  }

  if (request.method === "GET" && id) {
    const row = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
    if (!row) {
      throw createError(`Data ${config.tableName} dengan id ${id} tidak ditemukan`, 404);
    }
    return json(request, env, buildJsonResourceUrls(request, resourceName, row, config));
  }

  if (request.method === "POST") {
    await requireRole(request, env, ["AdminGereja", "Superadmin"]);
    const body = await parseJsonResourcePayload(request, env, config);
    validateRequiredFields(body, config.requiredFields);

    const result = await executeRun(
      env.DB,
      `INSERT INTO ${config.tableName} (${config.fields.join(", ")}) VALUES (${config.fields.map(() => "?").join(", ")})`,
      config.fields.map((field) => body[field])
    );

    const created = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [result.id]);
    return json(request, env, buildJsonResourceUrls(request, resourceName, created, config), 201);
  }

  if (request.method === "PUT" && id) {
    await requireRole(request, env, ["AdminGereja", "Superadmin"]);
    const existing = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
    if (!existing) {
      throw createError(`Data ${config.tableName} dengan id ${id} tidak ditemukan`, 404);
    }

    const body = await parseJsonResourcePayload(request, env, config, existing);
    validateRequiredFields(body, config.requiredFields);

    await executeRun(
      env.DB,
      `UPDATE ${config.tableName} SET ${config.fields.map((field) => `${field} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...config.fields.map((field) => body[field]), id]
    );

    const updated = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
    return json(request, env, buildJsonResourceUrls(request, resourceName, updated, config));
  }

  if (request.method === "DELETE" && id) {
    await requireRole(request, env, ["AdminGereja", "Superadmin"]);
    const existing = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
    if (!existing) {
      throw createError(`Data ${config.tableName} dengan id ${id} tidak ditemukan`, 404);
    }

    await executeRun(env.DB, `DELETE FROM ${config.tableName} WHERE id = ?`, [id]);
    for (const field of config.fileFields || []) {
      if (existing[field]) {
        await deleteAsset(env.DB, existing[field]);
      }
    }
    return json(request, env, { message: `Data ${config.tableName} berhasil dihapus` });
  }

  return notFound(request, env);
}

async function handlePdfResource(request, env, resourceName, id) {
  const config = PDF_RESOURCES[resourceName];

  if (request.method === "GET" && !id) {
    const rows = await queryAll(env.DB, `SELECT * FROM ${config.tableName} ORDER BY ${config.orderBy}`);
    return json(request, env, rows.map((row) => buildPdfUrls(request, resourceName, row)));
  }

  if (request.method === "GET" && id) {
    const row = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
    if (!row) {
      throw createError(`Data ${config.tableName} dengan id ${id} tidak ditemukan`, 404);
    }
    return json(request, env, buildPdfUrls(request, resourceName, row));
  }

  if (request.method === "POST") {
    await requireRole(request, env, ["AdminGereja", "Superadmin"]);
    return createPdfRecord(request, env, resourceName, config);
  }

  if (request.method === "PUT" && id) {
    await requireRole(request, env, ["AdminGereja", "Superadmin"]);
    return updatePdfRecord(request, env, resourceName, config, id);
  }

  if (request.method === "DELETE" && id) {
    await requireRole(request, env, ["AdminGereja", "Superadmin"]);
    const existing = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
    if (!existing) {
      throw createError(`Data ${config.tableName} dengan id ${id} tidak ditemukan`, 404);
    }

    await executeRun(env.DB, `DELETE FROM ${config.tableName} WHERE id = ?`, [id]);
    if (existing.file) {
      await deleteAsset(env.DB, existing.file);
    }

    return json(request, env, { message: `Data ${config.tableName} berhasil dihapus` });
  }

  return notFound(request, env);
}

async function handlePdfFileAction(request, env, resourceName, id, action) {
  if (request.method !== "GET") {
    return notFound(request, env);
  }

  const config = PDF_RESOURCES[resourceName];
  const row = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
  if (!row) {
    throw createError(`Data ${config.tableName} dengan id ${id} tidak ditemukan`, 404);
  }

  return serveAsset(request, env, row.file, action === "download" ? "attachment" : "inline");
}

async function createPdfRecord(request, env, resourceName, config) {
  const { body, file } = await parseMultipartRequest(request);
  validateRequiredFields(body, config.requiredFields.filter((field) => field !== "file"));
  if (!file) {
    throw createError("File PDF wajib diupload", 400);
  }

  const key = await storeUploadedPdf(env.DB, config.storageFolder, file);
  const payload = {
    ...body,
    file: key,
  };

  const result = await executeRun(
    env.DB,
    `INSERT INTO ${config.tableName} (${config.fields.join(", ")}) VALUES (${config.fields.map(() => "?").join(", ")})`,
    config.fields.map((field) => payload[field])
  );

  const created = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [result.id]);
  return json(request, env, buildPdfUrls(request, resourceName, created), 201);
}

async function updatePdfRecord(request, env, resourceName, config, id) {
  const existing = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
  if (!existing) {
    throw createError(`Data ${config.tableName} dengan id ${id} tidak ditemukan`, 404);
  }

  const { body, file } = await parseMultipartRequest(request);
  validateRequiredFields(body, config.requiredFields.filter((field) => field !== "file"));

  let nextFileKey = existing.file;
  let uploadedReplacementKey = null;

  if (file) {
    uploadedReplacementKey = await storeUploadedPdf(env.DB, config.storageFolder, file);
    nextFileKey = uploadedReplacementKey;
  }

  await executeRun(
    env.DB,
    `UPDATE ${config.tableName} SET ${config.fields.map((field) => `${field} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...config.fields.map((field) => (field === "file" ? nextFileKey : body[field])), id]
  );

  if (uploadedReplacementKey && existing.file && existing.file !== uploadedReplacementKey) {
    await deleteAsset(env.DB, existing.file);
  }

  const updated = await queryFirst(env.DB, `SELECT * FROM ${config.tableName} WHERE id = ?`, [id]);
  return json(request, env, buildPdfUrls(request, resourceName, updated));
}

async function parseJsonResourcePayload(request, env, config, existing = null) {
  const contentType = request.headers.get("content-type") || "";
  const fileFields = config.fileFields || [];

  if (!contentType.includes("multipart/form-data")) {
    return parseRequestBody(request);
  }

  const formData = await request.formData();
  const body = {};
  const uploadedKeys = [];

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (fileFields.includes(key) && value.size > 0) {
        const storedKey = await storeUploadedAsset(env.DB, config.storageFolder, value);
        body[key] = storedKey;
        uploadedKeys.push({ field: key, key: storedKey });
      }
      continue;
    }

    body[key] = value;
  }

  if (existing) {
    for (const field of fileFields) {
      if (!body[field] && existing[field]) {
        body[field] = existing[field];
      }
    }
  }

  for (const uploaded of uploadedKeys) {
    const previousKey = existing?.[uploaded.field];
    if (previousKey && previousKey !== uploaded.key) {
      await deleteAsset(env.DB, previousKey);
    }
  }

  return body;
}

async function login(request, env) {
  const body = await parseRequestBody(request);
  const { username, email, password } = body;
  
  // Accept either username or email
  const credential = username || email;

  if (!credential || !password) {
    throw createError("Username/Email dan password harus diisi", 400);
  }

  const user = await queryFirst(
    env.DB,
    "SELECT id, username, password, role, is_active FROM users WHERE username = ?",
    [credential]
  );

  if (!user) {
    throw createError("Username atau password salah", 401);
  }

  if (!user.is_active) {
    throw createError("Akun Anda telah dinonaktifkan", 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError("Username atau password salah", 401);
  }

  const token = await generateToken(env.JWT_SECRET, {
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return json(request, env, {
    message: "Login berhasil",
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
}

async function createAdminGereja(request, env) {
  const body = await parseRequestBody(request);
  const { username, password } = body;

  if (!username || !password) {
    throw createError("Username dan password harus diisi", 400);
  }

  if (String(password).length < 6) {
    throw createError("Password minimal 6 karakter", 400);
  }

  const existingUser = await queryFirst(env.DB, "SELECT id FROM users WHERE username = ?", [username]);
  if (existingUser) {
    throw createError("Username sudah terdaftar", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await executeRun(
    env.DB,
    "INSERT INTO users (username, password, role, is_active) VALUES (?, ?, ?, 1)",
    [username, hashedPassword, "AdminGereja"]
  );

  return json(
    request,
    env,
    {
      message: "Admin Gereja berhasil dibuat",
      admin: {
        id: result.id,
        username,
        role: "AdminGereja",
      },
    },
    201
  );
}

async function listAdminGereja(request, env) {
  const admins = await queryAll(
    env.DB,
    `SELECT id, username, role, is_active, created_at, updated_at
     FROM users
     WHERE role = 'AdminGereja'
     ORDER BY created_at DESC`
  );

  return json(request, env, {
    message: "Daftar Admin Gereja",
    data: admins,
  });
}

async function deactivateAdminGereja(request, env, id) {
  const admin = await queryFirst(env.DB, "SELECT id, role FROM users WHERE id = ?", [id]);
  if (!admin) {
    throw createError("Admin tidak ditemukan", 404);
  }
  if (admin.role !== "AdminGereja") {
    throw createError("User bukan Admin Gereja", 400);
  }

  await executeRun(env.DB, "UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  return json(request, env, { message: "Admin Gereja berhasil dinonaktifkan" });
}

async function activateAdminGereja(request, env, id) {
  const admin = await queryFirst(env.DB, "SELECT id, role FROM users WHERE id = ?", [id]);
  if (!admin) {
    throw createError("Admin tidak ditemukan", 404);
  }
  if (admin.role !== "AdminGereja") {
    throw createError("User bukan Admin Gereja", 400);
  }

  await executeRun(env.DB, "UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
  return json(request, env, { message: "Admin Gereja berhasil diaktifkan" });
}

async function deleteAdminGereja(request, env, id) {
  const admin = await queryFirst(env.DB, "SELECT id, role FROM users WHERE id = ?", [id]);
  if (!admin) {
    throw createError("Admin tidak ditemukan", 404);
  }
  if (admin.role !== "AdminGereja") {
    throw createError("User bukan Admin Gereja", 400);
  }

  await executeRun(env.DB, "DELETE FROM users WHERE id = ?", [id]);
  return json(request, env, { message: "Admin Gereja berhasil dihapus" });
}

async function changePassword(request, env) {
  const body = await parseRequestBody(request);
  const { adminId, newPassword } = body;

  if (!adminId || !newPassword) {
    throw createError("Admin ID dan password baru harus diisi", 400);
  }

  if (String(newPassword).length < 6) {
    throw createError("Password minimal 6 karakter", 400);
  }

  const admin = await queryFirst(env.DB, "SELECT id FROM users WHERE id = ?", [adminId]);
  if (!admin) {
    throw createError("Admin tidak ditemukan", 404);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await executeRun(
    env.DB,
    "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [hashedPassword, adminId]
  );

  return json(request, env, { message: "Password berhasil diubah" });
}

async function importAsset(request, env) {
  const formData = await request.formData();
  const key = String(formData.get("key") || "");
  const file = formData.get("file");

  if (!key) {
    throw createError("Field 'key' wajib diisi", 400);
  }

  if (!(file instanceof File) || file.size === 0) {
    throw createError("File PDF wajib diupload", 400);
  }

  await saveAsset(env.DB, key, file, file.name || key.split("/").pop());

  return json(request, env, {
    message: "Asset berhasil diimport",
    key,
  });
}

async function requireRole(request, env, allowedRoles) {
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);

  if (!token) {
    throw createError("Token tidak ditemukan. Silakan login terlebih dahulu.", 401);
  }

  const payload = await verifyToken(env.JWT_SECRET, token);
  if (!payload) {
    throw createError("Token tidak valid atau sudah expired.", 401);
  }

  if (!allowedRoles.includes(payload.role)) {
    const message =
      allowedRoles.length === 1 && allowedRoles[0] === "Superadmin"
        ? "Akses hanya untuk Superadmin"
        : "Akses hanya untuk Admin atau Superadmin";
    throw createError(message, 403);
  }

  return payload;
}

async function parseRequestBody(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return formDataToObject(formData);
  }

  const text = await request.text();
  return text ? JSON.parse(text) : {};
}

async function parseMultipartRequest(request) {
  try {
    const formData = await request.formData();
    const body = {};
    let file = null;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (key === "file" && value.size > 0) {
          file = value;
        }
        continue;
      }

      body[key] = value;
    }

    return { body, file };
  } catch (error) {
    console.error("Error parsing multipart request:", error);
    throw createError(`Gagal memproses form data: ${error.message}`, 400);
  }
}

function formDataToObject(formData) {
  const result = {};
  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File)) {
      result[key] = value;
    }
  }
  return result;
}

function validateRequiredFields(body, fields) {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      throw createError(`Field '${field}' wajib diisi`, 400);
    }
  }
}

async function saveAsset(db, key, file, fileName) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (bytes.byteLength > 2_000_000) {
    throw createError("Ukuran file melebihi batas D1 2MB per file", 400);
  }

  await executeRun(
    db,
    `INSERT INTO file_assets (asset_key, file_name, content_type, file_size, file_blob, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(asset_key) DO UPDATE SET
       file_name = excluded.file_name,
       content_type = excluded.content_type,
       file_size = excluded.file_size,
       file_blob = excluded.file_blob,
       updated_at = CURRENT_TIMESTAMP`,
    [key, fileName, file.type || "application/pdf", bytes.byteLength, arrayBuffer]
  );
}

async function storeUploadedAsset(db, folder, file) {
  const safeOriginalName = file.name.replace(/\s+/g, "-");
  const fileName = `${Date.now()}-${safeOriginalName}`;
  const key = `uploads/${folder}/${fileName}`;

  await saveAsset(db, key, file, fileName);

  return key;
}

async function deleteAsset(db, key) {
  await executeRun(db, "DELETE FROM file_assets WHERE asset_key = ?", [key]);
}

async function storeUploadedPdf(db, folder, file) {
  const safeOriginalName = file.name.replace(/\s+/g, "-");

  if (!safeOriginalName.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    throw createError("File yang diupload harus PDF", 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    throw createError("Ukuran file maksimal 10MB", 400);
  }

  return storeUploadedAsset(db, folder, file);
}

async function serveAsset(request, env, key, dispositionMode) {
  const asset = await queryFirst(
    env.DB,
    "SELECT file_name, content_type, file_blob FROM file_assets WHERE asset_key = ?",
    [key]
  );

  if (!asset && env.ASSETS) {
    const url = new URL(request.url);
    const assetResponse = await env.ASSETS.fetch(new Request(`${url.origin}/${key}`, request));
    if (assetResponse.status !== 404) {
      const headers = new Headers(assetResponse.headers);
      const fileName = key.split("/").pop();
      const dispositionPrefix = dispositionMode === "attachment" ? "attachment" : "inline";
      headers.set("Content-Disposition", `${dispositionPrefix}; filename="${encodeQuotedString(fileName)}"`);

      return withCors(
        request,
        env,
        new Response(assetResponse.body, {
          status: assetResponse.status,
          statusText: assetResponse.statusText,
          headers,
        })
      );
    }
  }

  if (!asset) {
    throw createError("File PDF tidak ditemukan", 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", asset.content_type || "application/pdf");

  const fileName = asset.file_name || key.split("/").pop();
  const dispositionPrefix = dispositionMode === "attachment" ? "attachment" : "inline";
  headers.set("Content-Disposition", `${dispositionPrefix}; filename="${encodeQuotedString(fileName)}"`);

  return withCors(request, env, new Response(normalizeBlobValue(asset.file_blob), { headers }));
}

function buildPdfUrls(request, routeName, row) {
  const url = new URL(request.url);
  return {
    ...row,
    file_url: `${url.origin}/${row.file}`,
    view_url: `${url.origin}/api/${routeName}/${row.id}/view`,
    download_url: `${url.origin}/api/${routeName}/${row.id}/download`,
    file_name: row.file.split("/").pop(),
  };
}

function buildJsonResourceUrls(request, routeName, row, config) {
  const url = new URL(request.url);
  const result = { ...row };

  for (const field of config.fileFields || []) {
    if (row[field]) {
      result[`${field}_url`] = `${url.origin}/${row[field]}`;
    }
  }

  return result;
}

async function queryAll(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).all();
  if (!result.success) {
    throw new Error(result.error || "Gagal menjalankan query");
  }
  return result.results || [];
}

async function queryFirst(db, sql, params = []) {
  return db.prepare(sql).bind(...params).first();
}

async function executeRun(db, sql, params = []) {
  try {
    const result = await db.prepare(sql).bind(...params).run();
    return {
      id: result.meta?.last_row_id ?? null,
      changes: result.meta?.changes ?? 0,
    };
  } catch (error) {
    throw mapSqliteError(error);
  }
}

function mapSqliteError(error) {
  if (!error?.message) {
    return error;
  }

  if (error.message.includes("UNIQUE constraint failed")) {
    return createError("Data memiliki nilai unik yang sudah digunakan", 400);
  }

  if (error.message.includes("CHECK constraint failed")) {
    return createError("Role user hanya boleh 'Superadmin' atau 'AdminGereja'", 400);
  }

  return error;
}

async function generateToken(secret, payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + JWT_EXPIRATION_SECONDS };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signature = await signHmacSha256(secret, `${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyToken(secret, token) {
  const [encodedHeader, encodedPayload, signature] = String(token).split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signHmacSha256(secret, `${encodedHeader}.${encodedPayload}`);
  if (signature !== expectedSignature) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) {
    return null;
  }

  return payload;
}

async function signHmacSha256(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function extractToken(authHeader) {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function trimTrailingSlash(pathName) {
  if (pathName === "/") {
    return "";
  }
  return pathName.endsWith("/") ? pathName.slice(0, -1) : pathName;
}

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function notFound(request, env) {
  return json(request, env, { message: `Route ${request.method} ${new URL(request.url).pathname} tidak ditemukan` }, 404);
}

function json(request, env, data, status = 200) {
  return jsonResponse(data, { status });
}

function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

function withCors(request, env, response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of corsHeaders(request, env)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function corsHeaders(request, env) {
  const headers = new Headers();
  const allowedOrigin = resolveAllowedOrigin(request, env);
  const requestedHeaders = request.headers.get("Access-Control-Request-Headers");

  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", requestedHeaders || "Authorization, Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin, Access-Control-Request-Headers");

  return headers;
}

function resolveAllowedOrigin(request, env) {
  const origin = request.headers.get("origin");
  const configured = (env.ALLOWED_ORIGINS || "*").trim();

  if (configured === "*") {
    return "*";
  }

  if (!origin) {
    return configured.split(",")[0].trim();
  }

  const allowedOrigins = configured.split(",").map((item) => item.trim()).filter(Boolean);
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || null;
}

function base64UrlEncode(value) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeQuotedString(value) {
  return String(value).replace(/"/g, "");
}

function normalizeBlobValue(value) {
  if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
    return value;
  }

  if (Array.isArray(value)) {
    return new Uint8Array(value);
  }

  return value;
}
