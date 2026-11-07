(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RM.matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const fmt = (n, d = 0) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400); };

/* ===================================================================
   DATA — structure mirrors the old PMMS dashboard (zone → sub-zone → gang).
   Values are dummy, regenerated per date with a seeded random generator.
   =================================================================== */
const ESTATES = [
  { code: 'EMU', name: 'Estate Muara Wis', color: '#073528', ink: '#fff', subs: { EMU1: ['PN1', 'PR3', 'PR4', 'PR7'], EMU2: ['RR1', 'RR5', 'RR7', 'RR9'], EMU3: ['SR1', 'SR2'] } },
  { code: 'EMC', name: 'Estate Muara Kaman', color: '#14684F', ink: '#fff', subs: { EMC1: ['PN1', 'PN2', 'PN3', 'PN4'], EMC2: ['PN5', 'PN6', 'PNB'], EMC3: ['PN7', 'PN8', 'PN9'] } },
  { code: 'EMS', name: 'Estate Sebulu', color: '#2FA84F', ink: '#04221A', subs: { EMS1: ['H01', 'H02', 'H03', 'H04'], EMS2: ['H05', 'H06', 'H07', 'H11', 'H12'] } },
  { code: 'SPS', name: 'Estate Sungai Payang', color: '#8BD450', ink: '#04221A', subs: { 'EMU3-SPS': ['HS1'], 'EMC3-SPS': ['HS3'], 'EMS3-SPS': ['HS4', 'HS5'] } },
  { code: 'KPSJ', name: 'Kebun Plasma Sebulu Jaya', color: '#C3D6CB', ink: '#04221A', subs: { KPSJ: ['HS2'], 'KPSS-PC': ['H10'] } }
];
const BASE_ABW = { EMU: 23.9, EMC: 25.4, EMS: 26.1, SPS: 24.9, KPSJ: 22.6 };
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const TODAY = new Date(2026, 10, 6);

function dataFor(offset) {
  let seed = 9173 + offset * 7919;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const int = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const dayF = 0.88 + rnd() * 0.22;
  const estates = ESTATES.map((e) => {
    const subs = Object.entries(e.subs).map(([sub, gangs]) => {
      const abw = +(BASE_ABW[e.code] + (rnd() - 0.5) * 1.6).toFixed(2);
      const gs = gangs.map((g) => { const t = Math.round(int(260, 980) * dayF); return { code: g, tandan: t, sj: Math.max(1, Math.round(t / 640)), ton: t * abw / 1000 }; });
      const sum = (k) => gs.reduce((a, g) => a + g[k], 0);
      return { code: sub, abw, gangs: gs, tandan: sum('tandan'), sj: sum('sj'), ton: sum('ton') };
    });
    const sum = (k) => subs.reduce((a, s) => a + s[k], 0);
    const tandan = sum('tandan'), ton = sum('ton');
    return { ...e, subs, tandan, sj: sum('sj'), ton, abw: ton / tandan * 1000 };
  });
  const tot = (k) => estates.reduce((a, e) => a + e[k], 0);
  const terkirim = tot('tandan'), sj = tot('sj'), ton = tot('ton');
  const bf1 = int(620, 980), bf2 = int(140, 320), bf3 = int(40, 150), bf = bf1 + bf2 + bf3;
  const remaining = int(40, 170), restanSent = bf - remaining;
  const segar = terkirim - restanSent, belum = int(1700, 3300);
  const cf1 = Math.round(remaining * 0.62), cf2 = remaining - cf1;
  const d = new Date(TODAY); d.setDate(d.getDate() + offset);
  return {
    offset, date: d, estates, tandan: terkirim, terkirim, sj, ton, abw: ton / terkirim * 1000,
    bf: { total: bf, d1: bf1, d2: bf2, d3: bf3 },
    prod: { total: segar + belum, sudah: segar, belum },
    kirim: { total: terkirim, segar, restan: restanSent },
    cf: { total: belum + remaining, d0: belum, d1: cf1, d2: cf2 },
    updated: offset === 0 ? '08:14' : '23:00'
  };
}

/* ===================================================================
   ANIMATED NUMBERS & BARS (remember last value per key, animate from it)
   =================================================================== */
const last = {};
function animateNumbers(root) {
  $$('[data-k]', root).forEach((el) => {
    const k = el.dataset.k, to = +el.dataset.to, dec = +(el.dataset.dec || 0);
    const from = last[k] ?? 0; last[k] = to;
    if (reduced() || from === to) { el.textContent = fmt(to, dec); return; }
    const t0 = performance.now(), dur = 900;
    const step = (now) => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(from + (to - from) * e, dec); if (p < 1) requestAnimationFrame(step); };
    el.textContent = fmt(from, dec); requestAnimationFrame(step);
  });
}
const lastW = {};
async function animateBars(root) {
  const bars = $$('[data-wk]', root);
  bars.forEach((b) => b.style.setProperty('--w', lastW[b.dataset.wk] ?? 0));
  $$('.stack,.div', root).forEach((s) => s.classList.remove('go'));
  await nextFrame();
  bars.forEach((b) => { b.style.setProperty('--w', b.dataset.w); lastW[b.dataset.wk] = b.dataset.w; });
  $$('.stack,.div', root).forEach((s) => s.classList.add('go'));
  $$('.ring .arc', root).forEach((a) => { a.style.strokeDashoffset = a.dataset.off; });
}
const N = (k, v, dec = 0) => `<span class="num" data-k="${k}" data-to="${v}" data-dec="${dec}">${fmt(last[k] ?? 0, dec)}</span>`;

