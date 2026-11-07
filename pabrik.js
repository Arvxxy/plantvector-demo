/* Mill menu: ABW bulanan, Tonase harian mill, Kontraktor, Truk & supir.
   Sources: AbwCrudController (/admin/abw: calc_month, zone, block, tandan, tonase, abw, tonase training/brondol/partheno,
   status Pending/Confirmed, sync_abw, bulk update, FA-only edit, calc_wages), AbwController@getReportChartAbw
   (/admin/abw-daily-chart: "Daily Mill Received Tonnage" per jam + truk), ContractorCrudController (/admin/contractor:
   foto, nama, kontak, group Internal/External, desa, status), TruckCrudController (/admin/truck: foto, kontraktor,
   supir, kontak, plat, no SIM, type FFB/CPO/PK/EFB/MF/DC/MIKO, status Active/Inactive/Blacklist, QR). Data is dummy. */
(() => {
'use strict';
const K = window.FFBKit; if (!K) return;
const { $, $$, fmt, esc, ic, rng, pad, pageHead, menuBtn, bindDropdowns, closeAllDD, pager, openSheet, closeSheet, confirmBox, start, ZONES } = K;
let H = { reduced: () => false, toast: () => {} };
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN_L = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/* ---------- wages (same formula as AbwCrudController::calc_wages) ---------- */
function calcWages(tahunTanam, produksiTon) {
  const basis = 1.65, old = tahunTanam <= 2009, hb = old ? 85000 : 80000, p1 = old ? 15000 : 10000, p2 = 20000;
  const mt = Math.min(produksiTon, basis), lebih = Math.max(0, produksiTon - basis), hp = lebih >= .85 ? p2 : p1;
  return mt * hb + (hp + hb) * lebih;
}

/* =====================================================================
   ABW BULANAN — /admin/abw
   ===================================================================== */
const ABW = (() => { const out = []; let id = 3120;
  [[2026, 9], [2026, 8], [2026, 7]].forEach(([y, m], mi) => Object.keys(ZONES).forEach((z, zi) => { const r = rng(y * 100 + m * 7 + zi * 31);
    const base = 22.2 + zi * .7;
    for (let b = 0; b < 6; b++) { const blk = 'ABCDEFGH'[(zi + b) % 8] + pad(1 + Math.floor(r() * 32)), tt = [2004, 2006, 2008, 2010, 2012, 2015][Math.floor(r() * 6)];
      const tandan = Math.round(2400 + r() * 5200), abw = +(base + (2015 - tt) * .18 + (r() - .5) * 3.2).toFixed(2), tonase = Math.round(tandan * abw);
      out.push({ id: id--, y, m, zone: z, block: blk, tt, tandan, tonase, abw, prev: +(abw + (r() - .5) * 1.6).toFixed(2), tp: Math.round(tonase * (.004 + r() * .01)), br: Math.round(tonase * (.02 + r() * .025)), pa: Math.round(tonase * r() * .006), status: mi === 0 ? (r() < .55 ? 0 : 1) : 1, upd: `${pad(1 + Math.floor(r() * 5))}/${pad(m + 1)}/2026 ${pad(8 + Math.floor(r() * 9))}:${pad(Math.floor(r() * 60))}` }); } }));
  return out; })();
const A = { ym: '2026-10', zone: [], st: 'all', q: '', sel: new Set(), page: 1, per: 25, sort: ['zone', 1] };
const abwChip = (s) => s ? '<span class="st-chip t-ok">Confirmed</span>' : '<span class="st-chip t-warn">Pending</span>';
function aRows() { const [y, m] = A.ym.split('-').map(Number), q = A.q.toLowerCase();
  let r = ABW.filter((x) => x.y === y && x.m + 1 === m && (!A.zone.length || A.zone.includes(x.zone)) && (A.st === 'all' || x.status === +A.st) && (!q || `${x.zone} ${x.block}`.toLowerCase().includes(q)));
  const [k, d] = A.sort; return r.slice().sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : (a.block > b.block ? 1 : -1)) * d); }
