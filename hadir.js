/* Kehadiran pages: daftar kehadiran per gang, kehadiran QR per pekerja, ringkasan grafik.
   Sources: AttendanceCrudController (/admin/attendance), attendance_qr, attendance_summary_graphical. Data is dummy. */
(() => {
'use strict';
const K = window.FFBKit; if (!K) return;
const { $, $$, fmt, esc, ic, rng, pad, pageHead, menuBtn, bindDropdowns, closeAllDD, pager, openSheet, start, NAMES, ZONES } = K;
let H = { reduced: () => false, toast: () => {} };
const MANDORS = ['Yohanes Ndruru', 'Markus Laia', 'Darius Tarigan', 'Paulus Gultom', 'Benny Sihombing', 'Rizal Harahap'];
const ROLES = ['Pemanen', 'Pemanen', 'Pemanen', 'Pemanen', 'Pengutip brondolan', 'Perawatan', 'Penyemprot', 'Pemupuk', 'Tukang muat', 'Kerani'];
const ST = { hadir: ['Hadir', 't-ok'], sakit: ['Sakit', 't-info'], izin: ['Izin', 't-warn'], mangkir: ['Mangkir', 't-bad'], cuti: ['Cuti', 't-mute'] };
const SCOL = { hadir: 'var(--leaf)', sakit: '#2F6690', izin: '#D99A00', mangkir: '#B42318', cuti: '#9AA8A0' };

/* -------- per-worker QR attendance (06/11 + 05/11) -------- */
const QR = (() => { const r = rng(4747), int = (a, b) => Math.floor(a + r() * (b - a + 1)), out = []; let n = 0;
  ['06/11/2026', '05/11/2026'].forEach((tgl) => Object.entries(ZONES).forEach(([z, gs]) => gs.forEach((g) => { const size = int(7, 11);
    for (let i = 0; i < size; i++) { const x = r(), st = x < .86 ? 'hadir' : x < .91 ? 'sakit' : x < .95 ? 'izin' : x < .985 ? 'mangkir' : 'cuti', role = ROLES[int(0, ROLES.length - 1)];
      out.push({ id: ++n, tgl, zone: z, gang: g, nik: '61' + int(10, 99) + String(int(100000, 999999)), nama: NAMES[int(0, NAMES.length - 1)], role, st, jam: st === 'hadir' ? `${pad(int(5, 6))}:${pad(int(10, 59))}` : '', hasil: st === 'hadir' ? r() < .9 : false, remark: st === 'sakit' ? 'Surat dokter' : st === 'izin' ? ['Urusan keluarga', 'Ke kota'][int(0, 1)] : st === 'mangkir' ? 'Tanpa keterangan' : st === 'cuti' ? 'Cuti tahunan' : r() < .06 ? 'Terlambat 20 menit' : '', foto: st === 'hadir' && r() < .94 }); } })));
  return out; })();

/* -------- gang summary (attendance list) built from QR rows -------- */
const GANG = (() => { const g = {}, r = rng(3131); QR.forEach((x) => { const k = x.tgl + x.gang + x.zone; g[k] = g[k] || { tgl: x.tgl, zone: x.zone, gang: x.gang, block: 'ABCDEFGH'[Math.floor(r() * 8)] + pad(1 + Math.floor(r() * 32)), mandor: MANDORS[Math.floor(r() * MANDORS.length)], rows: [], at: `${x.tgl} 0${6 + Math.floor(r() * 2)}:${pad(Math.floor(r() * 60))}`, foto: r() < .9 }; g[k].rows.push(x); });
  return Object.values(g).map((x, i) => ({ ...x, id: 7300 - i, total: x.rows.length, hadir: x.rows.filter((y) => y.st === 'hadir').length })); })();
const pct = (a, b) => b ? a / b * 100 : 0;
const tone = (p) => p >= 90 ? 'ok' : p >= 80 ? 'warn' : 'bad';
const ring = (p, sz = 44) => { const r = sz / 2 - 4, c = 2 * Math.PI * r; return `<svg class="hring ${tone(p)}" viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}" aria-hidden="true"><circle cx="${sz / 2}" cy="${sz / 2}" r="${r}" class="hr-t"/><circle cx="${sz / 2}" cy="${sz / 2}" r="${r}" class="hr-v" style="--c:${c.toFixed(1)};--o:${(c * (1 - p / 100)).toFixed(1)}" transform="rotate(-90 ${sz / 2} ${sz / 2})"/></svg>`; };
const foto = (ok, label) => ok ? `<span class="ph-th" role="img" aria-label="${label}"><i></i></span>` : `<span class="ph-th none" title="Tidak ada foto">${ic('noimg', 16)}</span>`;

/* ============================== /admin/attendance ============================== */
const A = { day: '06/11/2026', zone: [], q: '', sort: 'pct', page: 1, per: 25 };
function mountList(root) {
  const day = GANG.filter((g) => g.tgl === A.day), tot = day.reduce((a, g) => a + g.total, 0), hd = day.reduce((a, g) => a + g.hadir, 0);
  root.innerHTML = pageHead({ kicker: 'Kehadiran', title: 'Kehadiran Gang', sub: 'Absensi pagi per gang dari aplikasi mandor: berapa pekerja hadir dari total anggota, lengkap dengan foto apel pagi.', right: `<a class="f-btn" href="#hadir-scan">${ic('qr')}Kehadiran QR</a>${menuBtn('hdx', 'Ekspor', 'dl', [['xlsx', 'Excel (.xlsx)', 'file'], ['pdf', 'PDF', 'file']])}` }) + `
  <div class="wrap f-body">
    <div class="hd-kpi frv" style="--i:2">
      <div class="hk-main">${ring(pct(hd, tot), 92)}<div><span>Kehadiran ${A.day.slice(0, 5)}</span><b>${fmt(pct(hd, tot), 1)}%</b><small>${fmt(hd)} dari ${fmt(tot)} pekerja</small></div></div>
      ${Object.keys(ST).filter((k) => k !== 'hadir').map((k) => { const n = QR.filter((x) => x.tgl === A.day && x.st === k).length; return `<div class="hk"><span><i style="background:${SCOL[k]}"></i>${ST[k][0]}</span><b>${n}</b><small>pekerja</small></div>`; }).join('')}
      <div class="hk"><span>Gang di bawah 80%</span><b class="${day.filter((g) => pct(g.hadir, g.total) < 80).length ? 'bad-t' : ''}">${day.filter((g) => pct(g.hadir, g.total) < 80).length}</b><small>dari ${day.length} gang</small></div>
    </div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="hdQ" type="search" placeholder="Cari gang, blok, mandor…" value="${esc(A.q)}"></label>
        <div class="seg-s" role="group" aria-label="Tanggal">${['06/11/2026', '05/11/2026'].map((d) => `<button data-hd="${d}" aria-pressed="${A.day === d}">${d === '06/11/2026' ? 'Hari ini' : 'Kemarin'}</button>`).join('')}</div>
        <label class="ff-sel"><span class="sr">Urutkan</span><select id="hdS"><option value="pct" ${A.sort === 'pct' ? 'selected' : ''}>Kehadiran terendah</option><option value="gang" ${A.sort === 'gang' ? 'selected' : ''}>Zone & gang</option><option value="at" ${A.sort === 'at' ? 'selected' : ''}>Waktu input</option></select></label>
      </div>
      <div class="f-zone"><span>Zone</span>${Object.keys(ZONES).map((z) => `<button data-hz="${z}" aria-pressed="${A.zone.includes(z)}">${z}</button>`).join('')}</div>
      <div id="hdT"></div>
    </section>
  </div>`;
  bindDropdowns(root);
  $$('[data-act]', $('#hdx').parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(`Mengekspor kehadiran ke ${b.textContent.trim()}…`); });
  $('#hdQ').addEventListener('input', (e) => { A.q = e.target.value; A.page = 1; aTable(); });
  $('#hdS').onchange = (e) => { A.sort = e.target.value; aTable(); };
  $$('[data-hd]', root).forEach((b) => b.onclick = () => { A.day = b.dataset.hd; mountList(root); start(root); });
  $$('[data-hz]', root).forEach((b) => b.onclick = () => { const z = b.dataset.hz; A.zone = A.zone.includes(z) ? A.zone.filter((x) => x !== z) : [...A.zone, z]; b.setAttribute('aria-pressed', A.zone.includes(z)); A.page = 1; aTable(); });
  aTable();
}
function aTable() {
  const q = A.q.toLowerCase(), el = $('#hdT');
  let r = GANG.filter((g) => g.tgl === A.day && (!A.zone.length || A.zone.includes(g.zone)) && (!q || `${g.gang} ${g.zone} ${g.block} ${g.mandor}`.toLowerCase().includes(q)));
  r = r.slice().sort((a, b) => A.sort === 'pct' ? pct(a.hadir, a.total) - pct(b.hadir, b.total) : A.sort === 'gang' ? (a.zone + a.gang).localeCompare(b.zone + b.gang) : b.at.localeCompare(a.at));
  if (!r.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada gang</h3><p>Ubah filter zone atau kata kunci.</p></div>`; return; }
  const pages = Math.ceil(r.length / A.per); A.page = Math.min(A.page, pages); const from = (A.page - 1) * A.per;
  el.innerHTML = `<div class="f-tw" tabindex="0" aria-label="Tabel kehadiran gang"><table class="f-table"><thead><tr><th>Foto apel</th><th>Zone · Gang</th><th>Blok</th><th>Mandor</th><th>Kehadiran</th><th class="n">Hadir / total</th><th>Tidak hadir</th><th>Diinput</th></tr></thead><tbody>${r.slice(from, from + A.per).map((g, i) => { const p = pct(g.hadir, g.total), abs = Object.keys(ST).filter((k) => k !== 'hadir').map((k) => [k, g.rows.filter((x) => x.st === k).length]).filter((x) => x[1]);
    return `<tr data-hg="${g.id}" style="--r:${i}"><td>${foto(g.foto, 'Foto apel ' + g.gang)}</td><td><b>${g.zone}</b> · ${g.gang}</td><td>${g.block}</td><td>${esc(g.mandor)}</td><td><span class="pct-bar ${tone(p)}"><i style="--w:${(p / 100).toFixed(3)}"></i></span><b class="pct-v ${tone(p)}">${fmt(p, 0)}%</b></td><td class="n"><b>${g.hadir}</b> / ${g.total}</td><td>${abs.length ? abs.map(([k, n]) => `<span class="st-chip ${ST[k][1]}">${n} ${ST[k][0].toLowerCase()}</span>`).join(' ') : '<span class="mute">Semua hadir</span>'}</td><td>${g.at.slice(11)}<small>${g.at.slice(0, 10)}</small></td></tr>`; }).join('')}</tbody></table></div>${pager(A.page, pages, r.length, A.per, from)}`;
  $$('tr[data-hg]', el).forEach((t) => t.onclick = () => gSheet(+t.dataset.hg));
  $$('[data-p]', el).forEach((b) => b.onclick = () => { A.page = +b.dataset.p; aTable(); });
  const per = $('[data-per]', el); if (per) per.onchange = (e) => { A.per = +e.target.value; A.page = 1; aTable(); };
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.pct-bar i', el).forEach((i) => i.classList.add('go'))));
}
function gSheet(id) {
  const g = GANG.find((x) => x.id === id), p = pct(g.hadir, g.total);
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Kehadiran · ${g.tgl}</p><h2>${g.zone} · ${g.gang}</h2><p class="mute">Mandor ${esc(g.mandor)} · Blok ${g.block} · input ${g.at.slice(11)}</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b"><div class="hd-photo">${g.foto ? '<div class="ph-big" role="img" aria-label="Foto apel pagi"><i></i><span>Foto apel pagi · ' + g.at.slice(11) + '</span></div>' : `<div class="ph-big none">${ic('noimg', 28)}<span>Tidak ada foto apel</span></div>`}</div>
    <div class="fs-figs"><div><span>Kehadiran</span><b class="${tone(p)}-t">${fmt(p, 0)}%</b></div><div><span>Hadir</span><b>${g.hadir}</b></div><div><span>Tidak hadir</span><b>${g.total - g.hadir}</b></div></div>
    <h3>Anggota gang</h3><ul class="mb-list">${g.rows.map((x) => `<li><span class="av sm">${x.nama.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><span><b>${esc(x.nama)}</b><small>${x.nik} · ${x.role}</small></span><span class="st-chip ${ST[x.st][1]}">${ST[x.st][0]}</span><span class="mb-j">${x.jam || '—'}</span></li>`).join('')}</ul></div>
  <div class="fs-f"><button class="m-btn" data-close>Tutup</button><a class="m-btn pri" href="#hadir-scan" data-close>${ic('qr')}Lihat di Kehadiran QR</a></div>`, `Kehadiran ${g.gang}`);
}

/* ============================== /admin/attendance_qr ============================== */
const Q = { day: '06/11/2026', zone: '', gang: '', st: 'all', hasil: 'all', q: '', page: 1, per: 25 };
function mountQR(root) {
  root.innerHTML = pageHead({ kicker: 'Kehadiran · QR', title: 'Kehadiran QR', sub: 'Absensi per pekerja hasil scan QR kartu pekerja saat apel pagi. Cocokkan dengan hasil kerja: pekerja hadir tanpa hasil perlu dicek mandor.', right: `<button class="f-btn" id="hqScan">${ic('scan')}Scan kartu pekerja</button>${menuBtn('hqx', 'Ekspor', 'dl', [['xlsx', 'Excel (.xlsx)', 'file'], ['pdf', 'PDF', 'file']])}` }) + `
  <div class="wrap f-body">
    <div class="hq-tabs frv" style="--i:2" role="group" aria-label="Status">${[['all', 'Semua', null], ...Object.entries(ST).map(([k, v]) => [k, v[0], k])].map(([k, l]) => `<button data-qs="${k}" aria-pressed="${Q.st === k}"><span>${k !== 'all' ? `<i style="background:${SCOL[k]}"></i>` : ''}${l}</span><b data-qn="${k}">0</b></button>`).join('')}
      <button data-qh="nohasil" class="hq-warn" aria-pressed="${Q.hasil === 'nohasil'}"><span>${ic('alert', 14)}Hadir tanpa hasil</span><b data-qn="nohasil">0</b></button></div>
    <section class="f-card frv" style="--i:3">
      <div class="f-tools">
        <label class="f-search">${ic('search')}<span class="sr">Cari</span><input id="hqQ" type="search" placeholder="Cari NIK atau nama…" value="${esc(Q.q)}"></label>
        <div class="seg-s" role="group" aria-label="Tanggal">${['06/11/2026', '05/11/2026'].map((d) => `<button data-qd="${d}" aria-pressed="${Q.day === d}">${d === '06/11/2026' ? 'Hari ini' : 'Kemarin'}</button>`).join('')}</div>
        <label class="ff-sel"><span class="sr">Zone</span><select id="hqZ"><option value="">Semua zone</option>${Object.keys(ZONES).map((z) => `<option ${Q.zone === z ? 'selected' : ''}>${z}</option>`).join('')}</select></label>
        <label class="ff-sel"><span class="sr">Gang</span><select id="hqG"><option value="">Semua gang</option>${(Q.zone ? ZONES[Q.zone] : [...new Set(Object.values(ZONES).flat())]).map((g) => `<option ${Q.gang === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
      </div>
      <div id="hqT"></div>
    </section>
  </div>`;
  bindDropdowns(root);
  $$('[data-act]', $('#hqx').parentElement).forEach((b) => b.onclick = () => { closeAllDD(); H.toast(`Mengekspor kehadiran QR ke ${b.textContent.trim()}…`); });
  $('#hqQ').addEventListener('input', (e) => { Q.q = e.target.value; Q.page = 1; qTable(); });
  $$('[data-qd]', root).forEach((b) => b.onclick = () => { Q.day = b.dataset.qd; $$('[data-qd]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); Q.page = 1; qTable(); });
  $('#hqZ').onchange = (e) => { Q.zone = e.target.value; Q.gang = ''; mountQR(root); start(root); };
  $('#hqG').onchange = (e) => { Q.gang = e.target.value; Q.page = 1; qTable(); };
  $$('[data-qs]', root).forEach((b) => b.onclick = () => { Q.st = b.dataset.qs; Q.hasil = 'all'; $$('[data-qs],[data-qh]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); Q.page = 1; qTable(); });
  $('[data-qh]', root).onclick = (e) => { const b = e.currentTarget, on = Q.hasil !== 'nohasil'; Q.hasil = on ? 'nohasil' : 'all'; Q.st = on ? 'hadir' : 'all'; $$('[data-qs]', root).forEach((x) => x.setAttribute('aria-pressed', !on && x.dataset.qs === 'all')); b.setAttribute('aria-pressed', on); Q.page = 1; qTable(); };
  $('#hqScan').onclick = scanSheet;
  qTable();
}
function qBase() { const q = Q.q.toLowerCase(); return QR.filter((x) => x.tgl === Q.day && (!Q.zone || x.zone === Q.zone) && (!Q.gang || x.gang === Q.gang) && (!q || `${x.nik} ${x.nama}`.toLowerCase().includes(q))); }
function qTable() {
  const base = qBase(), el = $('#hqT');
  $$('[data-qn]').forEach((b) => { const k = b.dataset.qn; b.textContent = k === 'all' ? base.length : k === 'nohasil' ? base.filter((x) => x.st === 'hadir' && !x.hasil).length : base.filter((x) => x.st === k).length; });
  const r = base.filter((x) => (Q.st === 'all' || x.st === Q.st) && (Q.hasil === 'all' || (x.st === 'hadir' && !x.hasil)));
  if (!r.length) { el.innerHTML = `<div class="f-empty">${ic('search', 28)}<h3>Tidak ada pekerja</h3><p>Tidak ada data yang cocok dengan filter ini.</p></div>`; return; }
  const pages = Math.ceil(r.length / Q.per); Q.page = Math.min(Q.page, pages); const from = (Q.page - 1) * Q.per;
  el.innerHTML = `<div class="f-tw" tabindex="0" aria-label="Tabel kehadiran QR"><table class="f-table"><thead><tr><th>No</th><th>Tanggal</th><th>Zone</th><th>Gang</th><th>NIK</th><th>Nama</th><th>Jabatan</th><th>Status</th><th>Ada hasil?</th><th>Remarks</th><th>Foto pagi</th></tr></thead><tbody>${r.slice(from, from + Q.per).map((x, i) => `<tr style="--r:${i}" class="${x.st === 'hadir' && !x.hasil ? 'row-warn' : ''}"><td class="mute">${from + i + 1}</td><td>${x.jam || '—'}<small>${x.tgl}</small></td><td>${x.zone}</td><td>${x.gang}</td><td class="mono">${x.nik}</td><td><b>${esc(x.nama)}</b></td><td>${x.role}</td><td><span class="st-chip ${ST[x.st][1]}">${ST[x.st][0]}</span></td><td>${x.st !== 'hadir' ? '<span class="mute">—</span>' : x.hasil ? `<span class="yn y">${ic('check', 14)}Ya</span>` : `<span class="yn n">${ic('alert', 14)}Belum ada</span>`}</td><td>${x.remark ? esc(x.remark) : '<span class="mute">—</span>'}</td><td>${x.st === 'hadir' ? foto(x.foto, 'Foto pagi ' + x.nama) : '<span class="mute">—</span>'}</td></tr>`).join('')}</tbody></table></div>${pager(Q.page, pages, r.length, Q.per, from)}`;
  $$('[data-p]', el).forEach((b) => b.onclick = () => { Q.page = +b.dataset.p; qTable(); });
  const per = $('[data-per]', el); if (per) per.onchange = (e) => { Q.per = +e.target.value; Q.page = 1; qTable(); };
}
function scanSheet() {
  openSheet(`<div class="fs-h"><div><p class="m-kick dark">Kehadiran QR</p><h2>Scan kartu pekerja</h2><p class="mute">Arahkan scanner ke QR di kartu pekerja. Status otomatis Hadir dengan jam scan.</p></div><button class="iconbtn fs-x" data-close aria-label="Tutup">${ic('x')}</button></div>
  <div class="fs-b"><div class="sc-field"><label for="hqIn" class="sr">Kode QR kartu</label><input id="hqIn" autocomplete="off" placeholder="Menunggu scan…"><span class="sc-state"><i class="beam"></i>Siap</span></div><p class="w-msg" id="hqMsg" role="alert"></p>
    <div class="sc-demo"><span>Simulasi:</span><button class="chipbtn" data-sim="ok">Kartu valid</button><button class="chipbtn" data-sim="dup">Sudah absen</button><button class="chipbtn" data-sim="bad">Kartu tidak dikenal</button></div>
    <h3>Baru saja discan</h3><ul class="mb-list" id="hqRec"><li class="mute-li">Belum ada scan di sesi ini.</li></ul></div>
  <div class="fs-f"><button class="m-btn pri" data-close>Selesai</button></div>`, 'Scan kartu pekerja');
  const rec = [], inp = $('#hqIn'); setTimeout(() => inp.focus(), 80);
  const handle = (code) => { const m = $('#hqMsg'); m.textContent = '';
    if (!code || code === 'BAD') { m.textContent = 'Kartu tidak dikenal. Pastikan pekerja terdaftar.'; inp.value = ''; return; }
    const w = QR.find((x) => x.tgl === '06/11/2026' && (code === 'DUP' ? x.st === 'hadir' : x.st !== 'hadir'));
    if (!w || code === 'DUP') { m.textContent = `${w ? w.nama : 'Pekerja'} sudah absen hari ini pukul ${w ? w.jam : '—'}.`; inp.value = ''; return; }
    Object.assign(w, { st: 'hadir', jam: '11:5' + rec.length, hasil: false, foto: true, remark: 'Scan susulan' }); rec.unshift(w);
    $('#hqRec').innerHTML = rec.map((x, i) => `<li class="${i === 0 ? 'fresh' : ''}"><span class="av sm">${x.nama.split(' ').map((s) => s[0]).slice(0, 2).join('')}</span><span><b>${esc(x.nama)}</b><small>${x.nik} · ${x.zone} ${x.gang}</small></span><span class="st-chip t-ok">Hadir</span><span class="mb-j">${x.jam}</span></li>`).join('');
    inp.value = ''; inp.focus(); qTable(); H.toast(`${w.nama} tercatat hadir`); };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handle(inp.value.trim()); } });
  $$('[data-sim]').forEach((b) => b.onclick = () => handle(b.dataset.sim === 'ok' ? 'OK' : b.dataset.sim === 'dup' ? 'DUP' : 'BAD'));
}

/* ============================== /admin/attendance_summary_graphical ============================== */
const G = { day: '06/11/2026', by: 'zone' };
function mountGraph(root) {
  root.innerHTML = pageHead({ kicker: 'Kehadiran · Grafik', title: 'Ringkasan Kehadiran', sub: 'Komposisi kehadiran per zone atau gang, dan rekap per jabatan. Arahkan kursor ke batang untuk detail.', right: `<button class="f-btn" id="hgP">${ic('dl')}Unduh PDF</button>` }) + `
  <div class="wrap f-body">
    <section class="f-card frv" style="--i:2">
      <div class="f-tools">
        <div class="seg-s" role="group" aria-label="Tanggal">${['06/11/2026', '05/11/2026'].map((d) => `<button data-gd="${d}" aria-pressed="${G.day === d}">${d === '06/11/2026' ? 'Hari ini' : 'Kemarin'}</button>`).join('')}</div>
        <div class="seg-s" role="group" aria-label="Kelompokkan">${[['zone', 'Per zone'], ['gang', 'Per gang']].map(([k, l]) => `<button data-gb="${k}" aria-pressed="${G.by === k}">${l}</button>`).join('')}</div>
      </div>
      <div class="hg-leg">${Object.keys(ST).map((k) => `<span><i style="background:${SCOL[k]}"></i>${ST[k][0]}</span>`).join('')}</div>
      <div class="hg-chart" id="hgC"></div>
    </section>
    <div class="hg-grid">
      <section class="f-card frv" style="--i:3"><div class="tbl-h"><h2>Per jabatan</h2><p class="mute" id="hgRd"></p></div><div class="f-tw" tabindex="0" id="hgR"></div></section>
      <section class="f-card hg-donut frv" style="--i:4" id="hgD"></section>
    </div>
  </div>`;
  $$('[data-gd]', root).forEach((b) => b.onclick = () => { G.day = b.dataset.gd; $$('[data-gd]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); gDraw(); });
  $$('[data-gb]', root).forEach((b) => b.onclick = () => { G.by = b.dataset.gb; $$('[data-gb]', root).forEach((x) => x.setAttribute('aria-pressed', x === b)); gDraw(); });
  $('#hgP').onclick = () => H.toast('Mengunduh ringkasan kehadiran (PDF)…');
  gDraw();
}
function gDraw() {
  const rows = QR.filter((x) => x.tgl === G.day), grp = {};
  rows.forEach((x) => { const k = G.by === 'zone' ? x.zone : `${x.zone} · ${x.gang}`; (grp[k] = grp[k] || []).push(x); });
  const ent = Object.entries(grp);
  $('#hgC').innerHTML = `<ul class="hg-bars by-${G.by}">${ent.map(([k, list], i) => { const p = pct(list.filter((x) => x.st === 'hadir').length, list.length);
    return `<li style="--r:${i}"><span class="hb-l"><b>${k}</b><small>${list.length} pekerja</small></span><span class="hb-bar" role="img" aria-label="${k}: ${Object.keys(ST).map((s) => list.filter((x) => x.st === s).length + ' ' + ST[s][0]).join(', ')}">${Object.keys(ST).map((s) => { const n = list.filter((x) => x.st === s).length; return n ? `<i style="--w:${(n / list.length).toFixed(4)};background:${SCOL[s]}" title="${ST[s][0]}: ${n} (${fmt(pct(n, list.length), 1)}%)">${n / list.length > .07 ? n : ''}</i>` : ''; }).join('')}</span><b class="hb-p ${tone(p)}-t">${fmt(p, 0)}%</b></li>`; }).join('')}</ul>`;
  requestAnimationFrame(() => requestAnimationFrame(() => $$('.hb-bar', $('#hgC')).forEach((b) => b.classList.add('go'))));
  const roles = [...new Set(ROLES)];
  $('#hgRd').textContent = G.day;
  $('#hgR').innerHTML = `<table class="f-table"><thead><tr><th>Jabatan</th>${Object.keys(ST).map((s) => `<th class="n">${ST[s][0]}</th>`).join('')}<th class="n">Total</th><th class="n">% hadir</th></tr></thead><tbody>${roles.map((r) => { const l = rows.filter((x) => x.role === r), p = pct(l.filter((x) => x.st === 'hadir').length, l.length); return `<tr><th scope="row">${r}</th>${Object.keys(ST).map((s) => { const n = l.filter((x) => x.st === s).length; return `<td class="n ${n ? '' : 'mute'}">${n}</td>`; }).join('')}<td class="n"><b>${l.length}</b></td><td class="n"><b class="${tone(p)}-t">${fmt(p, 1)}%</b></td></tr>`; }).join('')}</tbody><tfoot><tr><td>Total</td>${Object.keys(ST).map((s) => `<td class="n">${rows.filter((x) => x.st === s).length}</td>`).join('')}<td class="n">${rows.length}</td><td class="n">${fmt(pct(rows.filter((x) => x.st === 'hadir').length, rows.length), 1)}%</td></tr></tfoot></table>`;
  const R = 70, C = 2 * Math.PI * R; let off = 0;
  const segs = Object.keys(ST).map((s) => { const n = rows.filter((x) => x.st === s).length, len = C * n / rows.length, seg = `<circle cx="90" cy="90" r="${R}" class="dn" style="stroke:${SCOL[s]};--len:${len.toFixed(2)};--gap:${(C - len).toFixed(2)};--off:${(-off).toFixed(2)}" transform="rotate(-90 90 90)"><title>${ST[s][0]}: ${n}</title></circle>`; off += len; return seg; }).join('');
  const hp = pct(rows.filter((x) => x.st === 'hadir').length, rows.length);
  $('#hgD').innerHTML = `<h2>Komposisi ${G.day === '06/11/2026' ? 'hari ini' : 'kemarin'}</h2><div class="dn-w"><svg viewBox="0 0 180 180" class="donut" role="img" aria-label="Kehadiran ${fmt(hp, 1)} persen">${segs}</svg><div class="dn-c"><b>${fmt(hp, 1)}%</b><small>hadir</small></div></div><ul class="dn-l">${Object.keys(ST).map((s) => { const n = rows.filter((x) => x.st === s).length; return `<li><i style="background:${SCOL[s]}"></i>${ST[s][0]}<b>${n}</b><small>${fmt(pct(n, rows.length), 1)}%</small></li>`; }).join('')}</ul>`;
}

/* ---------------- public ---------------- */
let cur = null;
const reg = (fn) => ({ mount(el, h) { H = { ...H, ...h }; cur = el; fn(el); }, start() { start(cur); } });
Object.assign(window.FFBPages, { hadir: reg(mountList), 'hadir-scan': reg(mountQR), 'hadir-grafik': reg(mountGraph) });
})();
