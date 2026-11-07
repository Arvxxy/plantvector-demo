/* Header mega menus + mobile drawer.
   FFB Tracking = E-Operasi › FFB Tracking: Tasks (/admin/task), Surat Jalan (/admin/surat-jalan),
                  Mills (/admin/mill-surat-jalan), Scan Laporan BCC (/admin/scan-lhm).
   Perawatan    = Perawatan: Task Listing (/admin/other-task), Scan Laporan Kerja Harian (/admin/scan-other-task?id=rawat). */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
let reduced = () => false;

const ICON = {
  tasks: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l7-7"/>',
  'surat-jalan': '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>',
  mills: '<path d="M3 21V10l6 4V10l6 4V5h6v16z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
  scan: '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/><path d="M7 12h10"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  sack: '<path d="M8 4h8l-1 3c3 2 5 5 5 8a5 5 0 01-5 5H9a5 5 0 01-5-5c0-3 2-6 5-8z"/><path d="M9 7h6"/>',
  spray: '<path d="M8 10h8v10a1 1 0 01-1 1H9a1 1 0 01-1-1z"/><path d="M10 10V6h4v4M14 6h3M19 4v.01M20 7v.01M19 10v.01"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  grid: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16M15 4v16"/>',
  plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  drop: '<path d="M12 3c4 5 6 8.5 6 11.5a6 6 0 01-12 0C6 11.5 8 8 12 3z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  chart2: '<path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/>',
  scale: '<path d="M12 3v18M5 21h14M4 7h16"/><path d="M7 7l-3 7a3 3 0 006 0zM17 7l-3 7a3 3 0 006 0z"/>',
  wave: '<path d="M3 20h18"/><rect x="5" y="12" width="3" height="6"/><rect x="10.5" y="7" width="3" height="11"/><rect x="16" y="10" width="3" height="8"/>',
  firm: '<path d="M4 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"/>',
  truck: '<path d="M3 6h11v9H3zM14 9h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.8c1.8.7 3 2.3 3.5 5.2"/>'
};
const GROUPS = {
  ffb: {
    btn: '#ffbBtn', menu: '#ffbMenu', label: 'FFB Tracking', kick: 'FFB Tracking', title: 'Perjalanan TBS',
    route: [['TPH', 'BCC dibuat checker'], ['Checkpoint', 'Surat Jalan + truk'], ['Timbangan PKS', 'Scan SJ & tiket mill']],
    items: [
      { id: 'tasks', icon: 'tasks', step: '1', title: 'Tugas Panen (BCC)', desc: 'Semua kartu BCC dari pemanen, grading, status, dan upah.', metric: '1.284', unit: 'BCC hari ini', where: 'TPH', lines: [['Panen HI', '612'], ['Restan', '96'], ['Selesai', '548']] },
      { id: 'surat-jalan', icon: 'surat-jalan', step: '2', title: 'Surat Jalan', desc: 'Pengiriman dari checkpoint ke pabrik, lengkap dengan tonase dan tiket.', metric: '41', unit: 'SJ hari ini', where: 'Checkpoint', lines: [['Di perjalanan', '4'], ['Diterima mill', '37'], ['Tonase', '622,8 t']] },
      { id: 'mills', icon: 'mills', step: '3', title: 'Mills · Scan Surat Jalan', desc: 'Scan QR Surat Jalan di timbangan, isi berat, cetak tiket mill.', metric: '3', unit: 'truk antri', where: 'Timbangan PKS', lines: [['Diterima hari ini', '14 SJ'], ['Berat timbangan', '286,4 t'], ['Tiket terakhir', 'SJ 10987']] },
      { id: 'scan-bcc', icon: 'scan', step: '+', title: 'Scan Laporan BCC', desc: 'Scan laporan tiket kerja BCC untuk mencatat restan yang belum terangkut.', metric: '214', unit: 'jjg restan 3+ hari', where: 'Kantor afdeling', lines: [['Discan hari ini', '6 laporan'], ['Tiket ditambahkan', '58'], ['Status disimpan', 'Restan']] }
    ]
  },
  mill: {
    btn: '#millBtn', menu: '#millMenu', label: 'Mill', kick: 'Mill', title: 'Timbangan & angkutan',
    route: [['Kontraktor', 'Daftarkan truk & supir'], ['Timbangan', 'Tonase per jam'], ['ABW bulanan', 'Dasar upah panen']],
    sections: [['ABW', ['abw', 'abw-harian']], ['CMS · Angkutan', ['kontraktor', 'truk']]],
    stats: [['Tonase hari ini', '286,4 t', 'abw-harian'], ['Truk ditimbang', '21', 'abw-harian'], ['ABW pending', '17 blok', 'abw'], ['Truk blacklist', '1', 'truk']],
    items: [
      { id: 'abw', icon: 'scale', step: 'A', title: 'ABW Bulanan', desc: 'Berat rata-rata tandan per blok, konfirmasi FA.', metric: '23,84 kg', unit: 'ABW rata-rata Oktober', where: 'Semua estate', lines: [['Pending', '17 blok'], ['Confirmed', '19 blok'], ['vs September', '+0,32 kg']] },
      { id: 'abw-harian', icon: 'wave', step: 'A', title: 'Tonase Harian Mill', desc: 'Tonase diterima per jam dan jumlah truk.', metric: '286,4 t', unit: 'diterima hari ini', where: 'Timbangan PKS', lines: [['Truk', '21'], ['Jam tersibuk', '13:00'], ['Rata-rata/truk', '13,6 t']] },
      { id: 'kontraktor', icon: 'firm', step: 'C', title: 'Kontraktor', desc: 'Perusahaan angkutan, group, desa, kontak.', metric: '7', unit: 'kontraktor aktif', where: 'Master data', lines: [['External', '7'], ['Internal', '1'], ['Truk aktif', '33']] },
      { id: 'truk', icon: 'truck', step: 'C', title: 'Truk & Supir', desc: 'Truk terdaftar, supir, type, status, QR.', metric: '42', unit: 'truk terdaftar', where: 'Master data', lines: [['Active', '33'], ['Blacklist', '3'], ['Type FFB', '30']] }
    ]
  },
  kebun: {
    btn: '#kebunBtn', menu: '#kebunMenu', label: 'Kebun', kick: 'Kebun', title: 'Kerja non-panen',
    route: [['Blok', 'Mandor isi tiket kerja'], ['Kantor afdeling', 'Scan QR laporan harian'], ['Daftar & upah', 'Masuk daftar tugas']],
    sections: [['Racun', ['racun', 'racun-jenis', 'scan-racun']], ['Pupuk', ['pupuk', 'pupuk-jenis', 'scan-pupuk']], ['Perawatan', ['perawatan', 'scan-perawatan']], ['Harvest Interval', ['interval']]],
    items: [
      { id: 'perawatan', icon: 'list', step: 'P', title: 'Kerja Perawatan', desc: 'Daftar tugas perawatan, hasil, dan gaji.', metric: '86', unit: 'tugas hari ini', where: 'Semua estate', lines: [['Rawat jalan', '12,4 Ha'], ['Pruning', '640 pokok'], ['Total gaji', 'Rp 9,8 jt']] },
      { id: 'scan-perawatan', icon: 'scan', step: 'P', title: 'Scan Laporan Kerja Harian', desc: 'Scan QR tiket kerja perawatan.', metric: '4', unit: 'laporan discan hari ini', where: 'Kantor afdeling', lines: [['Baris ditambahkan', '57'], ['Gagal', '2'], ['Laporan terakhir', 'EMC-1106-04']] },
      { id: 'pupuk', icon: 'sack', step: 'Pu', title: 'Kerja Pupuk', desc: 'Tugas pemupukan per blok dan pekerja.', metric: '3,8 t', unit: 'pupuk ditabur minggu ini', where: 'Semua estate', lines: [['NPK 15-15-15', '2,1 t'], ['Dolomit', '1,2 t'], ['Pokok dipupuk', '7.420']] },
      { id: 'pupuk-jenis', icon: 'tag', step: 'Pu', title: 'Jenis Pupuk', desc: 'Master pupuk: metode, frekuensi, dosis.', metric: '9', unit: 'jenis pupuk aktif', where: 'Master data', lines: [['Soil incorporation', '6'], ['Spraying', '2'], ['Frekuensi rata-rata', '2× / tahun']] },
      { id: 'scan-pupuk', icon: 'scan', step: 'Pu', title: 'Scan QR Pupuk', desc: 'Scan tiket kerja pemupukan.', metric: '2', unit: 'laporan discan hari ini', where: 'Kantor afdeling', lines: [['Baris ditambahkan', '23'], ['Gagal', '0'], ['Laporan terakhir', 'EMC-1106-P2']] },
      { id: 'racun', icon: 'spray', step: 'R', title: 'Kerja Racun', desc: 'Tugas penyemprotan herbisida per blok.', metric: '1.240 L', unit: 'larutan minggu ini', where: 'Semua estate', lines: [['Glifosat', '780 L'], ['Parakuat', '320 L'], ['Luas disemprot', '96 Ha']] },
      { id: 'racun-jenis', icon: 'tag', step: 'R', title: 'Jenis Racun', desc: 'Master racun: bentuk, metode, dosis.', metric: '7', unit: 'jenis racun aktif', where: 'Master data', lines: [['Liquid', '5'], ['Baits', '1'], ['Powder', '1']] },
      { id: 'scan-racun', icon: 'scan', step: 'R', title: 'Scan QR Racun', desc: 'Scan tiket kerja penyemprotan.', metric: '1', unit: 'laporan discan hari ini', where: 'Kantor afdeling', lines: [['Baris ditambahkan', '12'], ['Gagal', '1'], ['Laporan terakhir', 'EMC-1106-R1']] },
      { id: 'interval', icon: 'grid', step: 'H', title: 'Harvest Interval', desc: 'Rotasi panen per blok, aktual dan rencana.', metric: '14', unit: 'blok lewat 14 hari', where: 'Semua estate', lines: [['Rata-rata rotasi', '8,2 hari'], ['Blok > 10 hari', '31'], ['Rencana bulan ini', 'Tersimpan']] }
    ]
  },
  hujan: {
    btn: '#hujanBtn', menu: '#hujanMenu', label: 'Curah Hujan', kick: 'Curah Hujan', title: 'Data cuaca kebun',
    route: [['Stasiun', 'Penakar hujan per zone'], ['Catat harian', 'Asisten afdeling'], ['Grafik', 'Bulanan & tahunan']],
    items: [
      { id: 'hujan-baru', icon: 'plus', step: '1', title: 'Catat Curah Hujan', desc: 'Isi curah hujan hari ini, durasi hujan, dan keterangan.', metric: '18 mm', unit: 'kemarin di EMS', where: 'Per zone', lines: [['Zone sudah lapor', '9 / 13'], ['Hari hujan bulan ini', '19'], ['Hujan tertinggi', '64 mm']] },
      { id: 'hujan', icon: 'drop', step: '2', title: 'Data Curah Hujan', desc: 'Semua catatan curah hujan per zone dan tanggal.', metric: '387 mm', unit: 'total Oktober', where: 'Semua zone', lines: [['Rata-rata harian', '12,5 mm'], ['Hari hujan', '19'], ['Hari kering', '12']] },
      { id: 'hujan-bulan', icon: 'chart', step: '3', title: 'Grafik per Bulan', desc: 'Curah hujan dan hari hujan tiap bulan dalam setahun.', metric: '2.512 mm', unit: 'total 2026 s/d Okt', where: 'Per tahun', lines: [['Bulan terbasah', 'Januari'], ['Bulan terkering', 'Agustus'], ['Rata-rata', '251 mm']] },
      { id: 'hujan-tahun', icon: 'chart2', step: '4', title: 'Grafik per Tahun', desc: 'Bandingkan curah hujan antar tahun, bulan per bulan.', metric: '−6%', unit: '2026 vs 2025', where: 'Antar tahun', lines: [['2025', '2.940 mm'], ['2024', '3.105 mm'], ['2023', '2.788 mm']] }
    ]
  },
  hadir: {
    btn: '#hadirBtn', menu: '#hadirMenu', label: 'Kehadiran', kick: 'Kehadiran', title: 'Absensi pekerja',
    route: [['Pagi', 'Mandor catat kehadiran'], ['Kantor', 'Scan QR laporan kehadiran'], ['Rekap', 'Per zone & jabatan']],
    items: [
      { id: 'hadir', icon: 'users', step: '1', title: 'Data Kehadiran', desc: 'Kehadiran per gang dan blok, dengan persentase dan foto.', metric: '93,7%', unit: 'kehadiran hari ini', where: 'Semua zone', lines: [['Hadir', '1.184'], ['Mangkir', '9'], ['Gang lapor', '31 / 35']] },
      { id: 'hadir-scan', icon: 'scan', step: '2', title: 'Scan QR Kehadiran', desc: 'Scan laporan kehadiran dari aplikasi mandor.', metric: '6', unit: 'laporan discan hari ini', where: 'Kantor afdeling', lines: [['Baris ditambahkan', '148'], ['Dengan foto pagi', '6'], ['Laporan terakhir', '08:12']] },
      { id: 'hadir-grafik', icon: 'chart', step: '3', title: 'Grafik Rekap Kehadiran', desc: 'Kehadiran per zone dan jabatan, jumlah aktif vs hadir.', metric: '13', unit: 'sub zone', where: 'Rekap', lines: [['Tertinggi', 'EMS1 · 97%'], ['Terendah', 'EMU3 · 86%'], ['Jabatan', '19']] }
    ]
  }
};
const svg = (p, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const S = {};   // runtime per group: { btn, menu, openT, closeT, hoverId }
let active = null;

function build(key) {
  const g = GROUPS[key], st = S[key], menu = st.menu;
  menu.innerHTML = `<div class="mega-in ${g.sections ? 'secs' : g.items.length === 3 ? 'three' : ''}">
    <div class="mg-flow" aria-hidden="true"><p class="mg-kick">${g.kick}</p><h3>${g.title}</h3>
      <ol class="mg-route">${g.route.map((r) => `<li><span class="dot"></span><b>${r[0]}</b><small>${r[1]}</small></li>`).join('')}</ol></div>
    <div class="mg-items ${g.sections ? 'is-sec' : ''}" role="menu" aria-label="${g.label}"><span class="mg-hl" aria-hidden="true"></span>
      ${g.sections ? g.sections.map(([sec, ids], si) => `<div class="mg-sec" style="--i:${si}"><p class="mg-sec-h">${sec}</p>${ids.map((id) => { const it = g.items.find((x) => x.id === id); return `<a role="menuitem" href="#${it.id}" class="mg-item compact" data-id="${it.id}"><span class="mg-ico sm">${svg(ICON[it.icon], 18)}</span><span class="mg-txt"><b>${it.title}</b><small>${it.desc}</small></span></a>`; }).join('')}</div>`).join('') + (g.stats ? `<div class="mg-stats" style="--i:${g.sections.length}"><p class="mg-sec-h">Sekilas hari ini</p><div>${g.stats.map((s) => `<a href="#${s[2]}"><span>${s[0]}</span><b>${s[1]}</b></a>`).join('')}</div></div>` : '') : g.items.map((it, i) => `<a role="menuitem" href="#${it.id}" class="mg-item" data-id="${it.id}" style="--i:${i}">
        <span class="mg-ico">${svg(ICON[it.icon])}<i>${it.step}</i></span>
        <span class="mg-txt"><b>${it.title}</b><small>${it.desc}</small></span>
        <span class="mg-go" aria-hidden="true">${svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 18)}</span></a>`).join('')}
    </div>
    <div class="mg-prev" aria-live="polite"><div class="mg-prev-in"></div></div></div>`;
  const items = $$('.mg-item', menu);
  /* Hover intent: while the pointer is heading for the preview pane on the right, items it merely crosses
     do not take over the preview. The last item the pointer rested on stays selected inside the preview. */
  st.pts = [];
  menu.addEventListener('mousemove', (e) => { const t = performance.now(); st.pts.push([e.clientX, e.clientY, t]); while (st.pts.length > 2 && t - st.pts[0][2] > 140) st.pts.shift(); });
  // "Aiming" only counts while the pointer is actually moving: once it rests for ~60ms, the item under it wins.
  const aiming = () => {
    const pv = $('.mg-prev', menu), now = performance.now(); if (!pv || st.pts.length < 2) return false;
    const last = st.pts[st.pts.length - 1]; if (now - last[2] > 60) return false;
    const first = st.pts.find((p) => last[2] - p[2] <= 120) || st.pts[0];
    const r = pv.getBoundingClientRect(), [px, py] = first, [cx, cy] = last;
    if (cx >= r.left || cx - px < 4) return false;
    const yAt = cy + (cy - py) / (cx - px) * (r.left - cx);
    return yAt > r.top - 24 && yAt < r.bottom + 24;
  };
  const settle = (a) => { clearTimeout(st.hovT); st.pend = a; st.hovT = setTimeout(() => { if (st.pend !== a) return; if (aiming()) settle(a); else { st.pend = null; focusItem(key, a); } }, 70); };
  items.forEach((a) => {
    a.addEventListener('mouseenter', () => { if (aiming()) settle(a); else { clearTimeout(st.hovT); st.pend = null; focusItem(key, a); } });
    a.addEventListener('mousemove', () => { if (!a.classList.contains('hov') && st.pend !== a) { if (aiming()) settle(a); else { clearTimeout(st.hovT); st.pend = null; focusItem(key, a); } } });
    a.addEventListener('mouseleave', () => { if (st.pend === a) { clearTimeout(st.hovT); st.pend = null; } });
    a.addEventListener('focus', () => { clearTimeout(st.hovT); focusItem(key, a); });
    a.addEventListener('click', () => close(key, true));
  });
  menu.addEventListener('keydown', (e) => {
    const list = $$('.mg-item', menu), i = list.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    if (e.key === 'Escape') { close(key, true); st.btn.focus(); }
    if (e.key === 'Tab' && !e.shiftKey && i === list.length - 1) close(key, true);
  });
}
function moveHl(key, a, instant) {
  const menu = S[key].menu, hl = $('.mg-hl', menu), box = $('.mg-items', menu); if (!a || !hl) return;
  // offset* ignores CSS transforms, so the highlight lands on the item's final spot even while its entrance animation is still running
  let x = 0, y = 0, el = a; while (el && el !== box) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
  if (instant || reduced()) hl.style.transition = 'none';
  hl.style.width = a.offsetWidth + 'px'; hl.style.height = a.offsetHeight + 'px'; hl.style.transform = `translate3d(${x}px,${y}px,0)`; hl.classList.add('show');
  if (instant || reduced()) { void hl.offsetWidth; hl.style.transition = ''; }
}
function focusItem(key, a) {
  if (!a) return; const st = S[key];
  $$('.mg-item', st.menu).forEach((x) => x.classList.toggle('hov', x === a)); moveHl(key, a);
  const p = $('.mg-prev-in', st.menu);
  if (a.dataset.id !== st.hoverId || !p.innerHTML) { st.hoverId = a.dataset.id; renderPreview(key); }
}
function renderPreview(key) {
  const st = S[key], it = GROUPS[key].items.find((x) => x.id === st.hoverId), p = $('.mg-prev-in', st.menu);
  p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap');
  p.innerHTML = `<span class="pv-where">${svg('<path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', 14)}${it.where}</span>
    <div class="pv-big"><b>${it.metric}</b><small>${it.unit}</small></div>
    <ul>${it.lines.map((l) => `<li><span>${l[0]}</span><b>${l[1]}</b></li>`).join('')}</ul>
    <a href="#${it.id}" class="pv-open">Buka ${it.title.split(' ·')[0]} ${svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 16)}</a>`;
  $('.pv-open', p).addEventListener('click', () => close(key, true));
}
/* One shared white panel (#megaBg) sits behind every mega menu and animates its height.
   Moving from one header menu to another cross-slides the content inside that panel instead of
   closing one menu and dropping the next one in, and a soft pill (#navInk) glides between the buttons. */
