/* Curah Hujan pages: input baru, daftar, grafik bulanan per tahun, perbandingan tahunan.
   Sources: RainfallCrudController (create/list), yearlyrainfallchart, yearly2rainfallchart. Data is dummy. */
(() => {
'use strict';
const K = window.FFBKit; if (!K) return;
const { $, $$, fmt, esc, ic, rng, pad, pageHead, menuBtn, bindDropdowns, closeAllDD, pager, openSheet, start, ZONES } = K;
let H = { reduced: () => false, toast: () => {} };
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const STATIONS = Object.keys(ZONES);
const CUACA = { cerah: ['Cerah', 't-ok'], gerimis: ['Gerimis', 't-info'], hujan: ['Hujan', 't-warn'], lebat: ['Hujan lebat', 't-bad'] };
const cuacaOf = (mm) => mm === 0 ? 'cerah' : mm < 5 ? 'gerimis' : mm < 30 ? 'hujan' : 'lebat';
const YEARS = [2022, 2023, 2024, 2025, 2026];
const YCOL = { 2022: '#B9C9BF', 2023: '#8FB39C', 2024: '#5B9B72', 2025: '#2FA84F', 2026: '#0B4A3A' };

/* monthly totals per station per year (mm) — tropical, wetter Nov–Jan */
const BASE = [262, 198, 231, 245, 188, 132, 118, 104, 141, 205, 288, 301];
const MONTHLY = {};
YEARS.forEach((y) => { MONTHLY[y] = {}; STATIONS.forEach((s, si) => { const r = rng(y * 13 + si * 7); MONTHLY[y][s] = BASE.map((b, m) => (y === 2026 && m > 10) ? null : Math.round(b * (.62 + r() * .76) * (m === 10 && y === 2026 ? .24 : 1))); }); });
const rainDays = (mm) => mm == null ? null : Math.max(1, Math.round(mm / 14));

/* daily entries for the list */
const ROWS = (() => { const r = rng(5150), int = (a, b) => Math.floor(a + r() * (b - a + 1)), out = []; let id = 8420;
  for (let d = 6; d >= 1; d--) STATIONS.forEach((s) => { const wet = r() < .62, mm = wet ? +(r() < .2 ? 30 + r() * 48 : r() * 28).toFixed(1) : 0, durs = wet ? Array.from({ length: int(1, 2) }, () => { const h = int(1, 20), dur = int(20, 150); return [`${pad(h)}:${pad(int(0, 5) * 10)}`, dur]; }) : [];
    out.push({ id: id--, tgl: `${pad(d)}/11/2026`, st: s, mm, durs, by: ['Asisten ' + s, 'Krani ' + s][int(0, 1)], remark: wet && r() < .25 ? ['Banjir kecil di blok rendah', 'Jalan produksi licin', 'Panen dihentikan 1 jam'][int(0, 2)] : '', at: `${pad(d)}/11/2026 ${pad(int(6, 9))}:${pad(int(0, 59))}` }); });
  return out; })();
const durTot = (x) => x.durs.reduce((a, d) => a + d[1], 0);
const hm = (m) => m ? `${Math.floor(m / 60) ? Math.floor(m / 60) + ' j ' : ''}${m % 60 ? (m % 60) + ' m' : ''}`.trim() : '—';

/* ============================== CREATE ============================== */
const F = { tgl: '2026-11-06', st: 'EMU1', mm: '', durs: [['', '']], remark: '' };
function mountCreate(root) {
  root.innerHTML = pageHead({ kicker: 'Curah Hujan · Input', title: 'Input Curah Hujan', sub: 'Catat curah hujan harian per stasiun penakar. Isi jam mulai dan selesai untuk setiap kejadian hujan; durasi dihitung otomatis.', right: `<a class="f-btn" href="#hujan">${ic('file')}Daftar curah hujan</a>` }) + `
  <div class="wrap f-body"><div class="hj-grid">
    <section class="f-card hj-form frv" style="--i:2"><form id="hjF" novalidate>
      <div class="f2"><div class="wf"><label for="hjT">Tanggal</label><input id="hjT" type="date" value="${F.tgl}" max="2026-11-06"></div>
      <div class="wf"><label for="hjS">Stasiun / zone</label><select id="hjS" class="sel">${STATIONS.map((s) => `<option ${F.st === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <div class="wf"><label for="hjM">Curah hujan <small>(mm)</small></label><div class="mm-in"><input id="hjM" type="number" inputmode="decimal" step="0.1" min="0" placeholder="0.0" value="${F.mm}"><span>mm</span></div><p class="w-msg" id="hjMm"></p>
        <div class="mm-quick" role="group" aria-label="Isi cepat"><button type="button" data-mm="0">Tidak hujan</button><button type="button" data-mm="2.5">2.5</button><button type="button" data-mm="10">10</button><button type="button" data-mm="25">25</button><button type="button" data-mm="50">50</button></div></div>
      <div class="wf"><span class="lbl-s big">Durasi hujan</span><div id="hjDur" class="dur-list"></div><button type="button" class="m-btn sm" id="hjAdd"><span aria-hidden="true">+</span> Tambah kejadian hujan</button><p class="w-msg" id="hjDm"></p></div>
      <div class="wf"><label for="hjR">Remarks</label><textarea id="hjR" rows="3" placeholder="mis. Jalan produksi licin, panen dihentikan 1 jam">${esc(F.remark)}</textarea></div>
      <div class="hj-acts"><button type="reset" class="m-btn" id="hjReset">Kosongkan</button><button type="submit" class="m-btn pri">${ic('check')}Simpan</button></div>
    </form></section>
    <aside class="hj-side frv" style="--i:3">
      <div class="hj-prev" id="hjPrev"></div>
      <div class="f-card hj-recent"><h3>Input terakhir · <span id="hjSt">${F.st}</span></h3><ul id="hjRec"></ul></div>
    </aside>
  </div></div>`;
  const durs = () => { $('#hjDur').innerHTML = F.durs.map((d, i) => `<div class="dur-row" style="--r:${i}"><span class="dur-n">${i + 1}</span><label><span class="sr">Mulai ${i + 1}</span><input type="time" data-ds="${i}" value="${d[0]}"></label><span class="dur-to">s/d</span><label><span class="sr">Selesai ${i + 1}</span><input type="time" data-de="${i}" value="${d[1]}"></label><b class="dur-len" data-dl="${i}">${len(d)}</b><button type="button" class="iconbtn sm" data-dx="${i}" aria-label="Hapus kejadian ${i + 1}" ${F.durs.length === 1 ? 'disabled' : ''}>${ic('x', 16)}</button></div>`).join('');
    $$('[data-ds],[data-de]', root).forEach((inp) => inp.addEventListener('input', () => { const i = +(inp.dataset.ds ?? inp.dataset.de); F.durs[i][inp.dataset.ds != null ? 0 : 1] = inp.value; $(`[data-dl="${i}"]`).textContent = len(F.durs[i]); prev(); }));
    $$('[data-dx]', root).forEach((b) => b.onclick = () => { F.durs.splice(+b.dataset.dx, 1); durs(); prev(); }); };
  const mins = (d) => { if (!d[0] || !d[1]) return 0; const [a, b] = d.map((t) => { const [h, m] = t.split(':'); return +h * 60 + +m; }); return b > a ? b - a : 0; };
  const len = (d) => (d[0] && d[1]) ? (mins(d) ? hm(mins(d)) : 'Jam tidak valid') : '—';
  const prev = () => { const mm = +F.mm || 0, c = cuacaOf(mm), tot = F.durs.reduce((a, d) => a + mins(d), 0), lvl = Math.min(1, mm / 60);
    $('#hjPrev').innerHTML = `<span class="hp-k">Pratinjau</span><div class="gauge" style="--v:${lvl.toFixed(3)}"><div class="g-tube"><i></i></div><div class="g-scale"><span>60</span><span>30</span><span>5</span><span>0</span></div></div>
      <div class="hp-t"><b>${fmt(mm, 1)} <small>mm</small></b><span class="st-chip ${CUACA[c][1]}">${CUACA[c][0]}</span><dl><div><dt>Tanggal</dt><dd>${F.tgl.split('-').reverse().join('/')}</dd></div><div><dt>Stasiun</dt><dd>${F.st}</dd></div><div><dt>Durasi total</dt><dd>${hm(tot)}</dd></div><div><dt>Intensitas</dt><dd>${tot && mm ? fmt(mm / (tot / 60), 1) + ' mm/jam' : '—'}</dd></div></dl></div>`; };
  const rec = () => { $('#hjSt').textContent = F.st; $('#hjRec').innerHTML = ROWS.filter((x) => x.st === F.st).slice(0, 5).map((x) => `<li><span>${x.tgl}</span><span class="st-chip ${CUACA[cuacaOf(x.mm)][1]}">${CUACA[cuacaOf(x.mm)][0]}</span><b>${fmt(x.mm, 1)} mm</b></li>`).join(''); };
  durs(); prev(); rec();
  $('#hjT').oninput = (e) => { F.tgl = e.target.value; prev(); };
  $('#hjS').onchange = (e) => { F.st = e.target.value; prev(); rec(); };
  $('#hjM').addEventListener('input', (e) => { F.mm = e.target.value; prev(); });
  $$('[data-mm]', root).forEach((b) => b.onclick = () => { F.mm = b.dataset.mm; $('#hjM').value = F.mm; if (F.mm === '0') { F.durs = [['', '']]; durs(); } prev(); });
  $('#hjAdd').onclick = () => { F.durs.push(['', '']); durs(); const l = $$('[data-ds]', root).pop(); l && l.focus(); };
  $('#hjR').oninput = (e) => { F.remark = e.target.value; };
  $('#hjReset').onclick = (e) => { e.preventDefault(); Object.assign(F, { mm: '', durs: [['', '']], remark: '' }); mountCreate(root); start(root); };
  $('#hjF').onsubmit = (e) => { e.preventDefault();
    const m = $('#hjM'), w = m.closest('.wf'); w.classList.remove('err'); $('#hjMm').textContent = ''; $('#hjDm').textContent = '';
    if (F.mm === '' || +F.mm < 0) { void w.offsetWidth; w.classList.add('err'); $('#hjMm').textContent = 'Isi curah hujan (0 bila tidak hujan).'; m.focus(); return; }
    if (+F.mm > 0 && F.durs.some((d) => (d[0] || d[1]) && !mins(d))) { $('#hjDm').textContent = 'Jam selesai harus setelah jam mulai.'; return; }
    const dup = ROWS.find((x) => x.st === F.st && x.tgl === F.tgl.split('-').reverse().join('/'));
    ROWS.unshift({ id: ROWS[0].id + 1, tgl: F.tgl.split('-').reverse().join('/'), st: F.st, mm: +F.mm, durs: F.durs.filter((d) => mins(d)).map((d) => [d[0], mins(d)]), by: 'Agus Setiawan', remark: F.remark, at: '06/11/2026 11:52' });
    H.toast(dup ? `Tersimpan. Catatan: ${F.st} sudah punya input di tanggal ini.` : `Curah hujan ${F.st} ${fmt(+F.mm, 1)} mm tersimpan`);
    Object.assign(F, { mm: '', durs: [['', '']], remark: '' }); mountCreate(root); start(root); };
}

/* ============================== LIST ============================== */
const L = { q: '', st: [], c: 'all', page: 1, per: 25 };
function mountList(root) {
  const last7 = ROWS.filter((x) => +x.tgl.slice(0, 2) >= 1), tot = (s) => last7.filter((x) => x.st === s).reduce((a, x) => a + x.mm, 0), mx = Math.max(...STATIONS.map(tot));
  root.innerHTML = pageHead({ kicker: 'Curah Hujan', title: 'Daftar Curah Hujan', sub: 'Catatan curah hujan harian semua stasiun. Klik baris untuk melihat kejadian hujan dan mengubah data.', right: `<a class="f-btn" href="#hujan-baru">${ic('check')}Input baru</a>${menuBtn('hjx', 'Ekspor', 'dl', [['xlsx', 'Excel (.xlsx)', 'file'], ['csv', 'CSV', 'file'], ['pdf', 'PDF', 'file']])}` }) + `
  <div class="wrap f-body">
    <div class="hj-sum frv" style="--i:2">${STATIONS.map((s) => `<button class="hs-card" data-hs="${s}" aria-pressed="${L.st.includes(s)}"><span>${s}</span><b>${fmt(tot(s), 1)}<small> mm</small></b><span class="hs-bar"><i style="--w:${(tot(s) / mx).toFixed(3)}"></i></span><small>${last7.filter((x) => x.st === s && x.mm > 0).length} hari hujan · Nov 2026</small></button>`).join('')}</div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="hlQ" type="search" placeholder="Cari tanggal, stasiun, remarks…" value="${esc(L.q)}"></label>
        <div class="seg-s" role="group" aria-label="Cuaca">${[['all', 'Semua'], ...Object.entries(CUACA).map(([k, v]) => [k, v[0]])].map(([k, l]) => `<button data-hc="${k}" aria-pressed="${L.c === k}">${l}</button>`).join('')}</div>
      </div>
      <div id="hlT"></div>
    </section>
  </div>`;
  bindDropdowns(root);
  $$('[data-act]', $('#hjx').parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(`Mengekspor curah hujan ke ${b.textContent.trim()}…`); });
  $('#hlQ').addEventListener('input', (e) => { L.q = e.target.value; L.page = 1; lTable(); });
  $$('[data-hc]', root).forEach((b) => b.onclick = () => { L.c = b.dataset.hc; $$('[data-hc]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); L.page = 1; lTable(); });
  $$('[data-hs]', root).forEach((b) => b.onclick = () => { const s = b.dataset.hs; L.st = L.st.includes(s) ? L.st.filter((x) => x !== s) : [...L.st, s]; b.setAttribute('aria-pressed', L.st.includes(s)); L.page = 1; lTable(); });
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.hs-bar i', root).forEach((i) => i.classList.add('go'))));
  lTable();
}
function lTable() {
  const q = L.q.toLowerCase(), el = $('#hlT');
  const r = ROWS.filter((x) => (!L.st.length || L.st.includes(x.st)) && (L.c === 'all' || cuacaOf(x.mm) === L.c) && (!q || `${x.tgl} ${x.st} ${x.remark} ${x.by}`.toLowerCase().includes(q)));
  if (!r.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada data</h3><p>Ubah filter atau kata kunci.</p></div>`; return; }
  const pages = Math.ceil(r.length / L.per); L.page = Math.min(L.page, pages); const from = (L.page - 1) * L.per, mx = Math.max(...ROWS.map((x) => x.mm));
  el.innerHTML = `<div class="f-tw" tabindex="0" aria-label="Tabel curah hujan"><table class="f-table"><thead><tr><th>Tanggal</th><th>Stasiun</th><th>Cuaca</th><th class="n">Curah hujan</th><th>Kejadian hujan</th><th class="n">Durasi</th><th>Remarks</th><th>Diinput oleh</th></tr></thead><tbody>${r.slice(from, from + L.per).map((x, i) => `<tr data-hr="${x.id}" style="--r:${i}"><td><b>${x.tgl}</b></td><td>${x.st}</td><td><span class="st-chip ${CUACA[cuacaOf(x.mm)][1]}">${CUACA[cuacaOf(x.mm)][0]}</span></td><td class="n"><span class="mm-cell"><i style="--w:${(x.mm / mx).toFixed(3)}"></i><b>${fmt(x.mm, 1)}</b> mm</span></td><td>${x.durs.length ? x.durs.map((d) => `<span class="dur-chip">${d[0]} · ${hm(d[1])}</span>`).join(' ') : '<span class="mute">—</span>'}</td><td class="n">${hm(durTot(x))}</td><td>${x.remark ? esc(x.remark) : '<span class="mute">—</span>'}</td><td>${esc(x.by)}<small>${x.at.slice(11)}</small></td></tr>`).join('')}</tbody></table></div>${pager(L.page, pages, r.length, L.per, from)}`;
  $$('tr[data-hr]', el).forEach((t) => t.onclick = () => hSheet(+t.dataset.hr));
  $$('[data-p]', el).forEach((b) => b.onclick = () => { L.page = +b.dataset.p; lTable(); });
  const per = $('[data-per]', el); if (per) per.onchange = (e) => { L.per = +e.target.value; L.page = 1; lTable(); };
}
function hSheet(id) {
  const x = ROWS.find((y) => y.id === id), c = cuacaOf(x.mm);
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Curah hujan · ${x.st}</p><h2>${x.tgl}</h2><p class="mute">Diinput ${esc(x.by)} · ${x.at}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b"><div class="fs-top"><span class="st-chip ${CUACA[c][1]}">${CUACA[c][0]}</span></div>
    <div class="fs-figs"><div><span>Curah hujan</span><b>${fmt(x.mm, 1)} mm</b></div><div><span>Durasi</span><b>${hm(durTot(x))}</b></div><div><span>Intensitas</span><b>${durTot(x) ? fmt(x.mm / (durTot(x) / 60), 1) : '—'}</b></div></div>
    <h3>Kejadian hujan</h3>${x.durs.length ? `<ol class="ev-list">${x.durs.map((d) => { const [h, m] = d[0].split(':').map(Number), e = h * 60 + m + d[1]; return `<li><b>${d[0]} – ${pad(Math.floor(e / 60) % 24)}:${pad(e % 60)}</b><span>${hm(d[1])}</span></li>`; }).join('')}</ol>` : '<p class="mute">Tidak ada hujan.</p>'}
    <h3>Remarks</h3><p>${x.remark ? esc(x.remark) : '<span class="mute">—</span>'}</p></div>
  <div class="fs-f"><button class="m-btn" data-close>Tutup</button><a class="m-btn pri" href="#hujan-baru" data-close>${ic('cols')}Ubah</a></div>`, `Curah hujan ${x.st} ${x.tgl}`);
}

/* ============================== CHART HELPERS ============================== */
const W = 1100, HH = 330, PL = 44, PR = 12, PT = 16, PB = 30;
function axis(max, step) { let s = ''; for (let v = 0; v <= max; v += step) { const y = PT + (HH - PT - PB) * (1 - v / max); s += `<line x1="${PL}" x2="${W - PR}" y1="${y}" y2="${y}" class="gl"/><text x="${PL - 8}" y="${y + 4}" class="ax" text-anchor="end">${v}</text>`; } return s + BULAN.map((b, i) => `<text x="${PL + (W - PL - PR) * (i + .5) / 12}" y="${HH - 8}" class="ax" text-anchor="middle">${b}</text>`).join(''); }
const niceMax = (v) => { const s = v > 400 ? 100 : 50; return [Math.ceil(v / s) * s, s]; };
function tip(svg, wrap) {
  const t = document.createElement('div'); t.className = 'ch-tip'; t.hidden = true; wrap.appendChild(t);
  svg.addEventListener('pointermove', (e) => { const g = e.target.closest('[data-tip]'); if (!g) { t.hidden = true; return; } t.innerHTML = g.dataset.tip; t.hidden = false; const r = wrap.getBoundingClientRect(); let x = e.clientX - r.left + 12; if (x + 180 > r.width) x -= 200; t.style.transform = `translate(${x}px,${e.clientY - r.top - 12}px)`; });
  svg.addEventListener('pointerleave', () => { t.hidden = true; });
}

/* ============================== MONTHLY (yearlyrainfallchart) ============================== */
const M = { y: 2026, st: 'all' };
const sumSt = (y, st) => BULAN.map((_, m) => { const v = (st === 'all' ? STATIONS : [st]).map((s) => MONTHLY[y][s][m]); return v[0] == null ? null : Math.round(v.reduce((a, b) => a + b, 0) / v.length); });
function mountMonthly(root) {
  root.innerHTML = pageHead({ kicker: 'Curah Hujan · Grafik', title: 'Curah Hujan Bulanan', sub: 'Total curah hujan per bulan dalam satu tahun, dibanding rata-rata 5 tahun. Pilih stasiun untuk melihat satu lokasi.', right: `<button class="f-btn" id="hmP">${ic('dl')}Unduh grafik</button>` }) + `
  <div class="wrap f-body">
    <section class="f-card frv" style="--i:2">
      <div class="f-tools">
        <div class="seg-s" role="group" aria-label="Tahun">${YEARS.map((y) => `<button data-my="${y}" aria-pressed="${M.y === y}">${y}</button>`).join('')}</div>
        <label class="ff-sel"><span class="sr">Stasiun</span><select id="hmS"><option value="all">Rata-rata semua stasiun</option>${STATIONS.map((s) => `<option ${M.st === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      </div>
      <div class="ch-kpi" id="hmK"></div>
      <div class="ch-wrap" id="hmC"></div>
      <div class="ch-leg"><span><i class="lg-bar"></i>Curah hujan ${'<b id="hmLy">' + M.y + '</b>'}</span><span><i class="lg-line"></i>Rata-rata 5 tahun</span><span><i class="lg-dry"></i>Bulan kering (&lt; 100 mm)</span></div>
    </section>
    <section class="f-card frv" style="--i:3"><div class="tbl-h"><h2>Per stasiun · <span id="hmTy">${M.y}</span></h2><p class="mute">mm per bulan · angka kecil = hari hujan</p></div><div class="f-tw" tabindex="0" id="hmT"></div></section>
  </div>`;
  $$('[data-my]', root).forEach((b) => b.onclick = () => { M.y = +b.dataset.my; $$('[data-my]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); mDraw(); });
  $('#hmS').onchange = (e) => { M.st = e.target.value; mDraw(); };
  $('#hmP').onclick = () => H.toast('Mengunduh grafik curah hujan bulanan (PNG)…');
  mDraw();
}
function mDraw() {
  const v = sumSt(M.y, M.st), avg = BULAN.map((_, m) => Math.round(YEARS.filter((y) => y < 2026).reduce((a, y) => a + sumSt(y, M.st)[m], 0) / 4)), [max, step] = niceMax(Math.max(...v.filter((x) => x != null), ...avg) * 1.08);
  const bw = (W - PL - PR) / 12, y = (val) => PT + (HH - PT - PB) * (1 - val / max), done = v.filter((x) => x != null), total = done.reduce((a, b) => a + b, 0), avgTot = avg.slice(0, done.length).reduce((a, b) => a + b, 0);
  $('#hmLy').textContent = M.y; $('#hmTy').textContent = M.y;
  $('#hmK').innerHTML = [['Total ' + (done.length < 12 ? 'Jan–' + BULAN[done.length - 1] : 'setahun'), fmt(total), 'mm'], ['Dibanding rata-rata', (total >= avgTot ? '+' : '') + fmt((total / avgTot - 1) * 100, 1) + '%', total >= avgTot ? 'lebih basah' : 'lebih kering'], ['Bulan terbasah', BULAN[v.indexOf(Math.max(...done))], fmt(Math.max(...done)) + ' mm'], ['Bulan kering', done.filter((x) => x < 100).length, 'bulan < 100 mm']].map((k) => `<div><span>${k[0]}</span><b>${k[1]}</b><small>${k[2]}</small></div>`).join('');
  const bars = v.map((val, i) => val == null ? `<rect x="${PL + bw * i + bw * .2}" y="${y(0) - 2}" width="${bw * .6}" height="2" class="b-na"/>` : `<g data-tip="<b>${BULAN[i]} ${M.y}</b>${fmt(val)} mm · ${rainDays(val)} hari hujan<br><span>Rata-rata ${fmt(avg[i])} mm</span>"><rect class="hit" x="${PL + bw * i}" y="${PT}" width="${bw}" height="${HH - PT - PB}"/><rect class="cb ${val < 100 ? 'dry' : ''}" style="--i:${i}" x="${PL + bw * i + bw * .2}" y="${y(val)}" width="${bw * .6}" height="${y(0) - y(val)}" rx="4"/><text x="${PL + bw * (i + .5)}" y="${y(val) - 6}" class="bv" text-anchor="middle">${val}</text></g>`).join('');
  const line = avg.map((a, i) => `${i ? 'L' : 'M'}${PL + bw * (i + .5)},${y(a)}`).join('');
  $('#hmC').innerHTML = `<svg viewBox="0 0 ${W} ${HH}" class="ch" role="img" aria-label="Grafik curah hujan bulanan ${M.y}">${axis(max, step)}${bars}<path d="${line}" class="avg"/>${avg.map((a, i) => `<circle cx="${PL + bw * (i + .5)}" cy="${y(a)}" r="3" class="avg-d"/>`).join('')}</svg>`;
  tip($('#hmC svg'), $('#hmC'));
  const sts = M.st === 'all' ? STATIONS : [M.st];
  $('#hmT').innerHTML = `<table class="f-table ch-t"><thead><tr><th>Stasiun</th>${BULAN.map((b) => `<th class="n">${b}</th>`).join('')}<th class="n">Total</th></tr></thead><tbody>${sts.map((s) => { const row = MONTHLY[M.y][s]; return `<tr><th scope="row">${s}</th>${row.map((x) => x == null ? '<td class="n mute">—</td>' : `<td class="n ${x < 100 ? 'dry' : x > 300 ? 'wet' : ''}">${x}<small>${rainDays(x)} h</small></td>`).join('')}<td class="n"><b>${fmt(row.filter((x) => x != null).reduce((a, b) => a + b, 0))}</b></td></tr>`; }).join('')}</tbody></table>`;
}

/* ============================== YEARLY (yearly2rainfallchart) ============================== */
const Y = { on: new Set(YEARS), st: 'all', mode: 'month' };
function mountYearly(root) {
  root.innerHTML = pageHead({ kicker: 'Curah Hujan · Grafik', title: 'Perbandingan Curah Hujan Tahunan', sub: 'Pola curah hujan bulanan beberapa tahun dalam satu grafik. Matikan tahun di legenda untuk membandingkan lebih jelas.', right: `<button class="f-btn" id="hyP">${ic('dl')}Unduh grafik</button>` }) + `
  <div class="wrap f-body">
    <section class="f-card frv" style="--i:2">
      <div class="f-tools">
        <div class="yr-tog" role="group" aria-label="Tahun ditampilkan">${YEARS.map((y) => `<button data-yy="${y}" aria-pressed="${Y.on.has(y)}" style="--c:${YCOL[y]}"><i></i>${y}</button>`).join('')}</div>
        <label class="ff-sel"><span class="sr">Stasiun</span><select id="hyS"><option value="all">Rata-rata semua stasiun</option>${STATIONS.map((s) => `<option ${Y.st === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <div class="seg-s" role="group" aria-label="Tampilan"><button data-ym="month" aria-pressed="${Y.mode === 'month'}">Per bulan</button><button data-ym="cum" aria-pressed="${Y.mode === 'cum'}">Kumulatif</button></div>
      </div>
      <div class="ch-wrap" id="hyC"></div>
    </section>
    <div class="yr-cards frv" style="--i:3" id="hyCards"></div>
  </div>`;
  $$('[data-yy]', root).forEach((b) => b.onclick = () => { const y = +b.dataset.yy; if (Y.on.has(y) && Y.on.size === 1) return; Y.on.has(y) ? Y.on.delete(y) : Y.on.add(y); b.setAttribute('aria-pressed', Y.on.has(y)); yDraw(); });
  $('#hyS').onchange = (e) => { Y.st = e.target.value; yDraw(); };
  $$('[data-ym]', root).forEach((b) => b.onclick = () => { Y.mode = b.dataset.ym; $$('[data-ym]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); yDraw(); });
  $('#hyP').onclick = () => H.toast('Mengunduh grafik perbandingan tahunan (PNG)…');
  yDraw();
}
function yDraw() {
  const ser = {}; YEARS.forEach((y) => { let acc = 0; ser[y] = sumSt(y, Y.st).map((v) => v == null ? null : (Y.mode === 'cum' ? (acc += v) : v)); });
  const vis = YEARS.filter((y) => Y.on.has(y)), [max, step] = niceMax(Math.max(...vis.flatMap((y) => ser[y].filter((v) => v != null))) * 1.06), bw = (W - PL - PR) / 12, yy = (v) => PT + (HH - PT - PB) * (1 - v / max);
  const paths = vis.map((y) => { const pts = ser[y].map((v, i) => v == null ? null : [PL + bw * (i + .5), yy(v)]).filter(Boolean); return `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join('')}" class="yl ${y === 2026 ? 'cur' : ''}" style="--c:${YCOL[y]}"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="${y === 2026 ? 4 : 3}" fill="${YCOL[y]}"/>`).join('')}`; }).join('');
  const cols = BULAN.map((b, i) => `<rect class="hit" x="${PL + bw * i}" y="${PT}" width="${bw}" height="${HH - PT - PB}" data-tip="<b>${b}</b>${vis.map((y) => `<span class='tl'><i style='background:${YCOL[y]}'></i>${y}<em>${ser[y][i] == null ? '—' : fmt(ser[y][i]) + ' mm'}</em></span>`).join('')}"/>`).join('');
  $('#hyC').innerHTML = `<svg viewBox="0 0 ${W} ${HH}" class="ch" role="img" aria-label="Grafik perbandingan curah hujan tahunan">${axis(max, step)}${paths}${cols}</svg>`;
  tip($('#hyC svg'), $('#hyC'));
  const tot = (y) => sumSt(y, Y.st).filter((v) => v != null).reduce((a, b) => a + b, 0), ytdN = sumSt(2026, Y.st).filter((v) => v != null).length;
  $('#hyCards').innerHTML = YEARS.slice().reverse().map((y, i) => { const v = sumSt(y, Y.st), t = tot(y), ytd = v.slice(0, ytdN).reduce((a, b) => a + b, 0); return `<div class="yr-card ${Y.on.has(y) ? '' : 'off'}" style="--c:${YCOL[y]};--r:${i}"><span class="yc-y"><i></i>${y}${y === 2026 ? ' <small>berjalan</small>' : ''}</span><b>${fmt(t)} <small>mm</small></b><small>${y === 2026 ? 'Jan–' + BULAN[ytdN - 1] : 'Setahun penuh'} · ${v.filter((x) => x != null).reduce((a, x) => a + rainDays(x), 0)} hari hujan</small><span class="yc-ytd">Jan–${BULAN[ytdN - 1]}: <b>${fmt(ytd)} mm</b></span><svg viewBox="0 0 120 30" class="spark" aria-hidden="true"><path d="${v.map((x, k) => x == null ? '' : `${k ? 'L' : 'M'}${k * 10 + 5},${28 - x / 13}`).join('')}"/></svg></div>`; }).join('');
}

/* ---------------- public ---------------- */
let cur = null;
const reg = (fn) => ({ mount(el, h) { H = { ...H, ...h }; cur = el; fn(el); }, start() { start(cur); } });
Object.assign(window.FFBPages, { 'hujan-baru': reg(mountCreate), hujan: reg(mountList), 'hujan-bulan': reg(mountMonthly), 'hujan-tahun': reg(mountYearly) });
})();
