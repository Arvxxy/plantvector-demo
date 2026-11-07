/* Custom form controls that replace the browser's native pickers everywhere in the app:
   <select>, <input type="date">, <input type="month">, <input type="time">.
   Each native element stays in the DOM (hidden) and keeps its value, so page code that reads
   .value or listens for input/change keeps working. Enhancement is automatic for any element
   added later (MutationObserver). */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MON = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const TODAY = new Date(2026, 10, 6);           // prototype "today", matches the dummy data
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const same = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const svg = (d, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = { chev: '<path d="M6 9l6 6 6-6"/>', cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', l: '<path d="M15 6l-6 6 6 6"/>', r: '<path d="M9 6l6 6-6 6"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>' };
let uid = 0;
const fire = (el) => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };

/* ---------------- shared popover ---------------- */
let cur = null;   // { pop, anchor, onKey }
function place(pop, anchor) {
  const r = anchor.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
  pop.style.minWidth = Math.max(r.width, +pop.dataset.minw || 0) + 'px';
  const pw = pop.offsetWidth, ph = pop.offsetHeight, gap = 6;
  const below = vh - r.bottom - gap, above = r.top - gap, up = ph > below && above > below;
  let left = Math.min(Math.max(8, r.left), vw - pw - 8);
  pop.style.left = left + 'px';
  pop.style.top = (up ? Math.max(8, r.top - gap - ph) : r.bottom + gap) + 'px';
  pop.classList.toggle('up', up);
  pop.style.maxHeight = Math.max(160, (up ? above : below) - 8) + 'px';
}
function openPop(anchor, cls, build, onKey) {
  closePop(true);
  const pop = document.createElement('div'); pop.className = 'nx-pop ' + cls; pop.id = 'nxp' + (++uid);
  document.body.appendChild(pop); build(pop); place(pop, anchor);
  anchor.setAttribute('aria-expanded', 'true'); anchor.classList.add('open');
  requestAnimationFrame(() => pop.classList.add('show'));
  cur = { pop, anchor, onKey };
  return pop;
}
function closePop(silent) {
  if (!cur) return; const { pop, anchor } = cur; cur = null;
  anchor.setAttribute('aria-expanded', 'false'); anchor.classList.remove('open');
  pop.classList.remove('show'); pop.classList.add('hide');
  setTimeout(() => pop.remove(), reduced() ? 0 : 180);
  if (!silent) anchor.focus({ preventScroll: true });
}
document.addEventListener('mousedown', (e) => { if (cur && !cur.pop.contains(e.target) && !cur.anchor.contains(e.target)) closePop(true); }, true);
document.addEventListener('scroll', (e) => { if (!cur || cur.pop.contains(e.target)) return; const r = cur.anchor.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) closePop(true); else place(cur.pop, cur.anchor); }, true);
window.addEventListener('resize', () => cur && place(cur.pop, cur.anchor));
window.addEventListener('hashchange', () => closePop(true));
document.addEventListener('keydown', (e) => { if (!cur) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePop(); return; } if (cur.onKey) cur.onKey(e); }, true);

/* keep the custom button in sync when page code sets .value / .selectedIndex directly */
function watchValue(el, props, sync) {
  props.forEach((p) => { const proto = Object.getPrototypeOf(el), d = Object.getOwnPropertyDescriptor(proto, p) || Object.getOwnPropertyDescriptor(HTMLElement.prototype, p); if (!d) return;
    Object.defineProperty(el, p, { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, v); sync(); } }); });
}
function linkLabel(native, btn) {
  const lab = native.id ? $(`label[for="${native.id}"]`) : null;
  if (lab) { if (!lab.id) lab.id = 'nxl' + (++uid); btn.setAttribute('aria-labelledby', `${lab.id} ${btn.id}`); lab.addEventListener('click', (e) => { e.preventDefault(); btn.focus(); btn.click(); }); return; }
  const wrap = native.closest('label'), sr = wrap && $('.sr,.lbl-s,.ff-l', wrap);
  const name = native.getAttribute('aria-label') || (sr && sr.textContent.trim()) || (native.closest('.per') ? 'Baris per halaman' : '');
  if (name) btn.setAttribute('aria-label', name);
}
function makeBtn(native, kind, extra = '') {
  native.dataset.nx = '1';
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'nxb' + (++uid);
  btn.className = `nx-f nx-${kind} ${extra}`.trim();
  btn.setAttribute('aria-haspopup', kind === 'sel' ? 'listbox' : 'dialog'); btn.setAttribute('aria-expanded', 'false');
  native.classList.add('nx-native'); native.tabIndex = -1; native.setAttribute('aria-hidden', 'true');
  native.insertAdjacentElement('afterend', btn);
  linkLabel(native, btn);
  native.addEventListener('focus', () => btn.focus());
  return btn;
}
const ctx = (el) => el.closest('.f-pager') ? 'sm' : el.closest('.dur-row') ? 'md' : el.classList.contains('sel') || el.closest('.wf') ? 'lg' : el.closest('.ff-dates,.ff-g') ? 'mdf' : 'md';