const order = () => Object.keys(S);
const isOpen = (k) => S[k] && S[k].menu.classList.contains('show');
const anyOpen = () => order().find(isOpen);
function bgTo(menu, instant) {
  const bg = $('#megaBg'); if (!bg) return;
  if (instant || reduced()) bg.style.transition = 'none';
  bg.classList.remove('closing');
  bg.style.height = menu.offsetHeight + 'px';
  bg.classList.add('show');
  if (instant || reduced()) { void bg.offsetWidth; bg.style.transition = ''; }
}
function bgHide() { const bg = $('#megaBg'); if (!bg) return; bg.classList.add('closing'); bg.style.height = '0px'; bg.classList.remove('show'); }
function inkTo(btn, instant) {
  const ink = $('#navInk'); if (!ink) return;
  if (!btn) { ink.classList.remove('show'); return; }
  if (instant || reduced()) ink.style.transition = 'none';
  ink.style.width = btn.offsetWidth + 'px'; ink.style.transform = `translate3d(${btn.offsetLeft}px,0,0)`; ink.classList.add('show');
  if (instant || reduced()) { void ink.offsetWidth; ink.style.transition = ''; }
}
function open(key, viaKey) {
  const st = S[key]; clearTimeout(st.closeT); clearTimeout(st.openT);
  if (isOpen(key)) return;
  const prev = order().find((k) => k !== key && (isOpen(k) || S[k].closing));
  const dir = prev ? (order().indexOf(key) > order().indexOf(prev) ? 1 : -1) : 0;
  order().forEach((k) => { if (k !== key) { clearTimeout(S[k].closeT); clearTimeout(S[k].openT); if (isOpen(k) || !S[k].menu.hidden) swapOut(k, dir); } });
  const m = st.menu;
  m.classList.remove('to-l', 'to-r', 'from-l', 'from-r', 'swapping');
  if (dir) m.classList.add(dir > 0 ? 'from-r' : 'from-l', 'swapping');
  m.hidden = false; void m.offsetWidth;
  bgTo(m, false); inkTo(st.btn, !dir);
  m.classList.add('show'); st.btn.setAttribute('aria-expanded', 'true');
  const first = $(`.mg-item[data-id="${active}"]`, m) || $('.mg-item', m);
  requestAnimationFrame(() => { focusItem(key, first); moveHl(key, first, true); if (viaKey) first.focus(); });
}
function swapOut(k, dir) {
  const st = S[k], m = st.menu; st.closing = false;
  m.classList.remove('from-l', 'from-r');
  if (dir) m.classList.add(dir > 0 ? 'to-l' : 'to-r');
  m.classList.remove('show'); st.btn.setAttribute('aria-expanded', 'false');
  clearTimeout(st.hideT); st.hideT = setTimeout(() => { if (!m.classList.contains('show')) { m.hidden = true; m.classList.remove('to-l', 'to-r', 'swapping'); } }, reduced() ? 0 : 320);
}
function close(key, now) {
  const st = S[key]; if (!st) return; clearTimeout(st.openT);
  const done = () => { st.closing = false; if (!isOpen(key)) return; swapOut(key, 0); if (!anyOpen()) { bgHide(); inkTo(null); } };
  if (now) done(); else { st.closing = true; clearTimeout(st.closeT); st.closeT = setTimeout(done, 180); }
}

