# PlantVector

Prototipe panel admin PlantVector (Plantation Management System): login, Beranda, FFB Tracking, Mill, Kebun, Curah Hujan, Kehadiran, notifikasi, profil, dan catatan perubahan. Situs statis murni (HTML, CSS, JavaScript), tanpa build step dan tanpa dependensi. Semua data adalah data contoh.

Pengembang: PT. Makmur Mekanisasi Teknologi

## Struktur

| File | Isi |
|---|---|
| `index.html` | Halaman tunggal; navigasi memakai hash (`#dashboard`, `#tasks`, `#abw`, ...) |
| `app.css` | Semua gaya |
| `app.js` | Login, loader, Beranda, routing |
| `ui.js` | Komponen dropdown, kalender, bulan, dan jam custom |
| `nav.js` | Mega menu header, drawer HP, menu footer |
| `ffb.js`, `mills.js`, `rawat.js`, `kebun.js`, `hujan.js`, `hadir.js`, `pabrik.js`, `extra.js` | Halaman per modul |
| `assets/` | Ikon dan logo |
| `vercel.json` | Pengaturan Vercel (cache, header keamanan) |
| `404.html` | Halaman tidak ditemukan |
| `.github/workflows/ci-cd.yml` | CI/CD: cek kode lalu deploy ke Vercel |
| `scripts/check.mjs` | Pemeriksaan yang dijalankan CI |
| `.vercelignore` | File yang tidak ikut di-deploy |
| `DESIGN.md` | Catatan desain dan keputusan UI |

## Jalankan di komputer

Buka `index.html` langsung di browser, atau jalankan server lokal:

```bash
npx serve .
```

## Deploy otomatis (GitHub Actions + Vercel)

Workflow `.github/workflows/ci-cd.yml` berjalan di setiap push dan pull request:

1. **Cek kode** (`node scripts/check.mjs`): sintaks semua file JS, `vercel.json` valid, dan semua file yang dirujuk HTML/JS ada.
2. Kalau lolos:
   - push ke `main` → **deploy produksi** ke Vercel
   - push ke branch lain atau pull request → **deploy preview** (URL muncul di ringkasan job dan tab Environments)

Deploy dilakukan oleh GitHub Actions, jadi integrasi Git bawaan Vercel dimatikan di `vercel.json` (`"git": { "deploymentEnabled": false }`) supaya tidak deploy dua kali.

### Pengaturan sekali saja

1. Buat proyek di Vercel dan sambungkan ke folder ini dari komputer:
   ```bash
   npm i -g vercel
   vercel login
   vercel link        # pilih/buat proyek "plantvector-demo"
   ```
   Perintah ini membuat `.vercel/project.json` berisi `orgId` dan `projectId` (folder `.vercel` tidak ikut di-commit).
2. Buat token di Vercel: Account Settings → Tokens → Create.
3. Di GitHub repo: Settings → Secrets and variables → Actions → New repository secret, isi tiga secret:
   - `VERCEL_TOKEN` = token dari langkah 2
   - `VERCEL_ORG_ID` = `orgId` dari `.vercel/project.json`
   - `VERCEL_PROJECT_ID` = `projectId` dari `.vercel/project.json`
4. Push ke `main`. Selama secret belum diisi, job cek tetap jalan dan deploy dilewati dengan pemberitahuan.

### Cek di komputer sebelum push

```bash
node scripts/check.mjs
```

## Catatan

- Font dimuat dari Google Fonts (Fraunces, Figtree, Plus Jakarta Sans).
- Demo login: email apa pun dan kata sandi minimal 6 karakter. Kata sandi `salah123` menampilkan pesan galat.
- Membuka URL langsung ke halaman tertentu, misalnya `/#abw`, akan melewati login.
