# 03 · Hijau Putih

Builds on **03 · Tanah & Minyak**: same editorial structure, Fraunces + Figtree type, top navigation and figure-led hierarchy, with the brown palette replaced by green and white. This prototype covers **login**, **dashboard (Beranda)** and **Mills — Scan Surat Jalan** (`/admin/mill-surat-jalan`).

## Color choice
I went with the **green-and-white** option rather than plain white. Green is used on brand surfaces (the login brand panel, the dashboard hero, the page-transition curtain, primary buttons and the active tab). Every content area is white. This keeps the PlantVector identity strong without making tables and figures hard to read.

| Token | HEX | Usage |
|---|---|---|
| `--g800` | `#0B4A3A` | Logo green: brand panels, hero, primary button, active tab/segment, curtain |
| `--g700` / `--g900` | `#0F5C47` / `#073528` | Hover, decorative leaf shapes |
| `--g500` | `#1F7A3F` | Links, focus border, small green text (5.4:1 on white) |
| `--leaf` | `#2FA84F` | Positive values, Segar HI, success button, ABW above default |
| `--lime` | `#8BD450` | Accents on green (kicker text, operators, focus ring, live dot) |
| `--mint` / `--mint-2` | `#E6F3EC` / `#F3F9F5` | Soft fills, chips, empty bar tracks |
| `--white` / `--bg` | `#FFFFFF` / `#F6FAF7` | Content surfaces / page |
| `--ink` / `--ink-2` / `--muted` | `#0F231B` / `#33473F` / `#52665D` | Text (muted 6:1 on white) |
| on green | `#FFFFFF` / `#CFE6DA` / `#A8CDBB` | Text on `#0B4A3A` (12:1 / 8:1 / 5.6:1) |
| restan age | `#2FA84F` 0 h · `#D99A00` 1 h · `#E06A1F` 2 h · `#C3322F` ≥3 h | Ageing bars; they also step down in lightness |
| error / warning | `#B42318` on `#FDEBE9` · `#8A5A00` on `#FFF2D2` | Validation, countdown |

## Motion
- Easing: `cubic-bezier(.22,1,.36,1)` (out), `cubic-bezier(.65,0,.35,1)` (in-out). Durations 180 / 320 / 560 / 820 ms.
- Only `transform` and `opacity` are animated, plus stroke-dashoffset (ring/check) and `grid-template-rows` for the error banner. Number count-ups use `requestAnimationFrame`.
- **Login:** staggered reveal of logo → heading → fields → button (70 ms steps); leaf shapes slide in, then drift slowly. Input focus ring, validation shake + message fade, Caps Lock warning, show/hide password with an animated slash, loading spinner and a drawn check mark on success. The button and messages keep fixed heights, so nothing moves around.
- **Login → dashboard:** a green curtain with the PV mark slides up, the view swaps behind it, then the curtain slides away and the dashboard's own entrance runs. Logout plays the same transition back to login.
- **Dashboard:** hero nodes and cards rise in a stagger; numbers count up from their previous value; bars grow from the left. Tabs have a sliding pill indicator, and panels slide in from the direction of travel. Changing the date slides the date label and re-counts every number.
- `prefers-reduced-motion: reduce` cuts every animation and transition to near-zero, shows content immediately, skips the curtain and disables the shake.

## Dashboard: same data, new structure
Everything from the old FFB Daily Summary and its second page is still here:

| Old dashboard | New location |
|---|---|
| A · Restan BF, 1 hari, 2 hari, >3 hari | Hero node **A** + card A with ageing bars |
| B · Produksi hari ini, Sudah terkirim, Belum terkirim | Hero node **B** + card B with a completion ring |
| C · Surat Jalan hari ini, Tonase (ton) | Card **C · Penerimaan mill** (plus implied ABW) |
| D · Terkirim hari ini, Segar HI, Restan | Hero node **D** + card D with a stacked bar |
| E · Restan CF, 0 hari, 1 hari, ≥2 hari | Hero result node **E** + card E with ageing bars and a 23:00 countdown |
| Info text for A–E | **i** popovers on each hero node + an always-visible "Arti setiap angka" section |
| Date, prev/next, refresh, last updated | Date control in the hero |
| Tandan Terkirim / Surat Jalan / Tonase Kiriman per zone → sub-zone → gang (3 duplicated tables) | **Kiriman per estate** tab: one view with a metric switch, an estate share bar, and estate cards listing sub-zones (bar) and gangs (chips) |
| ABW kg/tandan per estate and sub-zone | **ABW per divisi** tab: estate tiles with delta vs the 25,00 kg default, plus a diverging bar per division |