/* ---------- mobile drawer ---------- */
function buildDrawer() {
  const d = $('#drawer');
  const group = (key) => { const g = GROUPS[key]; return `<div class="dr-g"><button class="dr-l dr-gbtn" aria-expanded="false" aria-controls="dr-${key}">${g.label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
    <div class="dr-sub" id="dr-${key}">${g.sections ? g.sections.map(([sec, ids]) => `<p class="dr-sec">${sec}</p>` + ids.map((id) => item(g.items.find((x) => x.id === id))).join('')).join('') : g.items.map(item).join('')}</div></div>`; };
  const item = (it) => `<a href="#${it.id}" data-page="${it.id}"><span class="mg-ico sm">${svg(ICON[it.icon], 18)}</span><span><b>${it.title}</b><small>${it.where}</small></span></a>`;
  d.innerHTML = `<div class="dr-h"><span class="brand"><img src="assets/plantvector-icon.png" alt=""><span class="wm hd"><span class="wm-n"><b>Plant</b><i>Vector</i></span><small>Plantation Management System</small></span></span><button class="iconbtn" id="drClose" aria-label="Tutup menu"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <nav class="dr-nav" aria-label="Menu utama"><a href="#dashboard" data-page="dashboard" class="dr-l">Beranda</a>${group('ffb')}${group('mill')}${group('kebun')}${group('hujan')}${group('hadir')}<a href="#dashboard" class="dr-l" data-soon-d>Laporan</a></nav>`;
  $('#drClose').onclick = closeDrawer;
  $$('a', d).forEach((a) => a.addEventListener('click', (e) => { if (a.hasAttribute('data-soon-d')) { e.preventDefault(); return; } closeDrawer(); }));
  $$('.dr-g', d).forEach((g) => { const b = $('.dr-gbtn', g); b.onclick = () => { const o = !g.classList.contains('open'); g.classList.toggle('open', o); b.setAttribute('aria-expanded', String(o)); }; });
}
/* Footer menu: same groups as the header, max 4 main links per column so the columns line up.
   The rest of a group sits behind "Lihat semua" and expands in place. */
