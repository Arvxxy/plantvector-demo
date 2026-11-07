/* Mills — Scan Surat Jalan QR (redesign of /admin/mill-surat-jalan, millSuratJalanV2.blade.php)
   Same flow and fields as the real page:
   scan QR (hand scanner types the code + Enter) → validateqrV2 fills Surat Jalan + task table
   → operator enters Total Berat (kg) & Weigh Bridge ID → Submit → confirm → submitSuratJalanV2
   → success → print Mill Ticket (printConfirmationLetter). "Cetak Tiket Terakhir" = reprintLastTicket. */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fmt = (n, d = 0) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
let H = { reduced: () => false, toast: () => {} };
const wait = (ms) => new Promise((r) => setTimeout(r, H.reduced() ? 0 : ms));

/* ---------- dummy data (structure = validateqrV2 response) ---------- */
const LOADS = [
  { sj: { plate: 'KT 8412 AB', driver: 'Samsul', peloading: '[PL-0213] Iwan Pratama', cp_tiket: 'CP-EMU-260611-0042', jaring: 1, contractor: 'CV Mahakam Jaya Angkut', created_by: 'Rahmat Hidayat', timestamp: '06/11/2026 10:52' }, zone: 'EMU1', rows: 9, kutip: 2 },
  { sj: { plate: 'KT 8077 GH', driver: 'Yusuf Daeng', peloading: '[PL-0187] Andi Saputra', cp_tiket: 'CP-EMC-260611-0038', jaring: 0, contractor: 'UD Kutai Sejahtera', created_by: 'Imanuel Laia', timestamp: '06/11/2026 11:20' }, zone: 'EMC2', rows: 7, kutip: 1 },
  { sj: { plate: 'KT 8930 MW', driver: 'Rudi Hasibuan', peloading: '[PL-0244] Joko Pratama', cp_tiket: 'CP-EMS-260611-0051', jaring: 1, contractor: 'CV Borneo Logistik', created_by: 'Paulus Gultom', timestamp: '06/11/2026 11:47' }, zone: 'EMS1', rows: 11, kutip: 0 }
];
const GANG = { EMU1: ['PN1', 'PR3', 'PR4', 'PR7'], EMC2: ['PN5', 'PN6', 'PNB'], EMS1: ['H01', 'H02', 'H03', 'H04'] };
const NAMES = ['Hendra Simanjuntak', 'Slamet Wijaya', 'Markus Laia', 'Joko Nainggolan', 'Agus Kurniawan', 'Herman Siregar', 'Yohanes Saputra', 'Darius Tarigan', 'Fransiskus Ndruru', 'Wayan Pratama', 'Taufik Hidayat'];
const CHECKERS = ['Imanuel Laia', 'Rudi Tarigan', 'Samsul Siregar'];
function buildLoad(i) {
  const L = LOADS[i % LOADS.length]; let seed = 311 + i * 97;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296), int = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const tasks = [];
  for (let k = 0; k < L.rows; k++) {
    const mentah = int(0, 3), mengkal = int(1, 9), matang = int(38, 92), tm = int(0, 6);
    tasks.push({ task_date: `06/11/2026 0${int(6, 9)}:${String(int(0, 59)).padStart(2, '0')}`, print_date: `06/11/2026 10:${String(int(5, 45)).padStart(2, '0')}`, zone_block: `${L.zone}-${'ABCDEFGH'[int(0, 7)]}${String(int(1, 32)).padStart(2, '0')}`, harvestor: `[PMN-${int(1000, 4999)}] ${NAMES[(k + i) % NAMES.length]}`, line_checker: CHECKERS[k % 3], ancak: int(1, 24), mentah, mengkal, matang, t_matang: tm, total: mengkal + matang + tm, machine: k % 4 === 3 ? 'MU-0' + int(1, 6) : '-', job: 'Panen', gang: GANG[L.zone][k % GANG[L.zone].length] });
  }
  for (let k = 0; k < L.kutip; k++) tasks.push({ task_date: `06/11/2026 09:${String(int(10, 59)).padStart(2, '0')}`, print_date: `06/11/2026 10:${String(int(5, 45)).padStart(2, '0')}`, zone_block: `${L.zone}-${'ABCDEFGH'[int(0, 7)]}${String(int(1, 32)).padStart(2, '0')}`, harvestor: `[PMN-${int(1000, 4999)}] ${NAMES[(k + 5) % NAMES.length]}`, line_checker: CHECKERS[(k + 1) % 3], ancak: int(1, 24), mentah: 0, mengkal: 0, matang: 0, t_matang: 0, total: int(3, 9), machine: '-', job: 'Kutip Brondolan' });
  const panen = tasks.filter((t) => t.job === 'Panen');
  const total_fruit = panen.reduce((a, t) => a + t.total, 0), total_sak = tasks.filter((t) => t.job !== 'Panen').reduce((a, t) => a + t.total, 0);
  return { sj: { ...L.sj, total_pb: total_fruit, total_sak }, tasks, totalTasks: tasks.length, sjid: 10988 + i };
}
const QR_FAKE = (i) => '1f8b0800' + (7349221 + i * 3517).toString(16) + 'a9c4e2' + 'f0'.repeat(18) + (i + 11).toString(16);