The key idea: the hero shows the day as a **tandan balance**, `Restan BF + Produksi − Terkirim = Restan CF`, with a "Cek neraca" line under it. The old A–E boxes really are parts of this one equation.

## Layout
- Login: two columns (green brand panel / white form). Below 900px it stacks into a short brand header above the form.
- Dashboard: white sticky header → green hero (equation) → sticky section tabs → white card grid on 12 columns. The equation goes 7 columns → 3 columns → 2×2 on phones (operators hidden there; the "Cek neraca" line keeps the equation readable).

## Mills · Scan Surat Jalan (`#mills`)
Source: `MillSuratJalanController@getListV2` → `millSuratJalanV2.blade.php`, `validateqrV2`, `createSuratJalanTaskV2`, `reprintLastTicket`, `printConfirmationLetter`, `MillSJParseTraits::parseSjToTable`.

Same flow and fields as the live page, reorganised into three visible steps (Scan QR → Periksa muatan → Timbang & simpan):

| Old page | New location |
|---|---|
| "Scan QR di sini" input (scanner + Enter) | Large scan field with a ready/validating/valid indicator; focus stays there so the hand scanner always works |
| Total Tandan, Truck Plat No, Peloading, Total Sak, Supir/Pengemudi, Check Point Tiket ID, Jaring | Muatan card: number plate, supir, peloading, CP tiket ID, the checkpoint user and time, contractor (already in the QR data), total tandan, total sak, jaring |
| Total Berat (Kg), Weigh Bridge ID | Timbangan card on the right, with a live ABW (berat ÷ tandan) check that warns outside 15–35 kg |
| Submit (swal confirm → processing → success → auto print) | "Simpan & cetak tiket" → confirmation dialog → saving state → success card with a mill-ticket preview, "Cetak ulang" and "Scan truk berikutnya" |
| Cetak Tiket Terakhir | Button in the page header + "Tiket terakhir" list with a reprint button per ticket |
| Task table (No … Jenis Kerja) | Same 14 columns; the grading columns are grouped under one header, with a total row and a note that Tdn/Sak = mengkal + matang + t.matang (sacks for kutip brondolan) |
| swal errors ("Harap scan masuk QR code", "Tiket ini sudah di scan", invalid QR, "Harap masukkan Berat Total") | Inline messages with a shake on the field |

Demo buttons on the scan card simulate a valid scan, an invalid QR and an already-scanned ticket.

## Navigation · FFB Tracking
The four real menus under E-Operasi › FFB Tracking are grouped into one nav item:

- Tugas Panen (`/admin/task`)
- Surat Jalan (`/admin/surat-jalan`)
- Mills (`/admin/mill-surat-jalan`)
- Scan Laporan BCC (`/admin/scan-lhm`)

The mega menu opens on hover (with a short delay), on click, or with Enter/↓. The panel has three parts:

- **Route panel (green):** shows the TBS route TPH → Checkpoint → Timbangan PKS, with a small truck moving along it.
- **Menu items:** a 2×2 grid. A highlight slides to whichever item is hovered, and the icon lifts.
- **Preview pane:** shows that item's live figures and changes with the hover.

Arrow keys move between items and Esc closes the menu. Below 1180px it becomes a slide-in drawer with an accordion.

## Tugas Panen (`#tasks`)
Source: `TaskCrudController`.

- **Columns:** all 19 list columns are kept. 10 are shown by default, and the rest can be switched on from the "Kolom" menu.
- **Filters:** status tabs (Panen HI, Restan, Selesai, Hilang, Dibatalkan), date shortcuts, and a filter panel for Zone, Job category, Gang and Tanggal kirim/Last update.
- **Table:** search, sorting, pagination with rows per page, and a sticky Task ID column.
- **Detail:** clicking a row opens a side sheet with grading, the BCC journey, card data and the TPH photo. The QR button on each row opens the task QR (task_created_qr).
- **Export:** Excel, CSV, PDF and print.

## Surat Jalan (`#surat-jalan`)
Source: `SuratJalanCrudController`.

- **Summary:** 4 KPIs at the top.
- **Filters:** status, tanggal kirim and zone.
- **Rows:** each row expands (the old details row) to show the BCC inside the SJ, the truck photo and the metadata.
- **Actions:** the row action menu has Export Surat Jalan PDF, Tiket mill berhasil and Tiket mill gagal. The top-bar button is "Recalculate SJ", with a confirmation step.