const SHORT = { tasks: 'Tugas Panen', mills: 'Mills', 'scan-bcc': 'Scan Laporan BCC', 'abw-harian': 'Tonase Harian', 'scan-perawatan': 'Scan Laporan Harian', 'hadir-grafik': 'Grafik Kehadiran', 'hadir-scan': 'Scan QR Kehadiran' };
function buildFooter() {
  const el = $('#ftCols'); if (!el) return;
  const col = (key) => {
    const g = GROUPS[key], flat = g.sections ? g.sections.flatMap(([, ids]) => ids) : g.items.map((i) => i.id);
    const main = g.sections ? g.sections.map(([, ids]) => ids[0]) : flat.slice(0, 4);
    flat.forEach((id) => { if (main.length < 4 && !main.includes(id)) main.push(id); });
    const ordered = flat.filter((id) => main.includes(id)), rest = flat.filter((id) => !main.includes(id));
    const link = (id) => { const it = g.items.find((x) => x.id === id); return `<a href="#${id}" title="${it.title}">${SHORT[id] || it.title}</a>`; };
    return `<div class="ft-col"><h4>${g.label}</h4>${ordered.map(link).join('')}${rest.length ? `<div class="ft-more" id="ftm-${key}" hidden><div>${rest.map(link).join('')}</div></div><button type="button" class="ft-all" aria-expanded="false" aria-controls="ftm-${key}">Lihat semua <span>+${rest.length}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>` : ''}</div>`;
  };
  el.innerHTML = Object.keys(GROUPS).map(col).join('') + '<div class="ft-col"><h4>Bantuan</h4><a href="#changelog">Catatan perubahan</a><a href="#notifikasi">Notifikasi</a><a href="#profil">Profil &amp; pengaturan</a></div>';
  $$('.ft-all', el).forEach((b) => b.addEventListener('click', () => {
    const box = document.getElementById(b.getAttribute('aria-controls')), open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open)); b.firstChild.textContent = open ? 'Sembunyikan ' : 'Lihat semua ';
    if (open) { box.hidden = false; requestAnimationFrame(() => box.classList.add('open')); }
    else { box.classList.remove('open'); setTimeout(() => { if (!box.classList.contains('open')) box.hidden = true; }, reduced() ? 0 : 320); }
  }));
}
function openDrawer() {
  const d = $('#drawer'), s = $('#drawerScrim');
  $$('.dr-g', d).forEach((g) => { const has = !!$('a.cur', g); if (has) { g.classList.add('open'); $('.dr-gbtn', g).setAttribute('aria-expanded', 'true'); } });
  d.hidden = false; s.hidden = false; void d.offsetWidth; d.classList.add('show'); s.classList.add('show'); $('#burger').setAttribute('aria-expanded', 'true'); setTimeout(() => $('#drClose').focus(), 50);
}
function closeDrawer() { const d = $('#drawer'), s = $('#drawerScrim'); d.classList.remove('show'); s.classList.remove('show'); $('#burger').setAttribute('aria-expanded', 'false'); setTimeout(() => { d.hidden = true; s.hidden = true; }, reduced() ? 0 : 320); }

