/* Perawatan pages:
   - Kerja Perawatan (/admin/other-task, OtherTaskCrudController list: date range default today, Zone, Pekerja, Gang filters;
     no create/delete, update only with "Perawatan - Update").
   - Scan Laporan Kerja Harian (/admin/scan-other-task?id=rawat, otherTasksPage.blade.php: parseOtherTaskQR, duplTasks, insertOtherTask).
   Data is dummy. */
(() => {
'use strict';
const K = window.FFBKit; if (!K) return;
const { $, $$, fmt, esc, ic, rng, pad, pageHead, menuBtn, bindDropdowns, closeAllDD, pager, openSheet, closeSheet, confirmBox, start, NAMES, ZONES } = K;
let H = { reduced: () => false, toast: () => {} };
const wait = (ms) => new Promise((r) => setTimeout(r, H.reduced() ? 0 : ms));

/* jenis kerja perawatan (from Constant::JOB_*), unit and indicative rate */
const JK = {
  rawat_jalan: ['Rawat jalan', 'Ha', 185000], pruning: ['Pruning', 'Pokok', 1800], pruning_ha: ['Pruning (Ha)', 'Ha', 210000], selective_weeding: ['Selective weeding', 'Ha', 160000],
  rempes_pelepah: ['Rempes pelepah', 'Pokok', 900], bersih_parit: ['Bersih parit', 'Meter', 450], bersih_parit_hk: ['Bersih parit (HK)', 'HK', 118000], ketek_tangkos: ['Ketek tangkos', 'Pokok', 700],
  bersihkan_pokok: ['Bersihkan pokok', 'Pokok', 650], sisir_brondolan: ['Sisir brondolan', 'HK', 118000]
};
const JKEYS = Object.keys(JK);
const MANDORS = ['Yohanes Ndruru', 'Markus Laia', 'Darius Tarigan', 'Paulus Gultom'];
const MATERIAL = ['-', '-', '-', 'Parang, kapak', 'Dodos', 'Egrek', 'Cangkul'];
const qty = (k, r) => { const u = JK[k][1]; return u === 'Ha' ? +(0.6 + r() * 1.6).toFixed(2) : u === 'Pokok' ? Math.round(40 + r() * 120) : u === 'Meter' ? Math.round(60 + r() * 220) : 1; };

const ROWS = (() => {
  const r = rng(5501), int = (a, b) => Math.floor(a + r() * (b - a + 1)), pick = (a) => a[Math.floor(r() * a.length)], zk = Object.keys(ZONES), out = [];
  for (let i = 0; i < 86; i++) {
    const k = i % 7 === 0 ? 'pruning' : i % 5 === 0 ? 'bersih_parit' : pick(JKEYS), q = qty(k, r), ot = r() < .08, zone = pick(zk);
    out.push({ n: i + 1, seri: '1762' + int(100000, 999999), id: 73480 - i, tgl: `06/11/2026 ${pad(int(6, 9))}:${pad(int(0, 59))}`, k, ot, pekerja: pick(NAMES), pid: 'GW-' + int(1000, 4999), gang: pick(ZONES[zone]), zone, field: zone, block: 'ABCDEFGH'[int(0, 7)] + pad(int(1, 32)), hasil: q, gaji: Math.round((q * JK[k][2] * (ot ? 1.5 : 1)) / 100) * 100, material: pick(MATERIAL), remark: r() < .15 ? pick(['Hujan siang, lanjut besok', 'Blok berbatasan sungai', 'Piringan sangat rimbun']) : '', mandor: pick(MANDORS), status: r() < .04 ? 'cancel' : 'complete', by: pick(['Dewi Kartika', 'Rahmat Hidayat', 'Lina Marbun']) });
  }
  return out;
})();
const unitOf = (k) => JK[k][1];
const fmtHasil = (k, v) => `${fmt(v, unitOf(k) === 'Ha' ? 2 : 0)} ${unitOf(k)}`;
const stChip = (s) => s === 'complete' ? '<span class="st-chip t-ok">Selesai</span>' : '<span class="st-chip t-mute">Dibatalkan</span>';

/* =====================================================================
   1. KERJA PERAWATAN — /admin/other-task
   ===================================================================== */
const COLS = [['n', '#', 1], ['seri', 'No seri', 0], ['tgl', 'Tanggal kerja', 1], ['id', 'Task ID', 1], ['k', 'Jenis kerja', 1], ['ot', 'OT', 1], ['pekerja', 'Pekerja', 1], ['zone', 'Zone', 0], ['field', 'Field', 0], ['block', 'Blok', 1], ['hasil', 'Hasil kerja (unit)', 1], ['gaji', 'Total gaji (Rp)', 1], ['material', 'Material', 0], ['remark', 'Remark', 0], ['mandor', 'Mandor', 1], ['status', 'Status', 1], ['by', 'Created by', 0]];
const L = { q: '', jk: [], zone: [], gang: '', pekerja: '', ot: false, range: 'today', group: 'jk', page: 1, per: 25, cols: new Set(COLS.filter((c) => c[2]).map((c) => c[0])), open: new Set(JKEYS) };
const rows = () => { const q = L.q.toLowerCase(); return ROWS.filter((x) => (!L.jk.length || L.jk.includes(x.k)) && (!L.zone.length || L.zone.includes(x.zone)) && (!L.gang || x.gang === L.gang) && (!L.pekerja || x.pekerja === L.pekerja) && (!L.ot || x.ot) && (!q || `${x.id} ${x.seri} ${x.pekerja} ${x.pid} ${x.block} ${x.mandor} ${JK[x.k][0]}`.toLowerCase().includes(q))); };
function cell(x, c) {
  switch (c) {
    case 'n': return `<span class="mute">${x.n}</span>`;
    case 'seri': return `<span class="mono">${x.seri}</span>`;
    case 'tgl': return `${x.tgl.slice(11)}<small>${x.tgl.slice(0, 10)}</small>`;
    case 'id': return `<a href="#perawatan" class="t-id" data-open="${x.id}">#${x.id}</a>`;
    case 'k': return `<span class="jk"><i class="jk-d jk-${JKEYS.indexOf(x.k) % 6}"></i>${JK[x.k][0]}</span>`;
    case 'ot': return x.ot ? '<span class="ot-y" title="Lembur">OT</span>' : '<span class="mute">—</span>';
    case 'pekerja': return `${esc(x.pekerja)}<small>${x.pid} · Gang ${x.gang}</small>`;
    case 'block': return `<b>${x.zone}</b> · ${x.block}`;
    case 'hasil': return `<b>${fmt(x.hasil, unitOf(x.k) === 'Ha' ? 2 : 0)}</b> <small class="inl">${unitOf(x.k)}</small>`;
    case 'gaji': return fmt(x.gaji);
    case 'status': return stChip(x.status);
    default: return x[c] && x[c] !== '-' ? esc(x[c]) : '<span class="mute">—</span>';
  }
}
const NUM = ['hasil', 'gaji'];
function mountList(root) {
  const byK = JKEYS.map((k) => { const r = ROWS.filter((x) => x.k === k); return { k, n: r.length, hasil: r.reduce((a, x) => a + x.hasil, 0), gaji: r.reduce((a, x) => a + x.gaji, 0), orang: new Set(r.map((x) => x.pekerja)).size }; }).filter((x) => x.n).sort((a, b) => b.gaji - a.gaji);
  const totGaji = ROWS.reduce((a, x) => a + x.gaji, 0);
  root.innerHTML = pageHead({ kicker: 'Perawatan · Langkah 2', title: 'Kerja Perawatan', sub: 'Tugas perawatan yang masuk dari laporan kerja harian mandor: jenis kerja, hasil, pekerja, dan gaji. Data hari ini ditampilkan lebih dulu.', right: `<div class="dd" data-dd><button class="f-btn" aria-haspopup="true" aria-expanded="false">${ic('clock')}<span id="rRangeL">Hari ini · 06 Nov 2026</span>${ic('down', 14)}</button><div class="dd-pop" role="menu">${[['today', 'Hari ini · 06 Nov 2026'], ['7d', '7 hari terakhir'], ['month', 'Bulan ini · November']].map((x) => `<button role="menuitem" data-range="${x[0]}">${ic('clock', 16)}${x[1]}</button>`).join('')}</div></div>${menuBtn('rExport', 'Ekspor', 'dl', [['xlsx', 'Excel (.xlsx)', 'file'], ['csv', 'CSV', 'file'], ['pdf', 'PDF', 'file']])}` }) + `
  <div class="wrap f-body">
    <div class="jk-strip frv" style="--i:2" role="group" aria-label="Ringkasan per jenis kerja">
      <div class="jk-total"><span>Total gaji hari ini</span><b>Rp ${fmt(totGaji / 1e6, 1)} jt</b><small>${ROWS.length} tugas · ${new Set(ROWS.map((x) => x.pekerja)).size} pekerja</small></div>
      ${byK.map((x) => `<button class="jk-card" data-jkc="${x.k}" aria-pressed="${L.jk.includes(x.k)}"><span class="jk"><i class="jk-d jk-${JKEYS.indexOf(x.k) % 6}"></i>${JK[x.k][0]}</span><b>${fmtHasil(x.k, x.hasil)}</b><small>${x.n} tugas · ${x.orang} pekerja · Rp ${fmt(x.gaji)}</small></button>`).join('')}
    </div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="rQ" type="search" placeholder="Cari Task ID, pekerja, blok, mandor, jenis kerja…" value="${esc(L.q)}"></label>
        <label class="ff-sel"><span class="sr">Pekerja</span><select id="rPek"><option value="">Semua pekerja</option>${[...new Set(ROWS.map((x) => x.pekerja))].sort().map((p) => `<option ${L.pekerja === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
        <label class="ff-sel"><span class="sr">Gang</span><select id="rGang"><option value="">Semua gang</option>${[...new Set(Object.values(ZONES).flat())].map((g) => `<option ${L.gang === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
        <button class="f-btn ${L.ot ? 'is-on' : ''}" id="rOt" aria-pressed="${L.ot}">${ic('clock')}Hanya lembur (OT)</button>
        <div class="dd" data-dd><button class="f-btn" aria-haspopup="true" aria-expanded="false">${ic('cols')}Kolom</button><div class="dd-pop cols-pop"><p>Tampilkan kolom</p>${COLS.map((c) => `<label><input type="checkbox" data-col="${c[0]}" ${L.cols.has(c[0]) ? 'checked' : ''} ${c[0] === 'id' ? 'disabled' : ''}>${c[1]}</label>`).join('')}</div></div>
      </div>
      <div class="f-zone"><span>Zone</span>${Object.keys(ZONES).map((z) => `<button data-rz="${z}" aria-pressed="${L.zone.includes(z)}">${z}</button>`).join('')}<span class="grp-l">Kelompokkan</span><div class="seg-s sm" role="group" aria-label="Kelompokkan">${[['jk', 'Jenis kerja'], ['mandor', 'Mandor'], ['none', 'Tanpa']].map(([k, l]) => `<button data-grp="${k}" aria-pressed="${L.group === k}">${l}</button>`).join('')}</div></div>
      <div id="rTable"></div>
    </section>
    <p class="f-note frv" style="--i:4">Data hanya bisa diubah oleh pengguna dengan izin "Perawatan - Update". Tugas baru masuk lewat Scan Laporan Kerja Harian, tidak dibuat manual di sini.</p>
  </div>`;
  bindDropdowns(root);
  $$('[data-range]', root).forEach((b) => b.onclick = () => { closeAllDD(); L.range = b.dataset.range; $('#rRangeL').textContent = b.textContent.trim(); H.toast(`Menampilkan ${b.textContent.trim()}`); });
  $$('[data-act]', $('#rExport').parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(`Mengekspor ${rows().length} tugas perawatan ke ${b.textContent.trim()}…`); });
  $('#rQ').addEventListener('input', (e) => { L.q = e.target.value; L.page = 1; table(); });
  $('#rPek').onchange = (e) => { L.pekerja = e.target.value; L.page = 1; table(); };
  $('#rGang').onchange = (e) => { L.gang = e.target.value; L.page = 1; table(); };
  $('#rOt').onclick = (e) => { L.ot = !L.ot; e.currentTarget.setAttribute('aria-pressed', L.ot); e.currentTarget.classList.toggle('is-on', L.ot); L.page = 1; table(); };
  $$('[data-jkc]', root).forEach((b) => b.onclick = () => { const k = b.dataset.jkc; L.jk = L.jk.includes(k) ? L.jk.filter((x) => x !== k) : [...L.jk, k]; b.setAttribute('aria-pressed', L.jk.includes(k)); L.page = 1; table(); });
  $$('[data-rz]', root).forEach((b) => b.onclick = () => { const z = b.dataset.rz; L.zone = L.zone.includes(z) ? L.zone.filter((x) => x !== z) : [...L.zone, z]; b.setAttribute('aria-pressed', L.zone.includes(z)); L.page = 1; table(); });
  $$('[data-grp]', root).forEach((b) => b.onclick = () => { L.group = b.dataset.grp; $$('[data-grp]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); L.page = 1; table(); });
  $$('[data-col]', root).forEach((c) => c.onchange = () => { c.checked ? L.cols.add(c.dataset.col) : L.cols.delete(c.dataset.col); table(); });
  table();
}
function table() {
  const el = $('#rTable'), r = rows(), cols = COLS.filter((c) => L.cols.has(c[0]));
  if (!r.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada tugas perawatan</h3><p>Tidak ada data yang cocok untuk filter dan tanggal ini.</p><button class="m-btn" id="rClr">Hapus semua filter</button></div>`; $('#rClr').onclick = () => { Object.assign(L, { q: '', jk: [], zone: [], gang: '', pekerja: '', ot: false }); mountList($('#ffb')); start($('#ffb')); }; return; }
  const head = `<thead><tr>${cols.map((c) => `<th class="${NUM.includes(c[0]) ? 'n' : ''} ${c[0] === 'id' ? 'stick' : ''}">${c[1]}</th>`).join('')}</tr></thead>`;
  const tr = (x, i) => `<tr data-row="${x.id}" style="--r:${i}">${cols.map((c) => `<td class="${NUM.includes(c[0]) ? 'n' : ''} ${c[0] === 'id' ? 'stick' : ''}">${cell(x, c[0])}</td>`).join('')}</tr>`;
  let body = '', foot = '';
  if (L.group === 'none') {
    const pages = Math.ceil(r.length / L.per); L.page = Math.min(L.page, pages); const from = (L.page - 1) * L.per;
    body = `<tbody>${r.slice(from, from + L.per).map(tr).join('')}</tbody>`; foot = pager(L.page, pages, r.length, L.per, from);
  } else {
    const key = L.group === 'jk' ? 'k' : 'mandor', groups = {};
    r.forEach((x) => (groups[x[key]] = groups[x[key]] || []).push(x));
    body = Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([g, list], gi) => {
      const open = L.open.has(g) || L.group === 'mandor' && !L.open.has('!' + g), gaji = list.reduce((a, x) => a + x.gaji, 0);
      const label = key === 'k' ? `<span class="jk"><i class="jk-d jk-${JKEYS.indexOf(g) % 6}"></i>${JK[g][0]}</span>` : `<span class="jk"><i class="jk-d jk-0"></i>Mandor ${esc(g)}</span>`;
      const sum = key === 'k' ? fmtHasil(g, list.reduce((a, x) => a + x.hasil, 0)) : `${new Set(list.map((x) => x.k)).size} jenis kerja`;
      return `<tbody class="grp ${open ? 'open' : ''}" data-g="${esc(g)}"><tr class="grp-h"><td colspan="${cols.length}"><button class="grp-btn" aria-expanded="${open}"><span class="caret">${ic('chev', 14)}</span>${label}<span class="grp-meta">${list.length} tugas · ${sum}</span><span class="grp-sum">Rp ${fmt(gaji)}</span></button></td></tr>${list.map(tr).join('')}</tbody>`;
    }).join('');
    foot = `<div class="f-pager"><span>${r.length} tugas dalam ${Object.keys(groups).length} kelompok</span><span class="pp"><b>Total gaji Rp ${fmt(r.reduce((a, x) => a + x.gaji, 0))}</b></span></div>`;
  }
  el.innerHTML = `<div class="f-tw" tabindex="0" aria-label="Tabel kerja perawatan"><table class="f-table">${head}${body}</table></div>${foot}`;
  $$('.grp-btn', el).forEach((b) => b.onclick = () => { const tb = b.closest('tbody'), g = tb.dataset.g, o = !tb.classList.contains('open'); tb.classList.toggle('open', o); b.setAttribute('aria-expanded', o); if (L.group === 'jk') { o ? L.open.add(g) : L.open.delete(g); } else { o ? L.open.delete('!' + g) : L.open.add('!' + g); } });
  $$('tr[data-row]', el).forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); sheet(+t.dataset.row); }));
  $$('[data-p]', el).forEach((b) => b.onclick = () => { L.page = +b.dataset.p; table(); });
  const per = $('[data-per]', el); if (per) per.onchange = (e) => { L.per = +e.target.value; L.page = 1; table(); };
}
function sheet(id, edit) {
  const x = ROWS.find((y) => y.id === id);
  const view = `<div class="fs-top">${stChip(x.status)}<span class="jk-pill"><i class="jk-d jk-${JKEYS.indexOf(x.k) % 6}"></i>${JK[x.k][0]}</span>${x.ot ? '<span class="ot-y">Lembur (OT)</span>' : ''}</div>
    <div class="fs-figs"><div><span>Hasil kerja</span><b>${fmtHasil(x.k, x.hasil)}</b></div><div><span>Total gaji</span><b>Rp ${fmt(x.gaji)}</b></div><div><span>Tarif</span><b>${fmt(JK[x.k][2])}<small style="font-family:var(--sans);font-size:12px;color:var(--muted)"> /${unitOf(x.k)}</small></b></div></div>
    <h3>Data tugas</h3><dl class="fs-dl">${[['Task ID', '#' + x.id], ['No seri', `<span class="mono">${x.seri}</span>`], ['Tanggal kerja', x.tgl], ['Pekerja', `${esc(x.pekerja)} (${x.pid})`], ['Gang', x.gang], ['Mandor', x.mandor], ['Zone · Field', `${x.zone} · ${x.field}`], ['Blok', x.block], ['Material', x.material === '-' ? '—' : x.material], ['Remark', x.remark || '—'], ['Dibuat oleh', x.by], ['Status', x.status === 'complete' ? 'Selesai' : 'Dibatalkan']].map((d) => `<div><dt>${d[0]}</dt><dd>${d[1]}</dd></div>`).join('')}</dl>`;
  const form = `<form class="fs-form" id="rEdit" novalidate><p class="mute">Perubahan hasil kerja akan menghitung ulang total gaji.</p>
    <div class="wf"><label for="eH">Hasil kerja <small>(${unitOf(x.k)})</small></label><input id="eH" type="number" step="any" min="0" value="${x.hasil}"></div>
    <div class="wf"><label for="eG">Total gaji (Rp)</label><input id="eG" type="number" step="100" min="0" value="${x.gaji}"><p class="w-msg" id="eMsg"></p></div>
    <div class="wf"><label for="eM">Material</label><input id="eM" value="${x.material === '-' ? '' : esc(x.material)}" placeholder="mis. Dodos, egrek"></div>
    <div class="wf"><label for="eR">Remark</label><textarea id="eR" rows="3" placeholder="Opsional">${esc(x.remark)}</textarea></div></form>`;
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Kerja perawatan</p><h2>#${x.id}</h2><p class="mute">${esc(x.pekerja)} · ${x.zone} · Blok ${x.block}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
    <div class="fs-b">${edit ? form : view}</div>
    <div class="fs-f">${edit ? `<button class="m-btn" id="eCancel">Batal</button><button class="m-btn pri" id="eSave">${ic('check')}Simpan perubahan</button>` : `<button class="m-btn" data-close>Tutup</button><button class="m-btn pri" id="eOpen">${ic('cols')}Ubah</button>`}</div>`, `Detail tugas perawatan #${x.id}`);
  if (!edit) { $('#eOpen').onclick = () => sheet(id, true); return; }
  const h = $('#eH'), g = $('#eG');
  h.addEventListener('input', () => { g.value = Math.round((+h.value || 0) * JK[x.k][2] * (x.ot ? 1.5 : 1) / 100) * 100; });
  $('#eCancel').onclick = () => sheet(id, false);
  $('#eSave').onclick = () => {
    if (!(+h.value > 0)) { const w = h.closest('.wf'); w.classList.remove('err'); void w.offsetWidth; w.classList.add('err'); $('#eMsg').textContent = 'Hasil kerja harus lebih dari 0.'; h.focus(); return; }
    x.hasil = +h.value; x.gaji = +g.value || 0; x.material = $('#eM').value || '-'; x.remark = $('#eR').value;
    H.toast(`Tugas #${x.id} diperbarui`); table(); sheet(id, false);
  };
  setTimeout(() => h.focus(), 60);
}

/* =====================================================================
   2. SCAN LAPORAN KERJA HARIAN — /admin/scan-other-task?id=rawat
   ===================================================================== */
let S, sCount = 0;
const SLOG = [{ no: 'EMC-1106-03', t: '10:22', ok: 14, fail: 0 }, { no: 'EMC-1106-02', t: '09:05', ok: 11, fail: 1 }, { no: 'EMC-1106-01', t: '07:48', ok: 18, fail: 1 }];
const sReset = () => { S = { phase: 'idle', data: null, err: null, qr: '', no: '' }; };
sReset();
function sBuild(i) {
  const r = rng(733 + i * 53), int = (a, b) => Math.floor(a + r() * (b - a + 1)), zk = Object.keys(ZONES), zone = zk[(i + 2) % zk.length], mandor = MANDORS[i % MANDORS.length];
  const ks = ['rawat_jalan', 'pruning', 'bersih_parit', 'selective_weeding', 'rempes_pelepah'];
  const rows = Array.from({ length: 9 + (i % 3) }, (_, n) => { const k = ks[n % ks.length], q = qty(k, r), unknownP = (n === 4 && i % 2 === 0), unknownR = (n === 7);
    return { tgl: `06/11/2026 ${pad(int(6, 8))}:${pad(int(0, 59))}`, field: zone, block: 'ABCDEFGH'[int(0, 7)] + pad(int(1, 32)), pekerja: unknownP ? '[GW-9041] Tidak terdaftar' : `[GW-${int(1000, 4999)}] ${NAMES[(n + i * 3) % NAMES.length]}`, pOk: !unknownP, mandor, k: unknownR ? 'tidak_dikenal' : k, rOk: !unknownR, jenis: unknownR ? 'TIDAK DIKENAL' : JK[k][0], unit: unknownR ? '-' : JK[k][1], total: q, ket: n % 4 === 1 ? 'Piringan rimbun' : '-', gaji: unknownR ? 0 : Math.round(q * JK[k][2] / 100) * 100 }; });
  return { zone, mandor, rows, by: ['Dewi Kartika', 'Rahmat Hidayat'][i % 2], remark: `Kerja perawatan ${zone}, mandor ${mandor}. ${i % 2 ? 'Cuaca cerah.' : 'Hujan ringan pukul 11.'}` };
}
function mountScan(root) {
  sReset();
  root.innerHTML = pageHead({ kicker: 'Perawatan · Langkah 1', title: 'Scan Laporan Kerja Harian', sub: 'Scan QR tiket kerja perawatan dari aplikasi mandor. Periksa pekerja dan jenis kerja, sesuaikan gaji bila perlu, lalu kirim ke Kerja Perawatan.', right: `<div class="m-today"><div><span>Laporan hari ini</span><b id="sToday">${SLOG.length}</b><small>discan</small></div><div><span>Baris berhasil</span><b id="sOk">${SLOG.reduce((a, l) => a + l.ok, 0)}</b><small>tugas</small></div></div>` }) + `
  <div class="wrap m-body">
    <ol class="m-steps frv" style="--i:2" id="sSteps" aria-label="Langkah">
      <li data-s="1"><span class="n">1</span><span class="t"><b>Scan QR tiket kerja</b><small>Dari aplikasi mandor</small></span></li>
      <li data-s="2"><span class="n">2</span><span class="t"><b>Periksa & sesuaikan</b><small>Pekerja, jenis kerja, gaji</small></span></li>
      <li data-s="3"><span class="n">3</span><span class="t"><b>Kirim laporan</b><small>Masuk ke Kerja Perawatan</small></span></li>
    </ol>
    <div class="b-grid">
      <section class="m-scan frv ga-scan" style="--i:3" id="sScan"></section>
      <section class="m-weigh frv ga-side" style="--i:4" id="sSide"></section>
      <section class="ga-load" id="sCheck"></section>
      <section class="m-log frv ga-log" style="--i:5"><h2>Laporan terakhir</h2><ul id="sLog"></ul></section>
    </div>
    <section class="m-tasks" id="sTable"></section>
  </div>`;
  sAll();
}
function sAll() { sSteps(); sScan(); sSide(); sCheck(); sTable(); sLog(); }
function sSteps() { const at = { idle: 1, scanning: 1, error: 1, loaded: 2, submitting: 3, done: 3 }[S.phase]; $$('#sSteps li').forEach((li) => { const n = +li.dataset.s; li.classList.toggle('on', n === at); li.classList.toggle('done', n < at || S.phase === 'done'); }); }
function sScan() {
  const c = $('#sScan'), busy = S.phase === 'scanning', locked = ['loaded', 'submitting'].includes(S.phase), d = S.data;
  c.className = `m-scan frv ga-scan ${S.phase}`;
  c.innerHTML = `<div class="sc-top"><div class="sc-ico ${busy ? 'busy' : ''}">${ic('scan', 26)}</div><div><h2>${locked ? 'Tiket kerja terbaca' : S.phase === 'done' ? 'Siap untuk laporan berikutnya' : 'Scan QR tiket kerja · Perawatan'}</h2><p>${locked ? 'Periksa daftar di bawah. Baris bertanda merah akan gagal saat dikirim.' : 'Arahkan scanner ke QR tiket kerja di HP mandor. Data dibaca otomatis saat scanner mengirim Enter.'}</p></div></div>
    <div class="sc-field"><label for="sQr" class="sr">Kode QR tiket kerja</label><input id="sQr" autocomplete="off" spellcheck="false" placeholder="${locked ? '' : 'Menunggu scan…'}" value="${S.qr}" ${locked || busy ? 'readonly' : ''}>
      <span class="sc-state">${busy ? '<i class="spin"></i>Membaca…' : locked ? `${ic('check', 16)}Valid · ${d.rows.length} baris` : '<i class="beam"></i>Siap'}</span></div>
    <p class="sc-msg" role="alert">${S.err ? `${ic('alert', 16)}<span><b>Pemindaian gagal.</b> ${S.err}</span>` : ''}</p>
    ${locked ? `<div class="qr-sum"><div><span>Field</span><b>${d.zone}</b></div><div><span>Mandor</span><b>${d.mandor}</b></div><div><span>Pekerja</span><b>${new Set(d.rows.map((x) => x.pekerja)).size}</b></div><div><span>Jenis kerja</span><b>${new Set(d.rows.map((x) => x.k)).size}</b></div></div>${chkList(d)}<p class="qr-next">${ic('chev', 16)}Lanjut: isi nomor laporan di kanan, lalu kirim.</p>` : busy ? '' : `<ul class="sc-tips"><li><b>1</b><span>Kursor otomatis berada di kolom scan.</span></li><li><b>2</b><span>Satu QR berisi semua tugas perawatan dari satu laporan mandor.</span></li><li><b>3</b><span>Gaji bisa disesuaikan per baris sebelum dikirim.</span></li></ul>`}
    <div class="sc-demo">${locked ? `<button class="m-btn" id="sRescan">${ic('undo', 16)}Batal & scan ulang</button>` : `<span>Simulasi:</span><button class="chipbtn" data-sd="ok">Scan valid</button><button class="chipbtn" data-sd="bad">QR tidak dikenali</button><button class="chipbtn" data-sd="dup">Tiket sudah di-scan</button>`}</div>`;
  const q = $('#sQr'); q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sDoScan(q.value.trim()); } });
  $$('[data-sd]', c).forEach((b) => b.onclick = () => sDemo(b.dataset.sd));
  const rs = $('#sRescan'); if (rs) rs.onclick = () => { sReset(); sAll(); sFocus(); };
}
const totGaji = () => S.data ? S.data.rows.reduce((a, x) => a + (+x.gaji || 0), 0) : 0;
function sSide() {
  const c = $('#sSide'), d = S.data, on = ['loaded', 'submitting'].includes(S.phase);
  c.className = `m-weigh frv ga-side ${on || S.phase === 'done' ? '' : 'off'} ${S.phase === 'done' ? 'done' : ''}`;
  if (S.phase === 'done') {
    const R = S.result;
    c.innerHTML = `<div class="ok-mark ${R.fail.length ? 'warn' : ''}">${ic(R.fail.length ? 'alert' : 'check', 30)}</div><h2>Laporan terkirim</h2><p>Berhasil memperbarui Tugas Lainnya.</p>
      <dl class="done-sum"><div><dt>Berhasil</dt><dd>${R.ok} baris</dd></div><div><dt>Gagal</dt><dd>${R.fail.length} baris</dd></div><div><dt>No laporan</dt><dd>${R.no}</dd></div><div><dt>Total gaji</dt><dd>Rp ${fmt(R.gaji)}</dd></div></dl>
      ${R.fail.length ? `<ul class="fail-list">${R.fail.map((f) => `<li>${ic('alert', 14)}${f}</li>`).join('')}</ul>` : ''}
      <div class="w-acts"><a class="m-btn" href="#perawatan">${ic('file')}Lihat Kerja Perawatan</a><button class="m-btn pri" id="sNext">${ic('scan')}Scan berikutnya</button></div>`;
    $('#sNext').onclick = () => { sReset(); sAll(); sFocus(); }; return;
  }
  c.innerHTML = `<h2>${ic('file', 20)}Laporan</h2>
    <div class="wf"><label>Laporan dibuat oleh</label><input value="${d ? d.by : ''}" placeholder="Terisi dari QR" readonly></div>
    <div class="wf ${S.noErr ? 'err' : ''}"><label for="sNo">No laporan</label><div class="no-in"><span>EMC</span><input id="sNo" value="${esc(S.no)}" placeholder="mis. 1106-04" ${on ? '' : 'disabled'}></div><p class="w-msg" id="sNoMsg">${S.noErr || ''}</p></div>
    <div class="wf"><label for="sRem">Keterangan</label><textarea id="sRem" rows="3" readonly placeholder="Terisi dari QR">${d ? esc(d.remark) : ''}</textarea></div>
    <div class="gaji-tot"><span>Total gaji</span><b id="sTot">${d ? 'Rp ' + fmt(totGaji()) : '—'}</b></div>
    <button class="m-btn pri big" id="sSubmit" ${on ? '' : 'disabled'}><span class="lbl">${S.phase === 'submitting' ? 'Mengirim…' : 'Kirim laporan'}</span>${S.phase === 'submitting' ? '<i class="spin w"></i>' : ''}</button>
    <p class="w-note">${on ? 'Anda akan diminta konfirmasi sebelum dikirim.' : 'Aktif setelah QR tiket kerja dipindai.'}</p>`;
  if (!on) return;
  $('#sNo').addEventListener('input', (e) => { S.no = e.target.value; if (S.noErr && S.no.trim()) { S.noErr = null; e.target.closest('.wf').classList.remove('err'); $('#sNoMsg').textContent = ''; } });
  $('#sNo').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sSubmit(); } });
  $('#sSubmit').onclick = sSubmit;
}
function chkList(d) {
  const badP = d.rows.filter((x) => !x.pOk), badR = d.rows.filter((x) => !x.rOk), ok = d.rows.length - new Set([...badP, ...badR]).size;
  return `<ul class="chk-list">
    <li class="ok">${ic('check', 16)}<span><b>${ok} baris siap dikirim</b>Pekerja dan jenis kerja dikenali.</span></li>
    <li class="${badP.length ? 'bad' : 'ok'}">${ic(badP.length ? 'alert' : 'check', 16)}<span><b>${badP.length ? badP.length + ' pekerja tidak terdaftar' : 'Semua pekerja terdaftar'}</b>${badP.length ? 'Baris ini akan gagal. Daftarkan pekerja di Admin Panel › Staff terlebih dahulu.' : 'Cocok dengan data pekerja.'}</span></li>
    <li class="${badR.length ? 'bad' : 'ok'}">${ic(badR.length ? 'alert' : 'check', 16)}<span><b>${badR.length ? badR.length + ' jenis kerja tidak dikenal' : 'Semua jenis kerja dikenal'}</b>${badR.length ? 'Tarif tidak ditemukan, gaji tidak bisa dihitung. Periksa Salary Rates.' : 'Tarif tersedia di Salary Rates.'}</span></li>
  </ul>`;
}
function sCheck() {
  const c = $('#sCheck'), d = S.data;
  if (!d || S.phase === 'done') { c.innerHTML = `<div class="m-empty"><div class="pl-ghost" aria-hidden="true">LKH</div><p>${S.phase === 'done' ? 'Laporan sudah dikirim. Ringkasan laporan berikutnya akan muncul di sini.' : 'Ringkasan hasil kerja dan gaji per jenis kerja akan muncul di sini setelah QR dipindai.'}</p></div>`; return; }
  const byK = {}; d.rows.filter((x) => x.rOk).forEach((x) => { byK[x.k] = byK[x.k] || { h: 0, g: 0, n: 0 }; byK[x.k].h += x.total; byK[x.k].g += x.gaji; byK[x.k].n++; });
  const ent = Object.entries(byK).sort((a, b) => b[1].g - a[1].g), max = Math.max(...ent.map((e) => e[1].g));
  c.innerHTML = `<div class="b-break one"><div><h3>Gaji per jenis kerja</h3><div class="b-bars wide">${ent.map(([k, v]) => `<div class="bb"><span class="jk"><i class="jk-d jk-${JKEYS.indexOf(k) % 6}"></i>${JK[k][0]}<small>${v.n} baris · ${fmtHasil(k, v.h)}</small></span><span class="bar"><i style="--w:${(v.g / max).toFixed(3)}"></i></span><b>Rp ${fmt(v.g)}</b></div>`).join('')}</div></div></div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.b-bars .bar i', c).forEach((i) => i.classList.add('go'))));
}
function sTable() {
  const c = $('#sTable'), d = S.data;
  if (!d || S.phase === 'done') { c.innerHTML = ''; c.classList.remove('show'); return; }
  c.innerHTML = `<div class="tk-h"><h2>Tugas dalam tiket kerja</h2><span class="pill">${d.rows.length} baris</span><div class="tk-leg"><span><i class="b-bad"></i>Tidak terdaftar / tidak dikenal</span></div></div>
  <div class="tk-wrap" tabindex="0" aria-label="Tabel tugas perawatan"><table class="tk"><thead><tr><th>No</th><th>Tanggal</th><th>Field</th><th>Blok</th><th>Pekerja</th><th>Pengawas / mandor</th><th>Jenis kerja</th><th>Jenis</th><th>Unit</th><th class="n">Total</th><th>Keterangan</th><th class="n">Gaji (Rp)</th></tr></thead>
  <tbody>${d.rows.map((x, i) => `<tr style="--r:${i}" class="${!x.pOk || !x.rOk ? 'row-bad' : ''}"><td class="n mute">${i + 1}</td><td>${x.tgl.slice(11)}<small>${x.tgl.slice(0, 10)}</small></td><td>${x.field}</td><td><b>${x.block}</b></td><td class="${x.pOk ? '' : 'flag'}">${x.pekerja.replace(/^\[[^\]]+\]\s*/, '')}<small>${x.pekerja.match(/^\[([^\]]+)\]/)[1]}</small></td><td>${x.mandor}</td><td class="${x.rOk ? '' : 'flag'}">${x.rOk ? JK[x.k][0] : 'TIDAK DIKENAL'}</td><td class="mute">${x.rOk ? JK[x.k][0].split(' ')[0] : '-'}</td><td>${x.unit}</td><td class="n">${fmt(x.total, x.unit === 'Ha' ? 2 : 0)}</td><td class="mute">${x.ket}</td><td class="n"><label class="sr" for="g${i}">Gaji baris ${i + 1}</label><input class="gaji-in" id="g${i}" data-gi="${i}" type="number" step="100" min="0" value="${x.gaji}" ${S.phase === 'submitting' ? 'disabled' : ''}></td></tr>`).join('')}</tbody>
  <tfoot><tr><td colspan="11">Total gaji</td><td class="n" id="sFootTot">Rp ${fmt(totGaji())}</td></tr></tfoot></table></div>
  <p class="tk-note">Gaji dihitung otomatis dari Salary Rates dan bisa diubah per baris sebelum dikirim, sama seperti di halaman lama.</p>`;
  $$('[data-gi]', c).forEach((inp) => inp.addEventListener('input', () => { S.data.rows[+inp.dataset.gi].gaji = +inp.value || 0; const t = 'Rp ' + fmt(totGaji()); $('#sFootTot').textContent = t; const st = $('#sTot'); if (st) { st.textContent = t; st.classList.remove('bump'); void st.offsetWidth; st.classList.add('bump'); } }));
  c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
}
function sLog() { $('#sLog').innerHTML = SLOG.slice(0, 4).map((l, i) => `<li class="${i === 0 && l.fresh ? 'fresh' : ''}"><div><b>${l.no}</b><span>${l.ok} berhasil${l.fail ? ` · <em class="bad-t">${l.fail} gagal</em>` : ''}</span></div><div class="r"><b>${l.t}</b><span>dikirim</span></div><a class="lg-p" href="#perawatan" aria-label="Lihat di Kerja Perawatan">${ic('chev', 16)}</a></li>`).join(''); }
function sFocus() { setTimeout(() => { const q = $('#sQr'); if (q && !q.readOnly) q.focus({ preventScroll: true }); }, H.reduced() ? 0 : 80); }
function sDemo(k) {
  const code = k === 'bad' ? 'ab' + Math.random().toString(16).slice(2, 12) : k === 'dup' ? '1fDUP' + 'c3'.repeat(10) : '1f8b0800' + (9321 + sCount * 733).toString(16) + 'beef' + 'd4'.repeat(16);
  const q = $('#sQr'); if (H.reduced()) { q.value = code; sDoScan(code); return; }
  let i = 0; q.value = ''; q.focus(); const tick = () => { i += 6; q.value = code.slice(0, i); if (i < code.length) requestAnimationFrame(tick); else setTimeout(() => sDoScan(code), 120); }; requestAnimationFrame(tick);
}
async function sDoScan(code) {
  if (!code) { S.err = 'Harap scan masuk QR code.'; sScan(); sShake(); return; }
  S.qr = code; S.err = null; S.phase = 'scanning'; sSteps(); sScan(); await wait(700);
  if (code.startsWith('1fDUP')) return sFail('Tiket ini sudah di-scan.');
  if (code.slice(0, 2).toLowerCase() !== '1f') return sFail('QR Code tidak dikenali. Harap scan QR code semula.');
  S.data = sBuild(sCount); S.phase = 'loaded'; S.no = ''; S.noErr = null; sAll();
  setTimeout(() => $('#sNo') && $('#sNo').focus({ preventScroll: true }), H.reduced() ? 0 : 360);
}
function sFail(m) { S.phase = 'error'; S.err = m; S.qr = ''; sSteps(); sScan(); sShake(); sFocus(); }
function sShake() { const f = $('#sScan .sc-field'); if (!f || H.reduced()) return; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
async function sSubmit() {
  if (!S.no.trim()) { S.noErr = 'Isi nomor laporan terlebih dahulu.'; const w = $('#sNo').closest('.wf'); w.classList.remove('err'); void w.offsetWidth; w.classList.add('err'); $('#sNoMsg').textContent = S.noErr; $('#sNo').focus(); return; }
  const d = S.data, bad = d.rows.filter((x) => !x.pOk || !x.rOk);
  if (!(await confirmBox('Kirim laporan ini?', `${d.rows.length - bad.length} baris akan disimpan ke Kerja Perawatan${bad.length ? `, ${bad.length} baris akan gagal karena data tidak dikenali` : ''}.`, 'Konfirmasi & kirim'))) return;
  S.phase = 'submitting'; sSteps(); sSide(); sTable(); await wait(1100);
  const no = 'EMC-' + S.no.trim(), t = '11:' + String(48 + sCount).padStart(2, '0');
  S.result = { ok: d.rows.length - bad.length, fail: bad.map((x) => `Baris ${d.rows.indexOf(x) + 1}: ${!x.pOk ? 'pekerja tidak terdaftar' : 'jenis kerja tidak dikenal'}`), no, gaji: d.rows.filter((x) => x.pOk && x.rOk).reduce((a, x) => a + x.gaji, 0) };
  SLOG.forEach((l) => delete l.fresh); SLOG.unshift({ no, t, ok: S.result.ok, fail: S.result.fail.length, fresh: true });
  sCount++; S.phase = 'done'; S.qr = ''; $('#sToday').textContent = SLOG.length; $('#sOk').textContent = SLOG.reduce((a, l) => a + l.ok, 0);
  sAll(); H.toast(`Berhasil: ${S.result.ok} · Gagal: ${S.result.fail.length}`); setTimeout(() => $('#sNext') && $('#sNext').focus({ preventScroll: true }), H.reduced() ? 0 : 300);
}

/* ---------------- public ---------------- */
let cur = null;
Object.assign(window.FFBPages, {
  perawatan: { mount(el, h) { H = { ...H, ...h }; cur = el; mountList(el); }, start() { start(cur); } },
  'scan-perawatan': { mount(el, h) { H = { ...H, ...h }; cur = el; mountScan(el); }, start() { start(cur); sFocus(); } }
});
})();