## Scan Laporan BCC (`#scan-bcc`)
Source: `scanLHMpage.blade.php`, `parselhmQR`, `insertRestanTask`.

- **Flow:** the same three steps as Mills: Scan QR laporan → Periksa tiket → Kirim sebagai restan.
- **What it adds:** an FFB-per-block chart, the combined grading, and the full ticket table with the same columns as the old page.
- **Saving:** tickets are saved with status Restan (overnight), matching `insertRestanTask`.

## Navigation · Perawatan
"Perawatan Kebun" is now a **Perawatan** mega menu with the same behaviour as FFB Tracking:

- Kerja Perawatan (`/admin/other-task`)
- Scan Laporan Kerja Harian (`/admin/scan-other-task?id=rawat`)

The route panel shows Blok → Kantor afdeling → Daftar & upah. Opening one mega menu closes the other.

## Kerja Perawatan (`#perawatan`)
Source: `OtherTaskCrudController` list.

- **Date:** Hari ini is shown by default, like the date filter in the code.
- **Jenis kerja strip:** one card per type with total result in its own unit (Ha, Pokok, Meter, HK), task count, worker count and wages. Clicking a card filters by that type.
- **Filters:** Zone, Pekerja, Gang and Lembur (OT).
- **Grouping:** by Jenis kerja (default) or Mandor, with a wage subtotal per group, or no grouping with pagination.
- **Columns:** all list columns are available from the "Kolom" menu.
- **Detail and edit:** clicking a row opens a side sheet. "Ubah" edits Hasil kerja, Total gaji, Material and Remark (update operation). There is no create or delete, matching the controller.

## Scan Laporan Kerja Harian (`#scan-perawatan`)
Source: `otherTasksPage.blade.php`, `parseOtherTaskQR`, `duplTasks`, `insertOtherTask`.

- **Flow:** three steps: Scan QR tiket kerja → Periksa & sesuaikan → Kirim laporan.
- **Scan card:** shows a data check. Workers not registered (`is_harvestor_exist`) and unknown work types (`is_rate_exist`) are flagged, as on the old page's red cells.
- **Laporan card:** "Laporan dibuat oleh" (read-only), No laporan with the estate prefix (EMC), the Keterangan from the QR, and a live wage total.
- **Table:** same columns as the old page, with editable Gaji per row.
- **Result:** after sending, it shows the berhasil/gagal counts and the failed rows.

## Screens
`index.html#login` · `#dashboard` · `#tasks` · `#surat-jalan` · `#mills` · `#scan-bcc` · `#perawatan` · `#scan-perawatan` (opening any of these directly skips the login).
Demo login: any email, password of at least 6 characters; `salah123` shows the server error state.

## Kebun, Curah Hujan, Kehadiran (menu baru)

Navigasi: Perawatan, Pupuk, Racun, dan Harvest Interval digabung dalam satu mega menu **Kebun** yang dibagi per seksi (supaya bar navigasi tidak penuh). Curah Hujan dan Kehadiran punya mega menu sendiri. Drawer mobile memakai heading seksi yang sama.

| Route prototipe | Route PMMS | File |
|---|---|---|
| #pupuk | /admin/pupuk-task | kebun.js |
| #pupuk-jenis | /admin/pupuk-type | kebun.js |
| #scan-pupuk | /admin/scan-other-task?id=pupuk | kebun.js |
| #racun | /admin/racun-tasks | kebun.js |
| #racun-jenis | /admin/racun | kebun.js |
| #scan-racun | /admin/scan-other-task?id=racun | kebun.js |
| #interval | /admin/intervalreporting | kebun.js |
| #hujan-baru | /admin/rainfall/create | hujan.js |
| #hujan | /admin/rainfall | hujan.js |
| #hujan-bulan | /admin/yearlyrainfallchart | hujan.js |
| #hujan-tahun | /admin/yearly2rainfallchart | hujan.js |
| #hadir | /admin/attendance | hadir.js |
| #hadir-scan | /admin/attendance_qr | hadir.js |
| #hadir-grafik | /admin/attendance_summary_graphical | hadir.js |