function mountAbw(root) {
  const months = [...new Set(ABW.map((x) => `${x.y}-${pad(x.m + 1)}`))];
  root.innerHTML = pageHead({ kicker: 'Mill · ABW', title: 'ABW Bulanan', sub: 'Average Bunch Weight per blok tiap bulan: tonase timbangan mill dibagi jumlah tandan. Setelah dikonfirmasi FA, berat dan upah panen di semua tugas blok itu dihitung ulang.', right: `<button class="f-btn" id="abSync">${ic('refresh')}Sinkron dari Surat Jalan</button>${menuBtn('abx', 'Ekspor', 'dl', [['xlsx', 'Excel (.xlsx)', 'file'], ['csv', 'CSV', 'file'], ['pdf', 'PDF', 'file']])}` }) + `
  <div class="wrap f-body">
    <div class="ab-kpi frv" style="--i:2" id="abKpi"></div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="abQ" type="search" placeholder="Cari zone atau blok…" value="${esc(A.q)}"></label>
        <div class="seg-s" role="group" aria-label="Bulan">${months.map((v) => { const [y, m] = v.split('-'); return `<button data-am="${v}" aria-pressed="${A.ym === v}">${BULAN[+m - 1]} ${y}</button>`; }).join('')}</div>
        <div class="seg-s" role="group" aria-label="Status">${[['all', 'Semua'], ['0', 'Pending'], ['1', 'Confirmed']].map(([k, l]) => `<button data-as="${k}" aria-pressed="${A.st === k}">${l}</button>`).join('')}</div>
      </div>
      <div class="f-zone"><span>Zone</span>${Object.keys(ZONES).map((z) => `<button data-az="${z}" aria-pressed="${A.zone.includes(z)}">${z}</button>`).join('')}</div>
      <div class="ab-bulk" id="abBulk" hidden><b id="abBulkN">0 blok dipilih</b><span>Konfirmasi akan menghitung ulang berat dan upah panen di tugas blok tersebut.</span><button class="m-btn" id="abClr">Batal pilih</button><button class="m-btn pri" id="abConf">${ic('check')}Konfirmasi ABW</button></div>
      <div id="abT"></div>
    </section>
    <p class="f-note frv" style="--i:4">Ubah ABW hanya untuk akun FA. Konfirmasi massal butuh izin "ABW - Update". Data ABW tidak bisa ditambah atau dihapus dari halaman ini; gunakan Sinkron dari Surat Jalan.</p>
  </div>`;
  bindDropdowns(root);
  $$('[data-act]', $('#abx').parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(`Mengekspor ABW ${A.ym} ke ${b.textContent.trim()}…`); });
  $('#abQ').addEventListener('input', (e) => { A.q = e.target.value; A.page = 1; aTable(); });
  $$('[data-am]', root).forEach((b) => b.onclick = () => { A.ym = b.dataset.am; A.sel.clear(); $$('[data-am]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); A.page = 1; aKpi(); aTable(); });
  $$('[data-as]', root).forEach((b) => b.onclick = () => { A.st = b.dataset.as; $$('[data-as]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); A.page = 1; aTable(); });
  $$('[data-az]', root).forEach((b) => b.onclick = () => { const z = b.dataset.az; A.zone = A.zone.includes(z) ? A.zone.filter((x) => x !== z) : [...A.zone, z]; b.setAttribute('aria-pressed', A.zone.includes(z)); A.page = 1; aKpi(); aTable(); });
  $('#abClr').onclick = () => { A.sel.clear(); aTable(); };
  $('#abConf').onclick = async () => { const n = A.sel.size; if (!(await confirmBox(`Konfirmasi ABW ${n} blok?`, 'Status menjadi Confirmed. Berat dan upah panen di semua tugas bulan ini untuk blok tersebut dihitung ulang dengan ABW baru.', 'Konfirmasi'))) return; ABW.forEach((x) => { if (A.sel.has(x.id)) x.status = 1; }); A.sel.clear(); H.toast(`${n} blok dikonfirmasi · upah panen dihitung ulang`); aKpi(); aTable(); };
  $('#abSync').onclick = async () => { const b = $('#abSync'); b.disabled = true; b.innerHTML = `<i class="spin dk" aria-hidden="true"></i>Menyinkronkan…`; await new Promise((r) => setTimeout(r, H.reduced() ? 0 : 1100)); b.disabled = false; b.innerHTML = `${ic('refresh')}Sinkron dari Surat Jalan`; H.toast(`Tandan & tonase ${BULAN_L[+A.ym.slice(5) - 1]} diperbarui dari 412 Surat Jalan`); };
  aKpi(); aTable();
}
function aKpi() {
  const [y, m] = A.ym.split('-').map(Number), r = ABW.filter((x) => x.y === y && x.m + 1 === m && (!A.zone.length || A.zone.includes(x.zone)));
  const t = r.reduce((a, x) => a + x.tandan, 0), w = r.reduce((a, x) => a + x.tonase, 0), pv = r.reduce((a, x) => a + x.tandan * x.prev, 0) / (t || 1), abw = w / (t || 1), pend = r.filter((x) => !x.status).length;
  $('#abKpi').innerHTML = `<div class="ab-main"><span>ABW rata-rata · ${BULAN_L[m - 1]} ${y}</span><b>${fmt(abw, 2)}<small> kg/jjg</small></b><em class="${abw >= pv ? 'up' : 'dn'}">${abw >= pv ? '▲' : '▼'} ${fmt(Math.abs(abw - pv), 2)} kg dari bulan lalu</em></div>
    <div><span>Tandan</span><b>${fmt(t)}</b><small>jjg diterima mill</small></div><div><span>Tonase</span><b>${fmt(w / 1000, 1)}</b><small>ton</small></div>
    <div class="${pend ? 'warn' : ''}"><span>Pending</span><b>${pend}</b><small>blok belum dikonfirmasi</small></div><div><span>Confirmed</span><b>${r.length - pend}</b><small>dari ${r.length} blok</small></div>`;
}
function aTable() {
  const el = $('#abT'), r = aRows();
  $('#abBulk').hidden = !A.sel.size; $('#abBulkN').textContent = `${A.sel.size} blok dipilih`;
  if (!r.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada data ABW</h3><p>Ubah filter, atau jalankan Sinkron dari Surat Jalan.</p></div>`; return; }
  const pages = Math.ceil(r.length / A.per); A.page = Math.min(A.page, pages); const from = (A.page - 1) * A.per, list = r.slice(from, from + A.per);
  const zAvg = {}; Object.keys(ZONES).forEach((z) => { const zr = r.filter((x) => x.zone === z); if (zr.length) zAvg[z] = zr.reduce((a, x) => a + x.tonase, 0) / zr.reduce((a, x) => a + x.tandan, 0); });
  const pendIds = list.filter((x) => !x.status).map((x) => x.id), allSel = pendIds.length && pendIds.every((i) => A.sel.has(i));
  const th = (k, l, n) => { const on = A.sort[0] === k; return `<th class="${n ? 'n' : ''}" ${on ? `aria-sort="${A.sort[1] > 0 ? 'ascending' : 'descending'}"` : ''}><button data-ak="${k}">${l}<i class="so ${on ? (A.sort[1] > 0 ? 'up' : 'dn') : ''}"></i></button></th>`; };
  el.innerHTML = `<div class="f-tw" tabindex="0" aria-label="Tabel ABW"><table class="f-table ab-t"><thead><tr><th class="ck"><label class="sr" for="abAll">Pilih semua pending</label><input type="checkbox" id="abAll" ${allSel ? 'checked' : ''} ${pendIds.length ? '' : 'disabled'}></th>${th('zone', 'Zone · Blok')}${th('tandan', 'Tandan', 1)}${th('tonase', 'Tonase (kg)', 1)}${th('abw', 'ABW (kg)', 1)}<th>vs rata-rata zone</th><th class="n">Training (kg)</th><th class="n">Brondol (kg)</th><th class="n">Partheno (kg)</th>${th('status', 'Status')}<th>Diperbarui</th></tr></thead>
  <tbody>${list.map((x, i) => { const d = x.abw - zAvg[x.zone], dv = x.abw - x.prev; return `<tr data-ar="${x.id}" style="--r:${i}" class="${A.sel.has(x.id) ? 'sel' : ''}"><td class="ck" data-noopen>${x.status ? '' : `<input type="checkbox" data-ac="${x.id}" ${A.sel.has(x.id) ? 'checked' : ''} aria-label="Pilih ${x.zone} ${x.block}">`}</td><td><b>${x.zone}</b> · ${x.block}<small>Tahun tanam ${x.tt}</small></td><td class="n">${fmt(x.tandan)}</td><td class="n">${fmt(x.tonase)}</td><td class="n"><b class="ab-v">${fmt(x.abw, 2)}</b><small class="${dv >= 0 ? 'up-t' : 'dn-t'}">${dv >= 0 ? '▲' : '▼'} ${fmt(Math.abs(dv), 2)}</small></td><td><span class="ab-dev ${d < 0 ? 'neg' : ''}"><i style="${(() => { const w = Math.min(1, Math.abs(d) / 3) * 50; return `left:${d < 0 ? 50 - w : 50}%;width:${w.toFixed(1)}%`; })()}"></i></span><small class="ab-dl">${d >= 0 ? '+' : '−'}${fmt(Math.abs(d), 2)} kg</small></td><td class="n">${fmt(x.tp)}</td><td class="n">${fmt(x.br)}</td><td class="n">${fmt(x.pa)}</td><td>${abwChip(x.status)}</td><td>${x.upd.slice(11)}<small>${x.upd.slice(0, 10)}</small></td></tr>`; }).join('')}</tbody></table></div>${pager(A.page, pages, r.length, A.per, from)}`;
  $$('[data-ac]', el).forEach((c) => c.onchange = (e) => { e.stopPropagation(); const id = +c.dataset.ac; c.checked ? A.sel.add(id) : A.sel.delete(id); aTable(); });
  const all = $('#abAll'); if (all) all.onchange = () => { pendIds.forEach((i) => all.checked ? A.sel.add(i) : A.sel.delete(i)); aTable(); };
  $$('[data-ak]', el).forEach((b) => b.onclick = () => { const k = b.dataset.ak; A.sort = [k, A.sort[0] === k ? -A.sort[1] : 1]; aTable(); });
  $$('tr[data-ar]', el).forEach((t) => t.addEventListener('click', (e) => { if (e.target.closest('[data-noopen]')) return; aSheet(+t.dataset.ar); }));
  $$('[data-p]', el).forEach((b) => b.onclick = () => { A.page = +b.dataset.p; aTable(); });
  const per = $('[data-per]', el); if (per) per.onchange = (e) => { A.per = +e.target.value; A.page = 1; aTable(); };
}
function aTasks(x) { const r = rng(x.id * 7), n = 18 + Math.floor(r() * 10); return Array.from({ length: n }, () => Math.round(x.tandan / n * (.6 + r() * .8))); }
function aSheet(id, edit) {
  const x = ABW.find((y) => y.id === id), tasks = aTasks(x), wage = (abw) => tasks.reduce((a, j) => a + calcWages(x.tt, j * abw / 1000 / 22), 0) * 22;
  const body = edit ? `<form class="fs-form" novalidate><p class="mute">Hanya akun FA. Menyimpan akan mengubah status menjadi Confirmed.</p>
      <div class="f2"><div class="wf"><label for="aeT">Tandan</label><input id="aeT" type="number" min="1" value="${x.tandan}"></div><div class="wf"><label for="aeW">Tonase (kg)</label><input id="aeW" type="number" min="1" value="${x.tonase}"></div></div>
      <div class="wf"><label for="aeA">Average Bunch Weight (kg)</label><input id="aeA" type="number" step="0.01" min="0" value="${x.abw}"><p class="w-msg" id="aeM"></p></div>
      <div class="dose" id="aePrev"></div></form>`
    : `<div class="fs-top">${abwChip(x.status)}<span class="jk-pill">Tahun tanam ${x.tt}</span></div>
      <div class="fs-figs"><div><span>ABW</span><b>${fmt(x.abw, 2)} kg</b></div><div><span>Tandan</span><b>${fmt(x.tandan)}</b></div><div><span>Tonase</span><b>${fmt(x.tonase / 1000, 2)} t</b></div></div>
      <div class="ab-trend"><span>ABW 3 bulan</span>${(() => { const hist = ABW.filter((y) => y.zone === x.zone && y.block === x.block).sort((a, b) => a.m - b.m); const mx = Math.max(...hist.map((h) => h.abw)) * 1.05; return `<div class="ab-bars">${hist.map((h) => `<div><i style="--h:${(h.abw / mx).toFixed(3)}" class="${h.id === x.id ? 'on' : ''}"></i><b>${fmt(h.abw, 1)}</b><small>${BULAN[h.m]}</small></div>`).join('')}</div>`; })()}</div>
      <h3>Rincian tonase</h3><dl class="fs-dl">${[['Bulan', `${BULAN_L[x.m]} ${x.y}`], ['Zone · Blok', `${x.zone} · ${x.block}`], ['Tonase training', fmt(x.tp) + ' kg'], ['Tonase brondol', fmt(x.br) + ' kg'], ['Tonase partheno', fmt(x.pa) + ' kg'], ['Tugas panen bulan ini', tasks.length + ' tugas'], ['Diperbarui', x.upd]].map((d) => `<div><dt>${d[0]}</dt><dd>${d[1]}</dd></div>`).join('')}</dl>`;
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">ABW · ${BULAN_L[x.m]} ${x.y}</p><h2>${x.zone} · ${x.block}</h2><p class="mute">Tonase ÷ tandan = ${fmt(x.tonase / x.tandan, 2)} kg/jjg</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div><div class="fs-b">${body}</div>
    <div class="fs-f">${edit ? `<button class="m-btn" id="aeC">Batal</button><button class="m-btn pri" id="aeS">${ic('check')}Simpan & konfirmasi</button>` : `<button class="m-btn" data-close>Tutup</button><button class="m-btn pri" id="aeE">${ic('cols')}Ubah ABW</button>`}</div>`, `ABW ${x.zone} ${x.block}`);
  if (!edit) { $('#aeE').onclick = () => aSheet(id, true); return; }
  const prev = () => { const v = +$('#aeA').value || 0, a = wage(x.abw), b = wage(v), d = b - a; $('#aePrev').innerHTML = `<span>Dampak ke upah panen (${tasks.length} tugas)</span><b>Rp ${fmt(a)} → Rp ${fmt(b)}</b><small class="${d >= 0 ? 'up-t' : 'dn-t'}">${d >= 0 ? '+' : '−'}Rp ${fmt(Math.abs(d))} · dihitung dengan rumus basis 1,65 t dan premi lebih</small>`; };
  const auto = () => { const t = +$('#aeT').value, w = +$('#aeW').value; if (t > 0 && w > 0) $('#aeA').value = (w / t).toFixed(2); prev(); };
  $('#aeT').addEventListener('input', auto); $('#aeW').addEventListener('input', auto); $('#aeA').addEventListener('input', prev); prev();
  $('#aeC').onclick = () => aSheet(id);
  $('#aeS').onclick = () => { const a = $('#aeA'); if (!(+a.value > 0)) { const w = a.closest('.wf'); w.classList.remove('err'); void w.offsetWidth; w.classList.add('err'); $('#aeM').textContent = 'ABW harus lebih dari 0.'; a.focus(); return; }
    x.tandan = +$('#aeT').value; x.tonase = +$('#aeW').value; x.abw = +a.value; x.status = 1; x.upd = '06/11/2026 12:10'; A.sel.delete(x.id);
    H.toast(`ABW ${x.zone} ${x.block} disimpan · upah ${tasks.length} tugas dihitung ulang`); aKpi(); aTable(); aSheet(id); };
  setTimeout(() => $('#aeA').focus(), 60);
}

/* =====================================================================
   TONASE HARIAN MILL — /admin/abw-daily-chart
   ===================================================================== */
const D = { day: 0 };
const DAYS = ['06/11/2026', '05/11/2026', '04/11/2026'];
function hourly(day) { const r = rng(777 + day * 13); return Array.from({ length: 17 }, (_, i) => { const h = 6 + i, peak = Math.exp(-((h - 13) ** 2) / 14), late = day === 0 && h > 12; const tr = late ? 0 : Math.max(0, Math.round(peak * 7 + r() * 2.2 - .6)); return { h, truk: tr, ton: +(tr * (13.2 + r() * 3.4)).toFixed(1) }; }); }
const W = 1100, HH = 300, PL = 46, PR = 46, PT = 18, PB = 30;
function tipOn(svg, wrap) {
  const t = document.createElement('div'); t.className = 'ch-tip'; t.hidden = true; wrap.appendChild(t);
  svg.addEventListener('pointermove', (e) => { const g = e.target.closest('[data-tip]'); if (!g) { t.hidden = true; return; } t.innerHTML = g.dataset.tip; t.hidden = false; const r = wrap.getBoundingClientRect(); let x = e.clientX - r.left + 12; if (x + 190 > r.width) x -= 210; t.style.transform = `translate(${x}px,${e.clientY - r.top - 12}px)`; });
  svg.addEventListener('pointerleave', () => { t.hidden = true; });
}
function mountDaily(root) {
  root.innerHTML = pageHead({ kicker: 'Mill · ABW', title: 'Tonase Harian Mill', sub: 'Tonase TBS yang diterima timbangan mill per jam, jumlah truk, dan akumulasi sepanjang hari. Data dari tiket mill Surat Jalan.', right: menuBtn('dax', 'Ekspor', 'dl', [['pdf', 'Export in PDF', 'file'], ['xlsx', 'Export in Excel', 'file']]) }) + `
  <div class="wrap f-body">
    <section class="f-card frv" style="--i:2">
      <div class="f-tools"><div class="seg-s" role="group" aria-label="Tanggal">${DAYS.map((d, i) => `<button data-dday="${i}" aria-pressed="${D.day === i}">${i === 0 ? 'Hari ini' : i === 1 ? 'Kemarin' : d.slice(0, 5)}</button>`).join('')}</div><span class="da-live" id="daLive"></span></div>
      <div class="ch-kpi" id="daK"></div>
      <div class="ch-wrap" id="daC1"></div>
      <div class="ch-leg"><span><i class="lg-bar"></i>Tonase per jam</span><span><i class="lg-line" style="border-top-style:solid"></i>Akumulasi (sumbu kanan)</span></div>
    </section>
    <div class="da-grid">
      <section class="f-card frv" style="--i:3"><div class="tbl-h"><h2>Truk per jam</h2><p class="mute">jumlah truk yang ditimbang</p></div><div class="ch-wrap" id="daC2"></div></section>
      <section class="f-card frv" style="--i:4"><div class="tbl-h"><h2>Rincian per jam</h2><p class="mute" id="daTd"></p></div><div class="f-tw da-tw" tabindex="0" id="daT"></div></section>
    </div>
  </div>`;
  bindDropdowns(root);
  $$('[data-act]', $('#dax').parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(`Mengekspor tonase ${DAYS[D.day]} (${b.dataset.act.toUpperCase()})…`); });
  $$('[data-dday]', root).forEach((b) => b.onclick = () => { D.day = +b.dataset.dday; $$('[data-dday]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); dDraw(); });
  dDraw();
}
function dDraw() {
  const rows = hourly(D.day), tot = rows.reduce((a, x) => a + x.ton, 0), tr = rows.reduce((a, x) => a + x.truk, 0), pk = rows.reduce((a, x) => x.ton > a.ton ? x : a, rows[0]);
  $('#daLive').innerHTML = D.day === 0 ? '<i class="ft-pulse"></i>Berjalan · update tiap tiket mill' : `Hari penuh · ${DAYS[D.day]}`;
  $('#daK').innerHTML = [['Tonase diterima', fmt(tot, 1), 'ton'], ['Truk', tr, 'ditimbang'], ['Rata-rata per truk', fmt(tr ? tot / tr : 0, 2), 'ton'], ['Jam tersibuk', `${pad(pk.h)}:00`, fmt(pk.ton, 1) + ' t · ' + pk.truk + ' truk']].map((k) => `<div><span>${k[0]}</span><b>${k[1]}</b><small>${k[2]}</small></div>`).join('');
  const bw = (W - PL - PR) / rows.length, mx = Math.ceil(Math.max(...rows.map((x) => x.ton), 10) / 20) * 20, cmx = Math.ceil(Math.max(tot, 50) / 100) * 100, y = (v) => PT + (HH - PT - PB) * (1 - v / mx), yc = (v) => PT + (HH - PT - PB) * (1 - v / cmx);
  let grid = ''; for (let i = 0; i <= 4; i++) { const v = mx * i / 4, yy = y(v); grid += `<line x1="${PL}" x2="${W - PR}" y1="${yy}" y2="${yy}" class="gl"/><text x="${PL - 8}" y="${yy + 4}" class="ax" text-anchor="end">${fmt(v)}</text><text x="${W - PR + 8}" y="${yy + 4}" class="ax">${fmt(cmx * i / 4)}</text>`; }
  let acc = 0; const pts = [];
  const bars = rows.map((x, i) => { acc += x.ton; if (x.truk || D.day > 0 || x.h <= 12) pts.push([PL + bw * (i + .5), yc(acc)]); return `<g data-tip="<b>${pad(x.h)}:00–${pad(x.h + 1)}:00</b>${fmt(x.ton, 1)} t · ${x.truk} truk<br><span>Akumulasi ${fmt(acc, 1)} t</span>"><rect class="hit" x="${PL + bw * i}" y="${PT}" width="${bw}" height="${HH - PT - PB}"/>${x.ton ? `<rect class="cb" style="--i:${i}" x="${PL + bw * i + bw * .18}" y="${y(x.ton)}" width="${bw * .64}" height="${y(0) - y(x.ton)}" rx="4"/>` : `<rect class="b-na" x="${PL + bw * i + bw * .18}" y="${y(0) - 2}" width="${bw * .64}" height="2"/>`}<text x="${PL + bw * (i + .5)}" y="${HH - 8}" class="ax" text-anchor="middle">${pad(x.h)}</text></g>`; }).join('');
  $('#daC1').innerHTML = `<svg viewBox="0 0 ${W} ${HH}" class="ch" role="img" aria-label="Tonase per jam ${DAYS[D.day]}">${grid}${bars}<path d="${pts.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join('')}" class="yl cum" style="--c:var(--leaf)"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#fff" stroke="var(--leaf)" stroke-width="2"/>`).join('')}</svg>`;
  tipOn($('#daC1 svg'), $('#daC1'));
  const W2 = 560, H2 = 230, m2 = Math.max(8, ...rows.map((x) => x.truk)), b2 = (W2 - 36 - 10) / rows.length, y2 = (v) => 12 + (H2 - 12 - 26) * (1 - v / m2);
  $('#daC2').innerHTML = `<svg viewBox="0 0 ${W2} ${H2}" class="ch" role="img" aria-label="Truk per jam">${[0, m2 / 2, m2].map((v) => `<line x1="36" x2="${W2 - 10}" y1="${y2(v)}" y2="${y2(v)}" class="gl"/><text x="28" y="${y2(v) + 4}" class="ax" text-anchor="end">${Math.round(v)}</text>`).join('')}${rows.map((x, i) => `<g data-tip="<b>${pad(x.h)}:00</b>${x.truk} truk"><rect class="hit" x="${36 + b2 * i}" y="12" width="${b2}" height="${H2 - 38}"/>${x.truk ? `<rect class="cb tr" style="--i:${i}" x="${36 + b2 * i + b2 * .2}" y="${y2(x.truk)}" width="${b2 * .6}" height="${y2(0) - y2(x.truk)}" rx="3"/>` : ''}${i % 2 === 0 ? `<text x="${36 + b2 * (i + .5)}" y="${H2 - 8}" class="ax" text-anchor="middle">${pad(x.h)}</text>` : ''}</g>`).join('')}</svg>`;
  tipOn($('#daC2 svg'), $('#daC2'));
  $('#daTd').textContent = DAYS[D.day];
  const mt = Math.max(...rows.map((x) => x.ton), 1);
  $('#daT').innerHTML = `<table class="f-table"><thead><tr><th>Jam</th><th class="n">Tonase diterima</th><th class="n">Truk</th></tr></thead><tbody>${rows.map((x) => `<tr class="${x === pk ? 'pk' : ''}"><td>${pad(x.h)}:00 – ${pad(x.h + 1)}:00</td><td class="n"><span class="mm-cell"><i style="--w:${(x.ton / mt).toFixed(3)}"></i><b>${x.ton ? fmt(x.ton, 1) : '—'}</b></span></td><td class="n">${x.truk || '—'}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="n">${fmt(tot, 1)} t</td><td class="n">${tr}</td></tr></tfoot></table>`;
}

/* =====================================================================
   KONTRAKTOR — /admin/contractor
   ===================================================================== */
const DESA = ['Desa Sebulu', 'Desa Puan Cepak', 'Desa Sedulang'];
const CON = [['CV Mahakam Jaya Angkut', 'E', 0], ['UD Kutai Sejahtera', 'E', 1], ['CV Borneo Logistik', 'E', 2], ['CV Sebulu Transport', 'E', 0], ['PT Tenggarong Armada', 'E', 1], ['Armada Internal Estate', 'I', 0], ['Koperasi Sedulang Mandiri', 'E', 2], ['UD Puan Cepak Makmur', 'E', 1]].map((c, i) => ({ id: 40 + i, name: c[0], group: c[1], desa: DESA[c[2]], phone: '+62 812-' + (5400 + i * 137) + '-' + (2100 + i * 311), active: i !== 6, since: ['2019', '2020', '2021', '2022', '2023'][i % 5] }));
const TYPES = ['FFB', 'CPO', 'PK', 'EFB', 'MF', 'DC', 'MIKO'];
const TST = { 1: ['Active', 't-ok'], 0: ['Inactive', 't-mute'], 2: ['Blacklist', 't-bad'] };
const TRUCKS = (() => { const r = rng(9090), out = [], first = ['Samsul', 'Yusuf', 'Rudi', 'Iwan', 'Joko', 'Herman', 'Taufik', 'Andi', 'Bambang', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hasan', 'Imam', 'Jamal', 'Kurnia', 'Lukman'], last = ['Daeng', 'Hasibuan', 'Pratama', 'Saputra', 'Siregar', 'Hidayat', 'Wijaya', 'Nainggolan', 'Tarigan', 'Laia', ''];
  for (let i = 0; i < 42; i++) { const c = CON[i % 7 === 6 ? 5 : Math.floor(r() * CON.length)], st = r() < .8 ? 1 : r() < .6 ? 0 : 2, ty = r() < .72 ? 'FFB' : TYPES[1 + Math.floor(r() * 6)];
    out.push({ id: 910 + i, con: c.id, name: `${first[Math.floor(r() * first.length)]} ${last[Math.floor(r() * last.length)]}`.trim(), phone: '+62 8' + (11 + Math.floor(r() * 9)) + '-' + (1000 + Math.floor(r() * 8999)) + '-' + (1000 + Math.floor(r() * 8999)), plate: 'KT ' + (8000 + Math.floor(r() * 999)) + ' ' + ['AB', 'BK', 'CF', 'DL', 'GH', 'MW', 'RU', 'ZX', 'PL', 'SN'][Math.floor(r() * 10)], sim: 'SIM B1 · ' + (1000 + Math.floor(r() * 8999)) + '-' + (1000 + Math.floor(r() * 8999)) + '-' + (100000 + Math.floor(r() * 899999)), type: ty, status: c.active ? st : 0, reg: `${pad(1 + Math.floor(r() * 28))}/${pad(1 + Math.floor(r() * 10))}/202${3 + Math.floor(r() * 4)}`, trips: st === 1 ? Math.floor(4 + r() * 38) : 0, ton: 0, qr: (Math.floor(r() * 1e12)).toString(36).toUpperCase(), photos: Math.floor(r() * 4) }); }
  out.forEach((t) => { t.ton = +(t.trips * (13 + (t.id % 5) * .6)).toFixed(1); }); return out; })();
const initials = (s) => s.replace(/^(CV|UD|PT)\s+/, '').split(' ').map((w) => w[0]).slice(0, 2).join('');
const conOf = (id) => CON.find((c) => c.id === id);
const C = { q: '', g: 'all', desa: '', st: 'all', view: 'card' };
function mountCon(root) {
  root.innerHTML = pageHead({ kicker: 'Mill · CMS', title: 'Kontraktor', sub: 'Perusahaan angkutan yang truknya membawa TBS dan produk mill. Dipakai saat mendaftarkan truk dan membuat Surat Jalan.', right: `<a class="f-btn" href="#truk">${ic('truck')}Truk & supir</a><button class="f-btn" id="cNew">${ic('scan').replace(K.P.scan, '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>')}Tambah kontraktor</button>` }) + `
  <div class="wrap f-body">
    <section class="f-card frv" style="--i:2">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="cQ" type="search" placeholder="Cari nama atau nomor kontak…" value="${esc(C.q)}"></label>
        <div class="seg-s" role="group" aria-label="Group">${[['all', 'Semua'], ['I', 'Internal'], ['E', 'External']].map(([k, l]) => `<button data-cg="${k}" aria-pressed="${C.g === k}">${l}</button>`).join('')}</div>
        <label class="ff-sel"><span class="sr">Desa</span><select id="cD"><option value="">Semua desa</option>${DESA.map((d) => `<option ${C.desa === d ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
        <div class="seg-s" role="group" aria-label="Status">${[['all', 'Semua status'], ['1', 'Aktif'], ['0', 'Nonaktif']].map(([k, l]) => `<button data-cs="${k}" aria-pressed="${C.st === k}">${l}</button>`).join('')}</div>
        <div class="seg-s" role="group" aria-label="Tampilan"><button data-cv="card" aria-pressed="${C.view === 'card'}">Kartu</button><button data-cv="table" aria-pressed="${C.view === 'table'}">Tabel</button></div>
      </div>
      <div id="cL"></div>
    </section>
    <p class="f-note frv" style="--i:3">Menambah butuh izin "Contractor - Create", mengubah butuh "Contractor - Update". Kontraktor tidak bisa dihapus; nonaktifkan bila sudah tidak bekerja sama.</p>
  </div>`;
  $('#cQ').addEventListener('input', (e) => { C.q = e.target.value; cList(); });
  $('#cD').onchange = (e) => { C.desa = e.target.value; cList(); };
  [['cg', 'g'], ['cs', 'st'], ['cv', 'view']].forEach(([a, k]) => $$(`[data-${a}]`, root).forEach((b) => b.onclick = () => { C[k] = b.dataset[a]; $$(`[data-${a}]`, root).forEach((x) => x.setAttribute('aria-pressed', x === b)); cList(); }));
  $('#cNew').onclick = () => cForm(null);
  cList();
}
function cStats(c) { const t = TRUCKS.filter((x) => x.con === c.id); return { n: t.length, act: t.filter((x) => x.status === 1).length, trips: t.reduce((a, x) => a + x.trips, 0), ton: t.reduce((a, x) => a + x.ton, 0) }; }
function cList() {
  const q = C.q.toLowerCase(), el = $('#cL');
  const list = CON.filter((c) => (C.g === 'all' || c.group === C.g) && (!C.desa || c.desa === C.desa) && (C.st === 'all' || +c.active === +C.st) && (!q || `${c.name} ${c.phone}`.toLowerCase().includes(q)));
  if (!list.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada kontraktor</h3><p>Ubah filter atau kata kunci.</p></div>`; return; }
  const wa = (p) => `https://wa.me/${p.replace(/\D/g, '')}`;
  if (C.view === 'table') {
    el.innerHTML = `<div class="f-tw" tabindex="0"><table class="f-table"><thead><tr><th>Foto</th><th>Nama kontraktor</th><th>Nomor kontak</th><th>Group</th><th>Desa</th><th class="n">Truk aktif</th><th class="n">Trip bulan ini</th><th>Status</th></tr></thead><tbody>${list.map((c, i) => { const s = cStats(c); return `<tr data-cr="${c.id}" style="--r:${i}"><td><span class="co-av sm">${initials(c.name)}</span></td><td><b>${esc(c.name)}</b><small>Sejak ${c.since}</small></td><td><a class="tel" href="${wa(c.phone)}" target="_blank" rel="noopener" data-noopen>${c.phone}</a></td><td>${c.group === 'I' ? 'Internal' : 'External'}</td><td>${c.desa}</td><td class="n">${s.act} / ${s.n}</td><td class="n">${s.trips}</td><td>${c.active ? '<span class="st-chip t-ok">Aktif</span>' : '<span class="st-chip t-mute">Nonaktif</span>'}</td></tr>`; }).join('')}</tbody></table></div>`;
  } else {
    el.innerHTML = `<div class="co-grid">${list.map((c, i) => { const s = cStats(c); return `<article class="co-card ${c.active ? '' : 'off'}" data-cr="${c.id}" style="--r:${i}" tabindex="0" role="button" aria-label="${esc(c.name)}">
      <header><span class="co-av">${initials(c.name)}</span><div><b>${esc(c.name)}</b><small>${c.group === 'I' ? 'Internal' : 'External'} · ${c.desa}</small></div>${c.active ? '<span class="st-chip t-ok">Aktif</span>' : '<span class="st-chip t-mute">Nonaktif</span>'}</header>
      <div class="co-stats"><div><b>${s.act}<small>/${s.n}</small></b><span>truk aktif</span></div><div><b>${s.trips}</b><span>trip bulan ini</span></div><div><b>${fmt(s.ton, 0)}</b><span>ton diangkut</span></div></div>
      <footer><a class="tel" href="${wa(c.phone)}" target="_blank" rel="noopener" data-noopen>${ic('qr', 14).replace(K.P.qr, '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>')}${c.phone}</a><span class="co-go">Lihat truk ${ic('chev', 14)}</span></footer></article>`; }).join('')}</div>`;
  }
  $$('[data-cr]', el).forEach((t) => { const go = (e) => { if (e.target.closest('[data-noopen]')) return; cSheet(+t.dataset.cr); }; t.addEventListener('click', go); t.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(e); }); });
}
function cSheet(id) {
  const c = conOf(id), s = cStats(c), tr = TRUCKS.filter((x) => x.con === id);
  openSheet(`<div class="fs-h"><div class="co-h"><span class="co-av lg">${initials(c.name)}</span><div><p class="m-kick dark">Kontraktor · ${c.group === 'I' ? 'Internal' : 'External'}</p><h2>${esc(c.name)}</h2><p class="mute">${c.desa} · ${c.phone}</p></div></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b"><div class="fs-figs"><div><span>Truk aktif</span><b>${s.act} / ${s.n}</b></div><div><span>Trip bulan ini</span><b>${s.trips}</b></div><div><span>Tonase</span><b>${fmt(s.ton, 0)} t</b></div></div>
    <h3>Truk terdaftar</h3>${tr.length ? `<ul class="co-trucks">${tr.map((t) => `<li><span class="plate sm">${t.plate}</span><span><b>${esc(t.name)}</b><small>${t.type} · ${t.trips} trip</small></span><span class="st-chip ${TST[t.status][1]}">${TST[t.status][0]}</span></li>`).join('')}</ul>` : '<p class="mute">Belum ada truk.</p>'}</div>
  <div class="fs-f"><a class="m-btn" href="#truk" data-close>${ic('truck')}Buka di Truk & supir</a><button class="m-btn pri" id="cEd">${ic('cols')}Ubah</button></div>`, c.name);
  $('#cEd').onclick = () => cForm(id);
}
function cForm(id) {
  const c = id ? conOf(id) : { name: '', phone: '+62 ', group: 'I', desa: DESA[0], active: true };
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Kontraktor</p><h2>${id ? 'Ubah kontraktor' : 'Kontraktor baru'}</h2><p class="mute">${id ? esc(c.name) : 'Akan muncul sebagai pilihan saat mendaftarkan truk.'}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b"><form class="fs-form" novalidate>
    <div class="up-row"><span class="co-av lg" id="cfAv">${c.name ? initials(c.name) : '?'}</span><div><b>Foto</b><small>JPG atau PNG, maks. 2 MB</small><button type="button" class="m-btn sm" id="cfUp">Pilih foto</button></div></div>
    <div class="wf"><label for="cfN">Nama kontraktor</label><input id="cfN" value="${esc(c.name)}" placeholder="mis. CV Mahakam Jaya Angkut"><p class="w-msg" id="cfNm"></p></div>
    <div class="wf"><label for="cfP">Nomor kontak</label><input id="cfP" type="tel" value="${esc(c.phone)}" inputmode="tel"><p class="w-msg" id="cfPm"></p></div>
    <div class="wf"><span class="lbl-s big">Group</span><div class="radio-row" role="radiogroup" aria-label="Group"><label><input type="radio" name="cfG" value="I" ${c.group === 'I' ? 'checked' : ''}><span>Internal</span></label><label><input type="radio" name="cfG" value="E" ${c.group === 'E' ? 'checked' : ''}><span>External</span></label></div></div>
    <div class="wf"><label for="cfD">Desa</label><select id="cfD" class="sel">${DESA.map((d) => `<option ${c.desa === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
    <label class="pf-tg"><span><b>Status aktif</b><small>Kontraktor nonaktif tidak bisa dipilih untuk truk baru.</small></span><input type="checkbox" id="cfA" ${c.active ? 'checked' : ''}><span class="sw" aria-hidden="true"></span></label>
  </form></div>
  <div class="fs-f"><button class="m-btn" data-close>Batal</button><button class="m-btn pri" id="cfS">${ic('check')}${id ? 'Simpan perubahan' : 'Tambah kontraktor'}</button></div>`, id ? 'Ubah kontraktor' : 'Kontraktor baru');
  $('#cfN').addEventListener('input', (e) => { $('#cfAv').textContent = e.target.value ? initials(e.target.value) : '?'; });
  $('#cfUp').onclick = () => H.toast('Unggah foto belum aktif di prototipe ini.');
  $('#cfS').onclick = () => { const n = $('#cfN'), p = $('#cfP'); let bad = null;
    [[n, !n.value.trim(), 'Nama wajib diisi.', '#cfNm'], [p, p.value.replace(/\D/g, '').length < 10, 'Nomor kontak minimal 10 digit.', '#cfPm']].forEach(([el, cond, msg, m]) => { const w = el.closest('.wf'); w.classList.remove('err'); $(m).textContent = ''; if (cond) { void w.offsetWidth; w.classList.add('err'); $(m).textContent = msg; bad = bad || el; } });
    if (bad) { bad.focus(); return; }
    const obj = id ? c : { id: 40 + CON.length, since: '2026' }; Object.assign(obj, { name: n.value.trim(), phone: p.value.trim(), group: $('input[name=cfG]:checked').value, desa: $('#cfD').value, active: $('#cfA').checked }); if (!id) CON.push(obj);
    closeSheet(); H.toast(id ? `${obj.name} diperbarui` : `${obj.name} ditambahkan`); cList(); };
  setTimeout(() => $('#cfN').focus(), 60);
}

/* =====================================================================
   TRUK & SUPIR — /admin/truck
   ===================================================================== */
const T = { q: '', st: 'all', type: [], con: '', page: 1, per: 10 };
function qrSvg(seed, size = 168) { const r = rng(seed.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 99991), n = 25, c = size / n; let s = '';
  const finder = (x, y) => `<rect x="${x * c}" y="${y * c}" width="${7 * c}" height="${7 * c}" fill="#0F231B"/><rect x="${(x + 1) * c}" y="${(y + 1) * c}" width="${5 * c}" height="${5 * c}" fill="#fff"/><rect x="${(x + 2) * c}" y="${(y + 2) * c}" width="${3 * c}" height="${3 * c}" fill="#0F231B"/>`;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); if (!inF && r() < .48) s += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}"/>`; }
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="QR code truk"><rect width="${size}" height="${size}" fill="#fff"/><g fill="#0F231B">${s}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`; }
function mountTruck(root) {
  root.innerHTML = pageHead({ kicker: 'Mill · CMS', title: 'Truk & Supir', sub: 'Truk yang terdaftar beserta supirnya. QR di kaca truk discan checker di TPH dan petugas timbangan untuk mengisi Surat Jalan otomatis.', right: `<a class="f-btn" href="#kontraktor">${ic('file')}Kontraktor</a>${menuBtn('tkx', 'Ekspor', 'dl', [['xlsx', 'Excel (.xlsx)', 'file'], ['csv', 'CSV', 'file'], ['pdf', 'PDF', 'file'], ['qr', 'Cetak semua QR', 'qr']])}<button class="f-btn" id="tNew">${ic('truck')}Daftarkan truk</button>` }) + `
  <div class="wrap f-body">
    <div class="hq-tabs frv" style="--i:2" role="group" aria-label="Status">${[['all', 'Semua', ''], ['1', 'Active', 'var(--leaf)'], ['0', 'Inactive', '#9AA8A0'], ['2', 'Blacklist', 'var(--bad)']].map(([k, l, c]) => `<button data-ts="${k}" aria-pressed="${T.st === k}"><span>${c ? `<i style="background:${c}"></i>` : ''}${l}</span><b>${k === 'all' ? TRUCKS.length : TRUCKS.filter((x) => x.status === +k).length}</b></button>`).join('')}</div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="tQ" type="search" placeholder="Cari plat, supir, kontraktor…" value="${esc(T.q)}"></label>
        <label class="ff-sel"><span class="sr">Kontraktor</span><select id="tC"><option value="">Semua kontraktor</option>${CON.map((c) => `<option value="${c.id}" ${+T.con === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      </div>
      <div class="f-zone"><span>Type</span>${TYPES.map((t) => `<button data-tt="${t}" aria-pressed="${T.type.includes(t)}">${t}</button>`).join('')}</div>
      <div id="tL"></div>
    </section>
    <p class="f-note frv" style="--i:4">Menambah butuh izin "Truck - Create", mengubah butuh "Truck - Update". Truk tidak bisa dihapus; ubah status ke Inactive atau Blacklist.</p>
  </div>`;
  bindDropdowns(root);
  $$('[data-act]', $('#tkx').parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(b.dataset.act === 'qr' ? 'Menyiapkan lembar QR untuk dicetak…' : `Mengekspor data truk ke ${b.textContent.trim()}…`); });
  $('#tQ').addEventListener('input', (e) => { T.q = e.target.value; T.page = 1; tList(); });
  $('#tC').onchange = (e) => { T.con = e.target.value; T.page = 1; tList(); };
  $$('[data-ts]', root).forEach((b) => b.onclick = () => { T.st = b.dataset.ts; $$('[data-ts]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); T.page = 1; tList(); });
  $$('[data-tt]', root).forEach((b) => b.onclick = () => { const t = b.dataset.tt; T.type = T.type.includes(t) ? T.type.filter((x) => x !== t) : [...T.type, t]; b.setAttribute('aria-pressed', T.type.includes(t)); T.page = 1; tList(); });
  $('#tNew').onclick = () => tForm(null);
  tList();
}
function tList() {
  const q = T.q.toLowerCase(), el = $('#tL');
  const r = TRUCKS.filter((t) => (T.st === 'all' || t.status === +T.st) && (!T.type.length || T.type.includes(t.type)) && (!T.con || t.con === +T.con) && (!q || `${t.plate} ${t.name} ${conOf(t.con).name}`.toLowerCase().includes(q)));
  if (!r.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada truk</h3><p>Ubah filter atau kata kunci.</p></div>`; return; }
  const pages = Math.ceil(r.length / T.per); T.page = Math.min(T.page, pages); const from = (T.page - 1) * T.per;
  el.innerHTML = `<div class="f-tw" tabindex="0" aria-label="Tabel truk"><table class="f-table tk-t"><thead><tr><th>Foto</th><th>Nomor kendaraan</th><th>Nama supir</th><th>Kontraktor</th><th>Nomor kontak</th><th>Type</th><th class="n">Trip bulan ini</th><th>Status</th><th>Tanggal daftar</th><th><span class="sr">QR</span></th></tr></thead><tbody>${r.slice(from, from + T.per).map((t, i) => `<tr data-tr="${t.id}" style="--r:${i}" class="${t.status === 2 ? 'row-bl' : ''}"><td><span class="dr-av">${t.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span></td><td><span class="plate sm">${t.plate}</span></td><td><b>${esc(t.name)}</b></td><td>${esc(conOf(t.con).name)}</td><td class="mono">${t.phone}</td><td><span class="ty ty-${t.type.toLowerCase()}">${t.type}</span></td><td class="n">${t.trips || '<span class="mute">—</span>'}</td><td><span class="st-chip ${TST[t.status][1]}">${TST[t.status][0]}</span></td><td>${t.reg}</td><td data-noopen><button class="iconbtn sm" data-tq="${t.id}" aria-label="QR ${t.plate}" title="Export QR">${ic('qr', 16)}</button></td></tr>`).join('')}</tbody></table></div>${pager(T.page, pages, r.length, T.per, from)}`;
  $$('tr[data-tr]', el).forEach((t) => t.addEventListener('click', (e) => { if (e.target.closest('[data-noopen]')) return; tSheet(+t.dataset.tr); }));
  $$('[data-tq]', el).forEach((b) => b.onclick = () => tSheet(+b.dataset.tq, 'qr'));
  $$('[data-p]', el).forEach((b) => b.onclick = () => { T.page = +b.dataset.p; tList(); });
  const per = $('[data-per]', el); if (per) per.onchange = (e) => { T.per = +e.target.value; T.page = 1; tList(); };
}
function tSheet(id, focus) {
  const t = TRUCKS.find((x) => x.id === id), c = conOf(t.con), r = rng(t.id), hist = Array.from({ length: Math.min(5, t.trips) }, (_, i) => ({ sj: 'SJ-' + (10988 - i * 7 - (t.id % 6)), d: `0${6 - Math.floor(i / 2)}/11/2026 ${pad(8 + Math.floor(r() * 9))}:${pad(Math.floor(r() * 60))}`, kg: Math.round(12000 + r() * 4500) }));
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Truk · ${t.type}</p><h2>${t.plate}</h2><p class="mute">${esc(t.name)} · ${esc(c.name)}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b"><div class="tk-top"><div class="tk-qr" id="tkQr">${qrSvg(t.qr)}<small>${t.qr}</small></div><div class="tk-id"><span class="plate">${t.plate}</span><span class="st-chip ${TST[t.status][1]}">${TST[t.status][0]}</span><button class="m-btn sm" id="tPr">${ic('print', 16)}Cetak QR</button></div></div>
    <h3>Supir & kendaraan</h3><dl class="fs-dl">${[['Nama supir', esc(t.name)], ['Nomor kontak', t.phone], ['No SIM', t.sim], ['Kontraktor', esc(c.name)], ['Type', t.type], ['Tanggal daftar', t.reg]].map((d) => `<div><dt>${d[0]}</dt><dd>${d[1]}</dd></div>`).join('')}</dl>
    <h3>Foto kendaraan</h3><div class="tk-ph">${Array.from({ length: 3 }, (_, i) => i < t.photos ? `<span class="ph-big sm" role="img" aria-label="Foto ${i + 1}"><i></i></span>` : `<span class="ph-big sm none">${ic('noimg', 20)}</span>`).join('')}</div>
    <h3>Riwayat Surat Jalan</h3>${hist.length ? `<ol class="ev-list">${hist.map((h) => `<li><b>${h.sj}</b><span>${h.d.slice(0, 5)} ${h.d.slice(11)} · ${fmt(h.kg)} kg</span></li>`).join('')}</ol>` : '<p class="mute">Belum ada perjalanan bulan ini.</p>'}</div>
  <div class="fs-f"><button class="m-btn" data-close>Tutup</button><button class="m-btn pri" id="tEd">${ic('cols')}Ubah</button></div>`, `Truk ${t.plate}`);
  $('#tPr').onclick = () => H.toast(`Mencetak QR ${t.plate}…`);
  $('#tEd').onclick = () => tForm(id);
  if (focus === 'qr') { const q = $('#tkQr'); q.classList.add('flash'); setTimeout(() => $('#tPr').focus(), 80); }
}
function tForm(id) {
  const t = id ? TRUCKS.find((x) => x.id === id) : { con: CON[0].id, name: '', phone: '+62 ', plate: 'KT ', sim: '', type: 'FFB', status: 1 };
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Truk & supir</p><h2>${id ? 'Ubah ' + t.plate : 'Daftarkan truk'}</h2><p class="mute">${id ? 'Perubahan berlaku untuk Surat Jalan berikutnya.' : 'QR dibuat otomatis setelah disimpan.'}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b"><form class="fs-form" novalidate>
    <div class="up-row"><span class="dr-av lg">${t.name ? t.name.split(' ').map((w) => w[0]).slice(0, 2).join('') : '?'}</span><div><b>Foto profil supir</b><small>JPG atau PNG, maks. 2 MB</small><button type="button" class="m-btn sm" data-up>Pilih foto</button></div></div>
    <div class="wf"><label for="tfC">Kontraktor</label><select id="tfC" class="sel">${CON.filter((c) => c.active || c.id === t.con).map((c) => `<option value="${c.id}" ${c.id === t.con ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    <div class="f2"><div class="wf"><label for="tfN">Nama supir</label><input id="tfN" value="${esc(t.name)}"><p class="w-msg" id="tfNm"></p></div><div class="wf"><label for="tfP">Nomor kontak</label><input id="tfP" type="tel" value="${esc(t.phone)}"></div></div>
    <div class="f2"><div class="wf"><label for="tfL">Nomor kendaraan</label><input id="tfL" value="${esc(t.plate)}" autocapitalize="characters" class="plate-in"><p class="w-msg" id="tfLm"></p></div><div class="wf"><label for="tfS">No SIM</label><input id="tfS" value="${esc(t.sim)}"></div></div>
    <div class="wf"><span class="lbl-s big">Type</span><div class="radio-row" role="radiogroup" aria-label="Type">${TYPES.map((x) => `<label><input type="radio" name="tfT" value="${x}" ${t.type === x ? 'checked' : ''}><span>${x}</span></label>`).join('')}</div></div>
    <div class="wf"><span class="lbl-s big">Status</span><div class="radio-row" role="radiogroup" aria-label="Status">${[[1, 'Active'], [0, 'Inactive'], [2, 'Blacklist']].map(([k, l]) => `<label><input type="radio" name="tfX" value="${k}" ${t.status === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
    <div class="wf"><span class="lbl-s big">Foto kendaraan</span><button type="button" class="drop-z" data-up>${ic('img', 22)}<b>Tarik foto ke sini atau pilih file</b><small>Depan, samping, dan plat nomor</small></button></div>
  </form></div>
  <div class="fs-f"><button class="m-btn" data-close>Batal</button><button class="m-btn pri" id="tfSv">${ic('check')}${id ? 'Simpan perubahan' : 'Daftarkan & buat QR'}</button></div>`, id ? 'Ubah truk' : 'Daftarkan truk');
  $$('[data-up]').forEach((b) => b.onclick = () => H.toast('Unggah foto belum aktif di prototipe ini.'));
  $('#tfL').addEventListener('input', (e) => { const p = e.target.selectionStart; e.target.value = e.target.value.toUpperCase(); e.target.setSelectionRange(p, p); });
  $('#tfSv').onclick = () => { const n = $('#tfN'), l = $('#tfL'); let bad = null;
    [[n, !n.value.trim(), 'Nama supir wajib diisi.', '#tfNm'], [l, !/^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$/.test(l.value.trim()), 'Format plat: KT 8421 RU', '#tfLm']].forEach(([el, cond, msg, m]) => { const w = el.closest('.wf'); w.classList.remove('err'); $(m).textContent = ''; if (cond) { void w.offsetWidth; w.classList.add('err'); $(m).textContent = msg; bad = bad || el; } });
    if (bad) { bad.focus(); return; }
    const obj = id ? t : { id: 910 + TRUCKS.length, trips: 0, ton: 0, photos: 0, qr: Math.floor(Math.random() * 1e12).toString(36).toUpperCase(), reg: '06/11/2026' };
    Object.assign(obj, { con: +$('#tfC').value, name: n.value.trim(), phone: $('#tfP').value, plate: l.value.trim().replace(/\s+/g, ' '), sim: $('#tfS').value, type: $('input[name=tfT]:checked').value, status: +$('input[name=tfX]:checked').value });
    if (!id) TRUCKS.unshift(obj); closeSheet(); H.toast(id ? `${obj.plate} diperbarui` : `${obj.plate} terdaftar · QR siap dicetak`); tList(); if (!id) setTimeout(() => tSheet(obj.id, 'qr'), H.reduced() ? 0 : 360); };
  setTimeout(() => $('#tfN').focus(), 60);
}

/* ---------------- public ---------------- */
let cur = null;
const reg = (fn) => ({ mount(el, h) { H = { ...H, ...h }; cur = el; fn(el); }, start() { start(cur); } });
Object.assign(window.FFBPages, { abw: reg(mountAbw), 'abw-harian': reg(mountDaily), kontraktor: reg(mountCon), truk: reg(mountTruck) });
})();