/* ---------------- select ---------------- */
function enhanceSelect(sel) {
  const btn = makeBtn(sel, 'sel', ctx(sel));
  const sync = () => { const o = sel.options[sel.selectedIndex]; btn.innerHTML = `<span class="nx-v ${o && o.value === '' ? 'ph' : ''}">${o ? o.textContent : ''}</span>${svg(I.chev, 16)}`; btn.disabled = sel.disabled; };
  watchValue(sel, ['value', 'selectedIndex'], sync); sel.addEventListener('change', sync); sync();
  const open = () => {
    const opts = [...sel.options], searchable = opts.length > 8; let act = Math.max(0, sel.selectedIndex), typed = '', typedT;
    const pop = openPop(btn, 'nx-list', (p) => {
      p.setAttribute('role', 'listbox'); p.setAttribute('aria-labelledby', btn.getAttribute('aria-labelledby') || btn.id);
      p.innerHTML = `${searchable ? `<label class="nx-search">${svg(I.search, 15)}<input type="text" placeholder="Cari…" aria-label="Cari pilihan"></label>` : ''}<div class="nx-opts">${opts.map((o, i) => `<button type="button" role="option" class="nx-o ${o.value === '' ? 'ph' : ''}" data-i="${i}" aria-selected="${i === sel.selectedIndex}" ${o.disabled ? 'disabled' : ''}><span>${o.textContent}</span>${svg(I.check, 15)}</button>`).join('')}</div>`;
    });
    const items = () => $$('.nx-o:not([hidden])', pop);
    const mark = (i, scroll = true) => { const list = items(); if (!list.length) return; act = (i + list.length) % list.length; list.forEach((b, k) => b.classList.toggle('act', k === act)); if (scroll) list[act].scrollIntoView({ block: 'nearest' }); };
    const choose = (b) => { sel.selectedIndex = +b.dataset.i; sync(); fire(sel); closePop(); };
    pop.addEventListener('click', (e) => { const b = e.target.closest('.nx-o'); if (b && !b.disabled) choose(b); });
    pop.addEventListener('mousemove', (e) => { const b = e.target.closest('.nx-o'); if (b) mark(items().indexOf(b), false); });
    const s = $('.nx-search input', pop);
    if (s) { s.addEventListener('input', () => { const q = s.value.toLowerCase(); $$('.nx-o', pop).forEach((b) => { b.hidden = !b.textContent.toLowerCase().includes(q); }); mark(0); }); setTimeout(() => s.focus(), 30); }
    const selIdx = items().findIndex((b) => b.getAttribute('aria-selected') === 'true'); mark(selIdx < 0 ? 0 : selIdx);
    cur.onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(act + 1); } else if (e.key === 'ArrowUp') { e.preventDefault(); mark(act - 1); }
      else if (e.key === 'Home') { e.preventDefault(); mark(0); } else if (e.key === 'End') { e.preventDefault(); mark(items().length - 1); }
      else if (e.key === 'Enter' || (e.key === ' ' && !s)) { e.preventDefault(); const b = items()[act]; if (b) choose(b); }
      else if (e.key === 'Tab') closePop(true);
      else if (!s && e.key.length === 1) { clearTimeout(typedT); typed += e.key.toLowerCase(); typedT = setTimeout(() => { typed = ''; }, 600); const k = items().findIndex((b) => b.textContent.trim().toLowerCase().startsWith(typed)); if (k >= 0) mark(k); }
    };
  };
  btn.addEventListener('click', () => (cur && cur.anchor === btn) ? closePop() : open());
  btn.addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp'].includes(e.key) && !cur) { e.preventDefault(); open(); } });
}