/* ---------- state ---------- */
let S, scanCount = 0, sessionKg = 0;
const LOG = [
  { sjid: 10987, plate: 'KT 8528 CF', tandan: 498, kg: 12195, time: '10:41' },
  { sjid: 10986, plate: 'KT 8628 ZX', tandan: 594, kg: 14268, time: '10:12' },
  { sjid: 10985, plate: 'KT 8339 ZX', tandan: 425, kg: 10517, time: '09:38' }
];
const reset = () => { S = { phase: 'idle', data: null, error: null, qr: '' }; };
reset();

/* ---------- icons ---------- */
const I = {
  scan: '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/><path d="M7 12h10"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
  truck: '<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  scale: '<path d="M12 3v18M5 21h14M5 7h14"/><path d="M5 7l-3 7a3 3 0 006 0zM19 7l-3 7a3 3 0 006 0z"/>', net: '<path d="M3 5h18M3 12h18M3 19h18M6 3v18M12 3v18M18 3v18"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>'
};
const ico = (n, s = 18) => `<svg class="mi" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

/* ---------- render ---------- */
let root;
function shell() {
  root.innerHTML = `
  <section class="m-head"><div class="wrap m-head-in">
    <div class="mrv" style="--i:0"><p class="m-kick">Pabrik · Mills</p><h1>Scan Surat Jalan</h1><p class="m-sub">Penerimaan TBS di PKS Tenggarong. Scan QR dari aplikasi Surat Jalan, isi berat timbangan, lalu simpan untuk mencetak tiket mill.</p></div>
    <div class="m-today mrv" style="--i:1" aria-label="Penerimaan hari ini">
      <div><span>Diterima hari ini</span><b id="mtSj">${LOG.length + 11}</b><small>Surat Jalan</small></div>
      <div><span>Berat timbangan</span><b id="mtKg">${fmt(286.4 + sessionKg / 1000, 1)}</b><small>ton</small></div>
      <button class="m-btn ghost-g" id="reprint">${ico('print')}Cetak tiket terakhir</button>
    </div>
  </div></section>
  <div class="wrap m-body">
    <ol class="m-steps mrv" style="--i:2" id="steps" aria-label="Langkah">
      <li data-s="1"><span class="n">1</span><span class="t"><b>Scan QR</b><small>QR dari aplikasi Surat Jalan</small></span></li>
      <li data-s="2"><span class="n">2</span><span class="t"><b>Periksa muatan</b><small>Truk, supir, tandan, sak</small></span></li>
      <li data-s="3"><span class="n">3</span><span class="t"><b>Timbang & simpan</b><small>Berat timbangan, cetak tiket</small></span></li>
    </ol>
    <div class="m-grid">
      <section class="m-scan mrv" style="--i:3" id="scanCard" aria-labelledby="scanLbl"></section>
      <section class="m-weigh mrv" style="--i:4" id="weighCard" aria-labelledby="wLbl"></section>
      <section class="m-load" id="loadCard" aria-live="polite"></section>
      <section class="m-log mrv" style="--i:5"><h2>Tiket terakhir</h2><ul id="log"></ul></section>
    </div>
    <section class="m-tasks" id="taskCard"></section>
  </div>
  <div class="m-modal" id="modal" hidden><div class="m-dialog" role="dialog" aria-modal="true" aria-labelledby="mdT" id="dialog"></div></div>`;
  $('#reprint').onclick = () => reprint();
  renderAll();
}

function renderAll() { renderSteps(); renderScan(); renderLoad(); renderWeigh(); renderTasks(); renderLog(); }

function renderSteps() {
  const at = { idle: 1, scanning: 1, error: 1, loaded: 2, ready: 3, submitting: 3, done: 3 }[S.phase];
  $$('#steps li').forEach((li) => { const n = +li.dataset.s; li.classList.toggle('on', n === at); li.classList.toggle('done', n < at || S.phase === 'done'); li.setAttribute('aria-current', n === at ? 'step' : 'false'); });
}

function renderScan() {
  const c = $('#scanCard'), busy = S.phase === 'scanning', locked = ['loaded', 'ready', 'submitting'].includes(S.phase);
  c.className = `m-scan mrv ${S.phase}`;
  c.innerHTML = `
    <div class="sc-top"><div class="sc-ico ${busy ? 'busy' : ''}">${ico('scan', 26)}</div><div><h2 id="scanLbl">${locked ? 'Surat Jalan terbaca' : S.phase === 'done' ? 'Siap untuk truk berikutnya' : 'Scan QR Surat Jalan'}</h2><p>${locked ? 'Periksa muatan di bawah, lalu isi berat timbangan.' : 'Arahkan scanner ke QR. Kode masuk otomatis dan diproses saat scanner mengirim Enter.'}</p></div></div>
    <div class="sc-field"><label for="qr" class="sr">Kode QR Surat Jalan</label>
      <input id="qr" autocomplete="off" spellcheck="false" placeholder="${locked ? '' : 'Menunggu scan…'}" value="${S.qr}" ${locked || busy ? 'readonly' : ''} aria-describedby="qrMsg">
      <span class="sc-state">${busy ? '<i class="spin"></i>Memvalidasi…' : locked ? `${ico('check', 16)}Valid · ${S.data.totalTasks} BCC` : '<i class="beam"></i>Siap'}</span></div>
    <p class="sc-msg" id="qrMsg" role="alert">${S.error ? `${ico('alert', 16)}<span><b>Pemindaian gagal.</b> ${S.error}</span>` : ''}</p>
    ${locked ? (() => { const t = S.data.tasks, pan = t.filter((x) => x.job === 'Panen'), times = t.map((x) => x.task_date.slice(11)).sort(); return `<div class="qr-sum"><div><span>BCC panen</span><b>${pan.length}</b></div><div><span>Kutip brondolan</span><b>${t.length - pan.length}</b></div><div><span>Zone</span><b>${t[0].zone_block.split('-')[0]}</b></div><div><span>Jam kerja</span><b>${times[0]}–${times[times.length - 1]}</b></div></div><p class="qr-next">${ico('scale', 16)}Lanjut: periksa muatan di bawah, lalu isi berat di kartu Timbangan.</p>`; })() : ''}
    ${locked || busy ? '' : `<ul class="sc-tips"><li><b>1</b><span>Pastikan kursor ada di kolom scan (otomatis setelah halaman dibuka).</span></li><li><b>2</b><span>Scan QR di HP checkpoint; scanner mengirim Enter dan data langsung dibaca.</span></li><li><b>3</b><span>Isi berat dari timbangan, lalu simpan untuk mencetak tiket.</span></li></ul>`}
    <div class="sc-demo">${locked ? `<button class="m-btn ghost-g" id="rescan">${ico('undo', 16)}Batal & scan ulang</button>` : `<span>Simulasi:</span><button class="chipbtn" data-demo="ok">Scan valid</button><button class="chipbtn" data-demo="invalid">QR tidak valid</button><button class="chipbtn" data-demo="dup">Tiket sudah di-scan</button>`}</div>`;
  const q = $('#qr', c);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); scan(q.value.trim()); } });
  $$('[data-demo]', c).forEach((b) => b.onclick = () => demoScan(b.dataset.demo));
  const rs = $('#rescan', c); if (rs) rs.onclick = () => { reset(); renderAll(); focusQr(); };
}

function renderLoad() {
  const c = $('#loadCard'), d = S.data;
  if (S.phase === 'done') {
    c.innerHTML = `<div class="m-done"><div class="md-t"><p class="m-lbl">Tiket mill</p><h3>SJ ID ${S.saved.sjid}</h3><p class="mute">Sedang dicetak ke printer timbangan. Pratinjau di samping sama dengan kertas yang keluar.</p><span class="print-st"><i class="spin"></i>Mencetak…</span></div><div class="ticket" aria-label="Pratinjau tiket mill">${ticketHTML(S.saved)}</div></div>`;
    c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
    setTimeout(() => { const ps = $('.print-st', c); if (ps) { ps.classList.add('ok'); ps.innerHTML = `${ico('check', 14)}Tiket tercetak`; } }, H.reduced() ? 0 : 1600);
    return;
  }
  if (!d) { c.innerHTML = `<div class="m-empty mrv" style="--i:4"><div class="pl-ghost" aria-hidden="true">KT ···· ··</div><p>Data truk, supir, peloading, dan daftar BCC akan muncul di sini setelah QR dipindai.</p></div>`; c.classList.remove('show'); return; }
  const sj = d.sj;
  c.innerHTML = `<div class="m-sj">
    <div class="sj-plate"><span class="lbl">Truk</span><div class="plate" aria-label="Plat nomor ${sj.plate}">${sj.plate}</div><span class="contractor">${ico('truck', 16)}${sj.contractor}</span></div>
    <dl class="sj-dl">
      <div><dt>Supir / Pengemudi</dt><dd>${sj.driver}</dd></div>
      <div><dt>Peloading</dt><dd>${sj.peloading}</dd></div>
      <div><dt>Check Point Tiket ID</dt><dd class="mono">${sj.cp_tiket}</dd></div>
      <div><dt>Dibuat di checkpoint</dt><dd>${sj.created_by} · ${sj.timestamp}</dd></div>
    </dl>
    <div class="sj-figs">
      <div><span>Total tandan</span><b>${fmt(sj.total_pb)}</b></div>
      <div><span>Total sak</span><b>${fmt(sj.total_sak)}</b></div>
      <div><span>Jaring</span><b class="jar ${sj.jaring ? 'y' : 'n'}">${sj.jaring ? `${ico('net', 18)}Ya` : 'Tidak'}</b></div>
    </div></div>`;
  c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
}

function renderWeigh() {
  const c = $('#weighCard'), d = S.data, on = ['loaded', 'ready', 'submitting'].includes(S.phase);
  c.className = `m-weigh mrv ${on ? '' : 'off'} ${S.phase === 'done' ? 'done' : ''}`;
  if (S.phase === 'done') {
    c.innerHTML = `<div class="ok-mark">${ico('check', 30)}</div><h2 id="wLbl">Tersimpan</h2><p>Surat Jalan <b>ID ${S.saved.sjid}</b> berhasil diperbarui.</p>
      <dl class="done-sum"><div><dt>Truk</dt><dd>${S.saved.plate}</dd></div><div><dt>Berat</dt><dd>${fmt(S.saved.kg)} kg</dd></div><div><dt>Tandan · Sak</dt><dd>${fmt(S.saved.tandan)} · ${S.saved.sak}</dd></div><div><dt>ABW</dt><dd>${fmt(S.saved.kg / S.saved.tandan, 2)} kg</dd></div></dl>
      <div class="w-acts"><button class="m-btn" id="printAgain">${ico('print')}Cetak ulang</button><button class="m-btn pri" id="next">${ico('scan')}Scan truk berikutnya</button></div>`;
    $('#printAgain').onclick = () => H.toast(`Mencetak tiket mill SJ ${S.saved.sjid}…`);
    $('#next').onclick = () => { reset(); renderAll(); focusQr(); };
    return;
  }
  const kg = S.kg ?? '', wb = S.wb ?? '';
  c.innerHTML = `<h2 id="wLbl">${ico('scale', 20)}Timbangan</h2>
    <div class="wf ${S.kgErr ? 'err' : ''}"><label for="kg">Total berat <small>(kg)</small></label>
      <div class="kg-in"><input id="kg" type="text" inputmode="numeric" autocomplete="off" placeholder="0" value="${kg ? fmt(kg) : ''}" ${on ? '' : 'disabled'} aria-describedby="kgMsg"><span>kg</span></div>
      <p class="w-msg" id="kgMsg">${S.kgErr || ''}</p></div>
    <div class="wf"><label for="wb">Weigh Bridge ID <small>(opsional)</small></label><input id="wb" type="text" autocomplete="off" placeholder="mis. WB-01-26110612" value="${wb}" ${on ? '' : 'disabled'}></div>
    <div class="abw ${d && kg ? 'show' : ''}" id="abw">${abwHTML()}</div>
    <button class="m-btn pri big" id="wSubmit" ${on ? '' : 'disabled'}><span class="lbl">${S.phase === 'submitting' ? 'Menyimpan…' : 'Simpan & cetak tiket'}</span>${S.phase === 'submitting' ? '<i class="spin w"></i>' : ''}</button>
    <p class="w-note">${on ? 'Anda akan diminta konfirmasi sebelum data disimpan.' : 'Aktif setelah QR Surat Jalan dipindai.'}</p>`;
  if (!on) return;
  const kgI = $('#kg');
  kgI.addEventListener('input', () => {
    const raw = kgI.value.replace(/\D/g, '').slice(0, 9); S.kg = raw ? +raw : null;
    const pos = kgI.value.length - kgI.selectionStart; kgI.value = raw ? fmt(+raw) : ''; kgI.setSelectionRange(kgI.value.length - pos, kgI.value.length - pos);
    if (S.kgErr && S.kg) { S.kgErr = null; $('.wf', $('#weighCard')).classList.remove('err'); $('#kgMsg').textContent = ''; }
    const a = $('#abw'); a.innerHTML = abwHTML(); a.classList.toggle('show', !!S.kg);
    S.phase = S.kg ? 'ready' : 'loaded'; renderSteps();
  });
  kgI.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#wb').focus(); } });
  $('#wb').addEventListener('input', (e) => { S.wb = e.target.value; });
  $('#wb').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); askSubmit(); } });
  $("#wSubmit").onclick = askSubmit;
}
function abwHTML() {
  if (!S.data || !S.kg) return '';
  const abw = S.kg / S.data.sj.total_pb, odd = abw < 15 || abw > 35;
  return `<div><span>ABW dari timbangan</span><b>${fmt(abw, 2)} <small>kg/tandan</small></b></div><p class="${odd ? 'warn' : ''}">${odd ? `${ico('alert', 14)}Di luar kisaran wajar 15–35 kg. Periksa kembali angka berat.` : `Dalam kisaran wajar · ${fmt(S.kg / 1000, 2)} ton`}</p>`;
}

function renderTasks() {
  const c = $('#taskCard'), d = S.data;
  if (!d || S.phase === 'done') { c.innerHTML = ''; c.classList.remove('show'); return; }
  const t = d.tasks, sum = (k, f = () => true) => t.filter(f).reduce((a, x) => a + x[k], 0);
  c.innerHTML = `<div class="tk-h"><h2>Daftar BCC dalam Surat Jalan</h2><span class="pill">${d.totalTasks} tugas</span><div class="tk-leg"><span><i class="b-pan"></i>Panen</span><span><i class="b-kut"></i>Kutip = kutip brondolan (sak)</span></div></div>
  <div class="tk-wrap" tabindex="0" aria-label="Tabel BCC, geser untuk melihat semua kolom"><table class="tk">
    <thead><tr><th rowspan="2">No</th><th rowspan="2">Tanggal kerja</th><th rowspan="2">Tanggal cetak</th><th rowspan="2">Zone-Blok</th><th rowspan="2">Pemanen</th><th rowspan="2">Line checker</th><th rowspan="2" class="n">Ancak</th><th colspan="4" class="grp">Grading (janjang)</th><th rowspan="2" class="n">Tdn/Sak</th><th rowspan="2">Mesin</th><th rowspan="2">Jenis kerja</th></tr>
    <tr><th class="n">Mentah</th><th class="n">Mengkal</th><th class="n">Matang</th><th class="n">T.Matang</th></tr></thead>
    <tbody>${t.map((r, i) => `<tr style="--r:${i}"><td class="n mute">${i + 1}</td><td>${r.task_date.slice(11)}<small>${r.task_date.slice(0, 10)}</small></td><td class="mute">${r.print_date.slice(11)}<small>${r.print_date.slice(0, 10)}</small></td><td><b>${r.zone_block}</b></td><td>${r.harvestor.replace(/^\[[^\]]+\]\s*/, '')}<small>${r.harvestor.match(/^\[([^\]]+)\]/)[1]}</small></td><td>${r.line_checker}</td><td class="n">${r.ancak}</td><td class="n ${r.mentah ? 'warnc' : 'mute'}">${r.mentah}</td><td class="n">${r.mengkal}</td><td class="n">${r.matang}</td><td class="n">${r.t_matang}</td><td class="n"><b>${Math.floor(r.total)}</b></td><td class="mute">${r.machine}</td><td><span class="job ${r.job === 'Panen' ? 'pan' : 'kut'}" title="${r.job}">${r.job === 'Panen' ? 'Panen' : 'Kutip'}</span></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="7">Total</td><td class="n">${sum('mentah')}</td><td class="n">${sum('mengkal')}</td><td class="n">${sum('matang')}</td><td class="n">${sum('t_matang')}</td><td class="n">${fmt(d.sj.total_pb)} tdn · ${d.sj.total_sak} sak</td><td colspan="2"></td></tr></tfoot>
  </table></div>
  <p class="tk-note">Tdn/Sak untuk panen = Mengkal + Matang + T.Matang (mentah tidak dihitung). Untuk kutip brondolan, angkanya adalah jumlah sak.</p>`;
  c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
}

function renderLog() {
  $('#log').innerHTML = LOG.slice(0, 4).map((l, i) => `<li class="${i === 0 && l.fresh ? 'fresh' : ''}"><div><b>SJ ${l.sjid}</b><span>${l.plate} · ${fmt(l.tandan)} tdn</span></div><div class="r"><b>${fmt(l.kg)} kg</b><span>${l.time}</span></div><button class="lg-p" aria-label="Cetak ulang tiket SJ ${l.sjid}" data-p="${l.sjid}">${ico('print', 16)}</button></li>`).join('');
  $$('[data-p]', $('#log')).forEach((b) => b.onclick = () => H.toast(`Mencetak ulang tiket mill SJ ${b.dataset.p}…`));
}

function ticketHTML(s) {
  return `<div class="tc-h"><img src="assets/plantvector-icon.png" alt=""><div><b>TIKET MILL</b><span>PKS Tenggarong</span></div></div>
  <div class="tc-r"><span>Surat Jalan</span><b>ID ${s.sjid}</b></div><div class="tc-r"><span>Tanggal</span><b>06/11/2026 ${s.time}</b></div>
  <div class="tc-r"><span>Plat</span><b>${s.plate}</b></div><div class="tc-r"><span>Supir</span><b>${s.driver}</b></div>
  <div class="tc-r"><span>CP Tiket</span><b>${s.cp}</b></div><div class="tc-r"><span>Weigh Bridge</span><b>${s.wb || '—'}</b></div>
  <div class="tc-sep"></div><div class="tc-r big"><span>Berat</span><b>${fmt(s.kg)} kg</b></div><div class="tc-r"><span>Tandan · Sak</span><b>${fmt(s.tandan)} · ${s.sak}</b></div><div class="tc-r"><span>ABW</span><b>${fmt(s.kg / s.tandan, 2)} kg</b></div><div class="tc-r"><span>Jumlah BCC</span><b>${s.tasks}</b></div>
  <div class="tc-bar" aria-hidden="true"></div>`;
}

/* ---------- actions ---------- */
function focusQr() { setTimeout(() => { const q = $('#qr'); if (q && !q.readOnly) q.focus({ preventScroll: true }); }, H.reduced() ? 0 : 80); }
function demoScan(kind) {
  const code = kind === 'invalid' ? 'xx-' + Math.random().toString(16).slice(2, 10) : kind === 'dup' ? 'DUP-' + QR_FAKE(0) : QR_FAKE(scanCount);
  const q = $('#qr'); if (!q) return;
  if (H.reduced()) { q.value = code; scan(code); return; }
  let i = 0; q.value = ''; q.focus();
  const tick = () => { i += 6; q.value = code.slice(0, i); if (i < code.length) requestAnimationFrame(tick); else setTimeout(() => scan(code), 120); };
  requestAnimationFrame(tick);
}
async function scan(code) {
  if (!code) { S.error = 'Harap scan masuk QR code.'; renderScan(); shake(); focusQr(); return; }
  S.qr = code; S.error = null; S.phase = 'scanning'; renderSteps(); renderScan();
  await wait(700);
  if (code.startsWith('DUP-')) return fail('Tiket ini sudah di-scan sebelumnya (SJ 10984).');
  if (!/^[0-9a-f]+$/i.test(code)) return fail('Kode QR tidak valid. Pastikan QR berasal dari aplikasi Surat Jalan PlantVector.');
  S.data = buildLoad(scanCount); S.phase = 'loaded'; S.kg = null; S.wb = ''; S.kgErr = null;
  renderAll();
  setTimeout(() => $('#kg') && $('#kg').focus({ preventScroll: true }), H.reduced() ? 0 : 360);
}
function fail(msg) { S.phase = 'error'; S.error = msg; S.qr = ''; renderSteps(); renderScan(); shake(); focusQr(); }
function shake() { const f = $('.sc-field'); if (!f || H.reduced()) return; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }

function askSubmit() {
  if (!S.kg) { S.kgErr = 'Harap masukkan berat total.'; const w = $('.wf', $('#weighCard')); w.classList.remove('err'); void w.offsetWidth; w.classList.add('err'); $('#kgMsg').textContent = S.kgErr; $('#kg').focus(); return; }
  const sj = S.data.sj;
  openModal(`<h2 id="mdT">Simpan Surat Jalan ini?</h2><p>Data BCC akan diperbarui dan tiket mill langsung dicetak. Pastikan berat sudah benar.</p>
    <div class="md-sum"><div><span>Truk</span><b>${sj.plate}</b></div><div><span>Berat</span><b>${fmt(S.kg)} kg</b></div><div><span>Tandan · Sak</span><b>${fmt(sj.total_pb)} · ${sj.total_sak}</b></div><div><span>Weigh Bridge</span><b>${S.wb || '—'}</b></div></div>
    <div class="md-acts"><button class="m-btn" data-x>Batal</button><button class="m-btn pri" data-ok>${ico('check')}Konfirmasi & simpan</button></div>`);
  $('[data-x]', $('#dialog')).onclick = closeModal;
  $('[data-ok]', $('#dialog')).onclick = async () => { closeModal(); await submit(); };
  setTimeout(() => $('[data-ok]', $('#dialog')).focus(), 30);
}
async function submit() {
  S.phase = 'submitting'; renderSteps(); renderWeigh();
  await wait(1200);
  const sj = S.data.sj, saved = { sjid: S.data.sjid, plate: sj.plate, driver: sj.driver, cp: sj.cp_tiket, wb: S.wb, kg: S.kg, tandan: sj.total_pb, sak: sj.total_sak, tasks: S.data.totalTasks, time: '11:' + String(52 + scanCount).padStart(2, '0') };
  LOG.forEach((l) => delete l.fresh); LOG.unshift({ sjid: saved.sjid, plate: saved.plate, tandan: saved.tandan, kg: saved.kg, time: saved.time, fresh: true });
  scanCount++; S.phase = 'done'; S.saved = saved; S.qr = '';
  sessionKg += saved.kg; $('#mtSj').textContent = LOG.length + 11; $('#mtKg').textContent = fmt(286.4 + sessionKg / 1000, 1);
  renderAll();
  H.toast(`Berhasil memperbarui daftar tugas Surat Jalan (ID: ${saved.sjid})`);
  setTimeout(() => $('#next') && $('#next').focus({ preventScroll: true }), H.reduced() ? 0 : 400);
}
function reprint() { H.toast(`Mencetak ulang tiket mill terakhir · SJ ${LOG[0].sjid}`); }

let lastFocus = null;
function openModal(html) {
  lastFocus = document.activeElement; const m = $('#modal'); $('#dialog').innerHTML = html; m.hidden = false; void m.offsetWidth; m.classList.add('show');
}
async function closeModal() { const m = $('#modal'); m.classList.remove('show'); await wait(200); m.hidden = true; lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); }
document.addEventListener('keydown', (e) => {
  const m = $('#modal'); if (!m || m.hidden) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') { const f = $$('button', $('#dialog')); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
});
document.addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

/* ---------- public ---------- */
window.MillsPage = {
  mount(el, helpers) { H = { ...H, ...helpers }; root = el; reset(); shell(); },
  start() { root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in'); focusQr(); }
};
})();