window.FFBNav = {
  groups: () => Object.fromEntries(Object.entries(GROUPS).map(([k, g]) => [k, g.items.map((i) => i.id)])),
  init(h) {
    reduced = h.reduced || reduced;
    const hoverable = window.matchMedia('(hover:hover) and (pointer:fine)');
    Object.keys(GROUPS).forEach((key) => {
      const btn = $(GROUPS[key].btn), menu = $(GROUPS[key].menu); if (!btn || !menu) return;
      S[key] = { btn, menu, hoverId: GROUPS[key].items[0].id }; build(key);
      btn.addEventListener('mouseenter', () => { if (!hoverable.matches) return; clearTimeout(S[key].closeT); S[key].openT = setTimeout(() => open(key, false), anyOpen() ? 40 : 90); });
      btn.addEventListener('mouseleave', () => { if (hoverable.matches) close(key); });
      menu.addEventListener('mouseenter', () => clearTimeout(S[key].closeT));
      menu.addEventListener('mouseleave', () => { if (hoverable.matches) close(key); });
      btn.addEventListener('click', () => { if (btn.getAttribute('aria-expanded') === 'true') close(key, true); else open(key, false); });
      btn.addEventListener('keydown', (e) => { if (['ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(key, true); } if (e.key === 'Escape') close(key, true); });
    });
    document.addEventListener('click', (e) => { Object.keys(S).forEach((k) => { const st = S[k]; if (!st.menu.hidden && !st.menu.contains(e.target) && !st.btn.contains(e.target)) close(k, true); }); });
    window.addEventListener('resize', () => Object.keys(S).forEach((k) => { if (isOpen(k)) { moveHl(k, $('.mg-item.hov', S[k].menu), true); bgTo(S[k].menu, true); inkTo(S[k].btn, true); } }));
    const bg = $('#megaBg'); if (bg) { bg.addEventListener('mouseenter', () => order().forEach((k) => clearTimeout(S[k].closeT))); }
    buildDrawer();
    buildFooter();
    $('#burger').addEventListener('click', openDrawer);
    $('#drawerScrim').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#drawer').hidden) closeDrawer(); });
  },
  setActive(name) {
    active = name;
    Object.keys(S).forEach((k) => {
      const inG = GROUPS[k].items.some((i) => i.id === name); S[k].btn.classList.toggle('on', inG);
      $$('.mg-item', S[k].menu).forEach((a) => { const on = a.dataset.id === name; a.classList.toggle('cur', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    });
    $$('#drawer [data-page]').forEach((a) => a.classList.toggle('cur', a.dataset.page === name));
  }
};
})();