/* ---------------- date ---------------- */
function fmtDate(d) { return `${pad(d.getDate())} ${MS[d.getMonth()]} ${d.getFullYear()}`; }
function enhanceDate(inp) {
  const btn = makeBtn(inp, 'date', ctx(inp));
  const sync = () => { const d = parse(inp.value); btn.innerHTML = `${svg(I.cal, 17)}<span class="nx-v ${d ? '' : 'ph'}">${d ? fmtDate(d) : 'Pilih tanggal'}</span>`; btn.disabled = inp.disabled; };
  watchValue(inp, ['value'], sync); inp.addEventListener('change', sync); sync();
  const open = () => {
    const min = parse(inp.min), max = parse(inp.max); let view = parse(inp.value) || TODAY, mode = 'day', focus = parse(inp.value) || TODAY;
    const pop = openPop(btn, 'nx-cal', () => {});
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Pilih tanggal'); pop.dataset.minw = 300;
    const ok = (d) => (!min || d >= min) && (!max || d <= max);
    const render = (anim) => {
      const y = view.getFullYear(), m = view.getMonth(), sel = parse(inp.value);
      let body;
      if (mode === 'day') {
        const first = new Date(y, m, 1), start = (first.getDay() + 6) % 7, cells = [];
        for (let i = 0; i < 42; i++) { const d = new Date(y, m, 1 - start + i); cells.push(d); }
        body = `<div class="cal-dow">${DOW.map((d) => `<span>${d}</span>`).join('')}</div><div class="cal-grid ${anim || ''}" role="grid">${cells.map((d) => `<button type="button" class="cal-d ${d.getMonth() !== m ? 'out' : ''} ${same(d, TODAY) ? 'today' : ''} ${same(d, sel) ? 'sel' : ''} ${same(d, focus) ? 'foc' : ''}" data-d="${iso(d)}" ${ok(d) ? '' : 'disabled'} tabindex="${same(d, focus) ? 0 : -1}" aria-label="${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}" aria-pressed="${same(d, sel)}">${d.getDate()}</button>`).join('')}</div>`;
      } else {
        body = `<div class="cal-months ${anim || ''}">${MS.map((n, i) => { const d0 = new Date(y, i, 1), d1 = new Date(y, i + 1, 0); const dis = (min && d1 < min) || (max && d0 > max); return `<button type="button" class="cal-m ${i === m ? 'sel' : ''} ${y === TODAY.getFullYear() && i === TODAY.getMonth() ? 'today' : ''}" data-m="${i}" ${dis ? 'disabled' : ''}>${n}</button>`; }).join('')}</div>`;
      }
      pop.innerHTML = `<div class="cal-h"><button type="button" class="cal-nav" data-nav="-1" aria-label="${mode === 'day' ? 'Bulan sebelumnya' : 'Tahun sebelumnya'}">${svg(I.l, 16)}</button><button type="button" class="cal-t" data-mode aria-label="Ganti tampilan">${mode === 'day' ? `${MON[m]} ${y}` : y}${svg(I.chev, 14)}</button><button type="button" class="cal-nav" data-nav="1" aria-label="${mode === 'day' ? 'Bulan berikutnya' : 'Tahun berikutnya'}">${svg(I.r, 16)}</button></div>${body}
        <div class="cal-f"><button type="button" data-today ${ok(TODAY) ? '' : 'disabled'}>Hari ini</button>${inp.required ? '' : '<button type="button" data-clear>Kosongkan</button>'}</div>`;
      place(pop, btn);
    };
    const pick = (d) => { inp.value = iso(d); sync(); fire(inp); closePop(); };
    pop.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t || t.disabled) return;
      if (t.dataset.nav) { const k = +t.dataset.nav; view = mode === 'day' ? new Date(view.getFullYear(), view.getMonth() + k, 1) : new Date(view.getFullYear() + k, view.getMonth(), 1); render(k > 0 ? 'an-l' : 'an-r'); }
      else if (t.hasAttribute('data-mode')) { mode = mode === 'day' ? 'month' : 'day'; render('an-z'); }
      else if (t.dataset.m) { view = new Date(view.getFullYear(), +t.dataset.m, 1); mode = 'day'; render('an-z'); }
      else if (t.dataset.d) pick(parse(t.dataset.d));
      else if (t.hasAttribute('data-today')) pick(TODAY);
      else if (t.hasAttribute('data-clear')) { inp.value = ''; sync(); fire(inp); closePop(); }
    });
    cur.onKey = (e) => { if (mode !== 'day') return; const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (mv) { e.preventDefault(); focus = new Date(focus.getFullYear(), focus.getMonth(), focus.getDate() + mv); if (focus.getMonth() !== view.getMonth()) view = new Date(focus.getFullYear(), focus.getMonth(), 1); render(); const f = $('.cal-d.foc', pop); f && f.focus(); }
      else if (e.key === 'Enter' && document.activeElement.classList.contains('cal-d')) { e.preventDefault(); if (!document.activeElement.disabled) pick(focus); } };
    render(); setTimeout(() => { const f = $('.cal-d.foc', pop) || $('.cal-d.sel', pop); f && f.focus(); }, 30);
  };
  btn.addEventListener('click', () => (cur && cur.anchor === btn) ? closePop() : open());
}

