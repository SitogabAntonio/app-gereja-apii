INSERT OR IGNORE INTO users (id, username, password, role, is_active)
VALUES
  (1, 'superadmin', '$2b$10$WrdbKRzoQ12.zaz1BZAjAunYQn97zGtGZSIsYgtDOugXj6lrhdrEe', 'Superadmin', 1),
  (2, 'admingereja', '$2b$10$i/Br6J2wssA7I6D9uXgTweRq7Z23Hh6zHi9RX6Dsafp3xQkMNw.JW', 'AdminGereja', 1);

INSERT OR IGNORE INTO sejarah (id, deskripsi, gambar)
VALUES
  (1, 'Gereja APP_GEREJA berdiri sebagai tempat persekutuan jemaat untuk beribadah, bertumbuh dalam iman, dan melayani bersama di tengah masyarakat.', 'sejarah-gereja-1.jpg'),
  (2, 'Seiring waktu, gereja berkembang dengan pelayanan sekolah minggu, ibadah keluarga, dan berbagai kegiatan pembinaan rohani jemaat.', 'sejarah-gereja-2.jpg');

INSERT OR IGNORE INTO minggu_batak (id, tanggal, file)
VALUES
  (1, '2026-04-19', 'uploads/minggu-batak/minggu-batak-2026-04-19.pdf'),
  (2, '2026-04-26', 'uploads/minggu-batak/minggu-batak-2026-04-26.pdf');

INSERT OR IGNORE INTO minggu_indonesia (id, tanggal, file)
VALUES
  (1, '2026-04-19', 'uploads/minggu-indonesia/minggu-indonesia-2026-04-19.pdf'),
  (2, '2026-04-26', 'uploads/minggu-indonesia/minggu-indonesia-2026-04-26.pdf');

INSERT OR IGNORE INTO partangiangan_wijk (id, tanggal, lokasi, waktu, file)
VALUES
  (1, '2026-04-20', 'Wijk I', '19:00', 'uploads/partangiangan-wijk/partangiangan-wijk-2026-04-20.pdf');

INSERT OR IGNORE INTO partangiangan_keluarga (id, tanggal, lokasi, waktu, file)
VALUES
  (1, '2026-04-27', 'Rumah Keluarga Sitorus', '19:30', 'uploads/partangiangan-keluarga/partangiangan-keluarga-2026-04-27.pdf');

INSERT OR IGNORE INTO kontemporer (id, tanggal, file)
VALUES
  (1, '2026-04-21', 'uploads/kontemporer/kontemporer-2026-04-21.pdf'),
  (2, '2026-04-28', 'uploads/kontemporer/kontemporer-2026-04-28.pdf');

INSERT OR IGNORE INTO tingting (id, tanggal, file)
VALUES
  (1, '2026-04-20', 'uploads/tingting/contoh-tingting.pdf');
