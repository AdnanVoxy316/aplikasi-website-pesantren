# PRD — Aplikasi Website ELMS Pesantren

**Versi:** 1.0
**Tanggal:** 3 September 2026
**Status:** Draft untuk pengembangan (HTML Prototype → Next.js → TypeScript)

---

## 1. Ringkasan & Latar Belakang

ELMS Pesantren adalah aplikasi web *Learning Management System* (LMS) yang dirancang khusus untuk kebutuhan operasional pesantren: mengelola akun pengguna, kelas, mata pelajaran (mapel) yang bersifat fleksibel/dapat dikustomisasi, penilaian, kehadiran, rapor otomatis, dan pengumpulan tugas digital.

Karakteristik utama yang membedakan dari LMS sekolah formal biasa:
- Struktur kelas dan mapel **tidak baku** — admin bisa membuat kelas seperti *Ibtida A, Ibtida B, Ibtida C*, dst, serta mapel pesantren (hafalan Qur'an, kitab kuning, akhlak) maupun mapel umum, semua dikonfigurasi sendiri lewat panel admin.
- Mendukung 4 peran (role) dalam satu sistem login yang sama.
- Rapor dihitung otomatis dari kombinasi nilai tugas/ujian dan data kehadiran.

---

## 2. Tujuan Produk

1. Menyediakan satu platform terpusat untuk manajemen akademik pesantren.
2. Memudahkan admin mengatur struktur kelas & mapel tanpa perlu bantuan developer (self-service configuration).
3. Memudahkan guru menilai, mencatat kehadiran, dan mencetak rapor otomatis.
4. Memudahkan santri mengumpulkan tugas dalam berbagai format (file & link).
5. Memberi wali santri visibilitas terhadap perkembangan akademik & kehadiran anaknya.

---

## 3. Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Tahap 1 (Prototype) | HTML + CSS (+ vanilla JS bila perlu) | Untuk validasi alur UI/UX sebelum masuk framework |
| Tahap 2 (Migrasi) | Next.js (App Router) | Migrasi dari prototype HTML |
| Tahap 3 (Final) | Next.js + TypeScript | Type-safety penuh di seluruh codebase |
| Styling | Tailwind CSS | Utility-first |
| ORM | Drizzle ORM | Type-safe query builder |
| Database | SQLite | File-based, cocok untuk skala pesantren tunggal; migrasi ke PostgreSQL dimungkinkan di masa depan bila multi-pesantren/skala besar |
| Autentikasi | BetterAuth | Session-based auth, role-based access control (RBAC) |
| File Storage | Local storage (filesystem server) | Path file disimpan di DB, file fisik di disk server |
| Cetak Rapor | HTML-to-PDF (misal Puppeteer / react-pdf) | Generate PDF dari data nilai + kehadiran |

### Rekomendasi tambahan (silakan dipertimbangkan):
- **Zod** untuk validasi input form & API route.
- **React Hook Form** untuk form-form kompleks (input nilai massal, tambah akun).
- **shadcn/ui** di atas Tailwind untuk komponen siap pakai (tabel, dialog, dsb).
- **node-cron** atau scheduled job sederhana untuk reminder tugas mendekati deadline.

---

## 4. Role & Hak Akses (RBAC)

Satu sistem login (`/login`) untuk semua role — sistem mengarahkan (redirect) ke dashboard sesuai role setelah autentikasi berhasil via BetterAuth session.

| Role | Deskripsi |
|---|---|
| **Admin** | Pengelola penuh sistem: akun, kelas, mapel, penugasan guru, pengaturan situs |
| **Guru** | Mengajar 1 atau lebih kelas & mapel; menilai, mencatat kehadiran, mencetak rapor, mengelola tugas |
| **Santri** | Mengikuti kelas yang diikutkan, mengumpulkan tugas, melihat nilai & rapor sendiri |
| **Wali Santri** | Orang tua/wali; melihat nilai, kehadiran, dan rapor anak (read-only) |

### Matriks Hak Akses (ringkas)

| Fitur | Admin | Guru | Santri | Wali Santri |
|---|:---:|:---:|:---:|:---:|
| Kelola akun (CRUD guru/santri/wali) | ✅ | ❌ | ❌ | ❌ |
| Kelola kelas & mapel | ✅ | ❌ | ❌ | ❌ |
| Pengaturan situs (logo, nama pesantren, dll) | ✅ | ❌ | ❌ | ❌ |
| Penugasan guru ke kelas/mapel | ✅ | ❌ | ❌ | ❌ |
| Input nilai | ❌ | ✅ (kelas diampu) | ❌ | ❌ |
| Input/edit kehadiran | ❌ | ✅ (kelas diampu) | ❌ | ❌ |
| Cetak/generate rapor | ✅ (semua) | ✅ (kelas diampu) | ❌ | ❌ |
| Lihat rapor sendiri/anak | ❌ | ❌ | ✅ (diri sendiri) | ✅ (anaknya) |
| Buat & kelola tugas | ❌ | ✅ | ❌ | ❌ |
| Kumpulkan tugas | ❌ | ❌ | ✅ | ❌ |
| Hapus/update file tugas santri | ✅ | ✅ | ✅ (milik sendiri, sebelum deadline) | ❌ |
| Lihat pengumuman | ✅ | ✅ | ✅ | ✅ |

---

## 5. Daftar Fitur per Role

### 5.1 Admin
- Dashboard ringkasan (jumlah santri, guru, kelas, tugas aktif, dll).
- **Manajemen Akun**: tambah/edit/nonaktifkan akun guru, santri, wali santri; reset password; bulk import (CSV) — *disarankan tambahan*.
- **Manajemen Kelas**: buat/edit/hapus kelas (misal Ibtida A, B, C, Tsanawiyah 1, dst), atur wali kelas.
- **Manajemen Mapel**: buat/edit/hapus mapel (fleksibel — akademik umum maupun pesantren: tahfidz, kitab kuning, akhlak, dll), atur bobot nilai per mapel jika perlu.
- **Penugasan Guru**: assign guru ke kombinasi kelas + mapel tertentu.
- **Relasi Wali Santri**: hubungkan akun wali santri ke satu/lebih akun santri (anak).
- **Pengaturan Situs**: upload logo pesantren, nama pesantren, alamat, tahun ajaran aktif, semester aktif.
- **Manajemen Pengumuman**: broadcast pengumuman ke semua/role tertentu/kelas tertentu.
- **Rekap & Cetak Rapor**: akses cetak rapor semua santri lintas kelas.
- **Log Aktivitas** (disarankan): audit trail perubahan nilai/akun untuk akuntabilitas.

### 5.2 Guru
- Dashboard kelas yang diampu.
- **Input Nilai**: per santri, per mapel, per jenis penilaian (tugas, UTS, UAS, hafalan, dll — kategori nilai juga bisa dikonfigurasi admin).
- **Kehadiran**: catat hadir/izin/sakit/alpa per pertemuan/hari.
- **Cetak Rapor Otomatis**: generate PDF rapor per santri berdasarkan gabungan nilai + rekap kehadiran + catatan wali kelas.
- **Manajemen Tugas**: buat tugas baru (judul, deskripsi, deadline, mapel, kelas tujuan), lihat daftar submission, beri nilai/feedback per submission.
- **Kelola file santri**: hapus/update file yang sudah diunggah santri jika diperlukan (misal salah kirim).
- **Presensi rekap**: lihat statistik kehadiran per santri/kelas.

### 5.3 Santri
- Dashboard: jadwal, tugas aktif, pengumuman, nilai terbaru.
- **Kumpulkan Tugas**: upload file (.doc/.docx, .pdf, .jpg/.png), atau submit link (Google Drive, YouTube, dsb).
- **Riwayat Tugas**: status (belum dikumpulkan / sudah dikumpulkan / dinilai), lihat feedback guru.
- **Lihat Nilai & Rapor**: nilai per mapel, unduh rapor PDF.
- **Lihat Kehadiran**: rekap kehadiran diri sendiri.
- **Edit file sendiri**: update/hapus submission sebelum deadline (sesuai keputusan hak akses di atas).

### 5.4 Wali Santri
- Dashboard anak (jika punya >1 anak terdaftar, bisa switch).
- Lihat nilai & rapor anak (read-only, bisa unduh PDF).
- Lihat rekap kehadiran anak.
- Lihat pengumuman yang relevan.
- (Disarankan) Notifikasi ringan saat rapor terbit atau kehadiran alpa berturut-turut.

### 5.5 Fitur Lintas Role (disarankan tambahan)
- **Notifikasi in-app** (bell icon) untuk tugas baru, nilai masuk, pengumuman.
- **Kalender Akademik**: tahun ajaran, semester, libur.
- **Multi-tahun ajaran**: data nilai/kehadiran terpisah per tahun ajaran agar histori tidak tertimpa.
- **Dark mode** (opsional, nice-to-have).

---

## 6. Struktur Database (Drizzle ORM + SQLite)

Skema di bawah ini konseptual (bukan syntax Drizzle literal) untuk memudahkan diskusi struktur — implementasi kode Drizzle akan mengikuti skema ini.

### 6.1 Tabel Auth (dikelola BetterAuth)
```
user
- id (pk, text/uuid)
- name
- email (unique)
- emailVerified (boolean)
- image (nullable)
- role (enum: admin | guru | santri | wali_santri)
- createdAt
- updatedAt

session
- id (pk)
- userId (fk -> user.id)
- token
- expiresAt
- ipAddress
- userAgent

account  (untuk credential/password & provider lain jika ada)
- id (pk)
- userId (fk -> user.id)
- providerId
- accountId
- password (hashed, jika credential)

verification
- id (pk)
- identifier
- value
- expiresAt
```

### 6.2 Tabel Inti Akademik
```
pesantren_settings
- id (pk)
- nama_pesantren
- alamat
- logo_url
- tahun_ajaran_aktif (fk -> tahun_ajaran.id)
- semester_aktif (enum: ganjil | genap)

tahun_ajaran
- id (pk)
- label            -- misal "2026/2027"
- tanggal_mulai
- tanggal_selesai
- is_active (boolean)

kelas
- id (pk)
- nama              -- misal "Ibtida A"
- tingkat           -- misal "Ibtida", "Tsanawiyah" (grouping/level, opsional)
- wali_kelas_id (fk -> guru_profile.id, nullable)
- tahun_ajaran_id (fk -> tahun_ajaran.id)

mapel
- id (pk)
- nama              -- misal "Tahfidz Qur'an", "Kitab Kuning", "Matematika"
- kategori          -- misal "Pesantren" / "Umum" (untuk filter/laporan)
- deskripsi (nullable)

guru_profile
- id (pk)
- user_id (fk -> user.id, unique)
- nip (nullable)
- no_telp (nullable)

santri_profile
- id (pk)
- user_id (fk -> user.id, unique)
- nis                -- nomor induk santri
- kelas_id (fk -> kelas.id)
- tempat_lahir (nullable)
- tanggal_lahir (nullable)
- alamat (nullable)

wali_santri_profile
- id (pk)
- user_id (fk -> user.id, unique)
- no_telp (nullable)

wali_santri_anak     -- relasi many-to-many wali <-> santri
- id (pk)
- wali_santri_id (fk -> wali_santri_profile.id)
- santri_id (fk -> santri_profile.id)

pengajaran            -- penugasan guru ke kelas & mapel
- id (pk)
- guru_id (fk -> guru_profile.id)
- kelas_id (fk -> kelas.id)
- mapel_id (fk -> mapel.id)
- tahun_ajaran_id (fk -> tahun_ajaran.id)
```

### 6.3 Tabel Penilaian & Kehadiran
```
jenis_nilai            -- dikonfigurasi admin/guru: "Tugas", "UTS", "UAS", "Hafalan", dll
- id (pk)
- nama
- bobot (decimal, misal 0.3 untuk 30%)

nilai
- id (pk)
- santri_id (fk -> santri_profile.id)
- mapel_id (fk -> mapel.id)
- kelas_id (fk -> kelas.id)
- jenis_nilai_id (fk -> jenis_nilai.id)
- guru_id (fk -> guru_profile.id)     -- yang menginput
- nilai (decimal)
- catatan (nullable)
- tahun_ajaran_id (fk -> tahun_ajaran.id)
- semester (enum: ganjil | genap)
- created_at
- updated_at

kehadiran
- id (pk)
- santri_id (fk -> santri_profile.id)
- kelas_id (fk -> kelas.id)
- mapel_id (fk -> mapel.id, nullable)  -- nullable jika kehadiran harian umum, bukan per mapel
- tanggal (date)
- status (enum: hadir | izin | sakit | alpa)
- dicatat_oleh (fk -> guru_profile.id)
- tahun_ajaran_id (fk -> tahun_ajaran.id)

rapor
- id (pk)
- santri_id (fk -> santri_profile.id)
- kelas_id (fk -> kelas.id)
- tahun_ajaran_id (fk -> tahun_ajaran.id)
- semester (enum: ganjil | genap)
- ringkasan_nilai (json)         -- snapshot nilai per mapel saat rapor digenerate
- ringkasan_kehadiran (json)     -- snapshot rekap hadir/izin/sakit/alpa
- catatan_wali_kelas (nullable)
- file_pdf_url (nullable)        -- hasil cetak tersimpan
- generated_at
- generated_by (fk -> guru_profile.id / user.id admin)
```

### 6.4 Tabel Tugas & Pengumpulan
```
tugas
- id (pk)
- judul
- deskripsi
- mapel_id (fk -> mapel.id)
- kelas_id (fk -> kelas.id)
- guru_id (fk -> guru_profile.id)
- deadline (datetime)
- tahun_ajaran_id (fk -> tahun_ajaran.id)
- created_at

tugas_submission
- id (pk)
- tugas_id (fk -> tugas.id)
- santri_id (fk -> santri_profile.id)
- tipe (enum: file | link_gdrive | link_youtube | link_lainnya)
- file_path (nullable)      -- lokasi file di local storage server
- file_nama_asli (nullable)
- file_mime_type (nullable) -- validasi: doc/docx, pdf, jpg/png
- url (nullable)            -- untuk tipe link
- status (enum: dikumpulkan | terlambat | dinilai)
- nilai (decimal, nullable)
- feedback_guru (nullable)
- submitted_at
- updated_at
- updated_by (fk -> user.id)  -- audit siapa terakhir update/hapus (guru/admin/santri sendiri)
```

### 6.5 Tabel Pendukung
```
pengumuman
- id (pk)
- judul
- isi
- target_role (enum: semua | admin | guru | santri | wali_santri, nullable)
- target_kelas_id (fk -> kelas.id, nullable)
- dibuat_oleh (fk -> user.id)
- created_at

activity_log            -- audit trail (disarankan)
- id (pk)
- user_id (fk -> user.id)
- aksi                  -- misal "update_nilai", "hapus_file_tugas"
- entitas               -- misal "nilai", "tugas_submission"
- entitas_id
- detail (json, nullable)
- created_at
```

### 6.6 Relasi Kunci (ringkas)
- `user` 1—1 `guru_profile` / `santri_profile` / `wali_santri_profile` (sesuai role).
- `kelas` 1—N `santri_profile`.
- `pengajaran` menghubungkan `guru_profile` ↔ `kelas` ↔ `mapel` (N—N—N via tabel penghubung).
- `wali_santri_anak` menghubungkan `wali_santri_profile` ↔ `santri_profile` (N—N, mendukung satu wali dengan beberapa anak, atau satu santri dengan beberapa wali).
- `nilai` & `kehadiran` selalu terikat `tahun_ajaran_id` agar histori tidak tertimpa saat naik tahun ajaran.
- `rapor` menyimpan **snapshot** (json) nilai & kehadiran saat digenerate — bukan live-query — supaya rapor yang sudah dicetak tidak berubah walau data mentah kemudian diedit.

---

## 7. Workflow Utama

### 7.1 Alur Login (Semua Role)
1. User membuka `/login`, input email + password.
2. BetterAuth memverifikasi kredensial → membuat session.
3. Sistem membaca `user.role` → redirect ke dashboard sesuai role:
   - `admin` → `/admin/dashboard`
   - `guru` → `/guru/dashboard`
   - `santri` → `/santri/dashboard`
   - `wali_santri` → `/wali/dashboard`
4. Middleware Next.js mengecek session pada setiap request ke route terproteksi; role yang tidak sesuai path di-redirect/403.

### 7.2 Alur Setup Awal oleh Admin (Onboarding)
1. Admin login pertama kali (akun admin dibuat via seed/migrasi awal).
2. Admin mengisi **Pengaturan Situs**: nama pesantren, logo, tahun ajaran aktif.
3. Admin membuat **Tahun Ajaran** aktif.
4. Admin membuat **Kelas** (misal Ibtida A, B, C).
5. Admin membuat **Mapel** (akademik & pesantren).
6. Admin menambah akun **Guru** (otomatis generate password sementara / kirim invite).
7. Admin menambah akun **Santri**, assign ke kelas.
8. Admin menambah akun **Wali Santri**, hubungkan ke santri (anak) terkait.
9. Admin melakukan **Penugasan Guru** → kombinasi guru + kelas + mapel.

### 7.3 Alur Penilaian & Kehadiran → Rapor Otomatis
1. Guru login → memilih kelas & mapel yang diampu.
2. Guru mencatat **kehadiran** per pertemuan/hari (hadir/izin/sakit/alpa).
3. Guru menginput **nilai** per jenis nilai (tugas, UTS, UAS, hafalan, dll) sepanjang semester.
4. Menjelang akhir semester, guru (atau admin) memicu **Generate Rapor**:
   - Sistem mengagregasi seluruh `nilai` santri per mapel di semester berjalan → hitung nilai akhir (sesuai bobot `jenis_nilai`).
   - Sistem mengagregasi seluruh `kehadiran` santri di semester berjalan → hitung rekap hadir/izin/sakit/alpa.
   - Guru (wali kelas) menambahkan **catatan** kualitatif.
   - Sistem menyimpan **snapshot** ke tabel `rapor` (json nilai + json kehadiran) dan generate file PDF.
5. Rapor PDF tersimpan → bisa diunduh oleh admin, guru terkait, santri ybs, dan wali santri terkait.

### 7.4 Alur Pengumpulan Tugas
1. Guru membuat **tugas baru**: judul, deskripsi, kelas & mapel tujuan, deadline.
2. Sistem otomatis memunculkan tugas ke dashboard seluruh santri di kelas tersebut.
3. Santri membuka tugas → memilih cara submit:
   - Upload file (validasi tipe: .doc/.docx, .pdf, .jpg/.png; validasi ukuran maksimum — disarankan misal 10MB) → tersimpan ke local storage, path disimpan di `tugas_submission.file_path`.
   - Atau submit link (Google Drive / YouTube / lainnya) → disimpan di `tugas_submission.url`.
4. Sistem mencatat `submitted_at`; jika melewati `deadline`, status otomatis `terlambat`.
5. Santri bisa **update/hapus** submission miliknya sendiri **sebelum deadline** (sesuai keputusan akses).
6. Guru meninjau daftar submission per tugas → memberi `nilai` + `feedback_guru`; status berubah jadi `dinilai`.
7. Guru atau admin sewaktu-waktu bisa menghapus/mengganti file submission santri (misal karena file rusak/salah upload) — aksi ini tercatat di `activity_log`.

### 7.5 Alur Wali Santri Memantau Anak
1. Wali santri login → dashboard menampilkan daftar anak (jika lebih dari satu, ada selector).
2. Pilih anak → lihat ringkasan nilai per mapel (semester berjalan), rekap kehadiran, dan rapor semester sebelumnya (unduh PDF).
3. (Opsional lanjutan) Terima notifikasi saat rapor baru terbit atau anak tercatat alpa beberapa kali berturut-turut.

---

## 8. Struktur Halaman (Routing — Next.js App Router)

```
/login
/admin
  /dashboard
  /pengaturan            -- logo, nama pesantren, tahun ajaran
  /akun                  -- CRUD guru, santri, wali santri
  /kelas                 -- CRUD kelas
  /mapel                 -- CRUD mapel
  /penugasan-guru        -- assign guru ke kelas+mapel
  /wali-santri           -- hubungkan wali <-> santri
  /pengumuman
  /rapor                 -- rekap & cetak lintas kelas
  /log-aktivitas

/guru
  /dashboard
  /nilai                 -- input nilai per kelas/mapel
  /kehadiran              -- input kehadiran
  /tugas
    /                     -- daftar tugas dibuat
    /baru                 -- buat tugas baru
    /[id]/submission      -- lihat & nilai submission santri
  /rapor                  -- generate & cetak rapor kelas diampu

/santri
  /dashboard
  /tugas
    /                     -- daftar tugas aktif & riwayat
    /[id]                 -- detail tugas + form submit
  /nilai
  /kehadiran
  /rapor

/wali
  /dashboard
  /anak/[santriId]/nilai
  /anak/[santriId]/kehadiran
  /anak/[santriId]/rapor
```

---

## 9. Non-Functional Requirements

- **Keamanan**: password ter-hash (ditangani BetterAuth), validasi role di setiap API route (bukan hanya di UI), rate-limiting pada `/login`.
- **Validasi file upload**: batasi tipe (.doc/.docx/.pdf/.jpg/.png) dan ukuran maksimum di sisi server, bukan hanya client.
- **Audit trail**: setiap perubahan/hapus data sensitif (nilai, file tugas orang lain) dicatat di `activity_log`.
- **Skalabilitas awal**: SQLite cukup untuk 1 pesantren dengan ratusan–ribuan santri; jika ke depan multi-cabang/multi-pesantren, pertimbangkan migrasi ke PostgreSQL.
- **Backup**: karena SQLite berbasis file, perlu strategi backup berkala (cron job copy file `.db` + folder storage tugas).
- **Responsif**: mengingat santri/wali santri mungkin akses dari HP, UI Tailwind harus mobile-first.

---

## 10. Roadmap Pengembangan

| Fase | Cakupan |
|---|---|
| **Fase 0 — Prototype HTML** | Bangun mockup statis semua halaman utama (login, dashboard 4 role, form nilai, form tugas) untuk validasi alur UI sebelum coding fungsional |
| **Fase 1 — Migrasi Next.js** | Konversi prototype ke Next.js (App Router), setup Tailwind, routing per role |
| **Fase 2 — Backend & Auth** | Setup Drizzle + SQLite, integrasi BetterAuth, RBAC middleware |
| **Fase 3 — Migrasi TypeScript** | Full type-safety di seluruh kode (schema Drizzle, API route, komponen) |
| **Fase 4 — Fitur Inti** | Manajemen akun, kelas, mapel, penugasan guru, input nilai & kehadiran |
| **Fase 5 — Tugas & Rapor** | Modul pengumpulan tugas, generate rapor otomatis + PDF |
| **Fase 6 — Wali Santri & Polish** | Dashboard wali santri, notifikasi, pengumuman, audit log, testing menyeluruh |

---

## 11. Hal yang Masih Perlu Didiskusikan Lebih Lanjut

Beberapa detail berikut sebaiknya diputuskan sebelum atau selama Fase 4–5:

1. **Skala nilai**: 0–100, atau huruf (A/B/C), atau kombinasi angka + predikat (Mumtaz/Jayyid, dsb yang lazim di pesantren)?
2. **Bobot nilai per jenis** (Tugas/UTS/UAS/Hafalan): apakah sama untuk semua mapel, atau bisa berbeda per mapel?
3. **Batas ukuran file upload** tugas santri (disarankan mulai dari 10MB).
4. **Kebijakan keterlambatan submit**: apakah tugas terlambat tetap bisa dinilai atau otomatis nilai 0?
5. **Multi-anak untuk 1 wali santri**: apakah satu akun wali bisa mewakili beberapa anak sekaligus di pesantren yang sama (sudah diakomodasi di skema, tinggal dikonfirmasi kebutuhan UI switch-nya)?


---

# ADDENDUM — PENGUATAN PRD UNTUK VIBE CODING, UI SHADCN/UI & DEPLOYMENT VERCEL

> **Catatan penting:** Seluruh isi PRD versi 1.0 di atas dipertahankan apa adanya. Bagian ini hanya merupakan tambahan/penguat agar PRD lebih siap digunakan sebagai **single source of truth** saat vibe coding menggunakan OpenCode di laptop.

## 12. Prinsip Implementasi Tambahan

### 12.1 Single Source of Truth

PRD ini menjadi acuan utama pengembangan aplikasi.

Ketika melakukan vibe coding:
- Jangan membuat fitur di luar PRD tanpa alasan yang jelas.
- Jangan menghapus fitur yang sudah tercantum di PRD.
- Jika ada kebutuhan teknis baru, prioritaskan kompatibilitas dengan requirement yang sudah ada.
- Jika terdapat konflik antara implementasi teknis dan requirement bisnis, requirement bisnis dalam PRD harus menjadi acuan.
- Semua fitur harus memiliki state **loading, empty, error, success**, dan feedback aksi yang jelas.
- Jangan membuat data dummy permanen yang menggantikan database nyata setelah modul terkait sudah tersedia.

### 12.2 Prinsip Pengembangan Bertahap

Pengembangan dilakukan secara incremental:
1. Setup project dan fondasi UI.
2. Authentication + RBAC.
3. Database schema + migration.
4. Modul Admin.
5. Modul Guru.
6. Modul Santri.
7. Modul Wali Santri.
8. Tugas dan submission.
9. Nilai dan kehadiran.
10. Rapor + PDF.
11. Notifikasi/pengumuman/audit log.
12. Testing, security hardening, dan deployment.

Setiap tahap harus menghasilkan aplikasi yang tetap dapat dijalankan.

---

## 13. UI/UX System — shadcn/ui

### 13.1 UI Component Library

Implementasi UI menggunakan **shadcn/ui** sebagai component system utama di atas Tailwind CSS.

Komponen shadcn/ui digunakan untuk:
- Button
- Input
- Textarea
- Select
- Checkbox
- Radio Group
- Switch
- Form
- Label
- Card
- Badge
- Alert
- Dialog
- Sheet
- Drawer
- Dropdown Menu
- Tabs
- Table
- Pagination
- Tooltip
- Popover
- Calendar
- Date Picker
- Command
- Breadcrumb
- Navigation Menu
- Sidebar
- Separator
- Skeleton
- Toast / Sonner
- Progress
- Avatar
- Accordion
- Alert Dialog

Tidak perlu membuat ulang komponen dasar yang sudah tersedia di shadcn/ui kecuali terdapat kebutuhan khusus.

### 13.2 Prinsip Visual

UI harus terlihat sebagai **aplikasi administrasi pendidikan/pesantren modern**, bukan template dashboard generik.

Karakter desain:
- Bersih.
- Profesional.
- Tenang.
- Mudah dibaca.
- Tidak terlalu banyak dekorasi.
- Mengutamakan informasi dan usability.
- Nuansa pesantren/Islamic boleh terasa melalui tipografi, ikon, copywriting, dan detail visual yang subtle.
- Hindari penggunaan ornamen Islami secara berlebihan.
- Hindari desain yang terlalu "corporate SaaS" sehingga kehilangan identitas pesantren.

### 13.3 Responsive Design

Prioritas:
1. Mobile untuk Santri dan Wali Santri.
2. Desktop untuk Admin dan Guru.
3. Semua halaman tetap usable pada tablet.

Breakpoint dan layout harus mengikuti responsive utility Tailwind.

### 13.4 Dashboard Layout

Dashboard menggunakan pola:
- Sidebar navigation pada desktop.
- Collapsible/mobile navigation pada perangkat kecil.
- Topbar.
- Breadcrumb jika diperlukan.
- Page title.
- Deskripsi singkat halaman.
- Primary action.
- Content area.
- Feedback/status area.

Contoh dashboard card:
- Total Santri.
- Total Guru.
- Total Kelas.
- Tugas Aktif.
- Kehadiran.
- Nilai terbaru.
- Pengumuman terbaru.

### 13.5 Data Table

Untuk halaman CRUD dan data akademik:
- Search.
- Filter.
- Sorting jika diperlukan.
- Pagination.
- Row action.
- Bulk action bila relevan.
- Confirmation dialog sebelum delete.
- Empty state.
- Loading skeleton.
- Error state.
- Responsive behavior pada mobile.

Untuk tabel nilai, usability input massal menjadi prioritas dibanding dekorasi.

### 13.6 Form

Form menggunakan:
- React Hook Form.
- Zod.
- shadcn/ui Form components.

Aturan:
- Validasi client-side untuk UX.
- Validasi server-side sebagai sumber kebenaran.
- Pesan error harus spesifik dan mudah dipahami.
- Tombol submit memiliki loading state.
- Hindari double submission.
- Setelah berhasil, tampilkan feedback dan refresh/revalidate data yang relevan.

### 13.7 Desain Per Role

#### Admin
Fokus pada:
- Data management.
- Statistik.
- CRUD.
- Pengaturan.
- Audit.
- Operasional akademik.

#### Guru
Fokus pada:
- Kelas yang diampu.
- Input nilai.
- Presensi.
- Tugas.
- Submission.
- Rapor.

#### Santri
Fokus pada:
- Tugas.
- Deadline.
- Submission.
- Nilai.
- Kehadiran.
- Rapor.
- Pengumuman.

#### Wali Santri
Fokus pada:
- Anak.
- Nilai.
- Kehadiran.
- Rapor.
- Pengumuman.

### 13.8 State UI Wajib

Setiap halaman/data-driven component minimal harus menangani:
- Loading.
- Empty.
- Error.
- Success.
- Permission denied.
- Not found jika menggunakan dynamic route.

Jangan menampilkan halaman kosong ketika data belum tersedia.

---

## 14. Penyesuaian Identitas Website Pesantren

Walaupun sistem inti tetap merupakan ELMS, implementasi UI harus terasa sebagai produk digital milik **pesantren**, bukan aplikasi sekolah umum yang hanya diganti namanya.

Terminologi UI menggunakan istilah:
- Pesantren.
- Santri.
- Wali Santri.
- Guru/Ustadz/Ustadzah bila memang dikonfigurasi.
- Kelas.
- Mapel.
- Tahfidz/Hafalan.
- Kitab.
- Kehadiran.
- Rapor.
- Tahun Ajaran.
- Semester.

Namun istilah database/API tetap boleh menggunakan nama teknis yang konsisten dengan schema PRD.

### 14.1 Branding Dinamis

Identitas pesantren harus berasal dari `pesantren_settings` bila tersedia:
- Nama pesantren.
- Logo.
- Alamat.
- Tahun ajaran aktif.
- Semester aktif.

Hindari hard-code nama pesantren pada banyak component.

### 14.2 Halaman Login

Halaman login harus dapat menampilkan:
- Logo pesantren.
- Nama pesantren.
- Deskripsi singkat.
- Form email/password.
- Show/hide password.
- Loading state.
- Error authentication.
- Responsive layout.

Tidak perlu membuat halaman login terlalu kompleks.

### 14.3 Nuansa Landing/Public Website

Jika nantinya website membutuhkan halaman publik, desain dapat mengadopsi pola umum website pesantren modern:
- Hero/profile singkat pesantren.
- Tentang pesantren.
- Program pendidikan.
- Kegiatan.
- Berita/pengumuman.
- Galeri.
- Informasi kontak.
- Lokasi.
- Link media sosial.
- CTA pendaftaran bila memang dibutuhkan.

**Catatan:** bagian public website bersifat tambahan dan tidak menghapus/menimpa scope ELMS pada PRD utama.

---

## 15. Penyempurnaan Arsitektur Deployment

### 15.1 Target Deployment

Target deployment production: **Vercel**.

Aplikasi harus dirancang agar kompatibel dengan environment deployment Vercel.

### 15.2 Catatan Penting SQLite + Vercel

PRD awal menggunakan SQLite dan local filesystem.

Untuk development lokal, konfigurasi tersebut tetap dapat digunakan.

Namun untuk production di Vercel:
- Jangan mengandalkan filesystem lokal Vercel sebagai persistent storage.
- Jangan menganggap file SQLite lokal akan menjadi database production yang persisten.
- Jangan menyimpan file submission santri secara permanen di filesystem instance/serverless.
- Database dan file storage production harus menggunakan layanan persistent/external.

### 15.3 Rekomendasi Production Architecture

Untuk deployment Vercel, gunakan arsitektur:

```text
Browser
   |
   v
Next.js App Router
   |
   +---- BetterAuth
   |
   +---- Drizzle ORM
   |
   +---- Production Database
   |
   +---- Object/File Storage
   |
   +---- PDF Generation Strategy
   |
   v
Vercel
```

Rekomendasi:
- Hosting/App: Vercel.
- Framework: Next.js.
- Database: PostgreSQL-compatible serverless database untuk production, atau SQLite-compatible hosted database bila dipilih dan telah diuji kompatibilitasnya.
- ORM: Drizzle ORM.
- File storage: object storage/persistent blob storage.
- Authentication: BetterAuth.
- UI: shadcn/ui + Tailwind CSS.

### 15.4 Development vs Production

Development lokal:
```text
Next.js
+
SQLite
+
Local development storage
```

Production:
```text
Vercel
+
Production database
+
Persistent object/file storage
```

Jangan mencampurkan asumsi storage development dengan production.

### 15.5 Environment Variables

Semua secret/configuration harus menggunakan environment variables.

Contoh kategori:
```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
```

Nama variable final boleh disesuaikan dengan provider yang digunakan, tetapi secret tidak boleh di-hard-code ke repository.

File `.env.local`:
- Tidak boleh di-commit.
- Masukkan ke `.gitignore`.
- Production secrets dikonfigurasi melalui Vercel Environment Variables.

---

## 16. File Storage Production

PRD utama mendefinisikan local storage. Untuk production Vercel, requirement bisnis tetap sama, tetapi implementasi storage harus persistent.

### 16.1 Abstraksi Storage

Buat abstraction layer:

```text
StorageService
├── upload()
├── delete()
├── getUrl()
└── replace()
```

Dengan demikian aplikasi tidak mengikat seluruh business logic langsung ke filesystem.

Development dapat menggunakan local adapter.

Production dapat menggunakan object/blob storage adapter.

### 16.2 File Submission

File yang diperbolehkan tetap mengikuti PRD:
- `.doc`
- `.docx`
- `.pdf`
- `.jpg`
- `.png`

Batas ukuran harus dikonfigurasi secara terpusat.

Default awal:
- Maksimum 10 MB per file.

Server tetap wajib melakukan validasi:
- Extension.
- MIME type.
- Ukuran.
- Authorization user.
- Ownership.

Jangan hanya mengandalkan extension dari filename.

---

## 17. Database Production & Integrity

### 17.1 Constraint

Database harus menggunakan constraint/index yang membantu menjaga integritas data.

Contoh:
- Email user unique.
- NIS santri unique bila memang berlaku global pada pesantren.
- Relasi wali-santri mencegah duplicate relation.
- Pengajaran mencegah duplicate assignment guru + kelas + mapel + tahun ajaran.
- Nilai memiliki uniqueness rule yang jelas untuk mencegah duplicate entry yang tidak disengaja.

### 17.2 Index

Tambahkan index untuk query yang sering dilakukan:
- `user.role`
- `santri_profile.kelas_id`
- `pengajaran.guru_id`
- `pengajaran.kelas_id`
- `pengajaran.mapel_id`
- `nilai.santri_id`
- `nilai.mapel_id`
- `nilai.tahun_ajaran_id`
- `kehadiran.santri_id`
- `kehadiran.tanggal`
- `tugas.kelas_id`
- `tugas.guru_id`
- `tugas.deadline`
- `tugas_submission.tugas_id`
- `tugas_submission.santri_id`

Implementasi final mengikuti kebutuhan query aktual.

---

## 18. Authentication & Authorization Hardening

Selain requirement RBAC pada PRD utama:

### 18.1 Server-Side Authorization

Permission harus diperiksa di:
- Server Actions.
- Route Handlers/API.
- Server Components saat mengambil data sensitif.
- Mutation database.

UI hiding bukan security mechanism.

### 18.2 Ownership Check

Contoh:
- Santri hanya boleh membaca tugas yang ditujukan ke kelasnya.
- Santri hanya boleh mengubah submission miliknya.
- Guru hanya boleh mengakses kelas/mapel yang ditugaskan kepadanya.
- Wali hanya boleh mengakses santri yang terhubung melalui `wali_santri_anak`.
- Admin dapat mengakses data sesuai scope admin.

### 18.3 Route Protection

Protected route harus menggunakan server-side session check.

Contoh kelompok:
```text
/admin/*
/guru/*
/santri/*
/wali/*
```

User dengan role yang salah:
- Jangan hanya disembunyikan menu.
- Harus ditolak di server.

---

## 19. Pengelolaan Rapor & PDF

### 19.1 Rapor sebagai Snapshot

Requirement snapshot pada PRD utama tetap dipertahankan.

Ketika rapor di-generate:
1. Ambil data nilai.
2. Hitung nilai akhir.
3. Ambil rekap kehadiran.
4. Masukkan catatan wali kelas.
5. Simpan snapshot.
6. Generate PDF.
7. Simpan hasil PDF pada persistent storage production.
8. Simpan reference/path/URL sesuai arsitektur storage.

### 19.2 Idempotency

Generate rapor tidak boleh menghasilkan data rapor ganda secara tidak sengaja.

Gunakan unique business key yang sesuai, misalnya kombinasi:
```text
santri + kelas + tahun_ajaran + semester
```

Jika rapor sudah ada:
- Tampilkan status.
- Berikan pilihan regenerate/revise sesuai permission.
- Jangan membuat duplicate record tanpa alasan.

---

## 20. Notification Architecture

Jika fitur notifikasi lintas role diaktifkan:

Tambahkan konsep notification yang menyimpan:
- Recipient/user.
- Type.
- Title.
- Message.
- Related entity.
- Read/unread.
- Created at.

Contoh:
```text
Tugas baru
Nilai baru
Rapor tersedia
Pengumuman baru
Kehadiran alpa
```

Notifikasi harus dapat diakses berdasarkan ownership/recipient.

---

## 21. Error Handling & UX Feedback

Gunakan pola error yang konsisten.

Kategori:
- Validation error.
- Authentication error.
- Authorization error.
- Not found.
- Conflict.
- File upload error.
- Database error.
- Unexpected server error.

User tidak boleh menerima error teknis mentah seperti stack trace.

Gunakan pesan:
- Singkat.
- Bahasa Indonesia.
- Menjelaskan tindakan yang dapat dilakukan user.

---

## 22. Seed Data & Demo Account

Untuk membantu vibe coding dan testing, sediakan seed database development.

Minimal:
- 1 Admin.
- 2 Guru.
- 1–2 Kelas.
- Beberapa Mapel.
- 5–10 Santri.
- 1–2 Wali Santri.
- Relasi wali-santri.
- Penugasan guru.
- Contoh nilai.
- Contoh kehadiran.
- Contoh tugas.
- Contoh submission.
- Contoh pengumuman.

Seed harus:
- Reproducible.
- Tidak menggunakan data pribadi nyata.
- Hanya digunakan untuk development/testing.

Credential demo harus terdokumentasi secara lokal dan tidak digunakan sebagai credential production.

---

## 23. Testing Minimum

### 23.1 Authentication
- Login valid.
- Login invalid.
- Session expiration.
- Logout.
- Role redirect.
- Unauthorized access.

### 23.2 Admin
- CRUD akun.
- CRUD kelas.
- CRUD mapel.
- Relasi wali-santri.
- Assignment guru.
- Pengumuman.
- Pengaturan pesantren.

### 23.3 Guru
- Melihat kelas yang diampu.
- Input/edit nilai.
- Input/edit kehadiran.
- Membuat tugas.
- Melihat submission.
- Memberikan nilai/feedback.
- Generate rapor.

### 23.4 Santri
- Melihat tugas kelasnya.
- Submit file.
- Submit link.
- Update/hapus submission sesuai deadline.
- Melihat nilai.
- Melihat kehadiran.
- Download rapor.

### 23.5 Wali
- Melihat anak.
- Switch anak.
- Melihat nilai.
- Melihat kehadiran.
- Melihat/download rapor.

### 23.6 Security Tests
Minimal test bahwa:
- Santri A tidak dapat membaca data Santri B melalui manipulasi URL.
- Wali A tidak dapat membaca anak milik Wali B.
- Guru A tidak dapat mengakses kelas yang bukan tanggung jawabnya.
- User biasa tidak dapat memanggil endpoint admin secara langsung.

---

## 24. Accessibility

UI harus memperhatikan:
- Keyboard navigation.
- Focus state.
- Label form.
- Semantic HTML.
- Kontras teks yang memadai.
- Button memiliki accessible name.
- Dialog memiliki title/description.
- Form error terhubung dengan field.
- Jangan menyampaikan informasi hanya melalui warna.

Target awal: accessibility yang baik dan mendekati praktik WCAG 2.1 AA pada komponen utama.

---

## 25. Performance

Prioritas:
- Server Components untuk halaman yang tidak membutuhkan client interactivity.
- Client Components hanya ketika diperlukan.
- Hindari fetch data berulang.
- Gunakan pagination untuk data besar.
- Gunakan query database yang ter-filter.
- Hindari mengambil seluruh daftar santri jika hanya membutuhkan agregasi.
- Optimalkan image.
- Lazy-load komponen berat jika relevan.
- Hindari bundle JavaScript berlebihan.

Dashboard tidak boleh melakukan query seluruh database hanya untuk menampilkan beberapa statistik.

---

## 26. SEO & Public Pages

Jika public-facing pages dikembangkan:
- Metadata title/description.
- Open Graph.
- Favicon.
- Sitemap.
- Robots.
- Semantic heading.
- Responsive.
- Fast loading.

Halaman dashboard private tidak perlu diprioritaskan untuk SEO.

---

## 27. Deployment Checklist — Vercel

Sebelum production:

### Code
- [ ] TypeScript build berhasil.
- [ ] Lint berhasil.
- [ ] Tidak ada error runtime kritis.
- [ ] Tidak ada secret di repository.
- [ ] `.env.local` masuk `.gitignore`.

### Database
- [ ] Migration production tersedia.
- [ ] Production database sudah dikonfigurasi.
- [ ] Seed demo tidak dijalankan pada production secara tidak sengaja.
- [ ] Index dan constraint telah diterapkan.
- [ ] Backup strategy tersedia.

### Authentication
- [ ] `BETTER_AUTH_SECRET` production berbeda dari development.
- [ ] Session configuration diperiksa.
- [ ] Protected routes diuji.
- [ ] Role authorization diuji.

### Storage
- [ ] Production storage persistent.
- [ ] Upload limit aktif.
- [ ] MIME validation aktif.
- [ ] Delete/replace file diuji.
- [ ] Access terhadap file sensitif tidak terbuka sembarangan.

### Vercel
- [ ] Environment variables dikonfigurasi.
- [ ] Build command berhasil.
- [ ] Production deployment berhasil.
- [ ] Preview deployment dapat digunakan untuk QA.
- [ ] Domain production dikonfigurasi bila tersedia.

---

## 28. Vibe Coding Rules untuk OpenCode

Karena proyek akan dikembangkan menggunakan vibe coding, agent coding harus mengikuti aturan:

1. **Baca PRD terlebih dahulu** sebelum membuat fitur.
2. Jangan mengarang requirement bisnis yang tidak ada.
3. Jangan menghapus requirement existing untuk menyederhanakan coding.
4. Prioritaskan implementasi end-to-end dibanding membuat banyak halaman kosong.
5. Setelah mengubah schema database, update migration dan type terkait.
6. Setelah mengubah business logic, periksa authorization.
7. Setelah membuat UI, pastikan mobile responsive.
8. Gunakan shadcn/ui sebagai component base.
9. Gunakan TypeScript strict.
10. Gunakan Zod untuk boundary validation.
11. Gunakan React Hook Form untuk form kompleks.
12. Hindari `any` kecuali benar-benar diperlukan dan diberi alasan.
13. Jangan hard-code branding pesantren.
14. Jangan hard-code data akademik yang seharusnya berasal dari database.
15. Gunakan reusable components.
16. Jangan membuat duplicate component untuk kebutuhan yang sebenarnya sama.
17. Jangan menyimpan secret dalam source code.
18. Semua mutation harus memiliki authorization check.
19. Semua upload harus memiliki server-side validation.
20. Setelah implementasi fitur, jalankan lint/typecheck/test yang relevan.
21. Jangan menganggap UI permission sebagai security.
22. Jangan menggunakan local filesystem sebagai persistent production storage di Vercel.
23. Jika ada keputusan teknis yang belum ditentukan oleh PRD, pilih solusi paling sederhana, maintainable, dan mudah diganti tanpa merusak business logic.
24. Jika suatu requirement belum cukup spesifik untuk implementasi aman, tandai sebagai TODO/decision point daripada membuat asumsi bisnis yang tidak berdasar.

---

## 29. Definition of Done

Sebuah fitur dianggap selesai apabila:

- [ ] Requirement PRD terimplementasi.
- [ ] Database/schema sesuai kebutuhan.
- [ ] Authorization sudah diterapkan.
- [ ] Validation tersedia.
- [ ] Loading state tersedia.
- [ ] Empty state tersedia.
- [ ] Error state tersedia.
- [ ] Success feedback tersedia.
- [ ] Responsive.
- [ ] Menggunakan component system yang konsisten.
- [ ] Tidak ada data sensitif yang bocor.
- [ ] Tidak ada hard-coded business data yang seharusnya configurable.
- [ ] TypeScript tidak menghasilkan error.
- [ ] Lint tidak menghasilkan error.
- [ ] Flow utama sudah diuji.

---

## 30. Keputusan Teknis yang Perlu Dipastikan Sebelum Production

Bagian ini tidak mengubah requirement utama, tetapi menjadi daftar keputusan yang perlu diselesaikan sebelum deployment production:

1. Provider database production yang akan digunakan bersama Vercel.
2. Provider object/blob storage untuk file tugas dan PDF rapor.
3. Strategi backup database.
4. Strategi backup file.
5. Provider/email mechanism jika fitur invite/reset password melalui email benar-benar digunakan.
6. Mekanisme scheduled notification/reminder karena runtime serverless tidak boleh diasumsikan sebagai server cron tradisional.
7. Final format rapor PDF.
8. Formula nilai akhir.
9. Final kebijakan late submission.
10. Final batas file upload.
11. Apakah public-facing website/landing page termasuk scope release pertama atau release terpisah.

---

## 31. Rekomendasi Struktur Project

Contoh struktur yang disarankan:

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   ├── guru/
│   │   ├── santri/
│   │   └── wali/
│   ├── api/
│   └── ...
│
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── layout/
│   ├── shared/
│   ├── admin/
│   ├── guru/
│   ├── santri/
│   └── wali/
│
├── db/
│   ├── schema/
│   ├── migrations/
│   └── index.ts
│
├── lib/
│   ├── auth/
│   ├── validation/
│   ├── permissions/
│   ├── storage/
│   ├── pdf/
│   └── utils/
│
├── actions/
├── hooks/
├── types/
└── config/
```

Struktur final boleh berubah selama separation of concerns tetap terjaga.

---

## 32. Prioritas MVP

Agar vibe coding tidak melebar, prioritas release pertama:

### P0 — Wajib
- Authentication.
- RBAC.
- Admin account management.
- Kelas.
- Mapel.
- Guru assignment.
- Santri.
- Wali santri relation.
- Nilai.
- Kehadiran.
- Tugas.
- Submission.
- Rapor.
- Responsive UI.
- shadcn/ui.
- Production-ready database/storage architecture.

### P1 — Penting
- Pengumuman.
- Activity log.
- Notifikasi in-app.
- Kalender akademik.
- Bulk import CSV.
- Multi-tahun ajaran.

### P2 — Nice to Have
- Dark mode.
- Reminder otomatis.
- Public website/landing page yang lebih lengkap.
- Integrasi layanan eksternal tambahan.

---

## 33. Prinsip Akhir Produk

ELMS Pesantren harus menghasilkan pengalaman:

**Admin**
> "Saya bisa mengelola seluruh struktur akademik tanpa developer."

**Guru**
> "Saya bisa mengajar, presensi, memberi nilai, mengelola tugas, dan membuat rapor dari satu tempat."

**Santri**
> "Saya bisa melihat tugas, mengumpulkan tugas, melihat nilai, kehadiran, dan rapor dengan mudah dari HP."

**Wali Santri**
> "Saya bisa memantau perkembangan anak tanpa harus meminta data secara manual kepada pihak pesantren."

**Pesantren**
> "Administrasi akademik lebih terpusat, rapi, terdokumentasi, dan siap berkembang menjadi sistem digital pesantren."

---

## 34. Catatan Referensi Visual

Referensi YouTube yang diberikan digunakan sebagai **inspirasi pendekatan pengembangan aplikasi modern/SaaS dan deployment**, bukan sebagai sumber requirement bisnis utama.

Video:
`https://youtu.be/4XgF5ZvT5HM`

Judul yang terdeteksi:
**"TUTORIAL bikin SaaS dari nol full pake AI - Integrasi payment gateway dan deployment ANTI RIBET"**

Penyesuaian untuk proyek ini:
- Tetap mempertahankan domain **ELMS Pesantren**.
- Mengambil pendekatan modern dalam workflow development dan deployment.
- Menggunakan Next.js + TypeScript.
- Menggunakan shadcn/ui + Tailwind.
- Production deployment diarahkan ke Vercel.
- Business requirement tetap mengikuti PRD utama.


---

# ADDENDUM — MODUL PEMBAYARAN SPP & INTEGRASI MAYAR.ID

> **Status:** Penambahan requirement baru. Seluruh isi PRD sebelumnya tetap dipertahankan. Bagian ini menambahkan modul pembayaran SPP yang terintegrasi dengan Mayar.id.

## 35. Ringkasan Modul Pembayaran SPP

Aplikasi ELMS Pesantren memiliki modul **Pembayaran SPP** yang memungkinkan pesantren mengelola tagihan SPP santri dan menerima pembayaran secara online.

Karakteristik utama:

1. Nominal SPP **tidak di-hard-code di sistem**.
2. Admin dapat membuat, mengubah, mengaktifkan, atau menonaktifkan konfigurasi tarif SPP sesuai kebijakan pesantren.
3. Perubahan nominal SPP tidak boleh mengubah nominal tagihan yang sudah dibuat pada periode sebelumnya.
4. Setiap tagihan menyimpan **snapshot nominal** pada saat tagihan dibuat.
5. Pembayaran online menggunakan **Mayar.id**.
6. Status pembayaran diperbarui berdasarkan event pembayaran/webhook dari Mayar.
7. Sistem harus aman terhadap duplicate webhook dan duplicate update pembayaran.
8. Development lokal dapat menggunakan **ngrok** untuk menyediakan endpoint webhook publik.
9. Production di Vercel menggunakan URL webhook publik aplikasi dan **tidak bergantung pada ngrok**.

Mayar menyediakan kapabilitas pembayaran, API/headless commerce, serta webhook yang dapat digunakan untuk integrasi aplikasi eksternal. Mayar juga mendukung berbagai metode pembayaran online dan pengelolaan invoice/pembayaran. citeturn0search0turn0search2turn0search7turn0search9

---

## 36. Role & Hak Akses Pembayaran SPP

| Fitur | Admin | Santri | Wali Santri | Guru |
|---|:---:|:---:|:---:|:---:|
| Kelola konfigurasi tarif SPP | ✅ | ❌ | ❌ | ❌ |
| Generate tagihan SPP | ✅ | ❌ | ❌ | ❌ |
| Lihat seluruh tagihan | ✅ | ❌ | ❌ | ❌ |
| Lihat tagihan sendiri | ❌ | ✅ | ❌ | ❌ |
| Lihat tagihan anak | ❌ | ❌ | ✅ | ❌ |
| Memulai pembayaran online | ❌ | ✅ | ✅ | ❌ |
| Redirect ke checkout Mayar | ❌ | ✅ | ✅ | ❌ |
| Lihat riwayat pembayaran | ❌ | ✅ | ✅ | ❌ |
| Lihat semua pembayaran | ✅ | ❌ | ❌ | ❌ |
| Mark paid/manual adjustment | Opsional, dengan audit | ❌ | ❌ | ❌ |
| Refund/correction workflow | Admin sesuai kebijakan | ❌ | ❌ | ❌ |

Wali Santri hanya boleh mengakses tagihan dan pembayaran milik anak yang memang terhubung melalui relasi `wali_santri_anak`.

---

## 37. Konfigurasi Tarif SPP oleh Admin

Admin harus dapat mengelola tarif SPP melalui halaman:

```text
/admin/pembayaran
/admin/pembayaran/tarif-spp
/admin/pembayaran/tagihan
/admin/pembayaran/transaksi
/admin/pembayaran/pengaturan
```

### 37.1 Tarif Tidak Boleh Hard-Code

Sistem tidak boleh memiliki nilai seperti:

```text
const SPP = 500000
```

sebagai sumber kebenaran bisnis.

Tarif harus berasal dari database.

### 37.2 Data Konfigurasi Tarif SPP

Tambahkan tabel konseptual:

```text
tarif_spp
- id (pk)
- nama
- nominal
- kelas_id (nullable)
- tahun_ajaran_id (nullable)
- berlaku_mulai
- berlaku_sampai (nullable)
- is_active
- created_by (fk -> user.id)
- created_at
- updated_at
```

Catatan:
- Tarif dapat dibuat umum untuk seluruh santri.
- Tarif dapat dibedakan berdasarkan kelas jika kebijakan pesantren memerlukannya.
- Tarif memiliki periode berlaku.
- Admin dapat membuat tarif baru ketika SPP naik.
- Tarif lama dapat dinonaktifkan tanpa menghapus histori.

### 37.3 Prinsip Versioning Tarif

Jika saat ini:

```text
SPP Januari–Juni 2026 = Rp300.000
```

Kemudian pesantren menaikkan SPP:

```text
SPP mulai Juli 2026 = Rp350.000
```

Maka:
- Tagihan Januari–Juni tetap menyimpan nominal Rp300.000.
- Tagihan baru setelah perubahan menggunakan konfigurasi tarif yang berlaku.
- Jangan melakukan update massal pada tagihan lama hanya karena `tarif_spp.nominal` berubah.
- Sebaiknya admin membuat record tarif/periode baru daripada menimpa histori tarif lama.

---

## 38. Tagihan SPP

Tambahkan tabel konseptual:

```text
tagihan_spp
- id (pk)
- nomor_tagihan (unique)
- santri_id (fk -> santri_profile.id)
- tarif_spp_id (fk -> tarif_spp.id, nullable untuk menjaga fleksibilitas histori)
- tahun_ajaran_id (fk -> tahun_ajaran.id)
- periode_bulan
- periode_tahun
- nominal
- nominal_diskon (default 0)
- nominal_denda (default 0)
- total_tagihan
- jatuh_tempo (nullable)
- status (enum: draft | pending | unpaid | processing | paid | expired | cancelled | failed)
- created_at
- updated_at
- created_by (fk -> user.id)
```

### 38.1 Snapshot Nominal

Field berikut adalah snapshot:

```text
nominal
nominal_diskon
nominal_denda
total_tagihan
```

Perubahan tarif di masa depan **tidak boleh mengubah nilai snapshot tagihan lama**.

### 38.2 Uniqueness Tagihan

Untuk mencegah tagihan SPP bulan yang sama dibuat dua kali tanpa sengaja, gunakan business uniqueness rule yang sesuai, minimal berdasarkan:

```text
santri_id
+ periode_bulan
+ periode_tahun
```

Jika di masa depan terdapat lebih dari satu jenis tagihan, uniqueness dapat diperluas dengan `jenis_tagihan`.

### 38.3 Generate Tagihan

Admin dapat:
- Generate tagihan satu santri.
- Generate tagihan satu kelas.
- Generate tagihan seluruh santri.
- Generate secara bulk berdasarkan tarif yang aktif.

Generate harus idempotent:
- Jika tagihan periode tersebut sudah ada, sistem tidak boleh membuat duplicate secara diam-diam.
- Sistem harus melaporkan jumlah tagihan baru, yang dilewati, dan yang gagal.

---

## 39. Transaksi Pembayaran

Tambahkan tabel konseptual:

```text
pembayaran_spp
- id (pk)
- tagihan_spp_id (fk -> tagihan_spp.id)
- provider (default: mayar)
- provider_transaction_id (nullable, unique jika tersedia)
- provider_invoice_id (nullable, unique jika tersedia)
- checkout_url (nullable)
- payment_method (nullable)
- nominal_dibayar
- biaya_admin (nullable)
- total_dibayar (nullable)
- status (enum: pending | processing | paid | expired | failed | cancelled | refunded)
- paid_at (nullable)
- provider_payload (json, nullable)
- created_at
- updated_at
```

Nama field ID provider harus disesuaikan dengan object identifier yang benar dari API Mayar yang digunakan.

Mayar menyediakan API untuk invoice/payment dan juga mekanisme webhook/history webhook; implementasi harus mengikuti dokumentasi/API Mayar yang aktif saat coding dilakukan. citeturn0search2turn0search8

---

## 40. Workflow Pembayaran SPP

### 40.1 Admin Menentukan Tarif

1. Admin membuka menu Tarif SPP.
2. Admin membuat tarif baru.
3. Admin menentukan nominal.
4. Admin menentukan target kelas jika diperlukan.
5. Admin menentukan periode mulai berlaku.
6. Admin mengaktifkan tarif.
7. Tarif lama tetap disimpan untuk histori.

### 40.2 Generate Tagihan

1. Admin memilih periode SPP.
2. Sistem menentukan santri target.
3. Sistem mengambil tarif yang aktif dan sesuai periode.
4. Sistem membuat `tagihan_spp`.
5. Sistem menyimpan snapshot nominal.
6. Jika tagihan periode tersebut sudah ada, sistem tidak membuat duplikat.

### 40.3 Santri/Wali Membayar

1. Santri atau Wali membuka menu **Pembayaran SPP**.
2. Sistem menampilkan:
   - Periode.
   - Nominal tagihan.
   - Jatuh tempo.
   - Status.
3. User memilih tagihan yang belum dibayar.
4. User menekan tombol **Bayar Sekarang**.
5. Backend membuat payment/invoice/request payment melalui integrasi Mayar sesuai API yang digunakan.
6. Sistem menyimpan reference/ID transaksi provider dan `checkout_url`.
7. User diarahkan ke halaman checkout Mayar.
8. User memilih metode pembayaran yang tersedia.
9. Mayar memproses pembayaran.
10. Mayar mengirim event/webhook ke aplikasi.
11. Aplikasi memvalidasi webhook.
12. Aplikasi memperbarui transaksi dan tagihan menjadi `paid` jika pembayaran benar-benar berhasil.
13. Riwayat pembayaran langsung dapat dilihat oleh pihak yang berwenang.

Mayar mendukung alur pembayaran online melalui API/headless integration dan payment link/checkout. citeturn0search7turn0search9turn0search10

---

## 41. Webhook Mayar — Requirement Kritis

Endpoint webhook:

```text
POST /api/webhooks/mayar
```

Endpoint harus:

1. Hanya menerima method POST.
2. Memverifikasi autentisitas/signature/token webhook sesuai mekanisme keamanan resmi Mayar yang berlaku.
3. Memvalidasi payload.
4. Mengidentifikasi transaksi menggunakan provider transaction/invoice/payment ID atau metadata/reference yang dibuat saat payment.
5. Tidak mempercayai nominal atau status dari client browser sebagai sumber kebenaran.
6. Menangani duplicate delivery.
7. Menyimpan event/log webhook.
8. Memproses status secara idempotent.
9. Mengembalikan response sukses sesuai requirement provider setelah event berhasil diterima/ditangani.
10. Tidak menjadikan redirect browser sebagai satu-satunya mekanisme konfirmasi pembayaran.

Mayar menyediakan konfigurasi webhook, pengujian webhook, riwayat delivery, dan retry webhook. Implementasi detail endpoint, event, payload, dan verifikasi harus mengikuti dokumentasi Mayar yang berlaku pada saat integrasi. citeturn0search2turn0search8

### 41.1 Idempotency Webhook

Tambahkan tabel:

```text
payment_webhook_events
- id (pk)
- provider (mayar)
- provider_event_id (nullable, unique jika tersedia)
- provider_transaction_id (nullable)
- event_type (nullable)
- payload (json)
- processing_status (received | processed | failed | ignored)
- received_at
- processed_at (nullable)
- error_message (nullable)
```

Jika event yang sama dikirim ulang:
- Jangan membuat pembayaran baru.
- Jangan menambah nominal pembayaran.
- Jangan mengubah status `paid` menjadi status yang tidak valid.
- Gunakan provider event ID atau kombinasi identifier yang sesuai sebagai idempotency key.

---

## 42. Development Webhook dengan ngrok

Untuk development lokal:

```text
Mayar
  |
  v
https://xxxxx.ngrok-free.app/api/webhooks/mayar
  |
  v
Next.js localhost
  |
  v
Database development
```

Contoh konsep:

```text
npx ngrok http 3000
```

Kemudian URL publik ngrok digunakan sebagai webhook URL development.

Contoh:

```text
https://xxxxx.ngrok-free.app/api/webhooks/mayar
```

URL webhook dapat diperbarui pada konfigurasi Mayar menggunakan mekanisme yang disediakan provider. Mayar menyediakan kapabilitas update/test webhook pada tooling/API-nya. citeturn0search2turn0search8

### 42.1 Environment Development

Contoh:

```env
APP_URL=http://localhost:3000
WEBHOOK_PUBLIC_URL=https://xxxxx.ngrok-free.app
MAYAR_API_KEY=
MAYAR_WEBHOOK_SECRET=
```

Nama environment variable final harus disesuaikan dengan requirement API Mayar yang sebenarnya.

### 42.2 Jangan Hard-Code URL ngrok

Jangan pernah menulis URL ngrok secara permanen di source code.

Gunakan:

```text
WEBHOOK_PUBLIC_URL
```

atau konfigurasi environment yang setara.

---

## 43. Production Webhook di Vercel

Pada production:

```text
Mayar
  |
  v
https://domain-pesantren.com/api/webhooks/mayar
  |
  v
Next.js di Vercel
  |
  v
Production Database
```

Ngrok hanya digunakan sebagai tunnel untuk local development/testing.

Production tidak boleh bergantung pada:

```text
localhost
ngrok URL development
SQLite filesystem lokal
temporary server filesystem
```

Webhook URL production harus merupakan URL HTTPS publik yang stabil.

Contoh:

```text
https://domain-pesantren.com/api/webhooks/mayar
```

atau domain deployment Vercel yang telah dikonfigurasi.

### 43.1 Environment Production

Contoh kategori:

```env
APP_URL=
DATABASE_URL=
BETTER_AUTH_SECRET=
MAYAR_API_KEY=
MAYAR_WEBHOOK_SECRET=
WEBHOOK_PUBLIC_URL=
```

Secret:
- Tidak boleh dikirim ke browser.
- Tidak boleh menggunakan prefix `NEXT_PUBLIC_`.
- Tidak boleh di-hard-code.
- Disimpan melalui Vercel Environment Variables untuk production.

---

## 44. Payment Status State Machine

Status tidak boleh berubah secara sembarangan.

Contoh alur:

```text
draft
  ↓
unpaid
  ↓
pending
  ↓
processing
  ↓
paid
```

Kemungkinan status terminal:

```text
paid
expired
failed
cancelled
refunded
```

Aturan:
- `paid` tidak boleh kembali menjadi `pending` hanya karena webhook lama datang terlambat.
- Update status harus mempertimbangkan urutan dan validitas state.
- Jika provider mengirim event tidak berurutan, gunakan data transaksi provider/reference untuk melakukan reconciliation bila diperlukan.

---

## 45. Payment Reconciliation

Tambahkan kemampuan Admin untuk melihat:

- Tagihan.
- Status internal.
- Status transaksi Mayar.
- Reference/provider ID.
- Waktu pembayaran.
- Payment method.
- Webhook terakhir.
- Error webhook jika ada.

Fitur tambahan yang direkomendasikan:

**Reconcile Transaction**

Digunakan apabila:
- Webhook gagal.
- Event terlambat.
- Status internal berbeda dengan provider.
- Admin perlu melakukan pengecekan ulang.

Reconciliation harus mengambil status dari API/provider yang sah dan tidak hanya mengubah status secara manual tanpa jejak.

Mayar menyediakan kemampuan mengambil detail pembayaran/invoice dan melihat histori webhook melalui API/tooling yang tersedia. citeturn0search2turn0search8

---

## 46. Manual Payment & Audit Trail

Walaupun pembayaran utama menggunakan Mayar, pesantren mungkin menerima pembayaran offline/manual.

Fitur ini **opsional tetapi direkomendasikan**:

Admin dapat mencatat:
- Cash.
- Transfer manual.
- Metode lain yang disetujui pesantren.

Setiap pembayaran manual wajib menyimpan:

```text
- nominal
- metode
- tanggal
- dicatat_oleh
- catatan
- bukti (opsional)
```

Status manual tidak boleh menghapus histori pembayaran Mayar.

Semua tindakan berikut wajib dicatat dalam `activity_log`:
- Membuat tarif.
- Mengubah tarif.
- Mengaktifkan/nonaktifkan tarif.
- Generate tagihan.
- Membatalkan tagihan.
- Manual mark paid.
- Adjustment.
- Reconciliation.
- Refund/correction jika fitur tersedia.

---

## 47. Halaman Baru

Tambahkan ke struktur routing:

```text
/admin
  /pembayaran
    /dashboard
    /tarif-spp
    /tagihan
    /transaksi
    /pengaturan

/santri
  /pembayaran
    /tagihan
    /riwayat

/wali
  /pembayaran
    /anak/[santriId]/tagihan
    /anak/[santriId]/riwayat
```

Halaman pembayaran menggunakan shadcn/ui dan mengikuti state UI:

- Loading.
- Empty.
- Error.
- Success.
- Pending.
- Paid.
- Expired.
- Failed.

Komponen yang relevan:
- Card.
- Table/Data Table.
- Badge.
- Dialog.
- Alert Dialog.
- Tabs.
- Skeleton.
- Sonner/Toast.
- Select/filter.
- Pagination.

---

## 48. Dashboard Pembayaran

### Admin

Menampilkan:
- Total tagihan periode berjalan.
- Total pembayaran berhasil.
- Total belum dibayar.
- Total pending.
- Total nominal pembayaran.
- Transaksi terbaru.
- Tagihan overdue jika fitur jatuh tempo digunakan.

### Santri

Menampilkan:
- Tagihan bulan/periode berjalan.
- Status pembayaran.
- Tombol Bayar Sekarang.
- Riwayat pembayaran.

### Wali Santri

Menampilkan:
- Pilihan anak.
- Tagihan aktif setiap anak.
- Status pembayaran.
- Riwayat pembayaran.
- Tombol bayar untuk tagihan anak yang terhubung.

---

## 49. Perubahan Definition of Done

Tambahkan requirement berikut untuk modul pembayaran:

- [ ] Tarif SPP dapat dikelola Admin.
- [ ] Nominal SPP tidak hard-coded.
- [ ] Tarif memiliki periode berlaku.
- [ ] Perubahan tarif tidak mengubah tagihan lama.
- [ ] Tagihan menyimpan snapshot nominal.
- [ ] Duplicate tagihan dapat dicegah.
- [ ] Pembayaran dapat dibuat melalui integrasi Mayar.
- [ ] Reference/ID transaksi provider tersimpan.
- [ ] Webhook dapat diterima di development melalui ngrok.
- [ ] Webhook production menggunakan endpoint HTTPS publik.
- [ ] Webhook tervalidasi sesuai mekanisme provider.
- [ ] Duplicate webhook tidak membuat duplicate payment.
- [ ] Status pembayaran memiliki aturan transisi.
- [ ] Santri tidak dapat membayar/mengakses tagihan santri lain.
- [ ] Wali hanya dapat mengakses tagihan anak yang terhubung.
- [ ] Admin dapat melihat histori transaksi.
- [ ] Semua aksi administratif penting memiliki audit trail.
- [ ] Secret Mayar tidak bocor ke client.
- [ ] Flow payment diuji end-to-end menggunakan environment/test mechanism yang tersedia.

---

## 50. Tambahan Vibe Coding Rules untuk Modul Pembayaran

OpenCode/agent harus mengikuti aturan:

1. Jangan hard-code nominal SPP.
2. Jangan mengubah tagihan lama ketika admin mengubah tarif.
3. Gunakan snapshot nominal pada tagihan.
4. Jangan menganggap redirect sukses dari browser sebagai bukti pembayaran final.
5. Webhook/provider confirmation adalah bagian utama sinkronisasi status pembayaran.
6. Semua webhook harus idempotent.
7. Jangan membuat transaksi duplicate jika user menekan tombol bayar berulang kali.
8. Gunakan idempotency/reference key untuk payment creation bila API provider mendukungnya.
9. Jangan mempercayai `amount` atau `status` yang dikirim langsung dari frontend.
10. Jangan expose `MAYAR_API_KEY` ke client.
11. Jangan hard-code URL ngrok.
12. Bedakan environment development dan production.
13. Gunakan ngrok hanya untuk local webhook development.
14. Production webhook harus menuju domain HTTPS publik yang stabil.
15. Simpan payload provider untuk audit/debug dengan memperhatikan data sensitif.
16. Jangan menyimpan data kartu pembayaran.
17. Jika detail API Mayar berubah, gunakan dokumentasi resmi/API reference Mayar yang aktif sebagai sumber implementasi.
18. Setelah modul selesai, lakukan test: create payment → checkout → webhook → update transaction → update tagihan → tampilkan riwayat.

---

## 51. Prioritas MVP Pembayaran

### P0 — Wajib

- Tarif SPP configurable oleh Admin.
- Versioning/periode tarif.
- Generate tagihan.
- Snapshot nominal.
- Daftar tagihan Santri.
- Daftar tagihan anak untuk Wali.
- Create payment melalui Mayar.
- Redirect/checkout URL Mayar.
- Webhook endpoint.
- Idempotency webhook.
- Update status otomatis.
- Riwayat pembayaran.
- Admin transaction monitoring.
- ngrok untuk local webhook development.
- Endpoint HTTPS publik untuk production Vercel.

### P1 — Penting

- Bulk generate tagihan.
- Reconciliation.
- Webhook event log.
- Jatuh tempo.
- Notifikasi tagihan.
- Payment reminder.
- Manual payment dengan audit trail.
- Export laporan pembayaran.

### P2 — Nice to Have

- Diskon.
- Denda otomatis.
- Cicilan/partial payment.
- Virtual account khusus per santri jika didukung arsitektur/provider.
- WhatsApp reminder.
- Invoice/receipt PDF.

---

## 52. Prinsip Bisnis Pembayaran SPP

Sistem harus memisahkan tiga konsep:

```text
TARIF
↓
aturan harga yang dapat berubah dari waktu ke waktu

TAGIHAN
↓
kewajiban pembayaran untuk santri pada periode tertentu
+ snapshot nominal

PEMBAYARAN
↓
transaksi aktual melalui Mayar/manual
```

Dengan pemisahan ini, jika kebijakan pesantren berubah:

```text
Tarif SPP naik
```

maka:

```text
Tarif baru dibuat
        ↓
Tagihan periode baru menggunakan tarif baru
        ↓
Tagihan lama tetap menggunakan snapshot lama
        ↓
Histori pembayaran tetap konsisten
```

Ini adalah requirement utama agar sistem pembayaran tetap fleksibel terhadap perubahan kebijakan dan perkembangan nominal SPP di masa depan.