/* ---------------- month ---------------- */
function enhanceMonth(inp) {
  const btn = makeBtn(inp, 'month', ctx(inp));
  const val = () => { const m = /^(\d{4})-(\d{2})$/.exec(inp.value || ''); return m ? [+m[1], +m[2] - 1] : null; };
  const sync = () => { const v = val(); btn.innerHTML = `${svg(I.cal, 17)}<span class="nx-v ${v ? '' : 'ph'}">${v ? `${MON[v[1]]} ${v[0]}` : 'Pilih bulan'}</span>${svg(I.chev, 16)}`; };
  watchValue(inp, ['value'], sync); inp.addEventListener('change', sync); sync();
  const open = () => { let y = (val() || [TODAY.getFullYear()])[0];
    const pop = openPop(btn, 'nx-cal', () => {}); pop.dataset.minw = 280; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Pilih bulan');
    const render = (anim) => { const v = val(); pop.innerHTML = `<div class="cal-h"><button type="button" class="cal-nav" data-nav="-1" aria-label="Tahun sebelumnya">${svg(I.l, 16)}</button><span class="cal-t static">${y}</span><button type="button" class="cal-nav" data-nav="1" aria-label="Tahun berikutnya">${svg(I.r, 16)}</button></div>
      <div class="cal-months ${anim || ''}">${MS.map((n, i) => `<button type="button" class="cal-m ${v && v[0] === y && v[1] === i ? 'sel' : ''} ${y === TODAY.getFullYear() && i === TODAY.getMonth() ? 'today' : ''}" data-m="${i}">${n}</button>`).join('')}</div>
      <div class="cal-f"><button type="button" data-this>Bulan ini</button></div>`; place(pop, btn); };
    const pick = (yy, m) => { inp.value = `${yy}-${pad(m + 1)}`; sync(); fire(inp); closePop(); };
    pop.addEventListener('click', (e) => { const t = e.target.closest('button'); if (!t) return; if (t.dataset.nav) { y += +t.dataset.nav; render(+t.dataset.nav > 0 ? 'an-l' : 'an-r'); } else if (t.dataset.m) pick(y, +t.dataset.m); else if (t.hasAttribute('data-this')) pick(TODAY.getFullYear(), TODAY.getMonth()); });
    render(); setTimeout(() => { const f = $('.cal-m.sel', pop) || $('.cal-m', pop); f && f.focus(); }, 30);
  };
  btn.addEventListener('click', () => (cur && cur.anchor === btn) ? closePop() : open());
}