/* ===================================================================
   LOGIN
   =================================================================== */
const form = $('#loginForm'), email = $('#email'), pass = $('#password'), submit = $('#submit'), alertBox = $('#formAlert');
function setField(id, msg) {
  const f = $('#' + id), m = $('.msg', f);
  if (msg) { f.classList.remove('err', 'ok'); void f.offsetWidth; f.classList.add('err'); m.textContent = msg; $('input', f).setAttribute('aria-invalid', 'true'); }
  else { f.classList.remove('err'); $('input', f).removeAttribute('aria-invalid'); }
}
function validate(onlyClear) {
  const ev = email.value.trim(), pv = pass.value;
  const eErr = !ev ? 'Email atau ID staf wajib diisi.' : (ev.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev)) ? 'Format email belum benar.' : '';
  const pErr = !pv ? 'Kata sandi wajib diisi.' : pv.length < 6 ? `Kata sandi minimal 6 karakter (baru ${pv.length}).` : '';
  if (onlyClear) {
    if (!eErr) { setField('f-email'); $('#f-email').classList.toggle('ok', !!ev); }
    if (!pErr) { setField('f-pass'); $('#f-pass').classList.toggle('ok', !!pv); }
    return;
  }
  setField('f-email', eErr); setField('f-pass', pErr);
  return eErr ? email : pErr ? pass : null;
}
function showAlert(msg) {
  alertBox.innerHTML = msg ? `<span><span class="in"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>${msg}</span></span>` : alertBox.innerHTML;
  alertBox.classList.toggle('show', !!msg);
}
[email, pass].forEach((i) => i.addEventListener('input', () => { validate(true); showAlert(''); }));
pass.addEventListener('keyup', (e) => $('#caps').classList.toggle('show', !!(e.getModifierState && e.getModifierState('CapsLock'))));
pass.addEventListener('blur', () => $('#caps').classList.remove('show'));
$('#peek').addEventListener('click', () => { const show = pass.type === 'password'; pass.type = show ? 'text' : 'password'; $('#peek').setAttribute('aria-pressed', String(show)); $('#peek').setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'); pass.focus(); });
let busy = false;
form.addEventListener('submit', async (e) => {
  e.preventDefault(); if (busy) return;
  showAlert('');
  const bad = validate(false); if (bad) { bad.focus(); return; }
  busy = true; submit.classList.add('loading'); submit.setAttribute('aria-busy', 'true'); $('.lbl', submit).textContent = 'Memeriksa…';
  await wait(1100);
  if (pass.value === 'salah123') {
    submit.classList.remove('loading'); submit.removeAttribute('aria-busy'); $('.lbl', submit).textContent = 'Masuk';
    showAlert('Email atau kata sandi tidak cocok. Sisa percobaan: 4.'); setField('f-pass', 'Periksa kembali kata sandi Anda.'); pass.select(); busy = false; return;
  }
  submit.classList.remove('loading'); submit.classList.add('success'); $('.lbl', submit).textContent = 'Berhasil';
  await wait(650);
  busy = false;
  goDashboard(true);
});

function enterLogin() {
  const L = $('#login'); L.classList.remove('is-in', 'leave'); void L.offsetWidth; L.classList.add('is-in');
  submit.classList.remove('success', 'loading'); $('.lbl', submit).textContent = 'Masuk';
  $$('.lg-stats [data-count]').forEach((dd) => { const to = +dd.dataset.count; if (reduced()) return; const t0 = performance.now(); const st = (n) => { const p = Math.min(1, (n - t0 - 500) / 900); dd.textContent = fmt(Math.max(0, to * (1 - Math.pow(1 - Math.max(p, 0), 3)))); if (p < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); });
  if (!email.value) setTimeout(() => email.focus({ preventScroll: true }), reduced() ? 0 : 700);
}

/* ===================================================================
   PAGE TRANSITIONS (curtain)
   =================================================================== */
const curtain = $('#curtain');
/* Loader inspired by React Bits "Threads" (flowing lines background) + "BlurText" (per-letter blur reveal),
   rewritten in vanilla canvas/CSS. The curtain opens as a circle from the button that started it. */
const Threads = (() => {
  const cv = $('#ctThreads'), cx = cv && cv.getContext('2d'); let raf = 0, t0 = 0, mx = .5, my = .5, W = 0, H = 0;
  const N = 22, seed = Array.from({ length: N }, (_, i) => ({ o: i / (N - 1), p: Math.random() * 6.28, s: .6 + Math.random() * .8 }));
  const size = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0); };
  const frame = (now) => {
    const t = (now - t0) / 1000; cx.clearRect(0, 0, W, H);
    seed.forEach((l, i) => {
      const base = H * (.3 + l.o * .4), amp = H * (.05 + .07 * Math.sin(l.o * 3.14)), pull = (my - .5) * H * .12 * (1 - Math.abs(l.o - .5) * 1.6);
      cx.beginPath();
      for (let x = -10; x <= W + 10; x += 12) {
        const u = x / W, fall = Math.sin(u * 3.14);                       // calm at the edges, lively in the middle
        const y = base + pull * fall + Math.sin(u * 6 + t * l.s + l.p) * amp * fall + Math.sin(u * 13 - t * 1.3 + l.p * 2) * amp * .25 * fall + Math.cos((u - mx) * 5) * 8 * fall;
        x < 0 ? cx.moveTo(x, y) : cx.lineTo(x, y);
      }
      const a = .1 + .5 * Math.sin(l.o * 3.14);
      cx.strokeStyle = i % 3 === 0 ? `rgba(139,212,80,${a})` : `rgba(207,230,218,${a * .55})`;
      cx.lineWidth = i % 3 === 0 ? 1.6 : 1; cx.stroke();
    });
    raf = requestAnimationFrame(frame);
  };
  window.addEventListener('pointermove', (e) => { mx = e.clientX / window.innerWidth; my = e.clientY / window.innerHeight; });
  window.addEventListener('resize', () => raf && size());
  return { start() { if (!cx) return; size(); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }, stop() { cancelAnimationFrame(raf); raf = 0; } };
})();
function blurWord(el) {
  const parts = [['Plant', 'b'], ['Vector', 'i']]; let k = 0;
  el.innerHTML = parts.map(([w, tag]) => `<${tag}>${[...w].map((ch) => `<span style="--k:${k++}">${ch}</span>`).join('')}</${tag}>`).join('');
}
async function curtainSwap(swap, kind = 'in', origin) {
  if (reduced()) { swap(); return; }
  const r = origin ? origin.getBoundingClientRect() : null;
  curtain.style.setProperty('--ox', (r ? r.left + r.width / 2 : window.innerWidth / 2) + 'px');
  curtain.style.setProperty('--oy', (r ? r.top + r.height / 2 : window.innerHeight / 2) + 'px');
  const steps = kind === 'in' ? ['Memverifikasi akun…', 'Memuat 5 estate dan 13 divisi…', 'Menyiapkan neraca tandan…', 'Siap'] : ['Menyimpan sesi…', 'Sampai jumpa'];
  const dur = kind === 'in' ? 1700 : 900;
  curtain.style.setProperty('--dur', dur + 'ms');
  blurWord($('#ctWord')); $('#ctSub').textContent = steps[0];
  document.documentElement.classList.add('ct-lock');
  curtain.classList.remove('out', 'done'); curtain.classList.add('up', kind); Threads.start();
  const sub = $('#ctSub'); let s = 0;
  const tick = setInterval(() => { s++; if (s >= steps.length) return clearInterval(tick); sub.classList.remove('swap'); void sub.offsetWidth; sub.classList.add('swap'); sub.textContent = steps[s]; }, dur / steps.length);
  await wait(dur + 260);
  clearInterval(tick);
  swap(); window.scrollTo(0, 0);
  await nextFrame(); await wait(80);
  curtain.classList.add('done');
  await wait(260);
  curtain.classList.remove('up'); curtain.classList.add('out');
  await wait(720);
  curtain.classList.remove('out', 'done', 'in', 'logout'); Threads.stop();
  document.documentElement.classList.remove('ct-lock');
}
let page = null, dashMounted = false;
const PAGES = ['dashboard', 'mills', 'tasks', 'surat-jalan', 'scan-bcc', 'perawatan', 'scan-perawatan', 'pupuk', 'pupuk-jenis', 'scan-pupuk', 'racun', 'racun-jenis', 'scan-racun', 'interval', 'hujan-baru', 'hujan', 'hujan-bulan', 'hujan-tahun', 'hadir', 'hadir-scan', 'hadir-grafik', 'changelog', 'notifikasi', 'profil', 'abw', 'abw-harian', 'kontraktor', 'truk'];
const FFB_GROUP = ['tasks', 'surat-jalan', 'mills', 'scan-bcc'];
const TITLES = { dashboard: 'Beranda', mills: 'Mills — Scan Surat Jalan', tasks: 'Tugas Panen (BCC)', 'surat-jalan': 'Surat Jalan', 'scan-bcc': 'Scan Laporan BCC', perawatan: 'Kerja Perawatan', 'scan-perawatan': 'Scan Laporan Kerja Harian', pupuk: 'Kerja Pupuk', 'pupuk-jenis': 'Jenis Pupuk', 'scan-pupuk': 'Scan QR Pupuk', racun: 'Kerja Racun', 'racun-jenis': 'Jenis Racun', 'scan-racun': 'Scan QR Racun', interval: 'Harvest Interval', 'hujan-baru': 'Catat Curah Hujan', hujan: 'Data Curah Hujan', 'hujan-bulan': 'Grafik Curah Hujan per Bulan', 'hujan-tahun': 'Grafik Curah Hujan per Tahun', hadir: 'Data Kehadiran', 'hadir-scan': 'Scan QR Kehadiran', 'hadir-grafik': 'Grafik Rekap Kehadiran', changelog: 'Catatan Perubahan', notifikasi: 'Notifikasi', profil: 'Profil', abw: 'ABW Bulanan', 'abw-harian': 'Tonase Harian Mill', kontraktor: 'Kontraktor', truk: 'Truk & Supir' };
const elFor = (n) => n === 'dashboard' ? $('#dash') : n === 'mills' ? $('#mills') : $('#ffb');
function setNav(name) {
  $$('.nav [data-page]').forEach((a) => { const on = a.dataset.page === name; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (window.FFBNav) window.FFBNav.setActive(name);
}
function showPage(name) {
  page = name; setNav(name);
  ['#dash', '#mills', '#ffb'].forEach((id) => { $(id).hidden = $(id) !== elFor(name); });
  const helpers = { reduced, toast };
  if (name === 'dashboard') { if (!dashMounted) { mountDashboard(); dashMounted = true; } }
  else if (name === 'mills') { if (window.MillsPage) window.MillsPage.mount($('#mills'), helpers); }
  else if (window.FFBPages && window.FFBPages[name]) window.FFBPages[name].mount($('#ffb'), helpers);
  document.title = TITLES[name] + ' · PlantVector';
}
function startPage() {
  if (page === 'dashboard') startDashboard();
  else if (page === 'mills') { if (window.MillsPage) window.MillsPage.start(); }
  else if (window.FFBPages && window.FFBPages[page]) window.FFBPages[page].start();
}
async function goDashboard(animated, target) {
  const name = PAGES.includes(target) ? target : 'dashboard';
  const doSwap = () => { $('#login').hidden = true; $('#app').hidden = false; history.replaceState(null, '', '#' + name); showPage(name); };
  if (animated) { $('#login').classList.add('leave'); await curtainSwap(doSwap, 'in', submit); } else doSwap();
  startPage();
}
async function switchPage(name) {
  if (name === page || $('#app').hidden) return;
  const cur = elFor(page);
  if (!reduced()) { cur.classList.add('page-out'); await wait(220); cur.classList.remove('page-out'); }
  window.scrollTo(0, 0);
  showPage(name);
  const nx = elFor(name);
  nx.classList.remove('page-in'); void nx.offsetWidth; nx.classList.add('page-in');
  startPage();
}
if (window.FFBNav) window.FFBNav.init({ reduced });
window.addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (PAGES.includes(h)) { if ($('#app').hidden) goDashboard(false, h); else switchPage(h); }
});
async function goLogin(animated) {
  const doSwap = () => { $('#app').hidden = true; $('#login').hidden = false; history.replaceState(null, '', '#login'); pass.value = ''; setField('f-pass'); $('#f-pass').classList.remove('ok'); enterLogin(); };
  if (animated) await curtainSwap(doSwap, 'logout', $('#meBtn')); else doSwap();
}
$('#logout').addEventListener('click', () => goLogin(true));
$$('[data-soon]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); toast('Prototipe ini hanya mencakup login dan Beranda.'); }));

/* ===================================================================
   DASHBOARD
   =================================================================== */
const S = { offset: 0, tab: 'ringkasan', metric: 'tandan' };
let D = dataFor(0);
const TABS = [['ringkasan', 'Ringkasan harian'], ['kiriman', 'Kiriman per estate'], ['abw', 'ABW per divisi']];
const DEF = {
  A: ['Restan BF (bring forward)', ['Total tandan restan yang dibawa dari hari-hari sebelumnya, yaitu yang belum masuk mill sampai pukul 23:00 kemarin.', 'Angka ini tidak berubah sepanjang hari; menjadi dasar referensi.']],
  B: ['Produksi hari ini', ['Total tandan segar dalam BCC dengan tanggal panen hari ini.', 'Sudah terkirim: tandan segar hari ini yang sudah sampai di mill. Belum terkirim: masih di TPH.']],
  C: ['Surat Jalan & tonase', ['Surat Jalan yang sudah masuk mill hari ini; 1 truk = 1 Surat Jalan.', 'Tonase adalah total berat yang tercatat di timbangan mill, tanpa potongan brondolan dan tandan training.']],
  D: ['Terkirim hari ini', ['Semua tandan yang terkirim ke mill hari ini.', 'Segar HI: tandan dengan tanggal panen hari ini. Restan: tandan dengan tanggal panen kemarin atau sebelumnya.']],
  E: ['Restan CF (carry forward)', ['Tandan yang belum terkirim sampai mill tutup. Angka ini berkurang setiap ada tandan yang terkirim.', 'Setiap pukul 23:00 semua tandan yang belum terkirim otomatis dihitung sebagai restan dan dibawa ke esok hari sebagai Restan BF.']]
};
const dateLabel = (d) => `${DAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${MON[d.getMonth()]} ${d.getFullYear()}`;
const longDate = (d) => `${['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][d.getDay()]}, ${d.getDate()} ${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][d.getMonth()]} ${d.getFullYear()}`;
const ico = { prev: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>', ref: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>' };
const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;

function mountDashboard() {
  $('#dash').innerHTML = `
  <section class="hero" aria-labelledby="h-title"><div class="wrap">
    <div class="hero-top">
      <div class="rv" style="--i:0"><p class="kick">FFB Daily Summary</p><h1 id="h-title">Neraca tandan hari ini</h1><p class="hsub" id="h-date"></p></div>
      <div class="datebar rv" style="--i:1">
        <div class="datectl" role="group" aria-label="Pilih tanggal">
          <button id="dPrev" aria-label="Hari sebelumnya">${svg(ico.prev)}</button>
          <div class="d" aria-live="polite"><span id="dLbl"></span></div>
          <button id="dNext" aria-label="Hari berikutnya">${svg(ico.next)}</button>
          <span class="sep"></span>
          <button id="dRef" class="refresh" aria-label="Muat ulang data">${svg(ico.ref)}</button>
        </div>
        <span class="updated" id="dUpd"></span>
      </div>
    </div>
    <div class="eq" id="eq"></div>
    <p class="eq-check rv" style="--i:7" id="eqCheck"></p>
  </div></section>
  <div class="tabs-wrap"><div class="wrap"><div class="tabs" role="tablist" aria-label="Bagian dashboard" id="tabs">${TABS.map(([k, l]) => `<button role="tab" id="t-${k}" aria-controls="p-${k}" aria-selected="${S.tab === k}" tabindex="${S.tab === k ? 0 : -1}" data-tab="${k}">${l}<span class="count" id="c-${k}"></span></button>`).join('')}<span class="ink" aria-hidden="true"></span></div></div></div>
  <div class="wrap panels">${TABS.map(([k]) => `<section class="panel" role="tabpanel" id="p-${k}" aria-labelledby="t-${k}" ${S.tab === k ? '' : 'hidden'}></section>`).join('')}</div>`;
  bindDash();
}

function renderHero() {
  const d = D;
  $('#h-date').textContent = `${longDate(d.date)} · 5 estate · ${d.estates.reduce((a, e) => a + e.subs.length, 0)} divisi`;
  $('#dLbl').textContent = dateLabel(d.date);
  $('#dNext').disabled = S.offset >= 0; $('#dPrev').disabled = S.offset <= -6;
  $('#dUpd').textContent = S.offset === 0 ? `Terakhir diperbarui ${d.updated} WITA` : `Ditutup ${d.updated} WITA · data final`;
  const node = (L, cls, title, k, v, cap) => `<article class="node ${cls} hv" style="--i:${'ABDE'.indexOf(L) * 2 + 2}"><span class="tag"><b>${L}</b>${title}</span><span class="big">${N(k, v)}<small>tandan</small></span><span class="cap">${cap}</span><button class="info" aria-label="Definisi ${DEF[L][0]}" aria-expanded="false" data-pop="${L}">i</button><div class="pop" role="dialog" aria-label="${DEF[L][0]}"><b>${DEF[L][0]}</b>${DEF[L][1].map((p) => `<p>${p}</p>`).join('')}</div></article>`;
  const op = (s, n, i) => `<div class="op o${n} hv" style="--i:${i}" aria-hidden="true">${s}</div>`;
  $('#eq').innerHTML = node('A', '', 'Restan BF', 'bf', d.bf.total, 'dibawa dari hari sebelumnya') + op('+', 1, 3) + node('B', '', 'Produksi hari ini', 'prod', d.prod.total, 'tandan segar, panen hari ini') + op('−', 2, 5) + node('D', '', 'Terkirim hari ini', 'kirim', d.kirim.total, `${fmt(d.sj)} Surat Jalan · ${fmt(d.ton, 1)} ton`) + op('=', 3, 7) + node('E', 'res', 'Restan CF', 'cf', d.cf.total, S.offset === 0 ? 'akan dibawa ke besok pukul 23:00' : 'dibawa ke hari berikutnya');
  $('#eqCheck').innerHTML = `Cek neraca: <b>${fmt(d.bf.total)}</b> + <b>${fmt(d.prod.total)}</b> − <b>${fmt(d.kirim.total)}</b> = <b>${fmt(d.cf.total)}</b> tandan.`;
  $$('[data-pop]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const p = b.nextElementSibling, open = !p.classList.contains('show'); closePops(); if (open) { p.classList.add('show'); b.setAttribute('aria-expanded', 'true'); } }));
}
function closePops() { $$('.pop.show').forEach((p) => { p.classList.remove('show'); p.previousElementSibling.setAttribute('aria-expanded', 'false'); }); }
document.addEventListener('click', (e) => { if (!e.target.closest('.pop')) closePops(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePops(); });

const age = (k, lb, v, max, color) => `<div class="age-r"><span class="lb">${lb}</span><span class="bar"><i data-wk="${k}" data-w="${max ? (v / max).toFixed(3) : 0}" style="background:${color}"></i></span><span class="v">${N(k, v)}</span></div>`;
function renderRingkasan() {
  const d = D, p = d.prod, k = d.kirim, bfMax = Math.max(d.bf.d1, d.bf.d2, d.bf.d3), cfMax = Math.max(d.cf.d0, d.cf.d1, d.cf.d2);
  const C = 2 * Math.PI * 52, sudahPct = p.sudah / p.total;
  const mins = S.offset === 0 ? (23 * 60) - (8 * 60 + 14) : 0;
  $('#p-ringkasan').innerHTML = `
  <div class="grid g-sum">
    <article class="card c4 st" style="--i:0"><div class="card-h"><span class="letter">A</span><div><h3>Restan BF</h3><p>Belum masuk mill sampai 23:00 kemarin</p></div><div class="r"><div class="fig">${N('a-t', d.bf.total)}</div></div></div>
      <div class="age">${age('a1', '1 hari', d.bf.d1, bfMax, 'var(--age1)')}${age('a2', '2 hari', d.bf.d2, bfMax, 'var(--age2)')}${age('a3', '> 3 hari', d.bf.d3, bfMax, 'var(--age3)')}</div>
      <p class="note">Angka referensi, tidak berubah sepanjang hari.</p></article>
    <article class="card c4 st" style="--i:1"><div class="card-h"><span class="letter">B</span><div><h3>Produksi hari ini</h3><p>Tandan segar di BCC bertanggal hari ini</p></div></div>
      <div class="ring-wrap"><div class="ring"><svg viewBox="0 0 132 132" aria-hidden="true"><circle class="trk" cx="66" cy="66" r="52"/><circle class="arc" cx="66" cy="66" r="52" stroke-dasharray="${C}" style="stroke-dashoffset:${C}" data-off="${C * (1 - sudahPct)}"/></svg><div class="ctr"><div><b>${N('b-pct', sudahPct * 100)}%</b><small>terkirim</small></div></div></div>
      <div class="kv"><div><span>Produksi</span><b>${N('b-t', p.total)}</b></div><div><span><i style="background:var(--g800)"></i>Sudah terkirim</span><b>${N('b-s', p.sudah)}</b></div><div><span><i style="background:var(--mint);box-shadow:inset 0 0 0 1px var(--line-2)"></i>Belum terkirim (TPH)</span><b>${N('b-b', p.belum)}</b></div></div></div></article>
    <article class="card c4 st" style="--i:2"><div class="card-h"><span class="letter">D</span><div><h3>Terkirim hari ini</h3><p>Semua tandan yang sampai di mill</p></div><div class="r"><div class="fig">${N('d-t', k.total)}</div></div></div>
      <div class="stack" role="img" aria-label="Segar HI ${fmt(k.segar)}, Restan ${fmt(k.restan)}"><i style="width:${k.segar / k.total * 100}%;background:var(--leaf)"></i><i style="width:${k.restan / k.total * 100}%;background:var(--age1);transition-delay:120ms"></i></div>
      <div class="kv"><div><span><i style="background:var(--leaf)"></i>Segar HI · panen hari ini</span><b>${N('d-s', k.segar)}</b></div><div><span><i style="background:var(--age1)"></i>Restan · panen kemarin & sebelumnya</span><b>${N('d-r', k.restan)}</b></div></div></article>

    <article class="card c5 mill st" style="--i:3"><div class="card-h"><span class="letter">C</span><div><h3>Penerimaan mill</h3><p>Surat Jalan yang sudah masuk & berat timbangan</p></div></div>
      <div class="pair"><div><span>Surat Jalan hari ini</span><div class="fig">${N('c-sj', d.sj)}<small>SJ</small></div><p class="note">1 truk = 1 Surat Jalan</p></div><div><span>Tonase timbangan</span><div class="fig">${N('c-ton', d.ton, 1)}<small>ton</small></div><p class="note">Tanpa potongan brondolan & tandan training</p></div></div>
      <p class="note">ABW rata-rata hari ini: <b>${fmt(d.abw, 2)} kg/tandan</b> dari ${fmt(d.terkirim)} tandan terkirim.</p></article>
    <article class="card c7 st" style="--i:4"><div class="card-h"><span class="letter">E</span><div><h3>Restan CF</h3><p>Belum terkirim sampai mill tutup, dibawa ke esok hari</p></div><div class="r"><div class="fig">${N('e-t', d.cf.total)}</div></div></div>
      <div class="age">${age('e0', '0 hari', d.cf.d0, cfMax, 'var(--age0)')}${age('e1', '1 hari', d.cf.d1, cfMax, 'var(--age1)')}${age('e2', '≥ 2 hari', d.cf.d2, cfMax, 'var(--age3)')}</div>
      <span class="countdown">${S.offset === 0 ? `Dihitung otomatis pukul 23:00 · ${Math.floor(mins / 60)} jam ${mins % 60} menit lagi` : 'Sudah dihitung pukul 23:00'}</span></article>

    <article class="card c12 st" style="--i:5"><div class="card-h"><div><h3>Arti setiap angka</h3><p>Penjelasan setiap angka di neraca tandan. Penjelasan yang sama juga ada di tombol <b>i</b> di bagian atas.</p></div></div>
      <div class="gloss">${'ABCDE'.split('').map((L) => `<div class="gl"><h4><span class="letter">${L}</span>${DEF[L][0]}</h4>${DEF[L][1].map((x) => `<p>${x}</p>`).join('')}</div>`).join('')}</div></article>
  </div>`;
}

const METRIC = { tandan: ['Tandan terkirim', 'tandan', 0, 1], sj: ['Surat Jalan', 'SJ', 0, 1], ton: ['Tonase kiriman', 'ton', 1, 1] };
function renderKiriman() {
  const d = D, [mL, mU, mD, mDiv] = METRIC[S.metric], val = (o) => o[S.metric] / mDiv, total = val(d);
  const maxSub = Math.max(...d.estates.flatMap((e) => e.subs.map(val)));
  $('#p-kiriman').innerHTML = `
  <div class="ktop st" style="--i:0"><div class="seg" role="group" aria-label="Pilih ukuran" id="seg">${Object.entries(METRIC).map(([k, m]) => `<button aria-pressed="${S.metric === k}" data-m="${k}">${m[0]}</button>`).join('')}<span class="ink" aria-hidden="true"></span></div>
    <div class="ktotal"><div class="lbl">${mL} · semua estate</div><div class="fig">${N('k-tot-' + S.metric, total, mD)}<small>${mU}</small></div></div></div>
  <div class="share st" style="--i:1" role="img" aria-label="Porsi per estate">${d.estates.map((e) => `<div style="flex-grow:${val(e)};background:${e.color};color:${e.ink}" title="${e.code}: ${fmt(val(e), mD)} ${mU}">${e.code}<small>${fmt(val(e) / total * 100, 0)}%</small></div>`).join('')}</div>
  <div class="estates">${d.estates.map((e, i) => `<article class="est st" style="--i:${i + 2}"><div class="est-h"><span class="code" style="background:${e.color};color:${e.ink}">${e.code}</span><h3>${e.name}</h3><span class="tot">${N(`k-${e.code}-${S.metric}`, val(e), mD)}<small>${mU}</small></span></div>
    ${e.subs.map((s) => `<div class="sub"><div class="sub-h"><b>${s.code}</b><span class="bar"><i data-wk="kb-${s.code}" data-w="${(val(s) / maxSub).toFixed(3)}" style="background:${e.code === 'SPS' || e.code === 'KPSJ' ? 'var(--g500)' : e.color}"></i></span><span class="v">${fmt(val(s), mD)}</span></div><div class="gangs">${s.gangs.map((g) => `<span class="gang"><b>${g.code}</b><span>${fmt(val(g), mD)}</span></span>`).join('')}</div></div>`).join('')}
  </article>`).join('')}</div>`;
  const seg = $('#seg');
  $$('[data-m]', seg).forEach((b) => b.addEventListener('click', async () => { if (S.metric === b.dataset.m) return; S.metric = b.dataset.m; renderKiriman(); placeInk($('#seg'), true); const p = $('#p-kiriman'); p.classList.add('static-in'); animateNumbers(p); animateBars(p); }));
}

function renderAbw() {
  const d = D, DEFAULT = 25;
  const subs = d.estates.flatMap((e) => e.subs.map((s) => ({ ...s, est: e.code })));
  $('#p-abw').innerHTML = `
  <div class="abw-top">${d.estates.map((e, i) => { const dl = e.abw - DEFAULT; return `<article class="abw-t st" style="--i:${i}"><div class="lbl">${e.code}</div><div class="fig">${N('abw-' + e.code, e.abw, 2)}<small>kg</small></div><span class="dlt ${dl >= 0 ? 'up' : 'dn'}">${dl >= 0 ? '+' : '−'}${fmt(Math.abs(dl), 2)} vs default 25,00</span></article>`; }).join('')}</div>
  <article class="card st" style="--i:5;margin-top:var(--s5)"><div class="card-h"><div><h3>ABW per divisi (kg/tandan)</h3><p>Hijau di atas default sistem 25,00 kg, oranye di bawahnya. Dipakai untuk mengubah jumlah tandan menjadi estimasi tonase.</p></div></div>
    <div class="abw-list"><div class="axis"><span>Divisi</span><span class="sc"><span>−2,5</span><span>25,00</span><span>+2,5</span></span><span class="st2" style="text-align:right">Tandan</span><span style="text-align:right">ABW</span></div>
    ${subs.map((s) => { const dl = s.abw - DEFAULT, w = Math.min(1, Math.abs(dl) / 2.5) * 50; return `<div class="abw-r"><span class="nm"><b>${s.code}</b><small>${s.est}</small></span><span class="div" role="img" aria-label="${s.code} ${fmt(s.abw, 2)} kg"><i class="${dl >= 0 ? 'pos' : 'neg'}" style="width:${w}%"></i></span><span class="st2" style="text-align:right;font-variant-numeric:tabular-nums">${fmt(s.tandan)}</span><span class="v">${fmt(s.abw, 2)}</span></div>`; }).join('')}</div></article>`;
}

function renderCounts() {
  $('#c-ringkasan').textContent = fmt(D.cf.total);
  $('#c-kiriman').textContent = fmt(D.terkirim);
  $('#c-abw').textContent = fmt(D.abw, 1);
}
function renderAll() { renderHero(); renderRingkasan(); renderKiriman(); renderAbw(); renderCounts(); }

function placeInk(container, animate = true) {
  const ink = $('.ink', container), on = $('[aria-selected=true],[aria-pressed=true]', container); if (!ink || !on) return;
  if (!animate) ink.style.transition = 'none';
  ink.style.width = on.offsetWidth + 'px'; ink.style.transform = `translate3d(${on.offsetLeft}px,0,0)`;
  if (!animate) { void ink.offsetWidth; ink.style.transition = ''; }
}

async function switchTab(k, focus) {
  if (k === S.tab) return;
  const order = TABS.map((t) => t[0]), back = order.indexOf(k) < order.indexOf(S.tab);
  const old = $('#p-' + S.tab), nw = $('#p-' + k);
  S.tab = k;
  $$('#tabs [role=tab]').forEach((b) => { const on = b.dataset.tab === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); });
  placeInk($('#tabs'));
  old.hidden = true; old.classList.remove('enter', 'back');
  nw.hidden = false; nw.classList.remove('enter', 'back'); void nw.offsetWidth; nw.classList.add('enter'); if (back) nw.classList.add('back');
  if (k === 'kiriman') placeInk($('#seg'), false);
  animateNumbers(nw); animateBars(nw);
  const top = $('.tabs-wrap').offsetTop - 68; if (window.scrollY > top) window.scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' });
}

async function changeDate(delta) {
  const n = Math.max(-6, Math.min(0, S.offset + delta)); if (n === S.offset && delta) return;
  S.offset = n; D = dataFor(n);
  const lbl = $('#dLbl');
  if (!reduced() && delta) { lbl.style.transform = `translate3d(${delta > 0 ? -24 : 24}px,0,0)`; lbl.style.opacity = '0'; await wait(160); }
  $$('.panel').forEach((x) => x.classList.remove('enter', 'back'));
  renderAll();
  if (!reduced() && delta) { lbl.style.transition = 'none'; lbl.style.transform = `translate3d(${delta > 0 ? 24 : -24}px,0,0)`; void lbl.offsetWidth; lbl.style.transition = ''; lbl.style.transform = ''; lbl.style.opacity = ''; }
  $('#dash').classList.add('static');
  if (S.tab === 'kiriman') placeInk($('#seg'), false);
  animateNumbers($('#dash')); animateBars($('#dash'));
}

function bindDash() {
  renderAll();
  $('#dPrev').addEventListener('click', () => changeDate(-1));
  $('#dNext').addEventListener('click', () => changeDate(1));
  $('#dRef').addEventListener('click', async (e) => { const b = e.currentTarget; b.classList.remove('spinning'); void b.offsetWidth; b.classList.add('spinning'); await wait(500); changeDate(0); toast('Data diperbarui · 08:14 WITA'); });
  $$('#tabs [role=tab]').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  $('#tabs').addEventListener('keydown', (e) => {
    const order = TABS.map((t) => t[0]), i = order.indexOf(S.tab);
    if (e.key === 'ArrowRight') { e.preventDefault(); switchTab(order[(i + 1) % order.length], true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); switchTab(order[(i + order.length - 1) % order.length], true); }
  });
  window.addEventListener('resize', () => { placeInk($('#tabs'), false); if (S.tab === 'kiriman') placeInk($('#seg'), false); });
}

async function startDashboard() {
  const dash = $('#dash');
  dash.classList.remove('is-in', 'static'); await nextFrame();
  placeInk($('#tabs'), false); if (S.tab === 'kiriman') placeInk($('#seg'), false);
  dash.classList.add('is-in');
  setTimeout(() => { animateNumbers(dash); animateBars(dash); }, reduced() ? 0 : 280);
  setTimeout(() => dash.classList.add('static'), reduced() ? 0 : 1500);
}

// numbers inside a dashboard block that scrolls into view count up again from 0
document.addEventListener('sv:in', (e) => { if (reduced() || !e.target.closest || !e.target.closest('#dash')) return;
  $$('[data-k]', e.target).forEach((el) => { const to = +el.dataset.to, dec = +(el.dataset.dec || 0), t0 = performance.now(); const step = (n) => { const p = Math.min(1, (n - t0) / 900), k = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * k, dec); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }); });

/* ===================================================================
   BOOT
   =================================================================== */
document.body.classList.remove('booting');
const startHash = location.hash.slice(1);
if (PAGES.includes(startHash)) { $('#login').hidden = true; goDashboard(false, startHash); }
else { history.replaceState(null, '', '#login'); enterLogin(); }
})();