- Pupuk/Racun mengikuti pola Perawatan: strip ringkasan per jenis (klik = filter), tabel dikelompokkan, sheet detail dengan dosis standar, dan halaman scan 3 langkah dengan validasi pekerja dan jenis.
- Jenis Pupuk/Racun: master data dalam kartu atau tabel, form samping dengan pratinjau "di aplikasi mandor" dan nama otomatis huruf besar.
- Harvest Interval: grid blok × tanggal dengan kode warna ≤10 / 11–14 / >14 hari, kolom "Hari ini" lengket, mode Rencana untuk menandai hari panen (klik atau Enter).
- Curah Hujan: form dengan kejadian hujan berulang (durasi dan intensitas otomatis), gauge pratinjau; grafik SVG buatan sendiri (batang + garis rata-rata 5 tahun; garis multi-tahun dengan toggle dan mode kumulatif), tooltip saat hover.
- Kehadiran: % hadir per gang dengan ring dan bar, Kehadiran QR per pekerja dengan tab status dan filter "Hadir tanpa hasil", grafik komposisi bertumpuk per zone/gang, rekap per jabatan, dan donut.

## Header, footer, dan halaman akun

- Notifikasi: klik lonceng membuka pop-over (tab Semua / Belum dibaca, tandai semua dibaca), lalu "Lihat semua notifikasi" ke `#notifikasi` (filter kategori, hanya belum dibaca, tandai per item).
- Profil: klik nama membuka pop-over (Profil saya, Pengaturan, Catatan perubahan, Keluar). `#profil` berisi akses & peran, pengaturan notifikasi/tampilan, dan aktivitas.
- Footer: tautan semua modul, status layanan, versi (ke `#changelog`), jam server, tombol kembali ke atas.
- `#changelog`: timeline versi, filter jenis perubahan, pencarian, lompat ke versi. File: extra.js.
- Mega menu: sorotan memakai offsetTop sehingga tidak bergeser saat animasi masuk; preview memakai hover intent (arah kursor ke panel kanan) agar tidak berganti saat menuju tautan "Buka".
- Pindah antar mega menu: satu panel putih bersama (#megaBg) menganimasikan tingginya, isi menu bergeser kiri/kanan sesuai urutan tombol, dan pill lembut (#navInk) meluncur di bawah tombol yang terbuka. Saat satu menu sudah terbuka, pindah ke tombol lain hanya butuh 40 ms.
- Notifikasi v2: tanpa ikon. Kategori ditandai garis tipis berwarna + label teks (Pengiriman hijau, Restan kuning tua, Cuaca biru, Kehadiran ungu, Kebun hijau zaitun, Sistem abu), "Perlu tindakan" merah untuk yang butuh aksi. Daftar lengkap bergaya inbox: kolom jam di kiri, judul tebal bila belum dibaca.

## Mill (ABW & CMS)

Menu **Mill** diletakkan setelah FFB Tracking karena isinya kelanjutan alur TBS di pabrik: berat timbangan (ABW) dan angkutan (kontraktor, truk). File: pabrik.js.

| Route prototipe | Route PMMS |
|---|---|
| #abw | /admin/abw |
| #abw-harian | /admin/abw-daily-chart (Daily Mill Received Tonnage) |
| #kontraktor | /admin/contractor |
| #truk | /admin/truck |

- ABW Bulanan: filter bulan, zone, status Pending/Confirmed; kolom tandan, tonase, ABW (+ selisih bulan lalu), posisi vs rata-rata zone, tonase training/brondol/partheno. Pilih beberapa blok pending lalu Konfirmasi ABW (izin "ABW - Update"). Ubah ABW (akun FA) menampilkan dampak ke upah panen memakai rumus calc_wages yang sama dengan PMMS (basis 1,65 t, premi lebih). Tombol Sinkron dari Surat Jalan = sync_abw.
- Tonase Harian Mill: tonase per jam + garis akumulasi (sumbu kanan), truk per jam, tabel per jam dengan jam tersibuk disorot. Ekspor PDF/Excel.
- Kontraktor: kartu/tabel, group Internal/External, desa, status, kontak (link WhatsApp), ringkasan truk/trip/tonase; form tambah/ubah, tidak ada hapus.
- Truk & Supir: tab status Active/Inactive/Blacklist, filter type (FFB, CPO, PK, EFB, MF, DC, MIKO) dan kontraktor, plat bergaya pelat nomor, detail dengan QR, foto kendaraan, riwayat Surat Jalan; daftarkan truk lalu QR langsung tampil.
- Mega menu Mill punya baris "Sekilas hari ini" agar tidak ada ruang kosong di bawah seksi.

## Tabel

- Scrollbar tabel disembunyikan (juga strip ringkasan dan tab). Tabel tetap bisa digeser dengan trackpad, shift+scroll, atau ditarik dengan mouse; klik baris tidak terpicu setelah menarik.
- Tepi kiri/kanan tabel memudar bila masih ada kolom tersembunyi di sisi itu (tepi kiri tidak memudar bila tabel punya kolom lengket).
- `scrollbar-gutter: stable` di halaman supaya lebar layout tidak melompat saat tinggi halaman berubah.
- Urutan seksi menu Kebun: Racun, Pupuk, Perawatan, Harvest Interval (juga di drawer dan footer).

## Kontrol form, loader, logo

- **ui.js** mengganti semua `<select>`, `input[type=date|month|time]` dengan komponen sendiri secara otomatis (MutationObserver). Elemen asli tetap ada tersembunyi dan menyimpan nilai, jadi kode halaman tetap membaca `.value` dan event `input/change`. Dropdown: daftar dengan centang, cari bila lebih dari 8 pilihan, navigasi panah/Enter/Esc/ketik huruf. Tanggal: kalender Senin-Minggu, hari ini ditandai titik, min/max dihormati, klik judul untuk pilih bulan. Bulan: grid 12 bulan per tahun. Jam: kolom jam dan menit (kelipatan 5). Pop-over menempel di layar (fixed), membalik ke atas bila ruang bawah sempit, tertutup saat scroll keluar.
- Spinner input angka dan tombol hapus kolom cari bawaan browser disembunyikan.
- **Loader masuk** (terinspirasi React Bits "Threads" + "BlurText", ditulis ulang tanpa React): tirai membuka sebagai lingkaran dari tombol Masuk, garis-garis mengalir di kanvas (ikut posisi mouse), cincin progres di sekitar logo, nama PlantVector muncul per huruf dari blur, status berganti (Memverifikasi akun, Memuat estate, Menyiapkan neraca, Siap), nama pengembang di bawah. Keluar memakai loader yang sama, lebih singkat.
- **Logo**: ikon PV (gambar) + nama "PlantVector" dari teks (Plus Jakarta Sans, Plant 800, Vector 600) + tagline. Dipakai di header (27px) dan sisi kiri login (versi putih/lime, 36px; 27px di layar kecil). Form login tanpa logo. Kartu footer login tanpa logo.
- Selama animasi loading, scrollbar halaman disembunyikan (html.ct-lock); halaman login juga tanpa gutter scrollbar.
- Login: petunjuk demo dihapus; footer login berisi nama app, versi, dan "Dikembangkan oleh PT. Makmur Mekanisasi Teknologi". Footer aplikasi juga mencantumkan pengembang.
- Mega menu menutup dengan panel menggulung ke atas (tinggi ke 0) lalu memudar; membuka dari tertutup juga menggulung turun.

## Animasi menyeluruh

- **Section hijau** (hero Beranda, header halaman FFB/Kebun/Mill/dll, header Mills): saat halaman dibuka, bentuk daun besar berputar masuk lalu bergerak pelan terus-menerus, garis diagonal bergeser perlahan, dan satu kilau cahaya menyapu dari kanan ke kiri.
- **Scroll reveal** (extra.js `initReveal`): elemen yang berada di bawah layar saat halaman dibuka (kartu, KPI, glosarium, baris tabel, daftar, footer) disembunyikan lalu muncul berurutan saat masuk layar. Elemen yang sudah terlihat tetap memakai animasi masuk bawaannya. Setelah tampil, animasi bawaan tidak diulang (`sv-done`). Angka di kartu Beranda menghitung naik lagi saat kartunya muncul.
- Semua dimatikan bila pengguna memilih kurangi gerakan (prefers-reduced-motion).

- Hover intent mega menu: arah kursor ke panel preview hanya dihitung selama kursor benar-benar bergerak (titik terakhir < 60 ms). Begitu kursor berhenti, item di bawahnya langsung aktif (cek ulang tiap 70 ms). Sorotan item 240 ms.

## Footer & nama sistem

- Footer: kiri logo PlantVector (teks), deskripsi singkat, status layanan; kanan 6 kolom menu yang dibuat otomatis dari grup menu header (nav.js `buildFooter`). Tiap kolom maksimal 4 menu utama (untuk grup berseksi: menu pertama tiap seksi) dengan label pendek agar satu baris; sisanya di balik "Lihat semua +n" yang membuka di tempat; baris bawah hanya © 2026 PlantVector · PT. Makmur Mekanisasi Teknologi, versi, dan tombol ke atas. Jam server dihapus.
- Nama yang tampil di UI selalu "PlantVector" (judul tab, login, footer, notifikasi). Kata "PMMS" di dokumen ini hanya merujuk ke kode aplikasi lama.