/* ---------------- time ---------------- */
function enhanceTime(inp) {
  const btn = makeBtn(inp, 'time', ctx(inp));
  const val = () => { const m = /^(\d{2}):(\d{2})/.exec(inp.value || ''); return m ? [+m[1], +m[2]] : null; };
  const sync = () => { const v = val(); btn.innerHTML = `${svg(I.clock, 16)}<span class="nx-v ${v ? '' : 'ph'}">${v ? `${pad(v[0])}:${pad(v[1])}` : '--:--'}</span>`; };
  watchValue(inp, ['value'], sync); inp.addEventListener('change', sync); sync();
  const open = () => { let [h, m] = val() || [null, null];
    const mins = Array.from({ length: 12 }, (_, i) => i * 5); if (m != null && !mins.includes(m)) { mins.push(m); mins.sort((a, b) => a - b); }
    const pop = openPop(btn, 'nx-time', () => {}); pop.dataset.minw = 200; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Pilih jam');
    pop.innerHTML = `<div class="tm-cols"><div class="tm-col" aria-label="Jam"><p>Jam</p><div>${Array.from({ length: 24 }, (_, i) => `<button type="button" data-h="${i}" class="${i === h ? 'sel' : ''}">${pad(i)}</button>`).join('')}</div></div><div class="tm-col" aria-label="Menit"><p>Menit</p><div>${mins.map((i) => `<button type="button" data-m="${i}" class="${i === m ? 'sel' : ''}">${pad(i)}</button>`).join('')}</div></div></div><div class="cal-f"><button type="button" data-now>Sekarang</button><button type="button" data-done class="pri">Selesai</button></div>`;
    place(pop, btn);
    const set = () => { if (h == null) return; inp.value = `${pad(h)}:${pad(m == null ? 0 : m)}`; sync(); fire(inp); };
    const mark = () => { $$('[data-h]', pop).forEach((b) => b.classList.toggle('sel', +b.dataset.h === h)); $$('[data-m]', pop).forEach((b) => b.classList.toggle('sel', +b.dataset.m === m)); };
    pop.addEventListener('click', (e) => { const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.h) { h = +t.dataset.h; if (m == null) m = 0; mark(); set(); }
      else if (t.dataset.m) { m = +t.dataset.m; if (h == null) h = 12; mark(); set(); closePop(); }
      else if (t.hasAttribute('data-now')) { const d = new Date(); h = d.getHours(); m = Math.floor(d.getMinutes() / 5) * 5; if (!mins.includes(m)) m = 0; mark(); set(); closePop(); }
      else if (t.hasAttribute('data-done')) closePop(); });
    requestAnimationFrame(() => { $$('.tm-col > div', pop).forEach((c) => { const s = $('.sel', c); if (s) c.scrollTop = s.offsetTop - c.clientHeight / 2 + s.offsetHeight / 2; }); const f = $('.tm-col .sel', pop) || $('[data-h="7"]', pop); f && f.focus({ preventScroll: true }); });
  };
  btn.addEventListener('click', () => (cur && cur.anchor === btn) ? closePop() : open());
}

/* ---------------- auto-enhance ---------------- */
const SEL = 'select:not([data-nx]):not([multiple]), input[type=date]:not([data-nx]), input[type=month]:not([data-nx]), input[type=time]:not([data-nx])';
function scan(root = document) {
  $$(SEL, root).forEach((el) => {
    if (el.closest('[data-native]')) return;
    if (el.tagName === 'SELECT') enhanceSelect(el);
    else if (el.type === 'date') enhanceDate(el);
    else if (el.type === 'month') enhanceMonth(el);
    else if (el.type === 'time') enhanceTime(el);
  });
}
let q = 0;
new MutationObserver(() => { cancelAnimationFrame(q); q = requestAnimationFrame(() => scan()); }).observe(document.documentElement, { childList: true, subtree: true });
// run synchronously after each microtask batch too, so a freshly rendered page never flashes native controls
new MutationObserver((muts) => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches?.(SEL) || n.querySelector?.(SEL))) { scan(n.parentNode || document); return; } }).observe(document.documentElement, { childList: true, subtree: true });
if (document.readyState !== 'loading') scan(); else document.addEventListener('DOMContentLoaded', () => scan());
window.NXUI = { scan, close: () => closePop(true) };
})();
