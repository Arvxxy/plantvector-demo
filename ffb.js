/* FFB Tracking pages: Tugas Panen (/admin/task), Surat Jalan (/admin/surat-jalan), Scan Laporan BCC (/admin/scan-lhm).
   Fields, filters and actions follow TaskCrudController, SuratJalanCrudController, scanLHMpage.blade.php
   and OtherTaskCrudController@parselhmQR / insertRestanTask. All data below is dummy. */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n, d = 0) => (n == null || n === '' ? '—' : Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let H = { reduced: () => false, toast: () => {} };
const wait = (ms) => new Promise((r) => setTimeout(r, H.reduced() ? 0 : ms));
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>', cols: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
  dl: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', chev: '<path d="M9 6l6 6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', back: '<path d="M15 6l-6 6 6 6"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2"/>', img: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
  noimg: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 4l16 16"/>', print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
  truck: '<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>', refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  scan: '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/><path d="M7 12h10"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>',
  net: '<path d="M3 5h18M3 12h18M3 19h18M6 3v18M12 3v18M18 3v18"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>'
};
const ic = (n, s = 18) => `<svg class="fi" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

/* ---------------- dummy data ---------------- */
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296); }
const ZONES = { EMU1: ['PN1', 'PR3', 'PR4', 'PR7'], EMU2: ['RR1', 'RR5', 'RR7', 'RR9'], EMC1: ['PN1', 'PN2', 'PN3', 'PN4'], EMC2: ['PN5', 'PN6', 'PNB'], EMS1: ['H01', 'H02', 'H03', 'H04'], EMS2: ['H05', 'H06', 'H07', 'H11'] };
const NAMES = ['Hendra Simanjuntak', 'Slamet Wijaya', 'Markus Laia', 'Joko Nainggolan', 'Agus Kurniawan', 'Herman Siregar', 'Yohanes Saputra', 'Darius Tarigan', 'Fransiskus Ndruru', 'Wayan Pratama', 'Taufik Hidayat', 'Rudi Hasibuan', 'Andi Saputra', 'Imanuel Gultom', 'Paulus Lumban Gaol', 'Samsul Daeng'];
const CHECKERS = ['Imanuel Laia', 'Rudi Tarigan', 'Samsul Siregar', 'Yosua Halawa'];
const DRIVERS = ['Samsul', 'Yusuf Daeng', 'Rudi Hasibuan', 'Iwan Pratama', 'Joko', 'Herman', 'Taufik'];
const CONTRACTORS = ['CV Mahakam Jaya Angkut', 'UD Kutai Sejahtera', 'CV Borneo Logistik', 'CV Sebulu Transport', 'PT Tenggarong Armada'];
const ST = { panen_hi: ['Panen HI', 'info'], overnight: ['Restan', 'warn'], complete: ['Selesai', 'ok'], hilang: ['Hilang', 'bad'], cancel: ['Dibatalkan', 'mute'] };
const SJST = { complete: ['Diterima mill', 'ok'], surat_jalan: ['Di perjalanan', 'info'], cancel: ['Dibatalkan', 'mute'] };
const JOBS = { panen_buah: 'Panen buah', kutip_brondolan: 'Kutip brondolan' };
const UNITS = ['Manual', 'Manual', 'Manual', 'Mini traktor', 'ATV'];
const pad = (n) => String(n).padStart(2, '0');

const TASKS = (() => {
  const r = rng(7741), int = (a, b) => Math.floor(a + r() * (b - a + 1)), pick = (a) => a[Math.floor(r() * a.length)];
  const zk = Object.keys(ZONES), out = [];
  for (let i = 0; i < 132; i++) {
    const zone = pick(zk), gang = pick(ZONES[zone]), day = i < 58 ? 6 : i < 100 ? 5 : 4;
    const s = r(), status = day === 6 ? (s < .5 ? 'panen_hi' : s < .9 ? 'complete' : s < .95 ? 'overnight' : 'cancel') : (s < .78 ? 'complete' : s < .93 ? 'overnight' : s < .97 ? 'hilang' : 'cancel');
    const kutip = r() < .14, total = kutip ? int(3, 9) : int(52, 168), abw = 23.5 + r() * 3;
    const h = int(6, 10), m = int(0, 59), unit = kutip ? 'Manual' : pick(UNITS), nm = pick(NAMES);
    out.push({
      id: 48620 - i, seri: '1762' + int(100000, 999999), img: r() > .15,
      kerja: `${pad(day)}/11/2026 ${pad(h)}:${pad(m)}`, kirim: status === 'complete' ? `${pad(day)}/11/2026 ${pad(Math.min(h + int(2, 6), 18))}:${pad(int(0, 59))}` : '',
      sj: status === 'complete' ? 10988 - int(0, 47) : '', status, checker: pick(CHECKERS), pemanen: nm, pid: 'PMN-' + int(1000, 4999), gang, zone, block: pick('ABCDEFGH'.split('')) + pad(int(1, 32)),
      total, job: kutip ? 'kutip_brondolan' : 'panen_buah', kg: status === 'complete' ? Math.round(kutip ? total * 11.5 : total * abw) : null,
      unit, plat: unit === 'Manual' ? '' : 'KT ' + int(1000, 9999) + ' ' + pick(['AB', 'GH', 'MW', 'RU']), unitRemark: unit === 'Manual' ? '' : pick(['Normal', 'Ban bocor, diganti siang', 'Normal']),
      remark: r() < .12 ? pick(['Kartu basah, ditulis ulang mandor', 'Grading dicek ulang', 'Tandan di TPH 14 dipindah']) : '', wages: Math.round(total * (kutip ? 6500 : 2150) / 100) * 100,
      upd: `${pad(day)}/11/2026 ${pad(Math.min(h + int(1, 8), 20))}:${pad(int(0, 59))}`,
      grading: kutip ? null : (() => { const mentah = int(0, 3), mengkal = int(1, 9), tm = int(0, 6); return { mentah, mengkal, matang: total - mengkal - tm, tm }; })()
    });
  }
  return out;
})();
const SJS = (() => {
  const r = rng(3319), int = (a, b) => Math.floor(a + r() * (b - a + 1)), pick = (a) => a[Math.floor(r() * a.length)];
  const zk = Object.keys(ZONES), out = [];
  for (let i = 0; i < 48; i++) {
    const zone = pick(zk), day = i < 18 ? 6 : i < 36 ? 5 : 4, status = i < 4 ? 'surat_jalan' : r() < .04 ? 'cancel' : 'complete';
    const tandan = int(380, 780), sak = int(0, 14), abw = 23.4 + r() * 3.2, h = int(7, 15), m = int(0, 59);
    out.push({
      id: 10988 - i, foto: r() > .1, kirim: `${pad(day)}/11/2026 ${pad(h)}:${pad(m)}`, tsj: `${pad(day)}/11/2026 ${pad(Math.max(h - 1, 6))}:${pad(int(0, 59))}`, upd: `${pad(day)}/11/2026 ${pad(Math.min(h + 1, 20))}:${pad(int(0, 59))}`,
      tandan, sak, plate: 'KT ' + int(8000, 8999) + ' ' + pick(['AB', 'BK', 'CF', 'DL', 'GH', 'MW', 'RU', 'ZX']), driver: pick(DRIVERS), contractor: pick(CONTRACTORS), status,
      kg: status === 'complete' ? Math.round(tandan * abw + sak * 11) : null, wb: status === 'complete' ? `WB-0${int(1, 2)}-${2611}${pad(day)}${pad(int(1, 40))}` : '', cp: `CP-${zone.slice(0, 3)}-2611${pad(day)}-${String(int(1, 60)).padStart(4, '0')}`,
      by: status === 'complete' ? pick(['Lina Marbun', 'Dewi Kartika', 'Rahmat Hidayat']) : '', jaring: r() > .45, zone, gangs: [...new Set([pick(ZONES[zone]), pick(ZONES[zone])])], bcc: int(6, 13)
    });
  }
  return out;
})();
const chip = (k, map = ST) => `<span class="st-chip t-${map[k][1]}">${map[k][0]}</span>`;

/* ---------------- shared bits ---------------- */
function pageHead({ kicker, title, sub, right = '' }) {
  return `<section class="f-head"><div class="wrap f-head-in"><div class="frv" style="--i:0"><p class="m-kick">${kicker}</p><h1>${title}</h1><p class="m-sub">${sub}</p></div><div class="f-head-r frv" style="--i:1">${right}</div></div></section>`;
}
function menuBtn(id, label, icon, items) {
  return `<div class="dd" data-dd><button class="f-btn" id="${id}" aria-haspopup="true" aria-expanded="false">${ic(icon)}${label}${ic('down', 14)}</button><div class="dd-pop" role="menu">${items.map((it) => `<button role="menuitem" data-act="${it[0]}">${ic(it[2] || 'file', 16)}${it[1]}</button>`).join('')}</div></div>`;
}
function bindDropdowns(root) {
  $$('[data-dd]', root).forEach((dd) => {
    const b = $('button', dd), pop = $('.dd-pop', dd);
    b.onclick = (e) => { e.stopPropagation(); const open = !dd.classList.contains('open'); closeAllDD(); if (open) { dd.classList.add('open'); b.setAttribute('aria-expanded', 'true'); const f = $('button,input', pop); f && setTimeout(() => f.focus(), 20); } };
    dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAllDD(); b.focus(); } });
  });
}
function closeAllDD() { $$('[data-dd].open').forEach((d) => { d.classList.remove('open'); $('button', d).setAttribute('aria-expanded', 'false'); }); }
document.addEventListener('click', (e) => { if (!e.target.closest('.dd-pop')) closeAllDD(); });
function pager(page, pages, total, per, from) {
  const nums = []; for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
  return `<div class="f-pager"><span>${fmt(from + 1)}–${fmt(Math.min(from + per, total))} dari ${fmt(total)}</span>
    <label class="per">Baris <select data-per>${[10, 25, 50].map((n) => `<option ${n === per ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <div class="pp"><button data-p="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">${ic('back', 16)}</button>${nums.map((n) => n === '…' ? '<span class="gap">…</span>' : `<button data-p="${n}" class="${n === page ? 'on' : ''}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`).join('')}<button data-p="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="Berikutnya">${ic('chev', 16)}</button></div></div>`;
}
let sheetReturn = null;
function openSheet(html, label) {
  let s = $('#fSheet'); if (!s) { s = document.createElement('div'); s.id = 'fSheet'; s.className = 'f-sheet'; s.innerHTML = '<div class="fs-scrim" data-close></div><aside class="fs-panel" role="dialog" aria-modal="true"></aside>'; document.body.appendChild(s); s.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); }); }
  sheetReturn = document.activeElement; const p = $('.fs-panel', s); p.setAttribute('aria-label', label); p.innerHTML = html; s.hidden = false; void s.offsetWidth; s.classList.add('show'); setTimeout(() => { const c = $('[data-close].fs-x', s); c && c.focus(); }, 60);
}
function closeSheet() { const s = $('#fSheet'); if (!s) return; s.classList.remove('show'); setTimeout(() => { s.hidden = true; }, H.reduced() ? 0 : 320); sheetReturn && sheetReturn.focus && sheetReturn.focus({ preventScroll: true }); }
document.addEventListener('keydown', (e) => { const s = $('#fSheet'); if (e.key === 'Escape' && s && !s.hidden) closeSheet(); });
function confirmBox(title, body, okLabel) {
  return new Promise((res) => {
    let m = $('#fConfirm'); if (!m) { m = document.createElement('div'); m.id = 'fConfirm'; m.className = 'm-modal'; m.innerHTML = '<div class="m-dialog" role="dialog" aria-modal="true" aria-labelledby="fcT"></div>'; document.body.appendChild(m); }
    const back = document.activeElement;
    $('.m-dialog', m).innerHTML = `<h2 id="fcT">${title}</h2><p>${body}</p><div class="md-acts"><button class="m-btn" data-n>Batal</button><button class="m-btn pri" data-y>${ic('check')}${okLabel}</button></div>`;
    m.hidden = false; void m.offsetWidth; m.classList.add('show');
    const done = (v) => { m.classList.remove('show'); setTimeout(() => { m.hidden = true; }, H.reduced() ? 0 : 200); back && back.focus && back.focus({ preventScroll: true }); res(v); };
    $('[data-n]', m).onclick = () => done(false); $('[data-y]', m).onclick = () => done(true);
    m.onclick = (e) => { if (e.target === m) done(false); };
    m.onkeydown = (e) => { if (e.key === 'Escape') done(false); };
    setTimeout(() => $('[data-y]', m).focus(), 30);
  });
}

/* =====================================================================
   1. TUGAS PANEN (BCC) — /admin/task
   ===================================================================== */
const TCOLS = [
  ['id', 'Task ID', 1], ['seri', 'No Seri', 0], ['img', 'Foto', 0], ['kerja', 'Tanggal kerja', 1], ['kirim', 'Tanggal kirim', 0], ['sj', 'Surat Jalan', 1], ['status', 'Status', 1],
  ['checker', 'Line checker', 0], ['pemanen', 'Pemanen', 1], ['block', 'Zone / Blok', 1], ['total', 'FFB / Sak', 1], ['job', 'Job category', 1], ['kg', 'Total berat (kg)', 1],
  ['unit', 'Jenis unit', 0], ['plat', 'Plat unit', 0], ['unitRemark', 'Remark unit', 0], ['remark', 'Remark', 0], ['wages', 'Total upah', 1], ['upd', 'Last update', 0]
];
const T = { q: '', status: 'all', zone: [], gang: '', job: [], day: 'all', sort: ['id', -1], page: 1, per: 10, cols: new Set(TCOLS.filter((c) => c[2]).map((c) => c[0])), state: 'data' };
function tRows() {
  const q = T.q.toLowerCase();
  let r = TASKS.filter((t) => (T.status === 'all' || t.status === T.status) && (!T.zone.length || T.zone.includes(t.zone)) && (!T.gang || t.gang === T.gang) && (!T.job.length || T.job.includes(t.job)) && (T.day === 'all' || t.kerja.startsWith(T.day)) && (!q || `${t.id} ${t.seri} ${t.pemanen} ${t.pid} ${t.zone} ${t.block} ${t.gang} ${t.sj}`.toLowerCase().includes(q)));
  const [k, d] = T.sort; r = r.slice().sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * d);
  return r;
}
function cell(t, k) {
  switch (k) {
    case 'id': return `<a href="#tasks" class="t-id" data-open="${t.id}">#${t.id}</a>`;
    case 'seri': return `<span class="mono">${t.seri}</span>`;
    case 'img': return t.img ? `<span class="img-ok" title="Ada foto">${ic('img', 16)}</span>` : `<span class="img-no" title="Tanpa foto">${ic('noimg', 16)}</span>`;
    case 'kerja': case 'kirim': case 'upd': return t[k] ? `${t[k].slice(11)}<small>${t[k].slice(0, 10)}</small>` : '<span class="mute">—</span>';
    case 'sj': return t.sj ? `<a href="#surat-jalan" class="sj-link">SJ ${t.sj}</a>` : '<span class="mute">—</span>';
    case 'status': return chip(t.status);
    case 'pemanen': return `${esc(t.pemanen)}<small>${t.pid} · Gang ${t.gang}</small>`;
    case 'block': return `<b>${t.zone}</b> · ${t.block}`;
    case 'total': return `<b>${fmt(t.total)}</b> <small class="inl">${t.job === 'panen_buah' ? 'jjg' : 'sak'}</small>`;
    case 'job': return `<span class="job ${t.job === 'panen_buah' ? 'pan' : 'kut'}">${JOBS[t.job]}</span>`;
    case 'kg': return t.kg ? fmt(t.kg) : '<span class="mute">—</span>';
    case 'wages': return 'Rp ' + fmt(t.wages);
    default: return t[k] ? esc(t[k]) : '<span class="mute">—</span>';
  }
}
const NUMK = ['total', 'kg', 'wages'];
function mountTasks(root) {
  const counts = Object.fromEntries(Object.keys(ST).map((k) => [k, TASKS.filter((t) => t.status === k).length]));
  root.innerHTML = pageHead({ kicker: 'FFB Tracking · Langkah 1', title: 'Tugas Panen (BCC)', sub: 'Semua kartu BCC dari aplikasi checker: grading, status pengiriman, Surat Jalan, dan upah pemanen.', right: menuBtn('tExport', 'Ekspor', 'dl', [['xlsx', 'Excel (.xlsx)', 'file'], ['csv', 'CSV', 'file'], ['pdf', 'PDF', 'file'], ['print', 'Cetak', 'print']]) }) + `
  <div class="wrap f-body">
    <div class="st-tabs frv" style="--i:2" role="tablist" aria-label="Status">
      ${[['all', 'Semua', TASKS.length, '']].concat(Object.keys(ST).map((k) => [k, ST[k][0], counts[k], ST[k][1]])).map(([k, l, n, tone]) => `<button role="tab" aria-selected="${T.status === k}" data-st="${k}" class="${tone ? 'tone-' + tone : ''}"><span>${l}</span><b>${fmt(n)}</b></button>`).join('')}
      <span class="st-ink" aria-hidden="true"></span>
    </div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="tQ" type="search" placeholder="Cari Task ID, no seri, pemanen, blok, SJ…" value="${esc(T.q)}"></label>
        <div class="seg-s" role="group" aria-label="Tanggal kerja">${[['all', 'Semua'], ['06/11', 'Hari ini'], ['05/11', 'Kemarin'], ['04/11', '04 Nov']].map(([k, l]) => `<button data-day="${k}" aria-pressed="${T.day === k}">${l}</button>`).join('')}</div>
        <button class="f-btn" id="tFilterBtn" aria-expanded="false" aria-controls="tFilter">${ic('filter')}Filter<span class="badge" id="tFcount" hidden></span></button>
        <div class="dd" data-dd><button class="f-btn" aria-haspopup="true" aria-expanded="false">${ic('cols')}Kolom</button><div class="dd-pop cols-pop" id="tCols"><p>Tampilkan kolom</p>${TCOLS.map((c) => `<label><input type="checkbox" data-col="${c[0]}" ${T.cols.has(c[0]) ? 'checked' : ''} ${c[0] === 'id' ? 'disabled' : ''}>${c[1]}</label>`).join('')}</div></div>
      </div>
      <div class="f-filter" id="tFilter" hidden><div class="ff-in">
        <div class="ff-g"><span class="ff-l">Zone</span><div class="ff-chips">${Object.keys(ZONES).map((z) => `<button data-zone="${z}" aria-pressed="${T.zone.includes(z)}">${z}</button>`).join('')}</div></div>
        <div class="ff-g"><span class="ff-l">Job category</span><div class="ff-chips">${Object.entries(JOBS).map(([k, l]) => `<button data-job="${k}" aria-pressed="${T.job.includes(k)}">${l}</button>`).join('')}</div></div>
        <div class="ff-g"><label class="ff-l" for="tGang">Gang</label><select id="tGang"><option value="">Semua gang</option>${[...new Set(Object.values(ZONES).flat())].map((g) => `<option ${T.gang === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
        <div class="ff-g"><span class="ff-l">Tanggal kirim & last update</span><div class="ff-dates"><input type="date" value="2026-11-04" aria-label="Dari tanggal"><span>–</span><input type="date" value="2026-11-06" aria-label="Sampai tanggal"></div></div>
        <button class="m-btn" id="tReset">${ic('undo', 16)}Atur ulang</button>
      </div></div>
      <div class="f-active" id="tActive"></div>
      <div id="tTable"></div>
    </section>
    <p class="f-note frv" style="--i:4">Klik baris untuk melihat detail lengkap kartu BCC, grading, dan QR tugas. Status: Panen HI, Restan (overnight), Selesai, Hilang, Dibatalkan.</p>
  </div>`;
  bindDropdowns(root);
  $$('[data-act]', $('#tExport').parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(`Mengekspor ${fmt(tRows().length)} BCC ke ${b.textContent.trim()}…`); });
  $('#tQ').addEventListener('input', (e) => { T.q = e.target.value; T.page = 1; tRender(true); });
  $$('[data-st]', root).forEach((b) => b.onclick = () => { T.status = b.dataset.st; T.page = 1; $$('[data-st]', root).forEach((x) => x.setAttribute('aria-selected', x === b)); placeInk(); tRender(true); });
  $$('[data-day]', root).forEach((b) => b.onclick = () => { T.day = b.dataset.day; T.page = 1; $$('[data-day]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); tRender(true); });
  const fb = $('#tFilterBtn'), fp = $('#tFilter');
  fb.onclick = () => { const o = fp.hidden; if (o) { fp.hidden = false; void fp.offsetWidth; fp.classList.add('show'); } else { fp.classList.remove('show'); setTimeout(() => { fp.hidden = true; }, H.reduced() ? 0 : 260); } fb.setAttribute('aria-expanded', String(o)); };
  $$('[data-zone]', root).forEach((b) => b.onclick = () => { const z = b.dataset.zone; T.zone = T.zone.includes(z) ? T.zone.filter((x) => x !== z) : [...T.zone, z]; b.setAttribute('aria-pressed', T.zone.includes(z)); T.page = 1; tRender(true); });
  $$('[data-job]', root).forEach((b) => b.onclick = () => { const j = b.dataset.job; T.job = T.job.includes(j) ? T.job.filter((x) => x !== j) : [...T.job, j]; b.setAttribute('aria-pressed', T.job.includes(j)); T.page = 1; tRender(true); });
  $('#tGang').onchange = (e) => { T.gang = e.target.value; T.page = 1; tRender(true); };
  $('#tReset').onclick = () => { T.zone = []; T.job = []; T.gang = ''; $$('[data-zone],[data-job]', root).forEach((b) => b.setAttribute('aria-pressed', 'false')); $('#tGang').value = ''; T.page = 1; tRender(true); };
  $$('[data-col]', root).forEach((c) => c.onchange = () => { c.checked ? T.cols.add(c.dataset.col) : T.cols.delete(c.dataset.col); tRender(false); });
  window.addEventListener('resize', placeInk);
  tRender(false);
}
function placeInk() {
  const tabs = $('.st-tabs'); if (!tabs) return; const on = $('[aria-selected=true]', tabs), ink = $('.st-ink', tabs); if (!on || !ink) return;
  ink.style.width = on.offsetWidth + 'px'; ink.style.transform = `translate3d(${on.offsetLeft}px,0,0)`;
}
let tTimer;
function tRender(withLoad) {
  const act = [...T.zone.map((z) => ['zone', z, 'Zone ' + z]), ...T.job.map((j) => ['job', j, JOBS[j]]), ...(T.gang ? [['gang', T.gang, 'Gang ' + T.gang]] : [])];
  $('#tActive').innerHTML = act.length ? act.map((a) => `<button data-rm="${a[0]}:${a[1]}">${a[2]}${ic('x', 14)}</button>`).join('') + '<button class="clear" data-rm="all">Hapus semua</button>' : '';
  $('#tFcount').hidden = !act.length; $('#tFcount').textContent = act.length;
  $$('[data-rm]').forEach((b) => b.onclick = () => { const [k, v] = b.dataset.rm.split(':'); if (k === 'all') { T.zone = []; T.job = []; T.gang = ''; } else if (k === 'zone') T.zone = T.zone.filter((x) => x !== v); else if (k === 'job') T.job = T.job.filter((x) => x !== v); else T.gang = ''; $$('[data-zone]').forEach((x) => x.setAttribute('aria-pressed', T.zone.includes(x.dataset.zone))); $$('[data-job]').forEach((x) => x.setAttribute('aria-pressed', T.job.includes(x.dataset.job))); $('#tGang').value = T.gang; T.page = 1; tRender(true); });
  const el = $('#tTable'); clearTimeout(tTimer);
  if (withLoad && !H.reduced()) { el.classList.add('loading'); tTimer = setTimeout(() => { el.classList.remove('loading'); tTable(); }, 260); }
  else tTable();
}
function tTable() {
  const el = $('#tTable'), rows = tRows(), cols = TCOLS.filter((c) => T.cols.has(c[0]));
  if (!rows.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada BCC yang cocok</h3><p>Ubah kata kunci, status, atau filter. Data yang sudah dihapus tidak tampil di daftar ini.</p><button class="m-btn" id="tClr">Hapus semua filter</button></div>`; $('#tClr').onclick = () => { T.q = ''; $('#tQ').value = ''; T.status = 'all'; T.zone = []; T.job = []; T.gang = ''; T.day = 'all'; mountTasks($('#ffb')); }; return; }
  const pages = Math.ceil(rows.length / T.per); T.page = Math.min(T.page, pages); const from = (T.page - 1) * T.per, vis = rows.slice(from, from + T.per);
  const sortable = ['id', 'kerja', 'total', 'kg', 'wages', 'upd'];
  el.innerHTML = `<div class="f-tw" tabindex="0" aria-label="Tabel tugas panen"><table class="f-table">
    <thead><tr>${cols.map((c) => { const s = sortable.includes(c[0]), on = T.sort[0] === c[0]; return `<th class="${NUMK.includes(c[0]) ? 'n' : ''} ${c[0] === 'id' ? 'stick' : ''}" ${on ? `aria-sort="${T.sort[1] > 0 ? 'ascending' : 'descending'}"` : ''}>${s ? `<button data-sort="${c[0]}">${c[1]}<i class="so ${on ? (T.sort[1] > 0 ? 'up' : 'dn') : ''}"></i></button>` : c[1]}</th>`; }).join('')}<th class="act"><span class="sr">Aksi</span></th></tr></thead>
    <tbody>${vis.map((t, i) => `<tr data-row="${t.id}" style="--r:${i}">${cols.map((c) => `<td class="${NUMK.includes(c[0]) ? 'n' : ''} ${c[0] === 'id' ? 'stick' : ''}">${cell(t, c[0])}</td>`).join('')}<td class="act"><button class="row-qr" data-qr="${t.id}" aria-label="QR tugas #${t.id}">${ic('qr', 16)}</button></td></tr>`).join('')}</tbody>
  </table></div>${pager(T.page, pages, rows.length, T.per, from)}`;
  $$('[data-sort]', el).forEach((b) => b.onclick = () => { const k = b.dataset.sort; T.sort = [k, T.sort[0] === k ? -T.sort[1] : -1]; tTable(); });
  $$('[data-p]', el).forEach((b) => b.onclick = () => { T.page = +b.dataset.p; tTable(); $('#tTable').scrollIntoView({ block: 'nearest', behavior: H.reduced() ? 'auto' : 'smooth' }); });
  $('[data-per]', el).onchange = (e) => { T.per = +e.target.value; T.page = 1; tTable(); };
  $$('tbody tr', el).forEach((tr) => tr.addEventListener('click', (e) => { if (e.target.closest('a.sj-link')) return; e.preventDefault(); if (e.target.closest('[data-qr]')) { taskQR(+tr.dataset.row); return; } taskSheet(+tr.dataset.row); }));
  placeInk();
}
function taskSheet(id) {
  const t = TASKS.find((x) => x.id === id), g = t.grading;
  const order = ['panen_hi', 'complete'], flow = [['Dipanen', t.kerja, true], ['Surat Jalan', t.sj ? 'SJ ' + t.sj : 'belum', !!t.sj], ['Diterima mill', t.kirim || 'belum', t.status === 'complete']];
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Tugas panen</p><h2>#${t.id}</h2><p class="mute">${t.zone} · Blok ${t.block} · Gang ${t.gang}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
    <div class="fs-b">
      <div class="fs-top">${chip(t.status)}<span class="job ${t.job === 'panen_buah' ? 'pan' : 'kut'}">${JOBS[t.job]}</span>${t.remark ? `<span class="fs-remark">${ic('alert', 14)}${esc(t.remark)}</span>` : ''}</div>
      <div class="fs-figs"><div><span>${t.job === 'panen_buah' ? 'Janjang (FFB)' : 'Sak'}</span><b>${fmt(t.total)}</b></div><div><span>Total berat</span><b>${t.kg ? fmt(t.kg) + ' kg' : '—'}</b></div><div><span>Total upah</span><b>Rp ${fmt(t.wages)}</b></div></div>
      <ol class="fs-flow">${flow.map((f) => `<li class="${f[2] ? 'done' : ''}"><i></i><b>${f[0]}</b><small>${f[1]}</small></li>`).join('')}</ol>
      ${g ? `<h3>Grading</h3><div class="fs-grade">${[['Mentah', g.mentah, 'var(--age3)'], ['Mengkal', g.mengkal, 'var(--age1)'], ['Matang', g.matang, 'var(--leaf)'], ['T.Matang', g.tm, 'var(--age2)']].map((x) => `<div><span>${x[0]}</span><b>${x[1]}</b><i style="--w:${(x[1] / (g.mentah + t.total)).toFixed(3)};background:${x[2]}"></i></div>`).join('')}</div>` : ''}
      <h3>Data kartu</h3>
      <dl class="fs-dl">${[['No seri', `<span class="mono">${t.seri}</span>`], ['Pemanen', `${esc(t.pemanen)} (${t.pid})`], ['Line checker', t.checker], ['Tanggal kerja', t.kerja], ['Tanggal kirim', t.kirim || '—'], ['Surat Jalan', t.sj ? 'SJ ' + t.sj : '—'], ['Jenis unit', t.unit], ['Plat unit', t.plat || '—'], ['Remark unit', t.unitRemark || '—'], ['Last update', t.upd]].map((d) => `<div><dt>${d[0]}</dt><dd>${d[1]}</dd></div>`).join('')}</dl>
      <h3>Foto TPH</h3><div class="fs-photo ${t.img ? '' : 'none'}">${t.img ? `${ic('img', 26)}<span>Foto dari aplikasi checker · ${t.kerja.slice(11)}</span>` : `${ic('noimg', 26)}<span>Tidak ada foto untuk kartu ini</span>`}</div>
    </div>
    <div class="fs-f"><button class="m-btn" data-qrs="${t.id}">${ic('qr')}QR tugas</button><button class="m-btn pri" data-close>Tutup</button></div>`, `Detail tugas #${t.id}`);
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.fs-grade i').forEach((i) => i.classList.add('go'))));
  $('[data-qrs]').onclick = () => taskQR(id);
}
function taskQR(id) {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => { const x = i % 21, y = Math.floor(i / 21); const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); if (finder) { const fx = x > 13 ? x - 14 : x, fy = y > 13 ? y - 14 : y; return (fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5)); } return ((x * 7 + y * 13 + id) % 5) < 2; });
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">QR tugas</p><h2>#${id}</h2><p class="mute">Dibuat dari tombol QR di daftar tugas (task_created_qr).</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b center"><div class="qr-box" role="img" aria-label="Kode QR tugas ${id}">${cells.map((c) => `<i class="${c ? 'on' : ''}"></i>`).join('')}</div><p class="mute">Pratinjau ilustrasi. QR asli dibuat oleh server.</p></div>
  <div class="fs-f"><button class="m-btn" data-close>Tutup</button><button class="m-btn pri" id="qrPrint">${ic('print')}Cetak</button></div>`, `QR tugas ${id}`);
  $('#qrPrint').onclick = () => H.toast(`Mencetak QR tugas #${id}…`);
}

