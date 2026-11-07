/* Kebun pages: Pupuk & Racun (task list, jenis master, scan QR) + Harvest Interval.
   Sources: PupukTaskCrudController, PupukTypeCrudController, RacunTasksCrudController, RacunCrudController,
   otherTasksPage.blade.php (id=pupuk / id=racun), IntervalController@intervalIndex + intervalUI2.blade.php. Data is dummy. */
(() => {
'use strict';
const K = window.FFBKit; if (!K) return;
const { $, $$, fmt, esc, ic, rng, pad, pageHead, menuBtn, bindDropdowns, closeAllDD, pager, openSheet, confirmBox, start, NAMES, ZONES } = K;
let H = { reduced: () => false, toast: () => {} };
const wait = (ms) => new Promise((r) => setTimeout(r, H.reduced() ? 0 : ms));
const MANDORS = ['Yohanes Ndruru', 'Markus Laia', 'Darius Tarigan', 'Paulus Gultom'];
const METHODS = { spray: 'Spraying', drench: 'Drenching', soil: 'Soil Incorporation', inject: 'Trunk Injection', bait: 'Baiting', fog: 'Fogging' };
const UNITS = { g: 'Grams (g)', kg: 'Kilograms (kg)', l: 'Liters (L)', ml: 'Milliliters (mL)', pct: 'Percentages (%)', oz: 'Ounces (oz)', mt: 'Metric Tons (MT)' };
const USHORT = { g: 'g', kg: 'kg', l: 'L', ml: 'mL', pct: '%', oz: 'oz', mt: 'MT' };
const RTYPES = { liquid: 'Liquid', solid: 'Solid', powder: 'Powder', aerosol: 'Aerosol', baits: 'Baits' };
const dots = ['#0B4A3A', '#2FA84F', '#D99A00', '#2F6690', '#8A5CB8', '#E06A1F', '#5B7A2B', '#B4532A', '#3D8B8B'];

/* ---------- master data ---------- */
const PUPUK = [
  ['NPK 15-15-15', 'PT Agro Subur (contoh)', 'Pupuk majemuk untuk TM, ditabur di piringan.', 'soil', 2, 2.5, 'kg'], ['UREA', 'PT Agro Subur (contoh)', 'Sumber nitrogen, aplikasi awal musim hujan.', 'soil', 2, 1.5, 'kg'],
  ['MOP (KCL)', 'CV Tani Makmur (contoh)', 'Kalium untuk pembentukan buah.', 'soil', 2, 1.75, 'kg'], ['DOLOMIT', 'CV Tani Makmur (contoh)', 'Kapur pertanian, menaikkan pH tanah.', 'soil', 1, 2, 'kg'],
  ['ROCK PHOSPHATE', 'PT Agro Subur (contoh)', 'Fosfat alam lepas lambat.', 'soil', 1, 1, 'kg'], ['KIESERITE', 'CV Tani Makmur (contoh)', 'Magnesium untuk daun.', 'soil', 1, 1, 'kg'],
  ['BORATE', 'PT Agro Subur (contoh)', 'Unsur mikro boron.', 'soil', 1, 100, 'g'], ['PUPUK DAUN', 'CV Hijau Lestari (contoh)', 'Disemprot ke pelepah untuk TBM.', 'spray', 4, 50, 'ml'], ['ZA', 'PT Agro Subur (contoh)', 'Amonium sulfat.', 'soil', 1, 1, 'kg']
].map((p, i) => ({ id: i + 1, name: p[0], brand: p[1], desc: p[2], method: p[3], freq: p[4], amount: p[5], unit: p[6], color: dots[i % dots.length] }));
const RACUN = [
  ['GLIFOSAT 490 SL', 'CV Hijau Lestari (contoh)', 'Herbisida sistemik untuk gulma piringan dan jalan pikul.', 'liquid', 'spray', 1.5, 'l'], ['PARAKUAT 276 SL', 'CV Hijau Lestari (contoh)', 'Herbisida kontak, cepat kering.', 'liquid', 'spray', 1, 'l'],
  ['METSULFURON 20 WG', 'PT Agro Subur (contoh)', 'Untuk pakis dan gulma daun lebar.', 'powder', 'spray', 15, 'g'], ['TRIKLOPIR 480 EC', 'PT Agro Subur (contoh)', 'Untuk anak kayu.', 'liquid', 'spray', 0.5, 'l'],
  ['2,4-D AMINA', 'CV Tani Makmur (contoh)', 'Gulma daun lebar di gawangan.', 'liquid', 'spray', 1, 'l'], ['UMPAN TIKUS', 'CV Tani Makmur (contoh)', 'Umpan blok untuk pengendalian tikus.', 'baits', 'bait', 20, 'g'],
  ['SIPERMETRIN 50 EC', 'CV Hijau Lestari (contoh)', 'Insektisida untuk ulat api.', 'liquid', 'fog', 250, 'ml']
].map((p, i) => ({ id: i + 1, name: p[0], brand: p[1], desc: p[2], rtype: p[3], method: p[4], amount: p[5], unit: p[6], color: dots[i % dots.length] }));

/* ---------- task rows ---------- */
function mkRows(kind) {
  const r = rng(kind === 'pupuk' ? 8181 : 9191), int = (a, b) => Math.floor(a + r() * (b - a + 1)), pick = (a) => a[Math.floor(r() * a.length)], zk = Object.keys(ZONES), types = kind === 'pupuk' ? PUPUK : RACUN, out = [];
  for (let i = 0; i < 64; i++) {
    const t = types[i % 4 === 0 ? int(0, types.length - 1) : int(0, Math.min(3, types.length - 1))], zone = pick(zk), ot = r() < .06;
    const total = kind === 'pupuk' ? int(60, 180) : +(0.8 + r() * 2.6).toFixed(2);            // pokok or Ha
    const hasil = kind === 'pupuk' ? +(total * (t.unit === 'g' ? t.amount / 1000 : t.unit === 'ml' ? t.amount / 1000 : t.amount)).toFixed(1) : +(total * (t.unit === 'g' ? t.amount / 1000 : t.unit === 'ml' ? t.amount / 1000 : t.amount)).toFixed(2);
    const rate = kind === 'pupuk' ? (t.method === 'spray' ? 'Semprot pupuk daun (Pokok)' : 'Tabur pupuk (Pokok)') : (t.method === 'bait' ? 'Pasang umpan (Ha)' : t.method === 'fog' ? 'Fogging (Ha)' : 'Semprot piringan (Ha)');
    const gaji = Math.round((kind === 'pupuk' ? total * 520 : total * 92000) * (ot ? 1.5 : 1) / 100) * 100;
    out.push({ n: i + 1, id: (kind === 'pupuk' ? 52480 : 61240) - i, tgl: `0${i < 26 ? 6 : i < 46 ? 5 : 4}/11/2026 ${pad(int(6, 10))}:${pad(int(0, 59))}`, pekerja: pick(NAMES), pid: 'GW-' + int(1000, 4999), gang: pick(ZONES[zone]), rate, t: t.id, zone, field: zone, block: 'ABCDEFGH'[int(0, 7)] + pad(int(1, 32)), ancak: int(1, 24), mandor: pick(MANDORS), total, gaji, hasil, material: kind === 'pupuk' ? pick(['Ember tabur', 'Takaran 1 kg', '-']) : pick(['Knapsack 15 L', 'Nozzle polijet', '-']), remark: r() < .12 ? pick(['Hujan siang, dilanjut besok', 'Blok dekat sungai, dosis dikurangi', 'Pupuk datang terlambat']) : '', status: r() < .05 ? 'cancel' : 'complete', ot });
  }
  return out;
}
const DATA = { pupuk: mkRows('pupuk'), racun: mkRows('racun') };
const CFG = {
  pupuk: { types: PUPUK, typeLabel: 'Pupuk', totalUnit: 'pokok', hasilUnit: (t) => USHORT[t.unit === 'g' || t.unit === 'ml' ? (t.unit === 'g' ? 'kg' : 'l') : t.unit], perm: 'Pupuk - Update', title: 'Kerja Pupuk', kicker: 'Kebun · Pupuk', listRoute: 'pupuk', jenisRoute: 'pupuk-jenis', scanRoute: 'scan-pupuk', icon: 'file' },
  racun: { types: RACUN, typeLabel: 'Jenis racun', totalUnit: 'Ha', hasilUnit: (t) => USHORT[t.unit === 'g' || t.unit === 'ml' ? (t.unit === 'g' ? 'kg' : 'l') : t.unit], perm: 'Racun - Update', title: 'Kerja Racun', kicker: 'Kebun · Racun', listRoute: 'racun', jenisRoute: 'racun-jenis', scanRoute: 'scan-racun', icon: 'file' }
};
const typeOf = (kind, id) => CFG[kind].types.find((t) => t.id === id);
const stChip = (s) => s === 'complete' ? '<span class="st-chip t-ok">Selesai</span>' : '<span class="st-chip t-mute">Dibatalkan</span>';
const tdot = (t) => `<span class="jk"><i class="jk-d" style="background:${t.color}"></i>${esc(t.name)}</span>`;

/* =====================================================================
   TASK LIST (pupuk-task / racun-tasks)
   ===================================================================== */
const LS = {};
function colsFor(kind) {
  const c = [['n', '#', 1], ['tgl', 'Tanggal kerja', 1], ['pekerja', 'Pekerja', 1], ['rate', 'Task (unit)', 1], ['t', CFG[kind].typeLabel, 1], ['zone', 'Zone', 0], ['field', 'Field', 0], ['block', 'Blok', 1]];
  if (kind === 'racun') c.push(['ancak', 'Ancak', 0]);
  return c.concat([['mandor', 'Mandor', 1], ['total', 'Total', 1], ['gaji', 'Total gaji (Rp)', 1], ['hasil', 'Hasil', 1], ['material', 'Material', 0], ['remark', 'Remark', 0], ['status', 'Status', 1]]);
}
function lCell(kind, x, c) {
  const t = typeOf(kind, x.t);
  switch (c) {
    case 'n': return `<span class="mute">${x.n}</span>`;
    case 'tgl': return `${x.tgl.slice(11)}<small>${x.tgl.slice(0, 10)}</small>`;
    case 'pekerja': return `${esc(x.pekerja)}${x.ot ? ' <span class="ot-y">OT</span>' : ''}<small>${x.pid} · Gang ${x.gang}</small>`;
    case 't': return tdot(t);
    case 'block': return `<b>${x.zone}</b> · ${x.block}`;
    case 'total': return `<b>${fmt(x.total, kind === 'racun' ? 2 : 0)}</b> <small class="inl">${CFG[kind].totalUnit}</small>`;
    case 'hasil': return `${fmt(x.hasil, kind === 'racun' ? 2 : 1)} <small class="inl">${CFG[kind].hasilUnit(t)}</small>`;
    case 'gaji': return fmt(x.gaji);
    case 'status': return stChip(x.status);
    default: return x[c] && x[c] !== '-' ? esc(x[c]) : '<span class="mute">—</span>';
  }
}
function mountTaskList(kind, root) {
  const cfg = CFG[kind], rows = DATA[kind];
  const L = LS[kind] = LS[kind] || { q: '', t: [], zone: [], mandor: '', group: 't', page: 1, per: 25, cols: new Set(colsFor(kind).filter((c) => c[2]).map((c) => c[0])), closed: new Set() };
  const byT = cfg.types.map((t) => { const r = rows.filter((x) => x.t === t.id); return { t, n: r.length, total: r.reduce((a, x) => a + x.total, 0), hasil: r.reduce((a, x) => a + x.hasil, 0), gaji: r.reduce((a, x) => a + x.gaji, 0) }; }).filter((x) => x.n).sort((a, b) => b.hasil - a.hasil);
  root.innerHTML = pageHead({ kicker: cfg.kicker, title: cfg.title, sub: kind === 'pupuk' ? 'Tugas pemupukan dari laporan kerja harian mandor: jenis pupuk, jumlah pokok, pupuk yang ditabur, dan gaji pekerja.' : 'Tugas penyemprotan dari laporan kerja harian mandor: jenis racun, luas, larutan yang dipakai, dan gaji pekerja.', right: `<a class="f-btn" href="#${cfg.scanRoute}">${ic('scan')}Scan QR</a><a class="f-btn" href="#${cfg.jenisRoute}">${ic('file')}${kind === 'pupuk' ? 'Jenis pupuk' : 'Jenis racun'}</a>${menuBtn('kx' + kind, 'Ekspor', 'dl', [['xlsx', 'Excel (.xlsx)', 'file'], ['csv', 'CSV', 'file'], ['pdf', 'PDF', 'file']])}` }) + `
  <div class="wrap f-body">
    <div class="jk-strip frv" style="--i:2" role="group" aria-label="Ringkasan per ${cfg.typeLabel.toLowerCase()}">
      <div class="jk-total"><span>${kind === 'pupuk' ? 'Pokok dipupuk' : 'Luas disemprot'} · 3 hari</span><b>${fmt(rows.reduce((a, x) => a + x.total, 0), kind === 'racun' ? 1 : 0)} ${cfg.totalUnit}</b><small>${rows.length} tugas · Rp ${fmt(rows.reduce((a, x) => a + x.gaji, 0) / 1e6, 1)} jt gaji</small></div>
      ${byT.map((x) => `<button class="jk-card" data-kt="${x.t.id}" aria-pressed="${L.t.includes(x.t.id)}">${tdot(x.t)}<b>${fmt(x.hasil, 1)} ${cfg.hasilUnit(x.t)}</b><small>${x.n} tugas · ${fmt(x.total, kind === 'racun' ? 1 : 0)} ${cfg.totalUnit} · Rp ${fmt(x.gaji)}</small></button>`).join('')}
    </div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="kQ" type="search" placeholder="Cari pekerja, blok, mandor, ${cfg.typeLabel.toLowerCase()}…" value="${esc(L.q)}"></label>
        <label class="ff-sel"><span class="sr">Mandor</span><select id="kMandor"><option value="">Semua mandor</option>${MANDORS.map((m) => `<option ${L.mandor === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        <div class="dd" data-dd><button class="f-btn" aria-haspopup="true" aria-expanded="false">${ic('cols')}Kolom</button><div class="dd-pop cols-pop"><p>Tampilkan kolom</p>${colsFor(kind).map((c) => `<label><input type="checkbox" data-kcol="${c[0]}" ${L.cols.has(c[0]) ? 'checked' : ''}>${c[1]}</label>`).join('')}</div></div>
      </div>
      <div class="f-zone"><span>Zone</span>${Object.keys(ZONES).map((z) => `<button data-kz="${z}" aria-pressed="${L.zone.includes(z)}">${z}</button>`).join('')}<span class="grp-l">Kelompokkan</span><div class="seg-s sm" role="group" aria-label="Kelompokkan">${[['t', cfg.typeLabel], ['mandor', 'Mandor'], ['none', 'Tanpa']].map(([k, l]) => `<button data-kg="${k}" aria-pressed="${L.group === k}">${l}</button>`).join('')}</div></div>
      <div id="kTable"></div>
    </section>
    <p class="f-note frv" style="--i:4">Tugas masuk lewat ${kind === 'pupuk' ? 'Scan QR Pupuk' : 'Scan QR Racun'}. Data hanya bisa diubah dengan izin "${cfg.perm}"; tidak ada tambah atau hapus dari halaman ini.</p>
  </div>`;
  bindDropdowns(root);
  $$('[data-act]', $('#kx' + kind).parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(`Mengekspor ${cfg.title.toLowerCase()} ke ${b.textContent.trim()}…`); });
  const re = () => { L.page = 1; kTable(kind); };
  $('#kQ').addEventListener('input', (e) => { L.q = e.target.value; re(); });
  $('#kMandor').onchange = (e) => { L.mandor = e.target.value; re(); };
  $$('[data-kt]', root).forEach((b) => b.onclick = () => { const id = +b.dataset.kt; L.t = L.t.includes(id) ? L.t.filter((x) => x !== id) : [...L.t, id]; b.setAttribute('aria-pressed', L.t.includes(id)); re(); });
  $$('[data-kz]', root).forEach((b) => b.onclick = () => { const z = b.dataset.kz; L.zone = L.zone.includes(z) ? L.zone.filter((x) => x !== z) : [...L.zone, z]; b.setAttribute('aria-pressed', L.zone.includes(z)); re(); });
  $$('[data-kg]', root).forEach((b) => b.onclick = () => { L.group = b.dataset.kg; $$('[data-kg]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); re(); });
  $$('[data-kcol]', root).forEach((c) => c.onchange = () => { c.checked ? L.cols.add(c.dataset.kcol) : L.cols.delete(c.dataset.kcol); kTable(kind); });
  kTable(kind);
}
function kTable(kind) {
  const L = LS[kind], q = L.q.toLowerCase(), el = $('#kTable'), cols = colsFor(kind).filter((c) => L.cols.has(c[0])), NUM = ['total', 'gaji', 'hasil'];
  const r = DATA[kind].filter((x) => (!L.t.length || L.t.includes(x.t)) && (!L.zone.length || L.zone.includes(x.zone)) && (!L.mandor || x.mandor === L.mandor) && (!q || `${x.pekerja} ${x.pid} ${x.block} ${x.mandor} ${typeOf(kind, x.t).name}`.toLowerCase().includes(q)));
  if (!r.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada tugas</h3><p>Tidak ada data yang cocok dengan filter ini.</p></div>`; return; }
  const head = `<thead><tr>${cols.map((c) => `<th class="${NUM.includes(c[0]) ? 'n' : ''}">${c[1]}</th>`).join('')}</tr></thead>`;
  const tr = (x, i) => `<tr data-krow="${x.id}" style="--r:${i}">${cols.map((c) => `<td class="${NUM.includes(c[0]) ? 'n' : ''}">${lCell(kind, x, c[0])}</td>`).join('')}</tr>`;
  let body, foot;
  if (L.group === 'none') { const pages = Math.ceil(r.length / L.per); L.page = Math.min(L.page, pages); const from = (L.page - 1) * L.per; body = `<tbody>${r.slice(from, from + L.per).map(tr).join('')}</tbody>`; foot = pager(L.page, pages, r.length, L.per, from); }
  else {
    const g = {}; r.forEach((x) => { const k = L.group === 't' ? x.t : x.mandor; (g[k] = g[k] || []).push(x); });
    body = Object.entries(g).sort((a, b) => b[1].length - a[1].length).map(([k, list]) => { const open = !L.closed.has(L.group + k), t = L.group === 't' ? typeOf(kind, +k) : null;
      const label = t ? tdot(t) : `<span class="jk"><i class="jk-d jk-0"></i>Mandor ${esc(k)}</span>`, meta = t ? `${fmt(list.reduce((a, x) => a + x.hasil, 0), 1)} ${CFG[kind].hasilUnit(t)} · ${fmt(list.reduce((a, x) => a + x.total, 0), kind === 'racun' ? 1 : 0)} ${CFG[kind].totalUnit}` : `${new Set(list.map((x) => x.t)).size} ${CFG[kind].typeLabel.toLowerCase()}`;
      return `<tbody class="grp ${open ? 'open' : ''}" data-kgk="${esc(k)}"><tr class="grp-h"><td colspan="${cols.length}"><button class="grp-btn" aria-expanded="${open}"><span class="caret">${ic('chev', 14)}</span>${label}<span class="grp-meta">${list.length} tugas · ${meta}</span><span class="grp-sum">Rp ${fmt(list.reduce((a, x) => a + x.gaji, 0))}</span></button></td></tr>${list.map(tr).join('')}</tbody>`; }).join('');
    foot = `<div class="f-pager"><span>${r.length} tugas</span><span class="pp"><b>Total gaji Rp ${fmt(r.reduce((a, x) => a + x.gaji, 0))}</b></span></div>`;
  }
  el.innerHTML = `<div class="f-tw" tabindex="0" aria-label="Tabel ${CFG[kind].title}"><table class="f-table">${head}${body}</table></div>${foot}`;
  $$('.grp-btn', el).forEach((b) => b.onclick = () => { const tb = b.closest('tbody'), k = L.group + tb.dataset.kgk, o = !tb.classList.contains('open'); tb.classList.toggle('open', o); b.setAttribute('aria-expanded', o); o ? L.closed.delete(k) : L.closed.add(k); });
  $$('tr[data-krow]', el).forEach((t) => t.addEventListener('click', () => kSheet(kind, +t.dataset.krow)));
  $$('[data-p]', el).forEach((b) => b.onclick = () => { L.page = +b.dataset.p; kTable(kind); });
  const per = $('[data-per]', el); if (per) per.onchange = (e) => { L.per = +e.target.value; L.page = 1; kTable(kind); };
}
function kSheet(kind, id, edit) {
  const x = DATA[kind].find((y) => y.id === id), t = typeOf(kind, x.t), cfg = CFG[kind];
  const body = edit ? `<form class="fs-form" novalidate><p class="mute">Butuh izin "${cfg.perm}".</p>
      <div class="wf"><label for="kH">Hasil <small>(${cfg.hasilUnit(t)})</small></label><input id="kH" type="number" step="any" min="0" value="${x.hasil}"><p class="w-msg" id="kMsg"></p></div>
      <div class="wf"><label for="kG">Total gaji (Rp)</label><input id="kG" type="number" step="100" min="0" value="${x.gaji}"></div>
      <div class="wf"><label for="kM">Material</label><input id="kM" value="${x.material === '-' ? '' : esc(x.material)}"></div>
      <div class="wf"><label for="kR">Remark</label><textarea id="kR" rows="3">${esc(x.remark)}</textarea></div></form>`
    : `<div class="fs-top">${stChip(x.status)}<span class="jk-pill"><i class="jk-d" style="background:${t.color}"></i>${esc(t.name)}</span>${x.ot ? '<span class="ot-y">Lembur (OT)</span>' : ''}</div>
      <div class="fs-figs"><div><span>Total</span><b>${fmt(x.total, kind === 'racun' ? 2 : 0)} <small style="font-family:var(--sans);font-size:12px;color:var(--muted)">${cfg.totalUnit}</small></b></div><div><span>Hasil</span><b>${fmt(x.hasil, kind === 'racun' ? 2 : 1)} <small style="font-family:var(--sans);font-size:12px;color:var(--muted)">${cfg.hasilUnit(t)}</small></b></div><div><span>Total gaji</span><b>Rp ${fmt(x.gaji)}</b></div></div>
      <div class="dose"><span>Dosis standar ${esc(t.name)}</span><b>${fmt(t.amount, 2)} ${USHORT[t.unit]} / ${kind === 'pupuk' ? 'pokok' : 'Ha'}</b><small>${METHODS[t.method]}${kind === 'pupuk' ? ` · ${t.freq}× per tahun` : ` · ${RTYPES[t.rtype]}`}</small></div>
      <h3>Data tugas</h3><dl class="fs-dl">${[['Task ID', '#' + x.id], ['Tanggal kerja', x.tgl], ['Pekerja', `${esc(x.pekerja)} (${x.pid})`], ['Task (unit)', x.rate], ['Mandor', x.mandor], ['Zone · Field', `${x.zone} · ${x.field}`], ['Blok', x.block], ...(kind === 'racun' ? [['Ancak', x.ancak]] : []), ['Material', x.material === '-' ? '—' : x.material], ['Remark', x.remark || '—']].map((d) => `<div><dt>${d[0]}</dt><dd>${d[1]}</dd></div>`).join('')}</dl>`;
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">${cfg.title}</p><h2>#${x.id}</h2><p class="mute">${esc(x.pekerja)} · ${x.zone} · Blok ${x.block}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div><div class="fs-b">${body}</div>
    <div class="fs-f">${edit ? `<button class="m-btn" id="kCancel">Batal</button><button class="m-btn pri" id="kSave">${ic('check')}Simpan perubahan</button>` : `<button class="m-btn" data-close>Tutup</button><button class="m-btn pri" id="kEdit">${ic('cols')}Ubah</button>`}</div>`, `Detail ${cfg.title} #${x.id}`);
  if (!edit) { $('#kEdit').onclick = () => kSheet(kind, id, true); return; }
  $('#kCancel').onclick = () => kSheet(kind, id);
  $('#kSave').onclick = () => { const h = $('#kH'); if (!(+h.value > 0)) { const w = h.closest('.wf'); w.classList.remove('err'); void w.offsetWidth; w.classList.add('err'); $('#kMsg').textContent = 'Hasil harus lebih dari 0.'; h.focus(); return; } x.hasil = +h.value; x.gaji = +$('#kG').value || 0; x.material = $('#kM').value || '-'; x.remark = $('#kR').value; H.toast(`Tugas #${x.id} diperbarui`); kTable(kind); kSheet(kind, id); };
  setTimeout(() => $('#kH').focus(), 60);
}

/* =====================================================================
   JENIS (pupuk-type / racun) — master data
   ===================================================================== */
const JV = { pupuk: { q: '', m: 'all', view: 'card' }, racun: { q: '', m: 'all', view: 'card' } };
function mountJenis(kind, root) {
  const types = CFG[kind].types, J = JV[kind], lab = kind === 'pupuk' ? 'pupuk' : 'racun';
  root.innerHTML = pageHead({ kicker: `Kebun · ${kind === 'pupuk' ? 'Pupuk' : 'Racun'} · Master data`, title: `Jenis ${kind === 'pupuk' ? 'Pupuk' : 'Racun'}`, sub: kind === 'pupuk' ? 'Daftar pupuk yang bisa dipilih mandor di tiket kerja: metode aplikasi, frekuensi per tahun, dan dosis per unit.' : 'Daftar racun yang bisa dipilih mandor di tiket kerja: bentuk, metode aplikasi, dan dosis per unit.', right: `<button class="f-btn" id="jNew">${ic('scan').replace(P_SCAN, P_PLUS)}Tambah jenis ${lab}</button>` }) + `
  <div class="wrap f-body">
    <section class="f-card frv" style="--i:2">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="jQ" type="search" placeholder="Cari nama, merek, keterangan…" value="${esc(J.q)}"></label>
        <div class="seg-s" role="group" aria-label="Metode">${[['all', 'Semua metode'], ...[...new Set(types.map((t) => t.method))].map((m) => [m, METHODS[m]])].map(([k, l]) => `<button data-jm="${k}" aria-pressed="${J.m === k}">${l}</button>`).join('')}</div>
        <div class="seg-s" role="group" aria-label="Tampilan"><button data-jv="card" aria-pressed="${J.view === 'card'}">Kartu</button><button data-jv="table" aria-pressed="${J.view === 'table'}">Tabel</button></div>
      </div>
      <div id="jList"></div>
    </section>
    <p class="f-note frv" style="--i:3">Menambah butuh izin "Jenis ${kind === 'pupuk' ? 'Pupuk' : 'Racun'} - Create", mengubah butuh "Jenis ${kind === 'pupuk' ? 'Pupuk' : 'Racun'} - Update". Jenis tidak bisa dihapus karena dipakai di riwayat tugas.</p>
  </div>`;
  $('#jQ').addEventListener('input', (e) => { J.q = e.target.value; jList(kind); });
  $$('[data-jm]', root).forEach((b) => b.onclick = () => { J.m = b.dataset.jm; $$('[data-jm]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); jList(kind); });
  $$('[data-jv]', root).forEach((b) => b.onclick = () => { J.view = b.dataset.jv; $$('[data-jv]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); jList(kind); });
  $('#jNew').onclick = () => jForm(kind, null);
  jList(kind);
}
const P_SCAN = K.P.scan, P_PLUS = '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>';
function jList(kind) {
  const J = JV[kind], q = J.q.toLowerCase(), el = $('#jList'), used = (id) => DATA[kind].filter((x) => x.t === id).length;
  const list = CFG[kind].types.filter((t) => (J.m === 'all' || t.method === J.m) && (!q || `${t.name} ${t.brand} ${t.desc}`.toLowerCase().includes(q)));
  if (!list.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada jenis yang cocok</h3></div>`; return; }
  if (J.view === 'table') {
    el.innerHTML = `<div class="f-tw"><table class="f-table"><thead><tr><th>#</th><th>Nama</th>${kind === 'racun' ? '<th>Type</th>' : ''}<th>Method</th>${kind === 'pupuk' ? '<th class="n">Frequency / tahun</th>' : ''}<th class="n">Amount per unit</th><th>Unit of measurement</th><th class="n">Dipakai</th></tr></thead><tbody>${list.map((t, i) => `<tr data-jt="${t.id}" style="--r:${i}"><td class="mute">${i + 1}</td><td>${tdot(t)}<small>${esc(t.brand)}</small></td>${kind === 'racun' ? `<td>${RTYPES[t.rtype]}</td>` : ''}<td>${METHODS[t.method]}</td>${kind === 'pupuk' ? `<td class="n">${t.freq}×</td>` : ''}<td class="n">${fmt(t.amount, 2)}</td><td>${UNITS[t.unit]}</td><td class="n">${used(t.id)} tugas</td></tr>`).join('')}</tbody></table></div>`;
  } else {
    el.innerHTML = `<div class="jn-grid">${list.map((t, i) => `<button class="jn-card" data-jt="${t.id}" style="--r:${i};--c:${t.color}"><span class="jn-top"><span class="jn-badge">${esc(t.name.slice(0, 2))}</span><span class="jn-m">${METHODS[t.method]}</span></span><b>${esc(t.name)}</b><small class="jn-brand">${esc(t.brand)}</small><span class="jn-desc">${esc(t.desc)}</span>
      <span class="jn-dose"><span><em>Dosis</em>${fmt(t.amount, 2)} ${USHORT[t.unit]} / ${kind === 'pupuk' ? 'pokok' : 'Ha'}</span><span><em>${kind === 'pupuk' ? 'Frekuensi' : 'Bentuk'}</em>${kind === 'pupuk' ? t.freq + '× / tahun' : RTYPES[t.rtype]}</span><span><em>Dipakai</em>${used(t.id)} tugas</span></span></button>`).join('')}</div>`;
  }
  $$('[data-jt]', el).forEach((b) => b.addEventListener('click', () => jForm(kind, +b.dataset.jt)));
}
function jForm(kind, id) {
  const t = id ? CFG[kind].types.find((x) => x.id === id) : { name: '', brand: '', desc: '', method: 'soil', freq: 1, amount: '', unit: 'kg', rtype: 'liquid' }, lab = kind === 'pupuk' ? 'pupuk' : 'racun';
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Jenis ${lab}</p><h2>${id ? esc(t.name) : 'Jenis ' + lab + ' baru'}</h2><p class="mute">${id ? 'Ubah data master. Tugas lama tetap memakai dosis yang berlaku saat itu.' : 'Akan muncul sebagai pilihan di aplikasi mandor.'}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b"><form class="fs-form" id="jF" novalidate>
    <div class="wf"><label for="jN">${kind === 'pupuk' ? 'Pupuk (HURUF BESAR)' : 'Nama'}</label><input id="jN" value="${esc(t.name)}" placeholder="${kind === 'pupuk' ? 'mis. NPK 15-15-15' : 'mis. GLIFOSAT 490 SL'}" autocapitalize="characters"><p class="w-msg" id="jNm"></p></div>
    <div class="wf"><label for="jB">Merek</label><input id="jB" value="${esc(t.brand)}" placeholder="Opsional"></div>
    <div class="wf"><label for="jD">Keterangan</label><textarea id="jD" rows="3">${esc(t.desc)}</textarea></div>
    ${kind === 'racun' ? `<div class="wf"><span class="lbl-s">Type</span><div class="radio-row" role="radiogroup" aria-label="Type">${Object.entries(RTYPES).map(([k, l]) => `<label><input type="radio" name="jT" value="${k}" ${t.rtype === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>` : ''}
    <div class="wf"><label for="jM">Method</label><select id="jM" class="sel">${Object.entries(METHODS).map(([k, l]) => `<option value="${k}" ${t.method === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="f2">${kind === 'pupuk' ? `<div class="wf"><label for="jFq">Frequency / tahun</label><input id="jFq" type="number" min="0" value="${t.freq}"></div>` : ''}<div class="wf"><label for="jA">Amount per unit</label><input id="jA" type="number" step="any" min="0" value="${t.amount}"><p class="w-msg" id="jAm"></p></div><div class="wf"><label for="jU">Unit of measurement</label><select id="jU" class="sel">${Object.entries(UNITS).map(([k, l]) => `<option value="${k}" ${t.unit === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <div class="dose" id="jPrev"></div>
  </form></div>
  <div class="fs-f"><button class="m-btn" data-close>Batal</button><button class="m-btn pri" id="jSave">${ic('check')}${id ? 'Simpan perubahan' : 'Tambah jenis ' + lab}</button></div>`, id ? `Ubah ${t.name}` : `Jenis ${lab} baru`);
  const prev = () => { $('#jPrev').innerHTML = `<span>Pratinjau di aplikasi mandor</span><b>${esc($('#jN').value || '—')}</b><small>${$('#jA').value || '0'} ${USHORT[$('#jU').value]} per ${kind === 'pupuk' ? 'pokok' : 'Ha'} · ${METHODS[$('#jM').value]}</small>`; };
  $('#jN').addEventListener('input', (e) => { const p = e.target.selectionStart; e.target.value = e.target.value.toUpperCase(); e.target.setSelectionRange(p, p); prev(); });
  ['#jA', '#jU', '#jM'].forEach((s) => $(s).addEventListener('input', prev)); prev();
  $('#jSave').onclick = () => {
    const n = $('#jN'), a = $('#jA'); let bad = null;
    [[n, !n.value.trim(), 'Nama wajib diisi.', '#jNm'], [a, !(+a.value > 0), 'Dosis harus lebih dari 0.', '#jAm']].forEach(([el, cond, msg, m]) => { const w = el.closest('.wf'); w.classList.remove('err'); $(m).textContent = ''; if (cond) { void w.offsetWidth; w.classList.add('err'); $(m).textContent = msg; bad = bad || el; } });
    if (bad) { bad.focus(); return; }
    const obj = id ? t : { id: CFG[kind].types.length + 1, color: dots[CFG[kind].types.length % dots.length] };
    Object.assign(obj, { name: n.value.trim(), brand: $('#jB').value, desc: $('#jD').value, method: $('#jM').value, amount: +a.value, unit: $('#jU').value }, kind === 'pupuk' ? { freq: +$('#jFq').value || 0 } : { rtype: ($('input[name=jT]:checked') || {}).value || 'liquid' });
    if (!id) CFG[kind].types.push(obj);
    K.closeSheet(); H.toast(id ? `${obj.name} diperbarui` : `${obj.name} ditambahkan`); jList(kind);
  };
  setTimeout(() => $('#jN').focus(), 60);
}

/* =====================================================================
   SCAN QR (scan-other-task?id=pupuk / racun)
   ===================================================================== */
const SC = {};
function mountScanK(kind, root) {
  const cfg = CFG[kind], lab = kind === 'pupuk' ? 'Pupuk' : 'Racun';
  const st = SC[kind] = { phase: 'idle', data: null, err: null, qr: '', no: '', count: SC[kind] ? SC[kind].count : 0, log: SC[kind] ? SC[kind].log : [{ no: `EMC-1106-${lab[0]}2`, t: '10:15', ok: 9, fail: 0 }, { no: `EMC-1106-${lab[0]}1`, t: '08:40', ok: 12, fail: kind === 'pupuk' ? 0 : 1 }, { no: `EMC-1105-${lab[0]}4`, t: 'Kemarin', ok: 11, fail: 0 }, { no: `EMC-1105-${lab[0]}3`, t: 'Kemarin', ok: 8, fail: 1 }] };
  root.innerHTML = pageHead({ kicker: `Kebun · ${lab}`, title: `Scan QR Tiket Kerja · ${lab}`, sub: `Scan QR tiket kerja ${lab.toLowerCase()} dari aplikasi mandor. Periksa pekerja, jenis ${lab.toLowerCase()}, dan gaji, lalu kirim ke ${cfg.title}.`, right: `<div class="m-today"><div><span>Laporan hari ini</span><b id="kToday">${st.log.filter((l) => l.t !== "Kemarin").length}</b><small>discan</small></div><div><span>Baris berhasil</span><b id="kOk">${st.log.filter((l) => l.t !== "Kemarin").reduce((a, l) => a + l.ok, 0)}</b><small>tugas</small></div></div>` }) + `
  <div class="wrap m-body">
    <ol class="m-steps frv" style="--i:2" id="kSteps" aria-label="Langkah"><li data-s="1"><span class="n">1</span><span class="t"><b>Scan QR tiket kerja</b><small>Dari aplikasi mandor</small></span></li><li data-s="2"><span class="n">2</span><span class="t"><b>Periksa & sesuaikan</b><small>Pekerja, ${lab.toLowerCase()}, gaji</small></span></li><li data-s="3"><span class="n">3</span><span class="t"><b>Kirim laporan</b><small>Masuk ke ${cfg.title}</small></span></li></ol>
    <div class="b-grid"><section class="m-scan frv ga-scan" style="--i:3" id="kScan"></section><section class="m-weigh frv ga-side" style="--i:4" id="kSide"></section><section class="ga-load" id="kLoad"></section><section class="m-log frv ga-log" style="--i:5"><h2>Laporan terakhir</h2><ul id="kLog"></ul></section></div>
    <section class="m-tasks" id="kTbl"></section>
  </div>`;
  kAll(kind);
}
function kBuild(kind, i) {
  const r = rng((kind === 'pupuk' ? 411 : 611) + i * 47), int = (a, b) => Math.floor(a + r() * (b - a + 1)), zk = Object.keys(ZONES), zone = zk[(i + 1) % zk.length], mandor = MANDORS[(i + 1) % MANDORS.length], types = CFG[kind].types;
  const rows = Array.from({ length: 8 + (i % 3) }, (_, n) => { const t = types[n % Math.min(4, types.length)], bad = n === 5 && kind === 'racun', badP = n === 3 && i % 2 === 0, total = kind === 'pupuk' ? int(60, 160) : +(0.8 + r() * 2).toFixed(2);
    return { tgl: `06/11/2026 ${pad(int(6, 9))}:${pad(int(0, 59))}`, field: zone, block: 'ABCDEFGH'[int(0, 7)] + pad(int(1, 32)), pekerja: badP ? '[GW-9077] Tidak terdaftar' : `[GW-${int(1000, 4999)}] ${NAMES[(n + i * 2) % NAMES.length]}`, pOk: !badP, mandor, jk: kind === 'pupuk' ? 'Tabur pupuk' : 'Semprot piringan', rOk: !bad, t: bad ? null : t, unit: bad ? '-' : USHORT[t.unit], total, ket: n % 4 === 2 ? (kind === 'pupuk' ? 'Piringan basah' : 'Angin kencang') : '-', gaji: bad ? 0 : Math.round((kind === 'pupuk' ? total * 520 : total * 92000) / 100) * 100 }; });
  return { zone, mandor, rows, by: ['Dewi Kartika', 'Rahmat Hidayat'][i % 2], remark: `${kind === 'pupuk' ? 'Pemupukan' : 'Penyemprotan'} ${zone}, mandor ${mandor}.` };
}
function kAll(kind) { kSteps(kind); kScanC(kind); kSide(kind); kLoad(kind); kTbl(kind); kLog(kind); }
function kSteps(kind) { const at = { idle: 1, scanning: 1, error: 1, loaded: 2, submitting: 3, done: 3 }[SC[kind].phase]; $$('#kSteps li').forEach((li) => { const n = +li.dataset.s; li.classList.toggle('on', n === at); li.classList.toggle('done', n < at || SC[kind].phase === 'done'); }); }
const kTot = (kind) => SC[kind].data ? SC[kind].data.rows.reduce((a, x) => a + (+x.gaji || 0), 0) : 0;
function kScanC(kind) {
  const S = SC[kind], c = $('#kScan'), busy = S.phase === 'scanning', locked = ['loaded', 'submitting'].includes(S.phase), d = S.data, lab = kind === 'pupuk' ? 'pupuk' : 'racun';
  c.className = `m-scan frv ga-scan ${S.phase}`;
  const chk = d ? (() => { const bp = d.rows.filter((x) => !x.pOk).length, br = d.rows.filter((x) => !x.rOk).length, ok = d.rows.filter((x) => x.pOk && x.rOk).length; return `<ul class="chk-list"><li class="ok">${ic('check', 16)}<span><b>${ok} baris siap dikirim</b>Pekerja dan jenis ${lab} dikenali.</span></li><li class="${bp ? 'bad' : 'ok'}">${ic(bp ? 'alert' : 'check', 16)}<span><b>${bp ? bp + ' pekerja tidak terdaftar' : 'Semua pekerja terdaftar'}</b>${bp ? 'Baris ini akan gagal saat dikirim.' : 'Cocok dengan data pekerja.'}</span></li><li class="${br ? 'bad' : 'ok'}">${ic(br ? 'alert' : 'check', 16)}<span><b>${br ? br + ' jenis ' + lab + ' tidak dikenal' : 'Semua jenis ' + lab + ' dikenal'}</b>${br ? 'Tambahkan dulu di Jenis ' + (kind === 'pupuk' ? 'Pupuk' : 'Racun') + '.' : 'Ada di master Jenis ' + (kind === 'pupuk' ? 'Pupuk' : 'Racun') + '.'}</span></li></ul>`; })() : '';
  c.innerHTML = `<div class="sc-top"><div class="sc-ico ${busy ? 'busy' : ''}">${ic('scan', 26)}</div><div><h2>${locked ? 'Tiket kerja terbaca' : S.phase === 'done' ? 'Siap untuk laporan berikutnya' : 'Scan QR tiket kerja · ' + (kind === 'pupuk' ? 'Pupuk' : 'Racun')}</h2><p>${locked ? 'Periksa daftar di bawah. Baris bertanda merah akan gagal saat dikirim.' : 'Arahkan scanner ke QR tiket kerja di HP mandor. Data dibaca otomatis saat scanner mengirim Enter.'}</p></div></div>
    <div class="sc-field"><label for="kQr" class="sr">Kode QR</label><input id="kQr" autocomplete="off" spellcheck="false" placeholder="${locked ? '' : 'Menunggu scan…'}" value="${S.qr}" ${locked || busy ? 'readonly' : ''}><span class="sc-state">${busy ? '<i class="spin"></i>Membaca…' : locked ? `${ic('check', 16)}Valid · ${d.rows.length} baris` : '<i class="beam"></i>Siap'}</span></div>
    <p class="sc-msg" role="alert">${S.err ? `${ic('alert', 16)}<span><b>Pemindaian gagal.</b> ${S.err}</span>` : ''}</p>
    ${locked ? `<div class="qr-sum"><div><span>Field</span><b>${d.zone}</b></div><div><span>Mandor</span><b>${d.mandor}</b></div><div><span>Pekerja</span><b>${new Set(d.rows.map((x) => x.pekerja)).size}</b></div><div><span>Jenis ${lab}</span><b>${new Set(d.rows.filter((x) => x.t).map((x) => x.t.id)).size}</b></div></div>${chk}` : busy ? '' : `<ul class="sc-tips"><li><b>1</b><span>Kursor otomatis berada di kolom scan.</span></li><li><b>2</b><span>Satu QR berisi semua tugas ${lab} dari satu laporan mandor.</span></li><li><b>3</b><span>Gaji bisa disesuaikan per baris sebelum dikirim.</span></li></ul>`}
    <div class="sc-demo">${locked ? `<button class="m-btn" id="kRescan">${ic('undo', 16)}Batal & scan ulang</button>` : `<span>Simulasi:</span><button class="chipbtn" data-kd="ok">Scan valid</button><button class="chipbtn" data-kd="bad">QR tidak dikenali</button><button class="chipbtn" data-kd="dup">Tiket sudah di-scan</button>`}</div>`;
  const q = $('#kQr'); q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); kDo(kind, q.value.trim()); } });
  $$('[data-kd]', c).forEach((b) => b.onclick = () => kDemo(kind, b.dataset.kd));
  const rs = $('#kRescan'); if (rs) rs.onclick = () => { Object.assign(S, { phase: 'idle', data: null, err: null, qr: '' }); kAll(kind); kFocus(); };
}
function kSide(kind) {
  const S = SC[kind], c = $('#kSide'), d = S.data, on = ['loaded', 'submitting'].includes(S.phase), cfg = CFG[kind];
  c.className = `m-weigh frv ga-side ${on || S.phase === 'done' ? '' : 'off'} ${S.phase === 'done' ? 'done' : ''}`;
  if (S.phase === 'done') { const R = S.result; c.innerHTML = `<div class="ok-mark ${R.fail.length ? 'warn' : ''}">${ic(R.fail.length ? 'alert' : 'check', 30)}</div><h2>Laporan terkirim</h2><p>Data masuk ke ${cfg.title}.</p><dl class="done-sum"><div><dt>Berhasil</dt><dd>${R.ok} baris</dd></div><div><dt>Gagal</dt><dd>${R.fail.length} baris</dd></div><div><dt>No laporan</dt><dd>${R.no}</dd></div><div><dt>Total gaji</dt><dd>Rp ${fmt(R.gaji)}</dd></div></dl>${R.fail.length ? `<ul class="fail-list">${R.fail.map((f) => `<li>${ic('alert', 14)}${f}</li>`).join('')}</ul>` : ''}<div class="w-acts"><a class="m-btn" href="#${cfg.listRoute}">${ic('file')}Lihat ${cfg.title}</a><button class="m-btn pri" id="kNext">${ic('scan')}Scan berikutnya</button></div>`; $('#kNext').onclick = () => { Object.assign(S, { phase: 'idle', data: null, err: null, qr: '' }); kAll(kind); kFocus(); }; return; }
  c.innerHTML = `<h2>${ic('file', 20)}Laporan</h2>
    <div class="wf"><label>Laporan dibuat oleh</label><input value="${d ? d.by : ''}" placeholder="Terisi dari QR" readonly></div>
    <div class="wf ${S.noErr ? 'err' : ''}"><label for="kNo">No laporan</label><div class="no-in"><span>EMC</span><input id="kNo" value="${esc(S.no)}" placeholder="mis. 1106-${kind === 'pupuk' ? 'P3' : 'R2'}" ${on ? '' : 'disabled'}></div><p class="w-msg" id="kNoM">${S.noErr || ''}</p></div>
    <div class="wf"><label for="kRem">Keterangan</label><textarea id="kRem" rows="3" readonly placeholder="Terisi dari QR">${d ? esc(d.remark) : ''}</textarea></div>
    <div class="gaji-tot"><span>Total gaji</span><b id="kTotS">${d ? 'Rp ' + fmt(kTot(kind)) : '—'}</b></div>
    <button class="m-btn pri big" id="kSub" ${on ? '' : 'disabled'}><span class="lbl">${S.phase === 'submitting' ? 'Mengirim…' : 'Kirim laporan'}</span>${S.phase === 'submitting' ? '<i class="spin w"></i>' : ''}</button>
    <p class="w-note">${on ? 'Anda akan diminta konfirmasi sebelum dikirim.' : 'Aktif setelah QR tiket kerja dipindai.'}</p>`;
  if (!on) return;
  $('#kNo').addEventListener('input', (e) => { S.no = e.target.value; if (S.noErr && S.no.trim()) { S.noErr = null; e.target.closest('.wf').classList.remove('err'); $('#kNoM').textContent = ''; } });
  $('#kNo').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); kSubmit(kind); } });
  $('#kSub').onclick = () => kSubmit(kind);
}
function kLoad(kind) {
  const S = SC[kind], c = $('#kLoad'), d = S.data, cfg = CFG[kind];
  if (!d || S.phase === 'done') { c.innerHTML = `<div class="m-empty"><div class="pl-ghost" aria-hidden="true">${kind === 'pupuk' ? 'PPK' : 'RCN'}</div><p>${S.phase === 'done' ? 'Laporan sudah dikirim.' : 'Pemakaian ' + (kind === 'pupuk' ? 'pupuk' : 'racun') + ' dan gaji per jenis akan muncul di sini setelah QR dipindai.'}</p></div>`; return; }
  const by = {}; d.rows.filter((x) => x.t).forEach((x) => { by[x.t.id] = by[x.t.id] || { t: x.t, total: 0, g: 0, n: 0 }; by[x.t.id].total += x.total; by[x.t.id].g += x.gaji; by[x.t.id].n++; });
  const ent = Object.values(by).sort((a, b) => b.g - a.g), max = Math.max(...ent.map((e) => e.g));
  c.innerHTML = `<div class="b-break one"><div><h3>Pemakaian per jenis ${kind === 'pupuk' ? 'pupuk' : 'racun'}</h3><div class="b-bars wide">${ent.map((v) => { const need = v.total * (v.t.unit === 'g' || v.t.unit === 'ml' ? v.t.amount / 1000 : v.t.amount); return `<div class="bb"><span class="jk"><i class="jk-d" style="background:${v.t.color}"></i>${esc(v.t.name)}<small>${v.n} baris · ${fmt(v.total, kind === 'racun' ? 2 : 0)} ${cfg.totalUnit} · ≈ ${fmt(need, 1)} ${cfg.hasilUnit(v.t)}</small></span><span class="bar"><i style="--w:${(v.g / max).toFixed(3)}"></i></span><b>Rp ${fmt(v.g)}</b></div>`; }).join('')}</div></div></div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.b-bars .bar i', c).forEach((i) => i.classList.add('go'))));
}
function kTbl(kind) {
  const S = SC[kind], c = $('#kTbl'), d = S.data, lab = kind === 'pupuk' ? 'Pupuk' : 'Racun';
  if (!d || S.phase === 'done') { c.innerHTML = ''; c.classList.remove('show'); return; }
  c.innerHTML = `<div class="tk-h"><h2>Tugas dalam tiket kerja</h2><span class="pill">${d.rows.length} baris</span><div class="tk-leg"><span><i class="b-bad"></i>Tidak terdaftar / tidak dikenal</span></div></div>
  <div class="tk-wrap" tabindex="0" aria-label="Tabel tugas ${lab.toLowerCase()}"><table class="tk"><thead><tr><th>No</th><th>Tanggal</th><th>Field</th><th>Blok</th><th>Pekerja</th><th>Pengawas / mandor</th><th>Jenis kerja</th><th>Jenis ${lab.toLowerCase()}</th><th>Unit</th><th class="n">Total</th><th>Keterangan</th><th class="n">Gaji (Rp)</th></tr></thead>
  <tbody>${d.rows.map((x, i) => `<tr style="--r:${i}" class="${!x.pOk || !x.rOk ? 'row-bad' : ''}"><td class="n mute">${i + 1}</td><td>${x.tgl.slice(11)}<small>${x.tgl.slice(0, 10)}</small></td><td>${x.field}</td><td><b>${x.block}</b></td><td class="${x.pOk ? '' : 'flag'}">${x.pekerja.replace(/^\[[^\]]+\]\s*/, '')}<small>${x.pekerja.match(/^\[([^\]]+)\]/)[1]}</small></td><td>${x.mandor}</td><td>${x.jk}</td><td class="${x.rOk ? '' : 'flag'}">${x.t ? esc(x.t.name) : 'TIDAK DIKENAL'}</td><td>${x.unit}</td><td class="n">${fmt(x.total, kind === 'racun' ? 2 : 0)}</td><td class="mute">${x.ket}</td><td class="n"><label class="sr" for="kg${i}">Gaji baris ${i + 1}</label><input class="gaji-in" id="kg${i}" data-kgi="${i}" type="number" step="100" min="0" value="${x.gaji}" ${S.phase === 'submitting' ? 'disabled' : ''}></td></tr>`).join('')}</tbody>
  <tfoot><tr><td colspan="11">Total gaji</td><td class="n" id="kFoot">Rp ${fmt(kTot(kind))}</td></tr></tfoot></table></div><p class="tk-note">Total untuk pupuk dalam pokok, untuk racun dalam Ha. Gaji bisa diubah per baris sebelum dikirim.</p>`;
  $$('[data-kgi]', c).forEach((inp) => inp.addEventListener('input', () => { S.data.rows[+inp.dataset.kgi].gaji = +inp.value || 0; const t = 'Rp ' + fmt(kTot(kind)); $('#kFoot').textContent = t; const s = $('#kTotS'); if (s) { s.textContent = t; s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); } }));
  c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
}
function kLog(kind) { $('#kLog').innerHTML = SC[kind].log.slice(0, 4).map((l, i) => `<li class="${i === 0 && l.fresh ? 'fresh' : ''}"><div><b>${l.no}</b><span>${l.ok} berhasil${l.fail ? ` · <em class="bad-t">${l.fail} gagal</em>` : ''}</span></div><div class="r"><b>${l.t}</b><span>dikirim</span></div><a class="lg-p" href="#${CFG[kind].listRoute}" aria-label="Lihat di ${CFG[kind].title}">${ic('chev', 16)}</a></li>`).join(''); }
function kFocus() { setTimeout(() => { const q = $('#kQr'); if (q && !q.readOnly) q.focus({ preventScroll: true }); }, H.reduced() ? 0 : 80); }
function kDemo(kind, k) { const S = SC[kind], code = k === 'bad' ? 'ab' + Math.random().toString(16).slice(2, 12) : k === 'dup' ? '1fDUP' + 'c3'.repeat(10) : '1f8b0800' + (7321 + S.count * 377).toString(16) + 'cafe' + 'e5'.repeat(16); const q = $('#kQr'); if (H.reduced()) { q.value = code; kDo(kind, code); return; } let i = 0; q.value = ''; q.focus(); const tick = () => { i += 6; q.value = code.slice(0, i); if (i < code.length) requestAnimationFrame(tick); else setTimeout(() => kDo(kind, code), 120); }; requestAnimationFrame(tick); }
async function kDo(kind, code) {
  const S = SC[kind];
  const fail = (m) => { S.phase = 'error'; S.err = m; S.qr = ''; kSteps(kind); kScanC(kind); const f = $('#kScan .sc-field'); if (f && !H.reduced()) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); } kFocus(); };
  if (!code) return fail('Harap scan masuk QR code.');
  S.qr = code; S.err = null; S.phase = 'scanning'; kSteps(kind); kScanC(kind); await wait(700);
  if (code.startsWith('1fDUP')) return fail('Tiket ini sudah di-scan.');
  if (code.slice(0, 2).toLowerCase() !== '1f') return fail('QR Code tidak dikenali. Harap scan QR code semula.');
  S.data = kBuild(kind, S.count); S.phase = 'loaded'; S.no = ''; S.noErr = null; kAll(kind);
  setTimeout(() => $('#kNo') && $('#kNo').focus({ preventScroll: true }), H.reduced() ? 0 : 360);
}
async function kSubmit(kind) {
  const S = SC[kind], d = S.data, cfg = CFG[kind];
  if (!S.no.trim()) { S.noErr = 'Isi nomor laporan terlebih dahulu.'; const w = $('#kNo').closest('.wf'); w.classList.remove('err'); void w.offsetWidth; w.classList.add('err'); $('#kNoM').textContent = S.noErr; $('#kNo').focus(); return; }
  const bad = d.rows.filter((x) => !x.pOk || !x.rOk);
  if (!(await confirmBox('Kirim laporan ini?', `${d.rows.length - bad.length} baris akan disimpan ke ${cfg.title}${bad.length ? `, ${bad.length} baris akan gagal` : ''}.`, 'Konfirmasi & kirim'))) return;
  S.phase = 'submitting'; kSteps(kind); kSide(kind); kTbl(kind); await wait(1100);
  const no = 'EMC-' + S.no.trim(), t = '11:' + String(40 + S.count).padStart(2, '0');
  S.result = { ok: d.rows.length - bad.length, fail: bad.map((x) => `Baris ${d.rows.indexOf(x) + 1}: ${!x.pOk ? 'pekerja tidak terdaftar' : 'jenis ' + (kind === 'pupuk' ? 'pupuk' : 'racun') + ' tidak dikenal'}`), no, gaji: d.rows.filter((x) => x.pOk && x.rOk).reduce((a, x) => a + x.gaji, 0) };
  S.log.forEach((l) => delete l.fresh); S.log.unshift({ no, t, ok: S.result.ok, fail: S.result.fail.length, fresh: true });
  S.count++; S.phase = 'done'; S.qr = ''; $("#kToday").textContent = S.log.filter((l) => l.t !== "Kemarin").length; $("#kOk").textContent = S.log.filter((l) => l.t !== "Kemarin").reduce((a, l) => a + l.ok, 0);
  kAll(kind); H.toast(`Berhasil: ${S.result.ok} · Gagal: ${S.result.fail.length}`); setTimeout(() => $('#kNext') && $('#kNext').focus({ preventScroll: true }), H.reduced() ? 0 : 300);
}

/* =====================================================================
   HARVEST INTERVAL — /admin/intervalreporting
   ===================================================================== */
const IV = { zone: 'EMU1', gang: 'all', mode: 'actual', month: '2026-11', dirty: false, plan: {} };
const DAYS = 30, TODAY = 6;
function ivData(zone) {
  const r = rng(zone.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 31), int = (a, b) => Math.floor(a + r() * (b - a + 1)), out = [];
  const fields = [zone + '-A', zone + '-B', zone + '-C'];
  fields.forEach((f, fi) => { for (let b = 0; b < 6; b++) { const code = 'ABCDEFGH'[fi * 2 + (b % 2)] + pad(b * 3 + int(1, 3)), rot = int(6, 12), gang = ZONES[zone] ? ZONES[zone][(fi + b) % ZONES[zone].length] : 'PN1'; let last = -int(0, rot + 4); const cells = [];
    const harvested = new Set(); for (let d = 1; d <= TODAY; d++) { if (d - last >= rot + (r() < .3 ? int(1, 6) : 0)) { harvested.add(d); last = d; } }
    let lh = harvested.size ? null : null; let since = int(4, 9);
    for (let d = 1; d <= DAYS; d++) { if (d > TODAY) { cells.push(null); continue; } if (harvested.has(d)) { cells.push('H'); since = 0; } else { since++; cells.push(since); } }
    out.push({ field: f, block: code, gang, rot, cells, planDays: Array.from({ length: Math.ceil((DAYS - TODAY) / rot) }, (_, k) => TODAY + 2 + k * rot).filter((d) => d <= DAYS) }); } });
  return out;
}
function mountInterval(root) {
  root.innerHTML = pageHead({ kicker: 'Kebun · Harvest Interval', title: 'Harvest Interval', sub: 'Rotasi panen tiap blok dalam sebulan. Angka = hari sejak panen terakhir; H = hari dipanen. Mode Rencana untuk menyusun jadwal panen berikutnya.', right: `<button class="f-btn" id="ivPdf">${ic('dl')}Export PDF</button>` }) + `
  <div class="wrap f-body">
    <section class="f-card frv" style="--i:2">
      <div class="f-tools">
        <label class="ff-sel"><span class="lbl-s">Bulan</span><input type="month" id="ivMonth" value="${IV.month}" class="mon"></label>
        <label class="ff-sel"><span class="lbl-s">Zone</span><select id="ivZone">${Object.keys(ZONES).map((z) => `<option ${IV.zone === z ? 'selected' : ''}>${z}</option>`).join('')}</select></label>
        <label class="ff-sel"><span class="lbl-s">Gang</span><select id="ivGang"><option value="all">Semua gang</option>${ZONES[IV.zone].map((g) => `<option ${IV.gang === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
        <div class="ff-g"><span class="lbl-s">Interval</span><div class="seg-s" role="group" aria-label="Mode interval">${[['actual', 'Aktual'], ['plan', 'Rencana'], ['both', 'Aktual & rencana']].map(([k, l]) => `<button data-ivm="${k}" aria-pressed="${IV.mode === k}">${l}</button>`).join('')}</div></div>
        <button class="m-btn pri" id="ivSave" ${IV.dirty ? '' : 'disabled'}>${ic('check', 16)}Simpan rencana</button>
      </div>
      <div class="iv-kpi" id="ivKpi"></div>
      <div class="iv-leg"><span><i class="ivlg-h"></i>Dipanen (H)</span><span><i class="ivlg-p"></i>Rencana panen</span><span><i class="ivlg-ok"></i>≤ 10 hari</span><span><i class="ivlg-w"></i>11–14 hari</span><span><i class="ivlg-b"></i>&gt; 14 hari</span><span class="iv-tip" id="ivTip">${IV.mode === 'actual' ? 'Pilih mode Rencana untuk menandai hari panen.' : 'Klik sel kosong setelah hari ini untuk menambah atau menghapus rencana panen.'}</span></div>
      <div class="iv-wrap" id="ivWrap" tabindex="0" aria-label="Tabel harvest interval"></div>
    </section>
  </div>`;
  $('#ivZone').onchange = (e) => { IV.zone = e.target.value; IV.gang = 'all'; IV.plan = {}; IV.dirty = false; mountInterval(root); start(root); };
  $('#ivGang').onchange = (e) => { IV.gang = e.target.value; ivGrid(); };
  $('#ivMonth').onchange = (e) => { IV.month = e.target.value; H.toast('Menampilkan ' + e.target.value); };
  $$('[data-ivm]', root).forEach((b) => b.onclick = () => { IV.mode = b.dataset.ivm; $$('[data-ivm]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); $('#ivTip').textContent = IV.mode === 'actual' ? 'Pilih mode Rencana untuk menandai hari panen.' : 'Klik sel kosong setelah hari ini untuk menambah atau menghapus rencana panen.'; ivGrid(); });
  $('#ivSave').onclick = () => { IV.dirty = false; $('#ivSave').disabled = true; H.toast('Rencana panen tersimpan'); };
  $('#ivPdf').onclick = () => H.toast('Mengekspor harvest interval ke PDF…');
  ivGrid();
}
function ivGrid() {
  const all = ivData(IV.zone), rows = all.filter((b) => IV.gang === 'all' || b.gang === IV.gang), showPlan = IV.mode !== 'actual', showAct = IV.mode !== 'plan';
  const lastSince = rows.map((b) => { const v = b.cells.slice(0, TODAY); const l = v[v.length - 1]; return l === 'H' ? 0 : l; });
  $('#ivKpi').innerHTML = [['Blok', rows.length, ''], ['Rata-rata rotasi', fmt(rows.reduce((a, b) => a + b.rot, 0) / (rows.length || 1), 1), 'hari'], ['11–14 hari', lastSince.filter((x) => x > 10 && x <= 14).length, 'blok'], ['Lewat 14 hari', lastSince.filter((x) => x > 14).length, 'blok']].map((k, i) => `<div class="${i === 3 && k[1] ? 'bad' : i === 2 && k[1] ? 'warn' : ''}"><span>${k[0]}</span><b>${k[1]}</b><small>${k[2]}</small></div>`).join('');
  let lastField = '';
  const body = rows.map((b, ri) => { const key = b.field + b.block, plans = IV.plan[key] || new Set(b.planDays); IV.plan[key] = plans;
    const fieldRow = b.field !== lastField ? `<tr class="iv-field"><th scope="rowgroup" colspan="${DAYS + 2}">${b.field}</th></tr>` : ''; lastField = b.field;
    return fieldRow + `<tr data-iv="${key}" style="--r:${ri}"><th scope="row" class="iv-b"><b>${b.block}</b><small>${b.gang} · rotasi ${b.rot} h</small></th>${b.cells.map((v, d) => { const day = d + 1;
      if (day > TODAY) { const p = showPlan && plans.has(day); return `<td class="fut ${p ? 'plan' : ''} ${showPlan ? 'click' : ''}" data-d="${day}" ${showPlan ? `tabindex="0" role="button" aria-pressed="${p}" aria-label="${b.block} tanggal ${day}${p ? ', rencana panen' : ''}"` : ''}>${p ? 'H' : ''}</td>`; }
      if (!showAct) return '<td class="mute-c"></td>';
      if (v === 'H') return `<td class="h" title="${b.block}: dipanen tanggal ${day}">H</td>`;
      return `<td class="${v > 14 ? 'b' : v > 10 ? 'w' : ''}" title="${b.block}: ${v} hari sejak panen terakhir">${v}</td>`; }).join('')}<td class="iv-last ${lastSince[ri] > 14 ? 'b' : lastSince[ri] > 10 ? 'w' : ''}">${lastSince[ri] === 0 ? 'H' : lastSince[ri]}</td></tr>`; }).join('');
  $('#ivWrap').innerHTML = `<table class="iv"><thead><tr><th class="iv-b">(Field) Blok</th>${Array.from({ length: DAYS }, (_, i) => `<th class="${i + 1 === TODAY ? 'today' : ''} ${[1, 8, 15, 22, 29].includes(i + 1) ? 'sun' : ''}" scope="col">${i + 1}</th>`).join('')}<th scope="col">Hari ini</th></tr></thead><tbody>${body}</tbody></table>`;
  const tbl = $('#ivWrap table');
  tbl.addEventListener('mouseover', (e) => { const td = e.target.closest('td,th'); $$('.col-hi', tbl).forEach((x) => x.classList.remove('col-hi')); if (!td || !td.parentElement) return; const idx = [...td.parentElement.children].indexOf(td); if (idx < 1) return; $$('tr', tbl).forEach((tr) => { const c = tr.children[idx]; if (c && !tr.classList.contains('iv-field')) c.classList.add('col-hi'); }); });
  tbl.addEventListener('mouseleave', () => $$('.col-hi', tbl).forEach((x) => x.classList.remove('col-hi')));
  const toggle = (td) => { if (!td || !td.classList.contains('click')) return; const key = td.parentElement.dataset.iv, d = +td.dataset.d, s = IV.plan[key]; s.has(d) ? s.delete(d) : s.add(d); const on = s.has(d); td.classList.toggle('plan', on); td.textContent = on ? 'H' : ''; td.setAttribute('aria-pressed', on); td.classList.remove('pop'); void td.offsetWidth; td.classList.add('pop'); IV.dirty = true; $('#ivSave').disabled = false; };
  tbl.addEventListener('click', (e) => toggle(e.target.closest('td.click')));
  tbl.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('td.click')) { e.preventDefault(); toggle(e.target); } });
  const w = $('#ivWrap'), th = tbl.querySelector('thead th.today'); if (th) w.scrollLeft = 0;
}

/* ---------------- public ---------------- */
let cur = null;
const reg = (name, fn, after) => ({ mount(el, h) { H = { ...H, ...h }; cur = el; fn(el); }, start() { start(cur); after && after(); } });
Object.assign(window.FFBPages, {
  pupuk: reg('pupuk', (el) => mountTaskList('pupuk', el)), racun: reg('racun', (el) => mountTaskList('racun', el)),
  'pupuk-jenis': reg('pj', (el) => mountJenis('pupuk', el)), 'racun-jenis': reg('rj', (el) => mountJenis('racun', el)),
  'scan-pupuk': reg('sp', (el) => mountScanK('pupuk', el), kFocus), 'scan-racun': reg('sr', (el) => mountScanK('racun', el), kFocus),
  interval: reg('iv', mountInterval)
});
})();
