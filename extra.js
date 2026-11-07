/* Header popovers (notifikasi, profil), footer, and the Catatan Perubahan / Notifikasi / Profil pages. Data is dummy. */
(() => {
'use strict';
const K = window.FFBKit; if (!K) return;
const { $, $$, esc, ic, pageHead, start } = K;
let H = { reduced: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, toast: (m) => { const t = $('#toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600); } };
const svg = (d, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  truck: '<path d="M3 6h11v9H3zM14 9h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/>',
  rain: '<path d="M7 15a4 4 0 01-.5-8A6 6 0 0118 8a3.5 3.5 0 01-1 7z"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  leaf: '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l8-8"/>',
  sys: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  bell: '<path d="M6 16V11a6 6 0 1112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  log: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
  doc: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
  go: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'
};
const CAT = { kirim: ['Pengiriman', '#1F7A3F'], restan: ['Restan', '#C27A00'], hujan: ['Cuaca', '#2F6690'], hadir: ['Kehadiran', '#7A4FA8'], kebun: ['Kebun', '#5B8A1E'], sistem: ['Sistem', '#6B7C74'] };

/* ---------------- notifications ---------------- */
const N = [
  { id: 1, jam: '11:42', act: true, cat: 'restan', t: '214 janjang restan lebih dari 3 hari', d: 'EMS2 · Gang H05 dan H07. Prioritaskan angkut pagi ini.', when: '10 menit lalu', day: 'Hari ini', href: '#scan-bcc', unread: true },
  { id: 2, jam: '11:27', cat: 'kirim', t: 'Surat Jalan SJ-10988 sudah ditimbang', d: 'KT 8421 RU · 14.820 kg · tiket mill WB-02-26110631.', when: '25 menit lalu', day: 'Hari ini', href: '#surat-jalan', unread: true },
  { id: 3, jam: '10:52', act: true, cat: 'hadir', t: 'Kehadiran Gang H07 hanya 56%', d: '5 dari 9 pekerja hadir. 3 izin, 1 sakit.', when: '1 jam lalu', day: 'Hari ini', href: '#hadir', unread: true },
  { id: 4, jam: '09:50', cat: 'hujan', t: 'Hujan lebat di EMC1: 48,2 mm', d: 'Jalan produksi blok rendah licin, panen dihentikan 1 jam.', when: '2 jam lalu', day: 'Hari ini', href: '#hujan', unread: true },
  { id: 5, jam: '08:52', cat: 'kebun', t: '2 blok lewat interval panen 14 hari', d: 'EMU1 · B10 (15 hari), EMS1 · D12 (14 hari).', when: '3 jam lalu', day: 'Hari ini', href: '#interval', unread: false },
  { id: 6, act: true, cat: 'kirim', t: 'Tiket mill SJ-10971 gagal', d: 'Nomor tiket tidak cocok dengan timbangan. Periksa ulang di Surat Jalan.', when: '07:12', day: 'Hari ini', href: '#surat-jalan', unread: false },
  { id: 7, act: true, cat: 'kebun', t: 'Laporan EMC-1105-R3: 1 baris gagal', d: 'Jenis racun tidak dikenal. Tambahkan di Jenis Racun lalu scan ulang.', when: 'Kemarin 16:40', day: 'Kemarin', href: '#scan-racun', unread: false },
  { id: 8, cat: 'sistem', t: 'PlantVector diperbarui ke v7.9.3', d: 'Menu Kebun, Curah Hujan, dan Kehadiran baru. Lihat catatan perubahan.', when: 'Kemarin 22:00', day: 'Kemarin', href: '#changelog', unread: false },
  { id: 9, cat: 'hadir', t: '3 pekerja hadir tanpa hasil kerja', d: 'EMU2 · RR5. Cocokkan dengan mandor sebelum tutup buku.', when: 'Kemarin 14:05', day: 'Kemarin', href: '#hadir-scan', unread: false },
  { id: 10, cat: 'restan', t: 'Restan CF ditutup: 2.469 janjang', d: 'Dibawa ke 06/11 sebagai Restan BF.', when: 'Kemarin 23:00', day: 'Kemarin', href: '#dashboard', unread: false },
  { id: 11, cat: 'sistem', t: '3 perangkat mandor belum sinkron', d: 'Terakhir terlihat lebih dari 12 jam lalu: MDR-07, MDR-12, MDR-19.', when: '04/11 18:30', day: 'Minggu ini', href: '#notifikasi', unread: false },
  { id: 12, cat: 'kirim', t: 'Rekap kiriman mingguan siap', d: '1.284 ton TBS · 92 Surat Jalan · ABW rata-rata 24,6 kg.', when: '03/11 07:00', day: 'Minggu ini', href: '#surat-jalan', unread: false }
];
const unread = () => N.filter((n) => n.unread).length;
function syncBell() {
  const u = unread(), n = $('#bellN'), b = $('#bellBtn');
  if (n) { n.textContent = u; n.hidden = !u; } const d = $('#bellDot'); if (d) d.hidden = true;
  if (b) b.setAttribute('aria-label', u ? `Notifikasi, ${u} belum dibaca` : 'Notifikasi');
}
const catTag = (c) => `<span class="nt-cat" style="--cc:${CAT[c][1]}">${CAT[c][0]}</span>`;
const actTag = (n) => n.act ? '<span class="nt-act">Perlu tindakan</span>' : '';
/* Popover: no icon tiles. A thin category-colored rule on the left plus a text label carries the category. */
const nItem = (n, i = 0) => `<a class="nt ${n.unread ? 'unread' : ''}" href="${n.href}" data-nid="${n.id}" style="--r:${i};--cc:${CAT[n.cat][1]}"><span class="nt-tx"><span class="nt-meta">${catTag(n.cat)}${actTag(n)}<time>${n.when}</time></span><b>${esc(n.t)}</b><small>${esc(n.d)}</small></span>${n.unread ? '<i class="nt-dot" aria-label="Belum dibaca"></i>' : ''}</a>`;
/* Full list: reads like an inbox. Time column on the left, text in the middle, no icons. */
const nRow = (n, i = 0) => `<a class="nr ${n.unread ? 'unread' : ''}" href="${n.href}" data-nid="${n.id}" style="--r:${i};--cc:${CAT[n.cat][1]}"><time>${n.jam || n.when.replace(/^(Kemarin|\d\d\/\d\d) /, '')}</time><span class="nr-tx"><b>${n.unread ? '<i class="nt-dot" aria-label="Belum dibaca"></i>' : ''}${esc(n.t)}</b><small>${esc(n.d)}</small><span class="nt-meta">${catTag(n.cat)}${actTag(n)}</span></span></a>`;

/* ---------------- popovers ---------------- */
let openPop = null;
const POPS = { notif: ['#bellBtn', '#notifPop'], me: ['#meBtn', '#mePop'] };
function showPop(k) {
  if (openPop && openPop !== k) hidePop(openPop, true);
  const [b, p] = POPS[k].map((s) => $(s)); if (!b || !p) return;
  if (k === 'notif') renderNotifPop();
  p.hidden = false; void p.offsetWidth; p.classList.add('show'); b.setAttribute('aria-expanded', 'true'); openPop = k;
  setTimeout(() => { const f = $('[data-first]', p) || $('a,button', p); f && f.focus({ preventScroll: true }); }, 40);
}
function hidePop(k, silent) {
  const [b, p] = POPS[k].map((s) => $(s)); if (!b || !p || p.hidden) return;
  p.classList.remove('show'); b.setAttribute('aria-expanded', 'false'); if (openPop === k) openPop = null;
  setTimeout(() => { if (!p.classList.contains('show')) p.hidden = true; }, H.reduced() ? 0 : 200);
  if (!silent) b.focus({ preventScroll: true });
}
let nTab = 'all';
function renderNotifPop() {
  const p = $('#notifPop'), list = N.filter((n) => nTab === 'all' || n.unread).slice(0, 6);
  p.innerHTML = `<div class="np-h"><div><b>Notifikasi</b><small>${unread() ? unread() + ' belum dibaca' : 'Semua sudah dibaca'}</small></div><button class="np-mark" id="npMark" ${unread() ? '' : 'disabled'}>${svg(I.check, 15)}Tandai semua dibaca</button></div>
    <div class="np-tabs" role="group" aria-label="Filter notifikasi"><button data-nt="all" aria-pressed="${nTab === 'all'}" data-first>Semua</button><button data-nt="unread" aria-pressed="${nTab === 'unread'}">Belum dibaca <span>${unread()}</span></button></div>
    <div class="np-list">${list.length ? list.map(nItem).join('') : `<div class="np-empty">${svg(I.check, 28)}<b>Tidak ada notifikasi baru</b><small>Semua sudah Anda baca.</small></div>`}</div>
    <a class="np-all" href="#notifikasi">Lihat semua notifikasi ${svg(I.go, 16)}</a>`;
  $$('[data-nt]', p).forEach((b) => b.onclick = (e) => { e.stopPropagation(); nTab = b.dataset.nt; renderNotifPop(); $(`[data-nt="${nTab}"]`, p).focus(); });
  const m = $('#npMark'); if (m) m.onclick = (e) => { e.stopPropagation(); N.forEach((n) => { n.unread = false; }); syncBell(); renderNotifPop(); H.toast('Semua notifikasi ditandai dibaca'); if (cur === 'notifikasi') nList(); };
  $$('a', p).forEach((a) => a.addEventListener('click', () => { const n = N.find((x) => x.id === +a.dataset.nid); if (n) n.unread = false; syncBell(); hidePop('notif', true); }));
}
function buildMePop() {
  const p = $('#mePop'); if (!p) return;
  p.innerHTML = `<div class="mp-h"><span class="av lg">AS</span><div><b>Agus Setiawan</b><small>Senior Estate Manager (SEM)</small><small class="mp-mail">agus.setiawan@plantvector.id</small></div></div>
    <div class="mp-scope"><span>Akses</span><b>Semua estate · 6 zone</b></div>
    <nav class="mp-nav" aria-label="Menu profil">
      <a href="#profil" data-first>${svg(I.user, 18)}<span>Profil saya<small>Data diri, jabatan, akses</small></span></a>
      <a href="#profil" data-tab="pref">${svg(I.gear, 18)}<span>Pengaturan<small>Notifikasi, tampilan, bahasa</small></span></a>
      <a href="#changelog">${svg(I.star, 18)}<span>Catatan perubahan<small>Yang baru di v7.9.3</small></span><i class="mp-new">Baru</i></a>
    </nav>
    <button class="mp-out" id="logout" type="button">${svg(I.log, 18)}Keluar</button>`;
  $$('a', p).forEach((a) => a.addEventListener('click', () => { if (a.dataset.tab) PR.tab = a.dataset.tab; hidePop('me', true); if (a.dataset.tab && cur === 'profil') pMount($('#ffb')); }));
  $('#logout').addEventListener('click', () => hidePop('me', true));
}
function initPops() {
  buildMePop(); syncBell();
  Object.entries(POPS).forEach(([k, [bs, ps]]) => { const b = $(bs), p = $(ps); if (!b || !p) return;
    b.addEventListener('click', (e) => { e.stopPropagation(); openPop === k ? hidePop(k) : showPop(k); });
    p.addEventListener('click', (e) => e.stopPropagation());
    p.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePop(k); }); });
  document.addEventListener('click', () => openPop && hidePop(openPop, true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openPop) hidePop(openPop); });
  window.addEventListener('hashchange', () => openPop && hidePop(openPop, true));
}

/* ---------------- footer ---------------- */
function initFooter() {
  const c = $('#ftClock'), tick = () => { const d = new Date(); if (c) c.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map((x) => String(x).padStart(2, '0')).join(':'); };
  tick(); setInterval(tick, 1000);
  let m = 2; setInterval(() => { m = m >= 5 ? 1 : m + 1; const s = $('#ftSync'); if (s) s.textContent = m + ' menit'; }, 60000);
  const up = $('#ftUp'); if (up) up.onclick = () => window.scrollTo({ top: 0, behavior: H.reduced() ? 'auto' : 'smooth' });
  $$('#foot [data-soon]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); H.toast('Panduan pengguna belum tersedia di prototipe ini.'); }));
}

/* =====================================================================
   CATATAN PERUBAHAN — #changelog
   ===================================================================== */
const TY = { baru: ['Baru', 't-ok'], tingkat: ['Peningkatan', 't-info'], fix: ['Perbaikan', 't-warn'], hapus: ['Dihapus', 't-mute'] };
const REL = [
  { v: '7.9.3', date: '06 Nov 2026', tag: 'Terbaru', title: 'Kebun, Curah Hujan, dan Kehadiran', sum: 'Tiga menu baru di navigasi utama, ditambah footer, notifikasi, dan profil yang bisa dibuka dari header.', items: [
    ['baru', 'Kebun', 'Menu Kebun menggabungkan Perawatan, Pupuk, Racun, dan Harvest Interval dalam satu mega menu yang dibagi per seksi.'],
    ['baru', 'Pupuk & Racun', 'Daftar tugas dengan ringkasan per jenis, master Jenis Pupuk/Racun (kartu atau tabel), dan Scan QR tiket kerja dengan validasi pekerja dan jenis.'],
    ['baru', 'Harvest Interval', 'Grid blok × tanggal dengan warna ≤10 / 11–14 / >14 hari, kolom Hari ini, dan mode Rencana untuk menandai hari panen.'],
    ['baru', 'Curah Hujan', 'Input harian dengan beberapa kejadian hujan, daftar per stasiun, grafik bulanan vs rata-rata 5 tahun, dan perbandingan tahunan.'],
    ['baru', 'Kehadiran', 'Kehadiran per gang, Kehadiran QR per pekerja dengan filter "Hadir tanpa hasil", dan ringkasan grafik.'],
    ['baru', 'Kontrol form', 'Semua dropdown, pemilih tanggal, bulan, dan jam memakai komponen sendiri (bukan bawaan browser): bisa dicari, keyboard, animasi.'],
    ['baru', 'Loading masuk', 'Layar loading baru dengan garis mengalir, logo dengan cincin progres, dan nama sistem yang muncul huruf demi huruf.'],
    ['tingkat', 'Logo', 'Logo header dan sisi kiri login memakai ikon + nama PlantVector dari teks sehingga lebih besar dan tajam; logo form login tetap versi asli.'],
    ['tingkat', 'Loading', 'Scrollbar halaman disembunyikan selama animasi loading.'],
    ['tingkat', 'Animasi', 'Section hijau di atas setiap halaman kini beranimasi (bentuk daun berputar masuk, kilau, garis bergerak). Kartu, tabel, dan footer yang di bawah layar muncul dengan animasi saat di-scroll.'],
    ['tingkat', 'Mega menu', 'Menutup menu kini halus: panel menggulung ke atas, isi memudar.'],
    ['fix', 'Ringkasan kehadiran', 'Grafik per gang tidak lagi menyusut menjadi batang kecil.'],
    ['baru', 'Mill', 'Menu Mill baru: ABW Bulanan (konfirmasi massal, dampak ke upah), Tonase Harian Mill, Kontraktor, dan Truk & Supir dengan QR.'],
    ['tingkat', 'Tabel', 'Scrollbar tabel disembunyikan. Tepi tabel memudar bila masih ada kolom di samping; tabel bisa digeser dengan trackpad atau ditarik dengan mouse.'],
    ['tingkat', 'Kebun', 'Urutan seksi di menu Kebun: Racun, Pupuk, Perawatan, Harvest Interval.'],
    ['tingkat', 'Notifikasi', 'Ikon diganti garis warna dan label kategori; daftar lengkap bergaya inbox dengan kolom jam dan tanda Perlu tindakan.'],
    ['baru', 'Header', 'Notifikasi dan profil kini membuka pop-over lebih dulu; halaman Notifikasi dan Profil tersedia lewat "Lihat semua".'],
    ['tingkat', 'Mega menu', 'Pindah dari satu menu header ke menu lain kini mulus: panel tidak menutup-buka, isinya bergeser, dan penanda tombol meluncur.'],
    ['tingkat', 'Animasi', 'Isi tab Akses & peran, Pengaturan, panel samping, dan dialog konfirmasi kini muncul berurutan.'],
    ['fix', 'Menu baris', 'Pop-over aksi baris (mis. Surat Jalan) tidak lagi tertimpa label status baris lain.'],
    ['baru', 'Deploy', 'Proyek siap di-deploy ke Vercel (vercel.json, aset lokal, halaman 404, README).'],
    ['tingkat', 'Footer', 'Footer lebih ringkas: logo dan deskripsi di kiri, menu utama di kanan (maks. 4 per kolom, sisanya lewat Lihat semua). Nama sistem ditulis PlantVector.'],
    ['fix', 'Mega menu', 'Pindah antar sub menu tidak lagi tertunda atau tertahan di sub menu lama; sorotan bergerak lebih cepat.'],
    ['tingkat', 'Mega menu', 'Preview di kanan tidak lagi berganti saat kursor melintasi item lain menuju tautan "Buka".'],
    ['fix', 'Mega menu', 'Sorotan item pertama tidak lagi turun beberapa piksel saat menu baru dibuka.'],
    ['hapus', 'Navigasi', 'Menu SDM dihapus dari bar navigasi utama.'] ] },
  { v: '7.9.2', date: '04 Nov 2026', title: 'Perawatan', sum: 'Kerja Perawatan dan Scan Laporan Kerja Harian.', items: [
    ['baru', 'Kerja Perawatan', 'Daftar tugas perawatan dengan ringkasan per jenis kerja, pengelompokan per jenis kerja atau mandor, dan ubah hasil dari panel samping.'],
    ['baru', 'Scan Laporan Kerja Harian', 'Scan QR laporan mandor, gaji bisa disesuaikan per baris, hasil berhasil/gagal setelah kirim.'],
    ['fix', 'Kartu scan', 'Ruang kosong di bawah kartu scan dan log diisi daftar periksa.'] ] },
  { v: '7.9.1', date: '01 Nov 2026', title: 'FFB Tracking', sum: 'Tugas Panen, Surat Jalan, Mills, dan Scan Laporan BCC dalam satu menu.', items: [
    ['baru', 'FFB Tracking', 'Mega menu dengan alur Panen → Surat Jalan → Mills dan preview angka di kanan.'],
    ['baru', 'Tugas Panen (BCC)', 'Filter status, zone, gang, job category; atur kolom; detail grading per kartu.'],
    ['baru', 'Surat Jalan', 'Daftar kiriman dengan tonase, tiket mill berhasil/gagal, dan ekspor PDF.'],
    ['baru', 'Scan Laporan BCC', 'Mencatat restan yang belum terangkut dari tiket kerja BCC.'],
    ['hapus', 'Animasi', 'Animasi ikon truk di menu dihapus.'] ] },
  { v: '7.9.0', date: '28 Okt 2026', title: 'Tampilan hijau-putih', sum: 'Desain baru untuk login, Beranda, dan Mills.', items: [
    ['baru', 'Login', 'Halaman masuk baru dengan animasi, peringatan Caps Lock, dan pesan galat yang jelas.'],
    ['baru', 'Beranda', 'Neraca tandan harian A–E: Restan BF, Produksi, Penerimaan mill, Terkirim, Restan CF.'],
    ['tingkat', 'Arti setiap angka', 'Keterangan istilah selalu tampil, tidak perlu diklik.'],
    ['baru', 'Mills', 'Scan Surat Jalan di timbangan, isi berat, cetak tiket mill.'],
    ['fix', 'Mills', 'Kartu timbang tidak lagi menimpa log saat halaman di-scroll.'] ] }
];
const CL = { q: '', ty: 'all' };
function clMount(root) {
  const counts = Object.keys(TY).map((k) => [k, REL.reduce((a, r) => a + r.items.filter((i) => i[0] === k).length, 0)]);
  root.innerHTML = pageHead({ kicker: 'Bantuan', title: 'Catatan Perubahan', sub: 'Semua yang baru, ditingkatkan, dan diperbaiki di PlantVector, dari versi terbaru ke yang lama.', right: `<div class="cl-cur"><span>Versi berjalan</span><b>v${REL[0].v}</b><small>${REL[0].date}</small></div>` }) + `
  <div class="wrap f-body cl-body">
    <aside class="cl-side frv" style="--i:2">
      <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="clQ" type="search" placeholder="Cari perubahan…" value="${esc(CL.q)}"></label>
      <div class="cl-filter" role="group" aria-label="Jenis perubahan"><button data-ct="all" aria-pressed="${CL.ty === 'all'}">Semua<span>${REL.reduce((a, r) => a + r.items.length, 0)}</span></button>${counts.map(([k, n]) => `<button data-ct="${k}" aria-pressed="${CL.ty === k}"><i class="st-chip ${TY[k][1]}"></i>${TY[k][0]}<span>${n}</span></button>`).join('')}</div>
      <nav class="cl-toc" aria-label="Versi"><p>Versi</p>${REL.map((r, i) => `<a href="#changelog" data-jump="${r.v}" class="${i === 0 ? 'on' : ''}"><b>v${r.v}</b><small>${r.date}</small></a>`).join('')}</nav>
    </aside>
    <div class="cl-main" id="clMain"></div>
  </div>`;
  $('#clQ').addEventListener('input', (e) => { CL.q = e.target.value; clList(); });
  $$('[data-ct]', root).forEach((b) => b.onclick = () => { CL.ty = b.dataset.ct; $$('[data-ct]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); clList(); });
  $$('[data-jump]', root).forEach((a) => a.onclick = (e) => { e.preventDefault(); const t = $(`#rel-${a.dataset.jump.replace(/\./g, '-')}`); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 90, behavior: H.reduced() ? 'auto' : 'smooth' }); $$('[data-jump]', root).forEach((x) => x.classList.toggle('on', x === a)); });
  clList();
}
function clList() {
  const q = CL.q.toLowerCase(), el = $('#clMain');
  const rels = REL.map((r) => ({ ...r, list: r.items.filter((i) => (CL.ty === 'all' || i[0] === CL.ty) && (!q || `${i[1]} ${i[2]}`.toLowerCase().includes(q))) })).filter((r) => r.list.length);
  if (!rels.length) { el.innerHTML = `<div class="f-card f-empty">${ic('search', 28)}<h3>Tidak ada perubahan yang cocok</h3><p>Coba kata kunci lain.</p></div>`; return; }
  el.innerHTML = `<ol class="cl-line">${rels.map((r, ri) => `<li class="cl-rel frv" style="--i:${ri + 3}" id="rel-${r.v.replace(/\./g, '-')}"><span class="cl-node ${ri === 0 && r.v === REL[0].v ? 'cur' : ''}" aria-hidden="true"></span>
    <article class="f-card cl-card"><header><div><span class="cl-v">v${r.v}</span>${r.tag ? `<span class="cl-tag">${r.tag}</span>` : ''}<time>${r.date}</time></div><h2>${r.title}</h2><p>${r.sum}</p></header>
    <ul class="cl-items">${r.list.map((i) => `<li><span class="st-chip ${TY[i[0]][1]}">${TY[i[0]][0]}</span><div><b>${esc(i[1])}</b><p>${esc(i[2])}</p></div></li>`).join('')}</ul></article></li>`).join('')}</ol>`;
}

/* =====================================================================
   NOTIFIKASI — #notifikasi
   ===================================================================== */
const NV = { cat: 'all', only: false };
function nMount(root) {
  root.innerHTML = pageHead({ kicker: 'Akun', title: 'Notifikasi', sub: 'Peringatan dan kabar dari pengiriman, restan, kebun, cuaca, kehadiran, dan sistem. Klik untuk membuka halaman terkait.', right: `<button class="f-btn" id="nMark">${svg(I.check, 16)}Tandai semua dibaca</button><a class="f-btn" href="#profil" data-tab="pref" id="nPref">${svg(I.gear, 16)}Atur notifikasi</a>` }) + `
  <div class="wrap f-body nt-body">
    <aside class="nt-side f-card frv" style="--i:2"><p class="nt-sh">Kategori</p><div id="nCats"></div>
      <label class="nt-only"><input type="checkbox" id="nOnly" ${NV.only ? 'checked' : ''}><span class="sw" aria-hidden="true"></span>Hanya yang belum dibaca</label></aside>
    <section class="f-card nt-main frv" style="--i:3" id="nMain"></section>
  </div>`;
  $('#nMark').onclick = () => { N.forEach((n) => { n.unread = false; }); syncBell(); nList(); H.toast('Semua notifikasi ditandai dibaca'); };
  $('#nPref').onclick = () => { PR.tab = 'pref'; };
  $('#nOnly').onchange = (e) => { NV.only = e.target.checked; nList(); };
  nList();
}
function nList() {
  const cats = $('#nCats'); if (!cats) return;
  cats.innerHTML = [['all', 'Semua', '#0B4A3A'], ...Object.entries(CAT).map(([k, v]) => [k, v[0], v[1]])].map(([k, l, c]) => { const n = N.filter((x) => (k === 'all' || x.cat === k) && x.unread).length; return `<button data-nc="${k}" aria-pressed="${NV.cat === k}"><i class="cdot" style="--cc:${c}"></i>${l}${n ? `<b>${n}</b>` : ''}</button>`; }).join('');
  $$('[data-nc]', cats).forEach((b) => b.onclick = () => { NV.cat = b.dataset.nc; nList(); });
  const list = N.filter((n) => (NV.cat === 'all' || n.cat === NV.cat) && (!NV.only || n.unread)), days = [...new Set(list.map((n) => n.day))];
  $('#nMain').innerHTML = list.length ? days.map((d) => `<div class="nt-day"><h3>${d}</h3>${list.filter((n) => n.day === d).map((n, i) => `<div class="nt-row">${nRow(n, i)}<button class="nt-tog" data-tog="${n.id}" aria-label="${n.unread ? 'Tandai dibaca' : 'Tandai belum dibaca'}" title="${n.unread ? 'Tandai dibaca' : 'Tandai belum dibaca'}">${n.unread ? svg(I.check, 16) : svg('<circle cx="12" cy="12" r="4"/>', 16)}</button></div>`).join('')}</div>`).join('') : `<div class="f-empty">${svg(I.check, 28)}<h3>Tidak ada notifikasi</h3><p>Tidak ada yang cocok dengan filter ini.</p></div>`;
  $$('[data-tog]').forEach((b) => b.onclick = () => { const n = N.find((x) => x.id === +b.dataset.tog); n.unread = !n.unread; syncBell(); nList(); });
  $$('#nMain a.nr').forEach((a) => a.addEventListener('click', () => { const n = N.find((x) => x.id === +a.dataset.nid); if (n) n.unread = false; syncBell(); }));
}

/* =====================================================================
   PROFIL — #profil
   ===================================================================== */
const PR = { tab: 'info', pref: { restan: true, kirim: true, hujan: true, hadir: false, kebun: true, sistem: true, email: false, ringkas: true }, theme: 'auto', lang: 'id' };
function pMount(root) {
  const act = [['Membuka Scan QR Racun', '#scan-racun', '11:42'], ['Menyimpan curah hujan EMU1 · 18,5 mm', '#hujan', '11:20'], ['Mengekspor Kerja Pupuk (Excel)', '#pupuk', '10:58'], ['Mengubah rencana panen EMU1', '#interval', '09:31'], ['Masuk dari Chrome · macOS', '#profil', '07:02']];
  root.innerHTML = pageHead({ kicker: 'Akun', title: 'Profil', sub: 'Data diri, akses estate, preferensi notifikasi, dan aktivitas terakhir Anda.', right: '' }) + `
  <div class="wrap f-body pf-body">
    <aside class="pf-card f-card frv" style="--i:2">
      <div class="pf-cover" aria-hidden="true"></div>
      <span class="av xl">AS</span><h2>Agus Setiawan</h2><p class="mute">Senior Estate Manager (SEM)</p>
      <dl class="pf-dl"><div><dt>ID staf</dt><dd>SEM-0042</dd></div><div><dt>Email</dt><dd>agus.setiawan@plantvector.id</dd></div><div><dt>Akses</dt><dd>Semua estate · 6 zone</dd></div><div><dt>Bergabung</dt><dd>Maret 2019</dd></div></dl>
      <button class="m-btn" id="pfPw">${svg(I.key, 16)}Ganti kata sandi</button>
    </aside>
    <section class="pf-main">
      <div class="seg-s pf-tabs frv" style="--i:3" role="tablist" aria-label="Bagian profil">${[['info', 'Akses & peran'], ['pref', 'Pengaturan'], ['act', 'Aktivitas']].map(([k, l]) => `<button role="tab" data-pt="${k}" aria-selected="${PR.tab === k}" aria-pressed="${PR.tab === k}">${l}</button>`).join('')}</div>
      <div class="f-card pf-panel frv" style="--i:4" id="pfPanel"></div>
    </section>
  </div>`;
  $$('[data-pt]', root).forEach((b) => b.onclick = () => { PR.tab = b.dataset.pt; $$('[data-pt]', root).forEach((x) => { x.setAttribute('aria-pressed', x === b); x.setAttribute('aria-selected', x === b); }); panel(); });
  $('#pfPw').onclick = () => H.toast('Tautan ganti kata sandi dikirim ke email Anda.');
  const panel = () => { const p = $('#pfPanel'); p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap');
    if (PR.tab === 'info') p.innerHTML = `<h3>Peran</h3><p class="mute">Peran menentukan menu yang bisa Anda buka dan data yang bisa Anda ubah.</p>
      <div class="pf-roles">${[['FFB Tracking', 'Lihat, ekspor, tiket mill'], ['Kebun', 'Lihat, ubah hasil & gaji'], ['Master data', 'Tambah & ubah jenis pupuk/racun'], ['Curah Hujan', 'Input & ubah'], ['Kehadiran', 'Lihat & ekspor'], ['Pengguna', 'Tidak ada akses']].map((r, i) => `<div class="${i === 5 ? 'off' : ''}"><b>${r[0]}</b><small>${r[1]}</small></div>`).join('')}</div>
      <h3>Estate</h3><div class="pf-zones">${['EMU1', 'EMU2', 'EMC1', 'EMC2', 'EMS1', 'EMS2'].map((z) => `<span>${z}</span>`).join('')}</div>`;
    else if (PR.tab === 'pref') p.innerHTML = `<h3>Notifikasi</h3><p class="mute">Pilih kabar yang muncul di lonceng notifikasi.</p>
      <div class="pf-sw">${Object.entries(CAT).map(([k, v]) => `<label><i class="cdot" style="--cc:${v[1]}"></i><span>${v[0]}</span><input type="checkbox" data-pp="${k}" ${PR.pref[k] ? 'checked' : ''}><span class="sw" aria-hidden="true"></span></label>`).join('')}
      <label><i class="cdot" style="--cc:#0B4A3A"></i><span>Kirim ringkasan harian ke email</span><input type="checkbox" data-pp="email" ${PR.pref.email ? 'checked' : ''}><span class="sw" aria-hidden="true"></span></label></div>
      <h3>Tampilan</h3><div class="pf-row"><span>Tema</span><div class="seg-s sm" role="group" aria-label="Tema">${[['auto', 'Ikuti sistem'], ['light', 'Terang']].map(([k, l]) => `<button data-th="${k}" aria-pressed="${PR.theme === k}">${l}</button>`).join('')}</div></div>
      <div class="pf-row"><span>Bahasa</span><div class="seg-s sm" role="group" aria-label="Bahasa">${[['id', 'Bahasa Indonesia'], ['en', 'English']].map(([k, l]) => `<button data-lg="${k}" aria-pressed="${PR.lang === k}">${l}</button>`).join('')}</div></div>`;
    else p.innerHTML = `<h3>Aktivitas hari ini</h3><ol class="pf-act">${act.map((a, i) => `<li style="--r:${i}"><span class="pa-dot"></span><a href="${a[1]}">${a[0]}</a><time>${a[2]}</time></li>`).join('')}</ol>`;
    $$('[data-pp]', p).forEach((c) => c.onchange = () => { PR.pref[c.dataset.pp] = c.checked; H.toast('Pengaturan notifikasi disimpan'); });
    $$('[data-th]', p).forEach((b) => b.onclick = () => { PR.theme = b.dataset.th; $$('[data-th]', p).forEach((x) => x.setAttribute('aria-pressed', x === b)); H.toast('Tema disimpan'); });
    $$('[data-lg]', p).forEach((b) => b.onclick = () => { PR.lang = b.dataset.lg; $$('[data-lg]', p).forEach((x) => x.setAttribute('aria-pressed', x === b)); H.toast(PR.lang === 'en' ? 'English belum tersedia di prototipe ini' : 'Bahasa disimpan'); }); };
  panel();
}

/* ---------------- public ---------------- */
let cur = null, curEl = null;
const reg = (name, fn) => ({ mount(el, h) { H = { ...H, ...h }; cur = name; curEl = el; fn(el); }, start() { start(curEl); } });
Object.assign(window.FFBPages, { changelog: reg('changelog', clMount), notifikasi: reg('notifikasi', nMount), profil: reg('profil', pMount) });
window.addEventListener('hashchange', () => { if (!['changelog', 'notifikasi', 'profil'].includes(location.hash.slice(1))) cur = null; });

/* ---------------- tables: hidden scrollbar, edge fades, drag to scroll ---------------- */
function initTables() {
  const TW = '.f-tw,.tk-wrap,.iv-wrap';
  const edges = (el) => { const l = el.scrollLeft > 2, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2; el.classList.toggle('can-l', l); el.classList.toggle('can-r', r); };
  let q = 0; const scan = () => { cancelAnimationFrame(q); q = requestAnimationFrame(() => $$(TW).forEach(edges)); };
  document.addEventListener('scroll', (e) => { const t = e.target; if (t && t.matches && t.matches(TW)) edges(t); }, true);
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('resize', scan); scan();
  // Mouse users without a trackpad can still pan a wide table by dragging it.
  let drag = null;
  document.addEventListener('mousedown', (e) => {
    const w = e.target.closest(TW); if (!w || e.button !== 0 || w.scrollWidth <= w.clientWidth + 2 || e.target.closest('input,select,textarea,button,label,.gaji-in')) return;
    drag = { w, x: e.clientX, sl: w.scrollLeft, moved: false };
  });
  document.addEventListener('mousemove', (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) < 6) return; drag.moved = true; drag.w.classList.add('grab'); drag.w.scrollLeft = drag.sl - dx; e.preventDefault(); });
  document.addEventListener('mouseup', () => { if (!drag) return; const d = drag; drag = null; d.w.classList.remove('grab'); if (d.moved) { const stop = (ev) => { ev.stopPropagation(); ev.preventDefault(); }; window.addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => window.removeEventListener('click', stop, true), 50); } });
}

/* ---------------- scroll reveal: anything below the fold animates when it scrolls into view ---------------- */
function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  const reducedM = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SEL = ['.frv', '.mrv', '.rv', '.hv', '.st', '.f-card', '.card', '.co-card', '.jn-card', '.yr-card', '.hs-card', '.hk', '.jk-card', '.cl-rel', '.nt-day', '.pf-panel', '.pf-card',
    '.estates > *', '.gloss', '.gl', '.ab-kpi > *', '.iv-kpi > *', '.ch-kpi > *', '.f-table tbody tr', '.tk tbody tr', '.sj-row', '.hg-bars li', '.nr', '.mb-list li',
    '.ft-brand', '.ft-cols > div', '.ft-bot', '.f-note'].join(',');
  const SKIP = '.f-sheet,.nx-pop,.hpop,.mega,.drawer,.curtain,#login,.m-modal';
  let batch = [], bt = 0;
  const flush = () => { batch.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left)
    .forEach((el, i) => { el.style.setProperty('--svd', Math.min(i, 10) * 60 + 'ms'); el.classList.remove('sv'); el.classList.add('sv-go'); el.addEventListener('animationend', function done(ev) { if (ev.target !== el) return; el.classList.remove('sv-go'); el.classList.add('sv-done'); el.removeEventListener('animationend', done); }); el.dispatchEvent(new CustomEvent('sv:in', { bubbles: true })); });
    batch = []; };
  const io = new IntersectionObserver((es) => { es.forEach((en) => { if (!en.isIntersecting) return; io.unobserve(en.target); batch.push(en.target); }); clearTimeout(bt); bt = setTimeout(flush, 16); }, { rootMargin: '0px', threshold: 0 });
  const scan = () => {
    if (reducedM()) return; const vh = window.innerHeight;
    $$(SEL).forEach((el) => {
      if (el.dataset.sv || el.closest(SKIP)) return;
      const r = el.getBoundingClientRect(); if (!r.height) return;           // hidden for now: check again later
      el.dataset.sv = '1';
      if (r.top < vh * 0.96) return;                                          // visible on arrival: keeps its own entrance
      if (el.parentElement && el.parentElement.closest('.sv')) return;        // parent already handles it
      el.classList.add('sv'); io.observe(el);
    });
  };
  let q = 0; const later = () => { cancelAnimationFrame(q); q = requestAnimationFrame(() => requestAnimationFrame(scan)); };
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(later, 260));
  later();
}
initPops(); initFooter(); initTables(); initReveal();
})();