/* =====================================================================
   2. SURAT JALAN — /admin/surat-jalan
   ===================================================================== */
const SJ = { q: '', zone: [], st: 'all', day: 'all', page: 1, per: 10, open: new Set() };
function sjRows() { const q = SJ.q.toLowerCase(); return SJS.filter((s) => (SJ.st === 'all' || s.status === SJ.st) && (!SJ.zone.length || SJ.zone.includes(s.zone)) && (SJ.day === 'all' || s.kirim.startsWith(SJ.day)) && (!q || `${s.id} ${s.plate} ${s.driver} ${s.contractor} ${s.wb} ${s.cp} ${s.gangs.join(' ')}`.toLowerCase().includes(q))); }
function mountSJ(root) {
  const today = SJS.filter((s) => s.kirim.startsWith('06/11')), done = today.filter((s) => s.kg), ton = done.reduce((a, s) => a + s.kg, 0), tdn = done.reduce((a, s) => a + s.tandan, 0);
  root.innerHTML = pageHead({ kicker: 'FFB Tracking · Langkah 2', title: 'Surat Jalan', sub: 'Pengiriman TBS dari checkpoint ke pabrik. Klik baris untuk melihat BCC di dalamnya, lalu ekspor surat atau tiket mill.', right: `<button class="f-btn on-g" id="sjRecalc">${ic('refresh')}Recalculate SJ</button>` }) + `
  <div class="wrap f-body">
    <div class="sj-kpi frv" style="--i:2">
      <div><span>Surat Jalan hari ini</span><b>${today.length}</b><small>${today.filter((s) => s.status === 'surat_jalan').length} masih di perjalanan</small></div>
      <div><span>Tonase diterima</span><b>${fmt(ton / 1000, 1)}<em>t</em></b><small>dari ${done.length} SJ yang sudah ditimbang</small></div>
      <div><span>Tandan · sak</span><b>${fmt(tdn)}</b><small>${fmt(done.reduce((a, s) => a + s.sak, 0))} sak brondolan</small></div>
      <div><span>ABW rata-rata</span><b>${fmt(ton / tdn, 2)}<em>kg</em></b><small>berat ÷ tandan, hari ini</small></div>
    </div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="sjQ" type="search" placeholder="Cari SJ ID, plat, supir, kontraktor, tiket…" value="${esc(SJ.q)}"></label>
        <div class="seg-s" role="group" aria-label="Status">${[['all', 'Semua'], ['surat_jalan', 'Di perjalanan'], ['complete', 'Diterima mill'], ['cancel', 'Dibatalkan']].map(([k, l]) => `<button data-sst="${k}" aria-pressed="${SJ.st === k}">${l}</button>`).join('')}</div>
        <div class="seg-s" role="group" aria-label="Tanggal kirim">${[['all', 'Semua'], ['06/11', 'Hari ini'], ['05/11', 'Kemarin']].map(([k, l]) => `<button data-sday="${k}" aria-pressed="${SJ.day === k}">${l}</button>`).join('')}</div>
      </div>
      <div class="f-zone"><span>Zone</span>${Object.keys(ZONES).map((z) => `<button data-sz="${z}" aria-pressed="${SJ.zone.includes(z)}">${z}</button>`).join('')}</div>
      <div class="sj-head" aria-hidden="true"><span>Surat Jalan</span><span>Truk</span><span class="n">Tandan · Sak</span><span class="n">Tonase</span><span>Tiket</span><span>Status</span><span></span></div>
      <div id="sjList"></div>
    </section>
  </div>`;
  $('#sjQ').addEventListener('input', (e) => { SJ.q = e.target.value; SJ.page = 1; sjList(); });
  $$('[data-sst]', root).forEach((b) => b.onclick = () => { SJ.st = b.dataset.sst; SJ.page = 1; $$('[data-sst]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); sjList(); });
  $$('[data-sday]', root).forEach((b) => b.onclick = () => { SJ.day = b.dataset.sday; SJ.page = 1; $$('[data-sday]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); sjList(); });
  $$('[data-sz]', root).forEach((b) => b.onclick = () => { const z = b.dataset.sz; SJ.zone = SJ.zone.includes(z) ? SJ.zone.filter((x) => x !== z) : [...SJ.zone, z]; b.setAttribute('aria-pressed', SJ.zone.includes(z)); SJ.page = 1; sjList(); });
  $('#sjRecalc').onclick = async () => { if (!(await confirmBox('Hitung ulang Surat Jalan?', 'ABW, berat per BCC, dan upah akan dihitung ulang untuk Surat Jalan pada filter saat ini.', 'Hitung ulang'))) return; const b = $('#sjRecalc'); b.classList.add('busy'); b.disabled = true; await wait(1100); b.classList.remove('busy'); b.disabled = false; H.toast(`${fmt(sjRows().length)} Surat Jalan dihitung ulang`); };
  sjList();
}
function sjList() {
  const el = $('#sjList'), rows = sjRows();
  if (!rows.length) { el.innerHTML = `<div class="f-empty">${ic('truck', 28)}<h3>Tidak ada Surat Jalan</h3><p>Coba ubah status, tanggal, atau zone.</p></div>`; return; }
  const pages = Math.ceil(rows.length / SJ.per); SJ.page = Math.min(SJ.page, pages); const from = (SJ.page - 1) * SJ.per, vis = rows.slice(from, from + SJ.per);
  el.innerHTML = `<ul class="sj-list">${vis.map((s, i) => `<li class="sj-row ${SJ.open.has(s.id) ? 'open' : ''}" style="--r:${i}" data-sj="${s.id}">
    <div class="sj-main">
      <button class="sj-cell sj-id" aria-expanded="${SJ.open.has(s.id)}" aria-controls="sjd-${s.id}"><span class="caret">${ic('chev', 16)}</span><span><b>SJ ${s.id}</b><small>${s.kirim}</small></span></button>
      <div class="sj-cell"><span class="plate-s">${s.plate}</span><small>${s.driver} · ${s.contractor}</small></div>
      <div class="sj-cell n"><b>${fmt(s.tandan)}</b><small>${s.sak} sak</small></div>
      <div class="sj-cell n"><b>${s.kg ? fmt(s.kg) + ' kg' : '—'}</b><small>${s.kg ? 'ABW ' + fmt(s.kg / s.tandan, 2) : 'belum ditimbang'}</small></div>
      <div class="sj-cell"><span class="mono">${s.wb || '—'}</span><small class="mono">${s.cp}</small></div>
      <div class="sj-cell">${chip(s.status, SJST)}${s.jaring ? `<small class="jar-s">${ic('net', 12)}Jaring</small>` : ''}</div>
      <div class="sj-cell act">${menuBtnRow(s)}</div>
    </div>
    <div class="sj-det" id="sjd-${s.id}" role="region" aria-label="Detail SJ ${s.id}"><div class="sj-det-in">${SJ.open.has(s.id) ? sjDetail(s) : ''}</div></div>
  </li>`).join('')}</ul>${pager(SJ.page, pages, rows.length, SJ.per, from)}`;
  bindDropdowns(el);
  $$('[data-act]', el).forEach((b) => b.onclick = (e) => { e.stopPropagation(); closeAllDD(); const id = b.closest('[data-sj]').dataset.sj; const m = { pdf: `Mengunduh Surat Jalan SJ ${id} (PDF)…`, ok: `Mengekspor tiket mill berhasil SJ ${id}…`, fail: `Mengekspor tiket mill gagal SJ ${id}…` }; H.toast(m[b.dataset.act]); });
  $$('.sj-id', el).forEach((b) => b.onclick = () => { const li = b.closest('.sj-row'), id = +li.dataset.sj, open = !SJ.open.has(id); open ? SJ.open.add(id) : SJ.open.delete(id); b.setAttribute('aria-expanded', open); if (open) $('.sj-det-in', li).innerHTML = sjDetail(SJS.find((x) => x.id === id)); li.classList.toggle('open', open); });
  $$('[data-p]', el).forEach((b) => b.onclick = () => { SJ.page = +b.dataset.p; sjList(); });
  $('[data-per]', el).onchange = (e) => { SJ.per = +e.target.value; SJ.page = 1; sjList(); };
}
function menuBtnRow(s) { return `<div class="dd right" data-dd><button class="row-more" aria-haspopup="true" aria-expanded="false" aria-label="Aksi SJ ${s.id}">${ic('more', 18)}</button><div class="dd-pop" role="menu"><button role="menuitem" data-act="pdf">${ic('file', 16)}Ekspor Surat Jalan (PDF)</button><button role="menuitem" data-act="ok" ${s.status !== 'complete' ? 'disabled' : ''}>${ic('check', 16)}Tiket mill · berhasil</button><button role="menuitem" data-act="fail">${ic('alert', 16)}Tiket mill · gagal</button></div></div>`; }
function sjDetail(s) {
  const r = rng(s.id), int = (a, b) => Math.floor(a + r() * (b - a + 1));
  const bcc = Array.from({ length: s.bcc }, (_, i) => ({ id: 48000 + int(1, 600), blk: `${s.zone} · ${'ABCDEFGH'[int(0, 7)]}${pad(int(1, 32))}`, pem: NAMES[int(0, NAMES.length - 1)], gang: s.gangs[i % s.gangs.length], n: int(40, 120) }));
  return `<div class="sjd-grid">
    <div class="sjd-bcc"><h4>BCC dalam Surat Jalan ini <span class="pill">${bcc.length}</span></h4><table class="mini"><thead><tr><th>Task ID</th><th>Zone · Blok</th><th>Pemanen</th><th>Gang</th><th class="n">Jjg</th></tr></thead><tbody>${bcc.map((b) => `<tr><td class="mono">#${b.id}</td><td>${b.blk}</td><td>${b.pem}</td><td>${b.gang}</td><td class="n">${b.n}</td></tr>`).join('')}</tbody></table></div>
    <div class="sjd-side">
      <div class="sjd-photo ${s.foto ? '' : 'none'}">${s.foto ? `${ic('img', 22)}<span>Foto muatan truk</span>` : `${ic('noimg', 22)}<span>Tanpa foto</span>`}</div>
      <dl>${[['Tanggal SJ', s.tsj], ['Tanggal kirim', s.kirim], ['Last update', s.upd], ['Discan oleh', s.by || '—'], ['Gang', s.gangs.join(', ')], ['Jaring', s.jaring ? 'Ya' : 'Tidak']].map((d) => `<div><dt>${d[0]}</dt><dd>${d[1]}</dd></div>`).join('')}</dl>
      <div class="sjd-acts"><button class="m-btn" onclick="this.closest('.sj-row').querySelector('[data-act=pdf]').click()">${ic('file', 16)}Surat Jalan PDF</button>${s.status === 'complete' ? `<button class="m-btn pri" onclick="this.closest('.sj-row').querySelector('[data-act=ok]').click()">${ic('print', 16)}Tiket mill</button>` : ''}</div>
    </div></div>`;
}

/* =====================================================================
   3. SCAN LAPORAN BCC — /admin/scan-lhm (tickets saved with status "overnight" = Restan)
   ===================================================================== */
let B, bCount = 0;
const BLOG = [{ t: '10:44', n: 12, ffb: 1104, z: 'EMU1' }, { t: '09:58', n: 9, ffb: 812, z: 'EMC2' }, { t: '08:31', n: 14, ffb: 1290, z: 'EMS1' }];
const bReset = () => { B = { phase: 'idle', data: null, err: null, qr: '' }; };
bReset();
function bBuild(i) {
  const r = rng(901 + i * 37), int = (a, b) => Math.floor(a + r() * (b - a + 1)), zk = Object.keys(ZONES), zone = zk[i % zk.length];
  const rows = Array.from({ length: 8 + (i % 3) * 2 }, (_, k) => { const kutip = k % 6 === 5; const mentah = kutip ? 0 : int(0, 3), mengkal = kutip ? 0 : int(1, 8), matang = kutip ? 0 : int(40, 95), tm = kutip ? 0 : int(0, 5); const unit = k % 4 === 3 ? 'ATV' : '-';
    return { tgl: `0${int(4, 5)}/11/2026 ${pad(int(6, 10))}:${pad(int(0, 59))}`, pem: `[PMN-${int(1000, 4999)}] ${NAMES[(k + i) % NAMES.length]}`, zone: zone.slice(0, 3), field: zone, block: 'ABCDEFGH'[int(0, 7)] + pad(int(1, 32)), mentah, mengkal, matang, tm, partheno: kutip ? 0 : int(0, 2), unit, unitRemark: unit === '-' ? '-' : 'Normal', ffb: kutip ? 0 : mengkal + matang + tm, sak: kutip ? int(3, 8) : 0 }; });
  return { zone, rows, ffb: rows.reduce((a, x) => a + x.ffb, 0), sak: rows.reduce((a, x) => a + x.sak, 0), mandor: ['Yohanes Ndruru', 'Markus Laia', 'Agus Setiawan'][i % 3] };
}
function mountScan(root) {
  bReset();
  root.innerHTML = pageHead({ kicker: 'FFB Tracking · Restan', title: 'Scan Laporan BCC', sub: 'Scan QR laporan tiket kerja BCC dari mandor. Tiket yang dibaca disimpan sebagai Restan (belum terangkut) dan masuk ke perhitungan restan.', right: `<div class="m-today"><div><span>Discan hari ini</span><b id="bToday">${BLOG.length}</b><small>laporan</small></div><div><span>Tiket ditambahkan</span><b id="bTix">${BLOG.reduce((a, l) => a + l.n, 0)}</b><small>BCC</small></div></div>` }) + `
  <div class="wrap m-body">
    <ol class="m-steps frv" style="--i:2" id="bSteps" aria-label="Langkah">
      <li data-s="1"><span class="n">1</span><span class="t"><b>Scan QR laporan</b><small>QR dari laporan tiket kerja BCC</small></span></li>
      <li data-s="2"><span class="n">2</span><span class="t"><b>Periksa tiket</b><small>Pemanen, blok, grading</small></span></li>
      <li data-s="3"><span class="n">3</span><span class="t"><b>Kirim sebagai restan</b><small>Status tiket: Restan</small></span></li>
    </ol>
    <div class="b-grid">
      <section class="m-scan frv ga-scan" style="--i:3" id="bScan"></section>
      <section class="m-weigh frv ga-side" style="--i:4" id="bSum"></section>
      <section class="ga-load" id="bLoad"></section>
      <section class="m-log frv ga-log" style="--i:5"><h2>Laporan terakhir</h2><ul id="bLog"></ul></section>
    </div>
    <section class="m-tasks" id="bTable"></section>
  </div>`;
  bAll();
}
function bAll() { bSteps(); bScan(); bSum(); bLoad(); bTable(); bLog(); }
function bSteps() { const at = { idle: 1, scanning: 1, error: 1, loaded: 2, submitting: 3, done: 3 }[B.phase]; $$('#bSteps li').forEach((li) => { const n = +li.dataset.s; li.classList.toggle('on', n === at); li.classList.toggle('done', n < at || B.phase === 'done'); }); }
function bScan() {
  const c = $('#bScan'), busy = B.phase === 'scanning', locked = ['loaded', 'submitting'].includes(B.phase);
  c.className = `m-scan frv ga-scan ${B.phase}`;
  c.innerHTML = `<div class="sc-top"><div class="sc-ico ${busy ? 'busy' : ''}">${ic('scan', 26)}</div><div><h2>${locked ? 'Laporan terbaca' : B.phase === 'done' ? 'Siap untuk laporan berikutnya' : 'Scan QR laporan BCC'}</h2><p>${locked ? 'Periksa tiket di bawah sebelum dikirim sebagai restan.' : 'Arahkan scanner ke QR pada laporan tiket kerja BCC. Data dibaca otomatis saat scanner mengirim Enter.'}</p></div></div>
    <div class="sc-field"><label for="bQr" class="sr">Kode QR laporan BCC</label><input id="bQr" autocomplete="off" spellcheck="false" placeholder="${locked ? '' : 'Menunggu scan…'}" value="${B.qr}" ${locked || busy ? 'readonly' : ''}>
      <span class="sc-state">${busy ? '<i class="spin"></i>Membaca…' : locked ? `${ic('check', 16)}Valid · ${B.data.rows.length} tiket` : '<i class="beam"></i>Siap'}</span></div>
    <p class="sc-msg" role="alert">${B.err ? `${ic('alert', 16)}<span><b>Pemindaian gagal.</b> ${B.err}</span>` : ''}</p>
    ${locked ? `<div class="qr-sum"><div><span>Field</span><b>${B.data.zone}</b></div><div><span>Mandor</span><b>${B.data.mandor}</b></div><div><span>Tiket</span><b>${B.data.rows.length}</b></div><div><span>Dibaca</span><b>11:5${bCount}</b></div></div><p class="qr-next">${ic('chev', 16)}Lanjut: periksa total di kanan, lalu kirim sebagai restan.</p>` : busy ? '' : `<ul class="sc-tips"><li><b>1</b><span>Kursor otomatis berada di kolom scan.</span></li><li><b>2</b><span>Satu QR berisi beberapa tiket BCC dari laporan mandor.</span></li><li><b>3</b><span>Tiket yang dikirim tersimpan dengan status Restan.</span></li></ul>`}
    <div class="sc-demo">${locked ? `<button class="m-btn" id="bRescan">${ic('undo', 16)}Batal & scan ulang</button>` : `<span>Simulasi:</span><button class="chipbtn" data-bd="ok">Scan valid</button><button class="chipbtn" data-bd="bad">QR tidak sah</button><button class="chipbtn" data-bd="dup">Tiket sudah di-scan</button>`}</div>`;
  const q = $('#bQr'); q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); bDoScan(q.value.trim()); } });
  $$('[data-bd]', c).forEach((b) => b.onclick = () => bDemo(b.dataset.bd));
  const rs = $('#bRescan'); if (rs) rs.onclick = () => { bReset(); bAll(); bFocus(); };
}
function bSum() {
  const c = $('#bSum'), d = B.data, on = ['loaded', 'submitting'].includes(B.phase);
  c.className = `m-weigh frv ga-side ${on || B.phase === 'done' ? '' : 'off'} ${B.phase === 'done' ? 'done' : ''}`;
  if (B.phase === 'done') { c.innerHTML = `<div class="ok-mark">${ic('check', 30)}</div><h2>Berhasil</h2><p>${B.saved.n} tiket BCC ditambahkan dengan status <b>Restan</b>.</p><dl class="done-sum"><div><dt>Field</dt><dd>${B.saved.z}</dd></div><div><dt>Total FFB</dt><dd>${fmt(B.saved.ffb)}</dd></div><div><dt>Total sak</dt><dd>${B.saved.sak}</dd></div><div><dt>Waktu</dt><dd>${B.saved.t}</dd></div></dl><div class="w-acts"><a class="m-btn" href="#tasks">${ic('file')}Lihat di Tugas Panen</a><button class="m-btn pri" id="bNext">${ic('scan')}Scan berikutnya</button></div>`; $('#bNext').onclick = () => { bReset(); bAll(); bFocus(); }; return; }
  const ffb = d ? d.ffb : 0, sak = d ? d.sak : 0, n = d ? d.rows.length : 0;
  c.innerHTML = `<h2>${ic('file', 20)}Ringkasan laporan</h2>
    <div class="b-figs"><div><span>Tiket BCC</span><b>${n || '—'}</b></div><div><span>Total FFB</span><b>${ffb ? fmt(ffb) : '—'}</b></div><div><span>Total sak</span><b>${d ? sak : '—'}</b></div><div><span>Status disimpan</span><b class="st-r">Restan</b></div></div>
    <p class="b-info">${ic('clock', 16)}<span>Tiket akan dihitung sebagai restan sampai terangkut dengan Surat Jalan dan diterima mill.</span></p>
    <button class="m-btn pri big" id="bSubmit" ${on ? '' : 'disabled'}><span class="lbl">${B.phase === 'submitting' ? 'Mengirim…' : 'Kirim sebagai restan'}</span>${B.phase === 'submitting' ? '<i class="spin w"></i>' : ''}</button>
    <p class="w-note">${on ? 'Anda akan diminta konfirmasi sebelum dikirim.' : 'Aktif setelah QR laporan dipindai.'}</p>`;
  if (on) $('#bSubmit').onclick = bSubmit;
}
function bLoad() {
  const c = $('#bLoad'), d = B.data;
  if (!d || B.phase === 'done') { c.innerHTML = `<div class="m-empty"><div class="pl-ghost" aria-hidden="true">BCC</div><p>${B.phase === 'done' ? 'Laporan sudah dikirim. Rincian per blok laporan berikutnya akan muncul di sini.' : 'Rincian per blok dan grading akan muncul di sini setelah QR laporan dipindai.'}</p></div>`; return; }
  const by = {}; d.rows.forEach((r) => { by[r.block] = (by[r.block] || 0) + r.ffb; });
  const max = Math.max(...Object.values(by)), tot = d.rows.reduce((a, r) => ({ mentah: a.mentah + r.mentah, mengkal: a.mengkal + r.mengkal, matang: a.matang + r.matang, tm: a.tm + r.tm, partheno: a.partheno + r.partheno }), { mentah: 0, mengkal: 0, matang: 0, tm: 0, partheno: 0 });
  const gsum = tot.mentah + tot.mengkal + tot.matang + tot.tm + tot.partheno || 1;
  c.innerHTML = `<div class="b-break"><div><h3>FFB per blok</h3><div class="b-bars">${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([b, v]) => `<div class="bb"><span>${d.zone} · ${b}</span><span class="bar"><i style="--w:${(v / max).toFixed(3)}"></i></span><b>${fmt(v)}</b></div>`).join('')}</div></div>
    <div><h3>Grading gabungan</h3><div class="b-stack" role="img" aria-label="Komposisi grading">${[['matang', 'var(--leaf)'], ['mengkal', 'var(--age1)'], ['tm', 'var(--age2)'], ['mentah', 'var(--age3)'], ['partheno', '#7B6BB0']].map(([k, col]) => `<i style="width:${tot[k] / gsum * 100}%;background:${col}"></i>`).join('')}</div>
    <ul class="b-leg">${[['Matang', 'matang', 'var(--leaf)'], ['Mengkal', 'mengkal', 'var(--age1)'], ['T.Matang', 'tm', 'var(--age2)'], ['Mentah', 'mentah', 'var(--age3)'], ['Partheno', 'partheno', '#7B6BB0']].map(([l, k, col]) => `<li><i style="background:${col}"></i>${l}<b>${fmt(tot[k])}</b></li>`).join('')}</ul></div></div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.b-bars .bar i, .b-stack', c).forEach((i) => i.classList.add('go'))));
}
function bTable() {
  const c = $('#bTable'), d = B.data;
  if (!d || B.phase === 'done') { c.innerHTML = ''; c.classList.remove('show'); return; }
  c.innerHTML = `<div class="tk-h"><h2>Tiket dalam laporan</h2><span class="pill">${d.rows.length} tiket</span></div><div class="tk-wrap" tabindex="0" aria-label="Tabel tiket BCC"><table class="tk"><thead><tr><th>No</th><th>Tanggal</th><th>Pemanen</th><th>Zone</th><th>Field</th><th>Block</th><th class="n">Mentah</th><th class="n">Mengkal</th><th class="n">Matang</th><th class="n">T.Matang</th><th class="n">Partheno</th><th>Unit (mesin)</th><th>Unit remark</th><th class="n">Total FFB</th><th class="n">Total sak</th></tr></thead>
    <tbody>${d.rows.map((r, i) => `<tr style="--r:${i}"><td class="n mute">${i + 1}</td><td>${r.tgl.slice(11)}<small>${r.tgl.slice(0, 10)}</small></td><td>${r.pem.replace(/^\[[^\]]+\]\s*/, '')}<small>${r.pem.match(/^\[([^\]]+)\]/)[1]}</small></td><td>${r.zone}</td><td>${r.field}</td><td><b>${r.block}</b></td><td class="n ${r.mentah ? 'warnc' : 'mute'}">${r.mentah}</td><td class="n">${r.mengkal}</td><td class="n">${r.matang}</td><td class="n">${r.tm}</td><td class="n">${r.partheno}</td><td class="mute">${r.unit}</td><td class="mute">${r.unitRemark}</td><td class="n"><b>${r.ffb}</b></td><td class="n"><b>${r.sak}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="13">Total</td><td class="n">${fmt(d.ffb)}</td><td class="n">${d.sak}</td></tr></tfoot></table></div>`;
  c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
}
function bLog() { $('#bLog').innerHTML = BLOG.slice(0, 4).map((l, i) => `<li class="${i === 0 && l.fresh ? 'fresh' : ''}"><div><b>${l.z} · ${l.n} tiket</b><span>${fmt(l.ffb)} FFB · Restan</span></div><div class="r"><b>${l.t}</b><span>discan</span></div><a class="lg-p" href="#tasks" aria-label="Lihat di Tugas Panen">${ic('chev', 16)}</a></li>`).join(''); }
function bFocus() { setTimeout(() => { const q = $('#bQr'); if (q && !q.readOnly) q.focus({ preventScroll: true }); }, H.reduced() ? 0 : 80); }
function bDemo(k) {
  const code = k === 'bad' ? 'zz-' + Math.random().toString(16).slice(2, 9) : k === 'dup' ? 'DUP-1f8b08' : '1f8b0800' + (5521 + bCount * 911).toString(16) + 'c0ffee' + 'ab'.repeat(16);
  const q = $('#bQr'); if (H.reduced()) { q.value = code; bDoScan(code); return; }
  let i = 0; q.value = ''; q.focus(); const tick = () => { i += 6; q.value = code.slice(0, i); if (i < code.length) requestAnimationFrame(tick); else setTimeout(() => bDoScan(code), 120); }; requestAnimationFrame(tick);
}
async function bDoScan(code) {
  if (!code) { B.err = 'Harap scan QR laporan terlebih dahulu.'; bScan(); bShake(); return; }
  B.qr = code; B.err = null; B.phase = 'scanning'; bSteps(); bScan(); await wait(700);
  if (code.startsWith('DUP-')) return bFail('Tiket ini sudah di-scan.');
  if (!/^[0-9a-f]+$/i.test(code)) return bFail('QR code tidak sah. Silakan scan ulang.');
  B.data = bBuild(bCount); B.phase = 'loaded'; bAll();
}
function bFail(m) { B.phase = 'error'; B.err = m; B.qr = ''; bSteps(); bScan(); bShake(); bFocus(); }
function bShake() { const f = $('#bScan .sc-field'); if (!f || H.reduced()) return; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
async function bSubmit() {
  if (!(await confirmBox('Kirim sebagai restan?', `${B.data.rows.length} tiket BCC dari ${B.data.zone} akan disimpan dengan status Restan.`, 'Konfirmasi & kirim'))) return;
  B.phase = 'submitting'; bSteps(); bSum(); await wait(1100);
  const t = '11:' + String(52 + bCount).padStart(2, '0');
  B.saved = { n: B.data.rows.length, z: B.data.zone, ffb: B.data.ffb, sak: B.data.sak, t };
  BLOG.forEach((l) => delete l.fresh); BLOG.unshift({ t, n: B.saved.n, ffb: B.saved.ffb, z: B.saved.z, fresh: true });
  bCount++; B.phase = 'done'; B.qr = ''; $('#bToday').textContent = BLOG.length; $('#bTix').textContent = BLOG.reduce((a, l) => a + l.n, 0);
  bAll(); H.toast('Berhasil menambahkan tiket BCC'); setTimeout(() => $('#bNext') && $('#bNext').focus({ preventScroll: true }), H.reduced() ? 0 : 300);
}

/* ---------------- public ---------------- */
const start = (root) => { root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in'); };
window.FFBKit = { $, $$, fmt, esc, ic, P, rng, pad, pageHead, menuBtn, bindDropdowns, closeAllDD, pager, openSheet, closeSheet, confirmBox, start, NAMES, ZONES };
let cur = null;
window.FFBPages = {
  tasks: { mount(el, h) { H = { ...H, ...h }; cur = el; mountTasks(el); }, start() { start(cur); requestAnimationFrame(placeInk); } },
  'surat-jalan': { mount(el, h) { H = { ...H, ...h }; cur = el; mountSJ(el); }, start() { start(cur); } },
  'scan-bcc': { mount(el, h) { H = { ...H, ...h }; cur = el; mountScan(el); }, start() { start(cur); bFocus(); } }
};
})();
