/* ===========================================================================
   SURG 2026 — interactive models
   Every widget re-implements the behaviour described in the project files.
   These are explanatory models, not simulator output. No result here comes
   from Vivado, from any HDL simulator, or from hardware.
   =========================================================================== */

const WIDGETS = {};

/* ------------------------------------------------------------------ utils */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function fitCanvas(cv, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth || 640;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(cssHeight * dpr);
  cv.style.height = cssHeight + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h: cssHeight };
}

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

/* Builds a labelled range control and wires it to a callback. */
function slider(parent, opts) {
  const wrap = el('div', 'control');
  const lab = el('label');
  lab.innerHTML = `<span>${opts.label}</span><span class="val" id="${opts.id}-val"></span>`;
  const inp = el('input');
  inp.type = 'range';
  inp.min = opts.min; inp.max = opts.max; inp.step = opts.step || 1; inp.value = opts.value;
  inp.id = opts.id;
  wrap.append(lab, inp);
  parent.append(wrap);
  const valEl = lab.querySelector('.val');
  const sync = () => { valEl.textContent = opts.fmt ? opts.fmt(+inp.value) : inp.value; };
  inp.addEventListener('input', () => { sync(); opts.on(+inp.value); });
  sync();
  return inp;
}

function readouts(parent, items) {
  const wrap = el('div', 'readout');
  items.forEach(it => {
    const d = el('div', 'readout-item');
    d.innerHTML = `<div class="k">${it.k}</div><div class="v" id="${it.id}">—</div>`;
    wrap.append(d);
  });
  parent.append(wrap);
  return wrap;
}

function setRO(id, text, cls) {
  const n = document.getElementById(id);
  if (!n) return;
  n.textContent = text;
  n.className = 'v' + (cls ? ' ' + cls : '');
}

function legend(parent, items) {
  const wrap = el('div', 'legend');
  items.forEach(i => {
    const s = el('span');
    s.innerHTML = `<i style="background:${i.c}"></i>${i.t}`;
    wrap.append(s);
  });
  parent.append(wrap);
}

/* =========================================================================
   1. Centre-aligned PWM with non-overlap
   Reimplements the output equations from pwm_3phase_center_aligned.v:
     hi = active && ((counter + nonoverlap) <  duty)
     lo = active && ( counter             >  (duty + nonoverlap))
   ========================================================================= */
WIDGETS.pwm = function (host) {
  const body = el('div', 'widget-body');
  const cw = el('div', 'widget-canvas-wrap');
  const cv = el('canvas');
  cw.append(cv); body.append(cw);
  host.append(body);

  const st = { period: 40, duty: 26, nonoverlap: 3, enable: true, inhibit: false, phases: 1 };

  const ctrls = el('div', 'controls');
  body.append(ctrls);

  slider(ctrls, { id: 'pwm-period', label: 'period (ticks)', min: 12, max: 80, value: st.period,
    on: v => { st.period = v; draw(); } });
  slider(ctrls, { id: 'pwm-duty', label: 'duty_a (ticks)', min: 0, max: 80, value: st.duty,
    on: v => { st.duty = v; draw(); } });
  slider(ctrls, { id: 'pwm-nov', label: 'nonoverlap_ticks', min: 0, max: 14, value: st.nonoverlap,
    on: v => { st.nonoverlap = v; draw(); } });

  const toggles = el('div', 'toggle-row');
  toggles.style.marginTop = '14px';
  const mkChip = (label, key, invert) => {
    const b = el('button', 'chip', label);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(invert ? !st[key] : st[key]));
    b.addEventListener('click', () => {
      st[key] = !st[key];
      b.setAttribute('aria-pressed', String(invert ? !st[key] : st[key]));
      draw();
    });
    toggles.append(b);
  };
  mkChip('enable', 'enable');
  mkChip('pwm_inhibit', 'inhibit');
  body.append(toggles);

  readouts(body, [
    { k: 'PWM frequency @100 MHz', id: 'pwm-freq' },
    { k: 'duty ratio', id: 'pwm-ratio' },
    { k: 'both-off per crossing', id: 'pwm-dead' },
    { k: 'configuration_error', id: 'pwm-cfg' }
  ]);

  legend(body, [
    { c: cssVar('--accent'), t: 'counter' },
    { c: '#3fb950', t: 'pwm_hi_a' },
    { c: '#f0883e', t: 'pwm_lo_a' },
    { c: '#f85149', t: 'both off (non-overlap)' }
  ]);

  function configError() {
    return !(st.period > 0 && st.nonoverlap < st.period &&
             2 * st.nonoverlap < st.period && st.duty <= st.period);
  }

  function draw() {
    const cfgErr = configError();
    const active = st.enable && !st.inhibit && !cfgErr;

    // The counter ramps 0 -> period -> 0, so one full PWM period is 2*period ticks.
    const total = 2 * st.period;
    const seq = [];
    for (let i = 0; i < st.period; i++) seq.push(i);
    for (let i = st.period; i > 0; i--) seq.push(i);

    const { ctx, w, h } = fitCanvas(cv, 300);
    ctx.clearRect(0, 0, w, h);
    const padL = 54, padR = 14, padT = 12;
    const plotW = w - padL - padR;
    const x = i => padL + (i / total) * plotW;

    const rowH = 46, gap = 12;
    const counterH = 96;

    // ---- counter triangle
    ctx.strokeStyle = cssVar('--border');
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT + counterH); ctx.lineTo(w - padR, padT + counterH); ctx.stroke();

    ctx.strokeStyle = cssVar('--accent');
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    seq.forEach((c, i) => {
      const px = x(i), py = padT + counterH - (c / Math.max(st.period, 1)) * (counterH - 8);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();

    // duty threshold line
    const dutyY = padT + counterH - (Math.min(st.duty, st.period) / Math.max(st.period, 1)) * (counterH - 8);
    ctx.strokeStyle = cssVar('--text-faint');
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, dutyY); ctx.lineTo(w - padR, dutyY); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = cssVar('--text-dim');
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('duty', padL - 6, dutyY + 3);
    ctx.fillText('counter', padL - 6, padT + 10);

    // ---- HI / LO traces
    const traces = [
      { name: 'pwm_hi_a', color: '#3fb950', fn: c => active && (c + st.nonoverlap) < st.duty },
      { name: 'pwm_lo_a', color: '#f0883e', fn: c => active && c > (st.duty + st.nonoverlap) }
    ];

    traces.forEach((tr, ti) => {
      const yTop = padT + counterH + gap + ti * (rowH + gap);
      const yBot = yTop + rowH - 16;
      ctx.strokeStyle = cssVar('--border');
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, yBot); ctx.lineTo(w - padR, yBot); ctx.stroke();

      ctx.fillStyle = cssVar('--text-dim');
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(tr.name, padL - 6, (yTop + yBot) / 2 + 3);

      ctx.strokeStyle = tr.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let prev = null;
      seq.forEach((c, i) => {
        const v = tr.fn(c);
        const py = v ? yTop : yBot;
        const px = x(i);
        if (prev === null) ctx.moveTo(px, py);
        else { if (prev !== v) ctx.lineTo(px, py === yTop ? yBot : yTop); ctx.lineTo(px, py); }
        prev = v;
      });
      ctx.lineTo(w - padR, prev ? yTop : yBot);
      ctx.stroke();
    });

    // ---- shade the both-off windows
    const yA = padT + counterH + gap;
    const yB = yA + 2 * (rowH + gap) - gap - 16;
    ctx.fillStyle = 'rgba(248, 81, 73, 0.14)';
    seq.forEach((c, i) => {
      const hi = active && (c + st.nonoverlap) < st.duty;
      const lo = active && c > (st.duty + st.nonoverlap);
      if (!hi && !lo && active) ctx.fillRect(x(i), yA, Math.max(plotW / total, 1.1), yB - yA);
    });

    // ---- readouts
    const fClk = 100e6;
    const fPwm = st.period > 0 ? fClk / (2 * st.period) : 0;
    setRO('pwm-freq', st.period > 0 ? (fPwm / 1000).toFixed(1) + ' kHz' : '—');
    setRO('pwm-ratio', st.period > 0 ? (Math.min(st.duty, st.period) / st.period * 100).toFixed(1) + ' %' : '—');
    const deadTicks = 2 * st.nonoverlap;
    setRO('pwm-dead', deadTicks + ' ticks · ' + (deadTicks * 10).toFixed(0) + ' ns',
      deadTicks === 0 ? 'bad' : 'ok');
    setRO('pwm-cfg', cfgErr ? "1 — outputs forced off" : '0 — valid', cfgErr ? 'bad' : 'ok');
  }

  window.addEventListener('resize', draw);
  document.addEventListener('themechange', draw);
  requestAnimationFrame(draw);
};

/* =========================================================================
   2. Three-phase duty view — all three phases at once
   ========================================================================= */
WIDGETS.pwm3 = function (host) {
  const body = el('div', 'widget-body');
  const cw = el('div', 'widget-canvas-wrap');
  const cv = el('canvas');
  cw.append(cv); body.append(cw); host.append(body);

  const st = { period: 40, da: 30, db: 20, dc: 10, nov: 2 };
  const ctrls = el('div', 'controls'); body.append(ctrls);
  slider(ctrls, { id: 'p3-a', label: 'duty_a', min: 0, max: 40, value: st.da, on: v => { st.da = v; draw(); } });
  slider(ctrls, { id: 'p3-b', label: 'duty_b', min: 0, max: 40, value: st.db, on: v => { st.db = v; draw(); } });
  slider(ctrls, { id: 'p3-c', label: 'duty_c', min: 0, max: 40, value: st.dc, on: v => { st.dc = v; draw(); } });
  slider(ctrls, { id: 'p3-n', label: 'nonoverlap_ticks', min: 0, max: 8, value: st.nov, on: v => { st.nov = v; draw(); } });

  legend(body, [
    { c: '#3fb950', t: 'HI (→ UCC21222 INA)' },
    { c: '#f0883e', t: 'LO (→ UCC21222 INB)' },
    { c: cssVar('--accent'), t: 'cycle_strobe / peak_strobe' }
  ]);

  function draw() {
    const total = 2 * st.period;
    const seq = [];
    for (let i = 0; i < st.period; i++) seq.push(i);
    for (let i = st.period; i > 0; i--) seq.push(i);

    const { ctx, w, h } = fitCanvas(cv, 292);
    ctx.clearRect(0, 0, w, h);
    const padL = 66, padR = 14, padT = 16;
    const plotW = w - padL - padR;
    const x = i => padL + (i / total) * plotW;

    const rows = [
      { n: 'pwm_hi_a', d: () => st.da, hi: true }, { n: 'pwm_lo_a', d: () => st.da, hi: false },
      { n: 'pwm_hi_b', d: () => st.db, hi: true }, { n: 'pwm_lo_b', d: () => st.db, hi: false },
      { n: 'pwm_hi_c', d: () => st.dc, hi: true }, { n: 'pwm_lo_c', d: () => st.dc, hi: false }
    ];
    const rowH = 34, sp = 8;

    rows.forEach((r, ri) => {
      const yTop = padT + ri * (rowH + sp) * 0.62;
      const yBot = yTop + 18;
      ctx.strokeStyle = cssVar('--border-soft'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, yBot); ctx.lineTo(w - padR, yBot); ctx.stroke();

      ctx.fillStyle = cssVar('--text-dim');
      ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'right';
      ctx.fillText(r.n, padL - 6, yBot - 4);

      ctx.strokeStyle = r.hi ? '#3fb950' : '#f0883e';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      let prev = null;
      seq.forEach((c, i) => {
        const d = r.d();
        const v = r.hi ? ((c + st.nov) < d) : (c > (d + st.nov));
        const py = v ? yTop : yBot, px = x(i);
        if (prev === null) ctx.moveTo(px, py);
        else { if (prev !== v) ctx.lineTo(px, py === yTop ? yBot : yTop); ctx.lineTo(px, py); }
        prev = v;
      });
      ctx.lineTo(w - padR, prev ? yTop : yBot);
      ctx.stroke();
    });

    // strobes
    const yb = padT + rows.length * (rowH + sp) * 0.62;
    ctx.strokeStyle = cssVar('--accent'); ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
    [0, st.period, total].forEach(i => {
      ctx.beginPath(); ctx.moveTo(x(i), padT - 6); ctx.lineTo(x(i), yb); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.fillStyle = cssVar('--accent'); ctx.font = '9.5px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText('cycle', x(0) + 14, yb + 12);
    ctx.fillText('peak', x(st.period), yb + 12);
    ctx.fillText('cycle', x(total) - 14, yb + 12);
  }

  window.addEventListener('resize', draw);
  document.addEventListener('themechange', draw);
  requestAnimationFrame(draw);
};

/* =========================================================================
   3. DISABLE / protection state model — mirrors pcb_disable_control.v
   ========================================================================= */
WIDGETS.disable = function (host) {
  const body = el('div', 'widget-body');
  host.append(body);

  const st = {
    rst: false, sensor_data_valid: false, enable_request: false,
    current_out_of_range: false, voltage_out_of_range: false,
    external_inhibit_request: false, protection_latched: false, status_code: 0
  };

  const row = el('div', 'toggle-row');
  const inputs = [
    ['rst', 'rst'],
    ['sensor_data_valid', 'sensor_data_valid'],
    ['enable_request', 'enable_request'],
    ['current_out_of_range', 'current_out_of_range'],
    ['voltage_out_of_range', 'voltage_out_of_range'],
    ['external_inhibit_request', 'external_inhibit_request']
  ];
  inputs.forEach(([key, label]) => {
    const b = el('button', 'chip', label);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(st[key]));
    b.addEventListener('click', () => {
      st[key] = !st[key];
      b.setAttribute('aria-pressed', String(st[key]));
      step(); render();
    });
    row.append(b);
  });
  const clr = el('button', 'chip', '⟲ clear_latch (pulse)');
  clr.type = 'button';
  clr.addEventListener('click', () => { step(true); render(); });
  row.append(clr);
  body.append(row);

  readouts(body, [
    { k: 'pwm_enable', id: 'dis-en' },
    { k: 'disable_cmd (the pin)', id: 'dis-cmd' },
    { k: 'protection_latched', id: 'dis-latch' },
    { k: 'status_code', id: 'dis-status' },
    { k: 'gate drivers', id: 'dis-drv' }
  ]);

  const expl = el('p');
  expl.style.cssText = 'margin-top:14px;font-size:12.5px;color:var(--text-dim)';
  body.append(expl);

  const STATUS = ['0 · none', '1 · current', '2 · voltage', '3 · external', '4 · startup'];

  function step(clearPulse) {
    if (st.rst) { st.protection_latched = false; st.status_code = 0; return; }
    const startup = !st.sensor_data_valid;
    const anyInhibit = startup || st.current_out_of_range || st.voltage_out_of_range || st.external_inhibit_request;

    if (startup) { st.protection_latched = false; st.status_code = 4; }
    else if (st.current_out_of_range) { st.protection_latched = true; st.status_code = 1; }
    else if (st.voltage_out_of_range) { st.protection_latched = true; st.status_code = 2; }
    else if (st.external_inhibit_request) { st.protection_latched = true; st.status_code = 3; }
    else if (clearPulse && !anyInhibit) { st.protection_latched = false; st.status_code = 0; }
    else if (!st.protection_latched) { st.status_code = 0; }
  }

  function render() {
    const startup = !st.sensor_data_valid;
    const anyInhibit = startup || st.current_out_of_range || st.voltage_out_of_range || st.external_inhibit_request;
    const pwmEnable = !st.rst && st.enable_request && !st.protection_latched && !anyInhibit;
    const disableCmd = pwmEnable ? 0 : 1;

    setRO('dis-en', String(pwmEnable ? 1 : 0), pwmEnable ? 'ok' : 'bad');
    setRO('dis-cmd', disableCmd + (disableCmd ? ' (high)' : ' (low)'), disableCmd ? 'bad' : 'ok');
    setRO('dis-latch', String(st.protection_latched ? 1 : 0), st.protection_latched ? 'warn' : 'ok');
    setRO('dis-status', STATUS[st.status_code]);
    setRO('dis-drv', disableCmd ? 'disabled' : 'enabled', disableCmd ? 'bad' : 'ok');

    let why;
    if (st.rst) why = 'Reset holds <code>pwm_enable</code> low, so DISABLE is driven high and the drivers are off.';
    else if (startup) why = 'Sensor data is not valid yet, so the startup inhibit holds the drivers off. This inhibit does not latch — it clears by itself once measurements come good.';
    else if (st.protection_latched) why = 'A trip has latched. It stays latched until <code>clear_latch</code> is pulsed while no inhibit condition is present. Try clearing the fault input first, then pulsing clear.';
    else if (!st.enable_request) why = 'Everything is healthy, but nothing has requested a run yet.';
    else why = 'All inhibits clear and a run is requested, so DISABLE is driven low and the UCC21222 outputs are enabled.';
    expl.innerHTML = why;
  }

  step(); render();
};

/* =========================================================================
   4. Hall decoder wheel — mirrors the decode table in hall_decoder.v
   ========================================================================= */
WIDGETS.hall = function (host) {
  const body = el('div', 'widget-body');
  const cw = el('div', 'widget-canvas-wrap');
  const cv = el('canvas');
  cw.append(cv); body.append(cw); host.append(body);

  // {hall_a, hall_b, hall_c} -> sector, in the ring order the RTL treats as forward
  const RING = [
    { code: '001', sector: 0 }, { code: '101', sector: 1 }, { code: '100', sector: 2 },
    { code: '110', sector: 3 }, { code: '010', sector: 4 }, { code: '011', sector: 5 }
  ];

  const st = { angle: 15, forced: null };

  const ctrls = el('div', 'controls'); body.append(ctrls);
  slider(ctrls, { id: 'hall-ang', label: 'rotor electrical angle', min: 0, max: 359, value: st.angle,
    fmt: v => v + '°', on: v => { st.angle = v; st.forced = null; draw(); render(); } });

  const row = el('div', 'toggle-row');
  row.style.marginTop = '12px';
  ['000', '111'].forEach(code => {
    const b = el('button', 'chip', 'force illegal ' + code);
    b.type = 'button';
    b.addEventListener('click', () => {
      st.forced = st.forced === code ? null : code;
      row.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.textContent.endsWith(st.forced || 'x'))));
      draw(); render();
    });
    row.append(b);
  });
  body.append(row);

  readouts(body, [
    { k: '{hall_a,hall_b,hall_c}', id: 'hall-code' },
    { k: 'sector', id: 'hall-sector' },
    { k: 'hall_valid', id: 'hall-valid' },
    { k: 'illegal_state', id: 'hall-illegal' }
  ]);

  function current() {
    if (st.forced) return { code: st.forced, sector: 7, illegal: true };
    const idx = Math.floor(st.angle / 60) % 6;
    return { ...RING[idx], illegal: false };
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(cv, 250);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2 + 6, R = Math.min(w, h) * 0.36;
    const cur = current();

    for (let i = 0; i < 6; i++) {
      const a0 = (i * 60 - 90) * Math.PI / 180;
      const a1 = ((i + 1) * 60 - 90) * Math.PI / 180;
      const isActive = !cur.illegal && cur.sector === RING[i].sector;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = isActive ? cssVar('--accent-soft') : cssVar('--bg-elev-2');
      ctx.fill();
      ctx.strokeStyle = isActive ? cssVar('--accent') : cssVar('--border');
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.stroke();

      const am = (a0 + a1) / 2;
      ctx.fillStyle = isActive ? cssVar('--accent') : cssVar('--text-dim');
      ctx.font = (isActive ? 'bold ' : '') + '11px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(RING[i].code, cx + Math.cos(am) * R * 0.68, cy + Math.sin(am) * R * 0.68 - 4);
      ctx.font = '9.5px ui-monospace, monospace';
      ctx.fillText('s' + RING[i].sector, cx + Math.cos(am) * R * 0.68, cy + Math.sin(am) * R * 0.68 + 9);
    }

    if (!cur.illegal) {
      const a = (st.angle - 90) * Math.PI / 180;
      ctx.strokeStyle = cssVar('--text');
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); ctx.stroke();
      ctx.fillStyle = cssVar('--text');
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = cssVar('--danger');
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('ILLEGAL CODE', cx, cy + 4);
    }
  }

  function render() {
    const cur = current();
    setRO('hall-code', cur.code, cur.illegal ? 'bad' : '');
    setRO('hall-sector', cur.illegal ? '7 (invalid)' : String(cur.sector), cur.illegal ? 'bad' : 'ok');
    setRO('hall-valid', cur.illegal ? '0' : '1', cur.illegal ? 'bad' : 'ok');
    setRO('hall-illegal', cur.illegal ? '1' : '0', cur.illegal ? 'bad' : 'ok');
  }

  window.addEventListener('resize', draw);
  document.addEventListener('themechange', draw);
  requestAnimationFrame(() => { draw(); render(); });
};

/* =========================================================================
   5. Current monitors — balance vs per-phase limit
   ========================================================================= */
WIDGETS.current = function (host) {
  const body = el('div', 'widget-body');
  host.append(body);

  const st = { ia: 30, ib: -15, ic: -15, limit: 60, bal: 8, valid: true };

  const ctrls = el('div', 'controls'); body.append(ctrls);
  slider(ctrls, { id: 'cur-a', label: 'ia_q', min: -120, max: 120, value: st.ia, on: v => { st.ia = v; render(); } });
  slider(ctrls, { id: 'cur-b', label: 'ib_q', min: -120, max: 120, value: st.ib, on: v => { st.ib = v; render(); } });
  slider(ctrls, { id: 'cur-c', label: 'ic_q', min: -120, max: 120, value: st.ic, on: v => { st.ic = v; render(); } });
  slider(ctrls, { id: 'cur-l', label: 'current_limit_q', min: 10, max: 120, value: st.limit, on: v => { st.limit = v; render(); } });
  slider(ctrls, { id: 'cur-bl', label: 'balance_limit_q', min: 0, max: 60, value: st.bal, on: v => { st.bal = v; render(); } });

  const row = el('div', 'toggle-row');
  row.style.marginTop = '12px';
  const vb = el('button', 'chip', 'sample_valid');
  vb.type = 'button'; vb.setAttribute('aria-pressed', 'true');
  vb.addEventListener('click', () => { st.valid = !st.valid; vb.setAttribute('aria-pressed', String(st.valid)); render(); });
  row.append(vb);

  const preset = el('button', 'chip', 'preset: all three high, sum ≈ 0');
  preset.type = 'button';
  preset.addEventListener('click', () => {
    st.ia = 100; st.ib = -50; st.ic = -50;
    document.getElementById('cur-a').value = 100; document.getElementById('cur-a-val').textContent = '100';
    document.getElementById('cur-b').value = -50; document.getElementById('cur-b-val').textContent = '-50';
    document.getElementById('cur-c').value = -50; document.getElementById('cur-c-val').textContent = '-50';
    render();
  });
  row.append(preset);
  body.append(row);

  readouts(body, [
    { k: 'balance_error_q (sum)', id: 'cur-sum' },
    { k: 'balance_out_of_range', id: 'cur-balout' },
    { k: 'phase_over_limit [C B A]', id: 'cur-bits' },
    { k: 'current_out_of_range', id: 'cur-out' }
  ]);

  const note = el('p');
  note.style.cssText = 'margin-top:14px;font-size:12.5px;color:var(--text-dim)';
  body.append(note);

  function render() {
    const sum = st.ia + st.ib + st.ic;
    const balOut = st.valid && Math.abs(sum) > Math.abs(st.bal);
    const bits = [
      st.valid && Math.abs(st.ia) > Math.abs(st.limit),
      st.valid && Math.abs(st.ib) > Math.abs(st.limit),
      st.valid && Math.abs(st.ic) > Math.abs(st.limit)
    ];
    const curOut = bits.some(Boolean);

    setRO('cur-sum', String(sum));
    setRO('cur-balout', balOut ? '1' : '0', balOut ? 'bad' : 'ok');
    setRO('cur-bits', `${bits[2] ? 1 : 0}${bits[1] ? 1 : 0}${bits[0] ? 1 : 0}`, curOut ? 'bad' : 'ok');
    setRO('cur-out', curOut ? '1' : '0', curOut ? 'bad' : 'ok');

    let msg;
    if (!st.valid) msg = '<code>sample_valid</code> is low, so both monitors suppress their outputs regardless of the current values.';
    else if (curOut && !balOut) msg = 'This is the case the limit monitor exists for: the three currents sum to roughly zero so the balance check is happy, but at least one phase is over its absolute limit.';
    else if (balOut && !curOut) msg = 'The three currents do not sum to zero, which points at a broken or mis-scaled measurement channel rather than a motor fault. No individual phase is over its limit.';
    else if (balOut && curOut) msg = 'Both monitors are tripping. Real overcurrent and an inconsistent measurement set at the same time.';
    else msg = 'Currents are balanced and every phase is inside its limit.';
    note.innerHTML = msg;
  }
  render();
};

/* =========================================================================
   6. Clarke / Park / inverse Park visualiser
   Uses the same formulas as matlab/foc_fixed_point_starter.m:
     alpha = ia;  beta = (ia + 2*ib)/sqrt(3)
     id =  alpha*cos + beta*sin;   iq = -alpha*sin + beta*cos
   ========================================================================= */
WIDGETS.clarke = function (host) {
  const body = el('div', 'widget-body');
  const cw = el('div', 'widget-canvas-wrap');
  const cv = el('canvas');
  cw.append(cv); body.append(cw); host.append(body);

  const st = { theta: 40, amp: 0.45, playing: false };

  const ctrls = el('div', 'controls'); body.append(ctrls);
  const thSlider = slider(ctrls, { id: 'ck-th', label: 'electrical angle θ', min: 0, max: 359, value: st.theta,
    fmt: v => v + '°', on: v => { st.theta = v; draw(); render(); } });
  slider(ctrls, { id: 'ck-amp', label: 'phase amplitude (pu)', min: 0.05, max: 0.95, step: 0.01, value: st.amp,
    fmt: v => v.toFixed(2), on: v => { st.amp = v; draw(); render(); } });

  const row = el('div', 'toggle-row'); row.style.marginTop = '12px';
  const play = el('button', 'chip', '▶ rotate');
  play.type = 'button';
  play.addEventListener('click', () => {
    st.playing = !st.playing;
    play.textContent = st.playing ? '❚❚ pause' : '▶ rotate';
    play.setAttribute('aria-pressed', String(st.playing));
    if (st.playing) tick();
  });
  row.append(play); body.append(row);

  readouts(body, [
    { k: 'i_a', id: 'ck-ia' }, { k: 'i_b', id: 'ck-ib' }, { k: 'i_c', id: 'ck-ic' },
    { k: 'i_alpha', id: 'ck-al' }, { k: 'i_beta', id: 'ck-be' },
    { k: 'i_d', id: 'ck-id' }, { k: 'i_q', id: 'ck-iq' }
  ]);

  const note = el('p');
  note.style.cssText = 'margin-top:14px;font-size:12.5px;color:var(--text-dim)';
  note.innerHTML = 'Rotate θ and watch the three phase currents swing while <b>i_d</b> and <b>i_q</b> hold still. That is the whole point of the Park transform: it converts a moving three-phase problem into two steady numbers a PI loop can regulate.';
  body.append(note);

  function tick() {
    if (!st.playing) return;
    st.theta = (st.theta + 1.4) % 360;
    thSlider.value = Math.round(st.theta);
    document.getElementById('ck-th-val').textContent = Math.round(st.theta) + '°';
    draw(); render();
    requestAnimationFrame(tick);
  }

  function values(thDeg) {
    const th = thDeg * Math.PI / 180;
    const ia = st.amp * Math.cos(th);
    const ib = st.amp * Math.cos(th - 2 * Math.PI / 3);
    const ic = st.amp * Math.cos(th + 2 * Math.PI / 3);
    const alpha = ia;
    const beta = (ia + 2 * ib) / Math.sqrt(3);
    const id = alpha * Math.cos(th) + beta * Math.sin(th);
    const iq = -alpha * Math.sin(th) + beta * Math.cos(th);
    return { ia, ib, ic, alpha, beta, id, iq };
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(cv, 260);
    ctx.clearRect(0, 0, w, h);

    // --- left: waveforms
    const splitX = Math.min(w * 0.58, w - 190);
    const padL = 34, padT = 14, plotH = h - 40;
    const midY = padT + plotH / 2;
    const plotW = splitX - padL - 14;

    ctx.strokeStyle = cssVar('--border'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, midY); ctx.lineTo(padL + plotW, midY); ctx.stroke();

    const scale = (plotH / 2 - 8);
    const series = [
      { c: '#f85149', f: t => values(t).ia, n: 'i_a' },
      { c: '#3fb950', f: t => values(t).ib, n: 'i_b' },
      { c: '#4d9fff', f: t => values(t).ic, n: 'i_c' }
    ];
    series.forEach(s => {
      ctx.strokeStyle = s.c; ctx.lineWidth = 1.7; ctx.beginPath();
      for (let d = 0; d <= 360; d += 2) {
        const px = padL + (d / 360) * plotW;
        const py = midY - s.f(d) * scale;
        d === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    const cx0 = padL + (st.theta / 360) * plotW;
    ctx.strokeStyle = cssVar('--text-faint'); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx0, padT); ctx.lineTo(cx0, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);

    const v = values(st.theta);
    series.forEach((s, i) => {
      const val = [v.ia, v.ib, v.ic][i];
      ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.arc(cx0, midY - val * scale, 3.4, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = cssVar('--text-faint'); ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('three phase currents vs θ', padL, h - 12);

    // --- right: vector plot
    const vx = splitX + (w - splitX) / 2, vy = padT + plotH / 2, R = Math.min((w - splitX) / 2, plotH / 2) - 16;
    ctx.strokeStyle = cssVar('--border'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(vx, vy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vx - R, vy); ctx.lineTo(vx + R, vy);
    ctx.moveTo(vx, vy - R); ctx.lineTo(vx, vy + R); ctx.stroke();

    const mag = Math.hypot(v.alpha, v.beta) || 1e-9;
    const norm = R / Math.max(st.amp * 1.16, 1e-6);

    // alpha/beta vector
    ctx.strokeStyle = cssVar('--accent'); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + v.alpha * norm, vy - v.beta * norm); ctx.stroke();

    // d axis (rotating frame)
    const th = st.theta * Math.PI / 180;
    ctx.strokeStyle = cssVar('--assumption'); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + Math.cos(th) * R, vy - Math.sin(th) * R); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = cssVar('--text-faint'); ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
    ctx.fillText('α', vx + R - 6, vy + 13);
    ctx.fillText('β', vx - 11, vy - R + 10);
    ctx.fillStyle = cssVar('--assumption');
    ctx.fillText('d axis', vx + Math.cos(th) * R * 0.72, vy - Math.sin(th) * R * 0.72 - 6);
    ctx.fillStyle = cssVar('--text-faint');
    ctx.fillText('α/β vector vs rotating d axis', vx, h - 12);
  }

  function render() {
    const v = values(st.theta);
    const f = x => (x >= 0 ? ' ' : '') + x.toFixed(3);
    setRO('ck-ia', f(v.ia)); setRO('ck-ib', f(v.ib)); setRO('ck-ic', f(v.ic));
    setRO('ck-al', f(v.alpha)); setRO('ck-be', f(v.beta));
    setRO('ck-id', f(v.id), 'ok'); setRO('ck-iq', f(v.iq), 'ok');
  }

  window.addEventListener('resize', draw);
  document.addEventListener('themechange', draw);
  requestAnimationFrame(() => { draw(); render(); });
};

/* =========================================================================
   7. Q-format quantisation explorer
   Mirrors q_encode / q_decode / q_mul_q15 from the MATLAB scripts.
   ========================================================================= */
WIDGETS.qformat = function (host) {
  const body = el('div', 'widget-body');
  host.append(body);

  const st = { value: 0.32, frac: 15, b: 0.5 };

  const ctrls = el('div', 'controls'); body.append(ctrls);
  slider(ctrls, { id: 'q-val', label: 'real value (pu)', min: -0.999, max: 0.999, step: 0.0001, value: st.value,
    fmt: v => v.toFixed(4), on: v => { st.value = v; render(); } });
  slider(ctrls, { id: 'q-frac', label: 'fractional bits (n in Q1.n)', min: 3, max: 15, value: st.frac,
    fmt: v => 'Q1.' + v, on: v => { st.frac = v; render(); } });
  slider(ctrls, { id: 'q-b', label: 'multiply by (pu)', min: -0.999, max: 0.999, step: 0.001, value: st.b,
    fmt: v => v.toFixed(3), on: v => { st.b = v; render(); } });

  readouts(body, [
    { k: 'scale 2^n', id: 'q-scale' },
    { k: 'encoded integer', id: 'q-enc' },
    { k: 'decoded back', id: 'q-dec' },
    { k: 'quantisation error', id: 'q-err' },
    { k: 'resolution (1 LSB)', id: 'q-res' },
    { k: 'a × b in Q1.n', id: 'q-mul' },
    { k: 'exact a × b', id: 'q-mulx' },
    { k: 'product error', id: 'q-mulerr' }
  ]);

  const note = el('p');
  note.style.cssText = 'margin-top:14px;font-size:12.5px;color:var(--text-dim)';
  body.append(note);

  function render() {
    const scale = Math.pow(2, st.frac);
    const qmax = Math.pow(2, 15) - 1, qmin = -Math.pow(2, 15);
    const enc = Math.min(Math.max(Math.round(st.value * scale), qmin), qmax);
    const dec = enc / scale;
    const err = dec - st.value;

    // q_mul_q15: round-half-away-from-zero then arithmetic shift right by frac
    const be = Math.min(Math.max(Math.round(st.b * scale), qmin), qmax);
    let raw = enc * be;
    raw = raw >= 0 ? raw + Math.pow(2, st.frac - 1) : raw - Math.pow(2, st.frac - 1);
    const shifted = Math.floor(raw / Math.pow(2, st.frac));
    const prod = Math.min(Math.max(shifted, qmin), qmax) / scale;
    const exact = st.value * st.b;

    setRO('q-scale', String(scale));
    setRO('q-enc', String(enc));
    setRO('q-dec', dec.toFixed(6));
    setRO('q-err', (err >= 0 ? '+' : '') + err.toExponential(2), Math.abs(err) > 0.01 ? 'warn' : 'ok');
    setRO('q-res', (1 / scale).toExponential(2));
    setRO('q-mul', prod.toFixed(6));
    setRO('q-mulx', exact.toFixed(6));
    const pe = prod - exact;
    setRO('q-mulerr', (pe >= 0 ? '+' : '') + pe.toExponential(2), Math.abs(pe) > 0.01 ? 'warn' : 'ok');

    const saturated = Math.abs(st.value * scale) > qmax;
    note.innerHTML = saturated
      ? '<b>Saturated.</b> The encoded value hit the 16-bit limit and was clamped. In Q1.15 this happens for anything at or beyond +1.0.'
      : `With ${st.frac} fractional bits, one LSB is ${(1 / scale).toExponential(2)} pu. Drag the fractional-bit slider down and watch both the encode error and the product error grow — that is the trade the FPGA is making when it drops bits to save fabric.`;
  }
  render();
};

/* =========================================================================
   8. PWM frequency / period calculator
   ========================================================================= */
WIDGETS.pwmfreq = function (host) {
  const body = el('div', 'widget-body');
  host.append(body);

  const st = { clk: 100, fpwm: 20, nov: 20 };

  const ctrls = el('div', 'controls'); body.append(ctrls);
  slider(ctrls, { id: 'pf-clk', label: 'fabric clock', min: 25, max: 250, step: 5, value: st.clk,
    fmt: v => v + ' MHz', on: v => { st.clk = v; render(); } });
  slider(ctrls, { id: 'pf-f', label: 'target PWM frequency', min: 4, max: 60, value: st.fpwm,
    fmt: v => v + ' kHz', on: v => { st.fpwm = v; render(); } });
  slider(ctrls, { id: 'pf-n', label: 'nonoverlap_ticks', min: 0, max: 120, value: st.nov,
    on: v => { st.nov = v; render(); } });

  readouts(body, [
    { k: 'period (half, ticks)', id: 'pf-period' },
    { k: 'actual PWM frequency', id: 'pf-actual' },
    { k: 'frequency error', id: 'pf-err' },
    { k: 'duty resolution', id: 'pf-res' },
    { k: 'non-overlap time', id: 'pf-nov' },
    { k: 'duty range lost', id: 'pf-lost' }
  ]);

  const note = el('p');
  note.style.cssText = 'margin-top:14px;font-size:12.5px;color:var(--text-dim)';
  body.append(note);

  function render() {
    const clk = st.clk * 1e6, target = st.fpwm * 1e3;
    const period = Math.round(clk / (2 * target));
    const actual = clk / (2 * period);
    const err = (actual - target) / target * 100;
    const bits = Math.log2(period);
    const novNs = st.nov / clk * 1e9;
    const lost = (2 * st.nov) / period * 100;

    setRO('pf-period', String(period));
    setRO('pf-actual', (actual / 1000).toFixed(2) + ' kHz');
    setRO('pf-err', (err >= 0 ? '+' : '') + err.toFixed(3) + ' %', Math.abs(err) < 0.1 ? 'ok' : 'warn');
    setRO('pf-res', period + ' steps · ' + bits.toFixed(1) + ' bits', bits < 8 ? 'warn' : 'ok');
    setRO('pf-nov', novNs.toFixed(0) + ' ns');
    setRO('pf-lost', lost.toFixed(2) + ' %', lost > 5 ? 'warn' : 'ok');

    const exact = Math.abs(err) < 1e-9;
    note.innerHTML = exact
      ? `<b>Exact.</b> ${st.clk} MHz divides evenly into ${st.fpwm} kHz centre-aligned, giving period = ${period} with no frequency error. The project's working numbers — 100 MHz and 20 kHz — land here at period = 2500.`
      : `${st.clk} MHz does not divide evenly into ${st.fpwm} kHz, so the integer period of ${period} produces ${(actual / 1000).toFixed(2)} kHz instead. Whether that matters depends on how tightly the switching frequency has to be held.`;
  }
  render();
};

/* =========================================================================
   9. Duty generation — inverse Park + min/max centring
   Mirrors svpwm_3pwm_duties() from matlab/stage1_3pwm_foc_sim.m
   ========================================================================= */
WIDGETS.duty = function (host) {
  const body = el('div', 'widget-body');
  const cw = el('div', 'widget-canvas-wrap');
  const cv = el('canvas');
  cw.append(cv); body.append(cw); host.append(body);

  const st = { vd: 0, vq: 0.35, theta: 60, centring: true };

  const ctrls = el('div', 'controls'); body.append(ctrls);
  slider(ctrls, { id: 'dt-vd', label: 'v_d command (pu)', min: -0.46, max: 0.46, step: 0.01, value: st.vd,
    fmt: v => v.toFixed(2), on: v => { st.vd = v; draw(); render(); } });
  slider(ctrls, { id: 'dt-vq', label: 'v_q command (pu)', min: -0.46, max: 0.46, step: 0.01, value: st.vq,
    fmt: v => v.toFixed(2), on: v => { st.vq = v; draw(); render(); } });
  slider(ctrls, { id: 'dt-th', label: 'electrical angle θ', min: 0, max: 359, value: st.theta,
    fmt: v => v + '°', on: v => { st.theta = v; draw(); render(); } });

  const row = el('div', 'toggle-row'); row.style.marginTop = '12px';
  const cb = el('button', 'chip', 'min/max centring');
  cb.type = 'button'; cb.setAttribute('aria-pressed', 'true');
  cb.addEventListener('click', () => { st.centring = !st.centring; cb.setAttribute('aria-pressed', String(st.centring)); draw(); render(); });
  row.append(cb); body.append(row);

  readouts(body, [
    { k: 'v_alpha', id: 'dt-al' }, { k: 'v_beta', id: 'dt-be' },
    { k: 'duty_a', id: 'dt-a' }, { k: 'duty_b', id: 'dt-b' }, { k: 'duty_c', id: 'dt-c' },
    { k: 'peak duty excursion', id: 'dt-pk' }
  ]);

  const note = el('p');
  note.style.cssText = 'margin-top:14px;font-size:12.5px;color:var(--text-dim)';
  body.append(note);

  function duties(thDeg) {
    const th = thDeg * Math.PI / 180;
    const va_ = st.vd * Math.cos(th) - st.vq * Math.sin(th);
    const vb_ = st.vd * Math.sin(th) + st.vq * Math.cos(th);
    let a = va_;
    let b = -0.5 * va_ + (Math.sqrt(3) / 2) * vb_;
    let c = -0.5 * va_ - (Math.sqrt(3) / 2) * vb_;
    if (st.centring) {
      const vz = -0.5 * (Math.max(a, b, c) + Math.min(a, b, c));
      a += vz; b += vz; c += vz;
    }
    const cl = x => Math.min(Math.max(0.5 + x, 0.02), 0.98);
    return { alpha: va_, beta: vb_, a: cl(a), b: cl(b), c: cl(c) };
  }

  function draw() {
    const { ctx, w, h } = fitCanvas(cv, 190);
    ctx.clearRect(0, 0, w, h);
    const padL = 40, padR = 14, padT = 12, plotH = h - 38;
    const plotW = w - padL - padR;
    const y = d => padT + (1 - d) * plotH;

    ctx.strokeStyle = cssVar('--border-soft'); ctx.lineWidth = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(d => {
      ctx.beginPath(); ctx.moveTo(padL, y(d)); ctx.lineTo(padL + plotW, y(d)); ctx.stroke();
      ctx.fillStyle = cssVar('--text-faint'); ctx.font = '9.5px ui-monospace, monospace'; ctx.textAlign = 'right';
      ctx.fillText(d.toFixed(2), padL - 5, y(d) + 3);
    });

    const cols = ['#f85149', '#3fb950', '#4d9fff'];
    ['a', 'b', 'c'].forEach((key, i) => {
      ctx.strokeStyle = cols[i]; ctx.lineWidth = 1.8; ctx.beginPath();
      for (let d = 0; d <= 360; d += 2) {
        const px = padL + (d / 360) * plotW, py = y(duties(d)[key]);
        d === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    });

    const cx0 = padL + (st.theta / 360) * plotW;
    ctx.strokeStyle = cssVar('--text-faint'); ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx0, padT); ctx.lineTo(cx0, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);
    const cur = duties(st.theta);
    [cur.a, cur.b, cur.c].forEach((d, i) => {
      ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(cx0, y(d), 3.4, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = cssVar('--text-faint'); ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('duty_a / duty_b / duty_c across one electrical revolution', padL, h - 10);
  }

  function render() {
    const v = duties(st.theta);
    setRO('dt-al', v.alpha.toFixed(3)); setRO('dt-be', v.beta.toFixed(3));
    setRO('dt-a', v.a.toFixed(3)); setRO('dt-b', v.b.toFixed(3)); setRO('dt-c', v.c.toFixed(3));

    let pk = 0;
    for (let d = 0; d <= 360; d += 2) {
      const x = duties(d);
      pk = Math.max(pk, Math.abs(x.a - 0.5), Math.abs(x.b - 0.5), Math.abs(x.c - 0.5));
    }
    setRO('dt-pk', '±' + pk.toFixed(3), pk > 0.48 ? 'warn' : 'ok');

    note.innerHTML = st.centring
      ? 'Min/max centring is on. The common-mode offset pushes the three duties away from the rails, so a larger voltage vector fits inside the same 0–1 duty range. The characteristic flat-topped shape is the offset doing its work.'
      : 'Centring is off — this is plain sine modulation. Compare the peak duty excursion with centring switched back on: the same v_d/v_q now demands more duty range, so it saturates sooner.';
  }

  window.addEventListener('resize', draw);
  document.addEventListener('themechange', draw);
  requestAnimationFrame(() => { draw(); render(); });
};

/* =========================================================================
   10. PI current loop — fixed point vs floating point
   Mirrors pi_fixed_step / pi_float_step from the MATLAB scripts.
   ========================================================================= */
WIDGETS.piloop = function (host) {
  const body = el('div', 'widget-body');
  const cw = el('div', 'widget-canvas-wrap');
  const cv = el('canvas');
  cw.append(cv); body.append(cw); host.append(body);

  const st = { kp: 0.30, ki: 0.016, frac: 15, tau: 2.5, limit: 0.46 };

  const ctrls = el('div', 'controls'); body.append(ctrls);
  slider(ctrls, { id: 'pi-kp', label: 'k_p', min: 0.02, max: 1.2, step: 0.01, value: st.kp,
    fmt: v => v.toFixed(2), on: v => { st.kp = v; draw(); } });
  slider(ctrls, { id: 'pi-ki', label: 'k_i per sample', min: 0, max: 0.12, step: 0.001, value: st.ki,
    fmt: v => v.toFixed(3), on: v => { st.ki = v; draw(); } });
  slider(ctrls, { id: 'pi-q', label: 'fractional bits', min: 4, max: 15, value: st.frac,
    fmt: v => 'Q1.' + v, on: v => { st.frac = v; draw(); } });
  slider(ctrls, { id: 'pi-t', label: 'plant time constant', min: 0.4, max: 8, step: 0.1, value: st.tau,
    fmt: v => v.toFixed(1) + ' ms', on: v => { st.tau = v; draw(); } });

  readouts(body, [
    { k: 'max |float − fixed|', id: 'pi-err' },
    { k: 'overshoot', id: 'pi-os' },
    { k: 'settled by', id: 'pi-set' }
  ]);

  legend(body, [
    { c: cssVar('--text-faint'), t: 'reference' },
    { c: '#4d9fff', t: 'floating point' },
    { c: '#f85149', t: `fixed point` }
  ]);

  const note = el('p');
  note.style.cssText = 'margin-top:14px;font-size:12.5px;color:var(--text-dim)';
  note.innerHTML = 'Both loops run the same gains against the same first-order plant. The only difference is that one quantises every signal and every product to the chosen Q format. Drop the fractional bits and the fixed-point trace starts to grind against its own resolution.';
  body.append(note);

  function simulate() {
    const fpwm = 20000, dt = 1 / fpwm, N = 900;
    const alpha = dt / (st.tau / 1000);
    const scale = Math.pow(2, st.frac);
    const qmax = 32767, qmin = -32768;
    const enc = x => Math.min(Math.max(Math.round(x * scale), qmin), qmax);
    const qmul = (a, b) => {
      let raw = a * b;
      raw = raw >= 0 ? raw + Math.pow(2, st.frac - 1) : raw - Math.pow(2, st.frac - 1);
      return Math.min(Math.max(Math.floor(raw / Math.pow(2, st.frac)), qmin), qmax);
    };

    const ref = k => (k < 80 ? 0 : (k < 560 ? 0.35 : -0.25));
    const outLim = st.limit;
    const outLimQ = Math.round(outLim * scale);

    const fl = { i: 0, integ: 0 }, fx = { i: 0, integ: 0 };
    const trace = [];
    const kpQ = enc(st.kp), kiQ = enc(st.ki);

    for (let k = 0; k < N; k++) {
      const r = ref(k);

      // floating point
      let errF = r - fl.i;
      let integC = fl.integ + st.ki * errF;
      let uns = st.kp * errF + integC;
      let outF = Math.min(Math.max(uns, -outLim), outLim);
      if (!((outF >= outLim && errF > 0) || (outF <= -outLim && errF < 0))) fl.integ = integC;
      fl.i += alpha * (outF - fl.i);

      // fixed point
      const errQ = Math.min(Math.max(enc(r) - enc(fx.i), qmin), qmax);
      const pQ = qmul(errQ, kpQ), iStepQ = qmul(errQ, kiQ);
      const integCQ = Math.min(Math.max(fx.integ + iStepQ, qmin), qmax);
      const unsQ = Math.min(Math.max(pQ + integCQ, qmin), qmax);
      const outQ = Math.min(Math.max(unsQ, -outLimQ), outLimQ);
      if (!((outQ >= outLimQ && errQ > 0) || (outQ <= -outLimQ && errQ < 0))) fx.integ = integCQ;
      const outFx = outQ / scale;
      fx.i += alpha * (outFx - fx.i);

      trace.push({ r, f: fl.i, x: fx.i });
    }
    return trace;
  }

  function draw() {
    const tr = simulate();
    const { ctx, w, h } = fitCanvas(cv, 220);
    ctx.clearRect(0, 0, w, h);
    const padL = 42, padR = 14, padT = 12, plotH = h - 34;
    const plotW = w - padL - padR;
    const lo = -0.45, hi = 0.55;
    const y = v => padT + (1 - (v - lo) / (hi - lo)) * plotH;
    const x = i => padL + (i / (tr.length - 1)) * plotW;

    ctx.strokeStyle = cssVar('--border-soft'); ctx.lineWidth = 1;
    [-0.25, 0, 0.35].forEach(v => {
      ctx.beginPath(); ctx.moveTo(padL, y(v)); ctx.lineTo(padL + plotW, y(v)); ctx.stroke();
      ctx.fillStyle = cssVar('--text-faint'); ctx.font = '9.5px ui-monospace, monospace'; ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(2), padL - 5, y(v) + 3);
    });

    const line = (key, color, dash) => {
      ctx.strokeStyle = color; ctx.lineWidth = key === 'r' ? 1.2 : 1.8;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      tr.forEach((p, i) => { const px = x(i), py = y(p[key]); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
      ctx.stroke(); ctx.setLineDash([]);
    };
    line('r', cssVar('--text-faint'), [4, 4]);
    line('f', '#4d9fff');
    line('x', '#f85149');

    ctx.fillStyle = cssVar('--text-faint'); ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'left';
    ctx.fillText('i_q tracking a reference step, 20 kHz loop rate', padL, h - 8);

    let maxErr = 0, peak = 0;
    tr.forEach((p, i) => {
      maxErr = Math.max(maxErr, Math.abs(p.f - p.x));
      if (i > 80 && i < 560) peak = Math.max(peak, p.f);
    });
    setRO('pi-err', maxErr.toExponential(2), maxErr > 0.02 ? 'warn' : 'ok');
    const os = peak > 0.35 ? (peak / 0.35 - 1) * 100 : 0;
    setRO('pi-os', os.toFixed(1) + ' %', os > 20 ? 'warn' : 'ok');
    let settle = '—';
    for (let i = 80; i < 560; i++) {
      if (Math.abs(tr[i].f - 0.35) < 0.35 * 0.02) { settle = ((i - 80) / 20000 * 1000).toFixed(2) + ' ms'; break; }
    }
    setRO('pi-set', settle);
  }

  window.addEventListener('resize', draw);
  document.addEventListener('themechange', draw);
  requestAnimationFrame(draw);
};

/* =========================================================================
   10. Voltage-sense divider calculator
   Mirrors the VSENSE chain read from the netlist:
     Vbus -> 750k + 750k / 20k divider -> AMC1311 -> OPA4388 (unity) -> ADC
   The resistor values are confirmed; the ADC full scale is not, which is
   why the last stage is a question rather than a number.
   ========================================================================= */
WIDGETS.vdiv = function (host) {
  const body = el('div', 'widget-body');
  host.append(body);

  const st = { vbus: 96, rtop: 1500, rbot: 20, amcMax: 2.0 };

  const ctrls = el('div', 'controls');
  body.append(ctrls);
  slider(ctrls, { id: 'vd-vbus', label: 'bus voltage', min: 0, max: 200, step: 1, value: st.vbus,
    fmt: v => v + ' V', on: v => { st.vbus = v; draw(); } });
  slider(ctrls, { id: 'vd-rtop', label: 'R top', min: 100, max: 2000, step: 10, value: st.rtop,
    fmt: v => v + ' kOhm', on: v => { st.rtop = v; draw(); } });
  slider(ctrls, { id: 'vd-rbot', label: 'R bottom', min: 1, max: 100, step: 1, value: st.rbot,
    fmt: v => v + ' kOhm', on: v => { st.rbot = v; draw(); } });

  readouts(body, [
    { k: 'divider ratio', id: 'vd-ratio' },
    { k: 'AMC1311 input', id: 'vd-vin' },
    { k: 'within 0-2 V?', id: 'vd-ok' },
    { k: 'max safe bus', id: 'vd-max' },
  ]);

  const note = el('div', 'widget-note');
  body.append(note);

  function draw() {
    const ratio = st.rbot / (st.rtop + st.rbot);
    const vin = st.vbus * ratio;
    const maxBus = st.amcMax / ratio;
    setRO('vd-ratio', '1 : ' + (1 / ratio).toFixed(1));
    setRO('vd-vin', vin.toFixed(3) + ' V');
    setRO('vd-ok', vin <= st.amcMax ? 'yes' : 'NO - clipping', vin <= st.amcMax ? 'ok' : 'warn');
    setRO('vd-max', maxBus.toFixed(0) + ' V');

    const isBoard = st.rtop === 1500 && st.rbot === 20;
    note.innerHTML =
      '<p><strong>Board values</strong> are 750 k&#8486; + 750 k&#8486; on top and 20 k&#8486; to PGND, so R top = 1500 k&#8486; ' +
      '&mdash; a ratio of 1:76. ' + (isBoard ? 'You are looking at the board values now.' : 'You have moved these away from the board values.') + '</p>' +
      '<p>At 96 V that gives about <strong>1.26 V</strong> into the AMC1311, comfortably inside its 0&ndash;2 V range. ' +
      'A schematic note reads <em>"96V to 1V65"</em>, which does <strong>not</strong> match 96 / 76 &asymp; 1.26 V. ' +
      'That discrepancy is an open question for the PCB team.</p>' +
      '<p><strong>What this cannot tell you:</strong> the voltage that actually reaches the ADC. The OPA4388 stage is ' +
      'unity gain, but the ADC full scale is unknown, so the limits in <code>voltage_sense_monitor.v</code> still ' +
      'cannot be converted into volts.</p>';
  }
  draw();
};

/* =========================================================================
   11. PS / PL split
   Clickable rather than a static picture: the rule that decides which side
   a job belongs on is "does a late answer break something?", so each item
   states its own reason.
   ========================================================================= */
WIDGETS.pspl = function (host) {
  const body = el('div', 'widget-body');
  host.append(body);

  const ITEMS = [
    { t: 'PWM timing and HI/LO generation', side: 'pl', why: 'A PWM edge 50 us late produces the wrong motor voltage. It has to land on an exact clock cycle.', file: 'pwm_3phase_center_aligned.v' },
    { t: 'Hall capture and sector decode', side: 'pl', why: 'Feeds commutation inside the control period, and needs two-stage synchronisation of asynchronous inputs.', file: 'hall_decoder.v' },
    { t: 'Per-phase current limit', side: 'pl', why: 'All three phases compared at the same instant, with a shutdown path only a few cycles long.', file: 'phase_current_limit_monitor.v' },
    { t: 'Measurement-health check', side: 'pl', why: 'Kirchhoff test on ia+ib+ic at the same sample instant.', file: 'phase_current_balance_monitor.v' },
    { t: 'Voltage window check', side: 'pl', why: 'Bus and phase voltage compared against limits every sample.', file: 'voltage_sense_monitor.v' },
    { t: 'Fast inhibit and DISABLE', side: 'pl', why: 'Must react without asking a processor, and latch until explicitly cleared.', file: 'pcb_disable_control.v' },
    { t: 'Fixed-point FOC datapath', side: 'pl', why: 'Belongs in fabric eventually. Not written yet.', file: 'not written' },
    { t: 'Startup mode and state machine', side: 'ps', why: 'Human-timescale sequencing. Milliseconds are fine.', file: '-' },
    { t: 'Commands and setpoints', side: 'ps', why: 'Arrives from an operator or a host. Jitter here is harmless.', file: '-' },
    { t: 'Thresholds into fabric registers', side: 'ps', why: 'Written once at configuration, then read by fabric every cycle.', file: 'AXI map not defined' },
    { t: 'Logging, telemetry, comms', side: 'ps', why: 'A log line 50 ms late is still a fine log line.', file: '-' },
    { t: 'Recovery policy after a trip', side: 'ps', why: 'Deliberately slow. A human or a supervisor decides when a latch clears.', file: '-' },
  ];

  const grid = el('div', 'pspl-grid');
  const detail = el('div', 'widget-note');

  ['pl', 'ps'].forEach(side => {
    const col = el('div', 'pspl-col pspl-' + side);
    col.append(el('h4', null, side === 'pl'
      ? 'PL &mdash; programmable logic<small>inside the PWM period</small>'
      : 'PS &mdash; ARM processing system<small>milliseconds, or human decisions</small>'));
    ITEMS.filter(i => i.side === side).forEach(i => {
      const b = el('button', 'pspl-item');
      b.type = 'button';
      b.textContent = i.t;
      b.addEventListener('click', () => {
        grid.querySelectorAll('.pspl-item').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        detail.innerHTML = '<p><strong>' + i.t + '</strong> &rarr; ' + side.toUpperCase() + '</p>' +
          '<p>' + i.why + '</p><p class="pspl-file">RTL: <code>' + i.file + '</code></p>';
      });
      col.append(b);
    });
    grid.append(col);
  });
  body.append(grid);

  detail.innerHTML = '<p>Click any item to see why it sits on that side.</p>' +
    '<p>The test is always the same: <strong>does a late answer break something?</strong> If yes, it belongs in fabric.</p>';
  body.append(detail);

  const warn = el('div', 'widget-note');
  warn.innerHTML = '<p><strong>Not yet defined:</strong> the AXI register map carrying setpoints, thresholds and ' +
    'telemetry between the two sides. It should be written after the pin map and the ADC route are known, because ' +
    'both change what fabric needs to expose.</p>';
  body.append(warn);
};

/* =========================================================================
   12. Vivado flow checklist
   Ordered so everything doable today comes before everything blocked on
   someone else. Progress is kept in localStorage only.
   ========================================================================= */
WIDGETS.vivadoflow = function (host) {
  const body = el('div', 'widget-body');
  host.append(body);

  const STEPS = [
    { t: 'Install Vivado and the Digilent Arty Z7 board files', s: 'ready' },
    { t: 'Create a project and add fpga/rtl/*.v as design sources', s: 'ready' },
    { t: 'Add fpga/tb/tb_*.v as simulation sources', s: 'ready' },
    { t: 'Run behavioural simulation on each of the six testbenches', s: 'ready' },
    { t: 'Record what actually happened, including any failures', s: 'ready' },
    { t: 'Build a throwaway LED blink project to learn the XDC workflow', s: 'ready' },
    { t: 'Read the fabric clock and I/O bank voltage off that project', s: 'ready' },
    { t: 'Write the top-level wrapper tying the six modules together', s: 'ready' },
    { t: 'Confirm the Arty Z7 variant (Z7-10 or Z7-20)', s: 'blocked' },
    { t: 'Get board-side net-to-header mapping confirmed by the PCB team', s: 'blocked' },
    { t: 'Resolve the Hall 5 V pull-up question', s: 'blocked' },
    { t: 'Settle the ADC route (XADC, external, or PS-side)', s: 'blocked' },
    { t: 'Define the AXI register map', s: 'blocked' },
    { t: 'Write the final XDC', s: 'blocked' },
    { t: 'Synthesis, implementation, bitstream', s: 'blocked' },
  ];

  const KEY = 'surg-vivado-flow';
  let done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { done = {}; }

  const list = el('div', 'flow-list');
  const summary = el('div', 'widget-note');

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) { /* private mode */ }
  }

  function refresh() {
    const readyTotal = STEPS.filter(s => s.s === 'ready').length;
    const readyDone = STEPS.filter(s => s.s === 'ready' && done[s.t]).length;
    summary.innerHTML =
      '<p><strong>' + readyDone + ' of ' + readyTotal + '</strong> unblocked steps ticked. The remaining ' +
      (STEPS.length - readyTotal) + ' are waiting on information from outside the FPGA work, and are listed so the ' +
      'order is visible rather than because they can be started.</p>' +
      '<p>Nothing here has been run. Ticking a box records your own progress in this browser only.</p>';
  }

  STEPS.forEach((step, i) => {
    const row = el('label', 'flow-row flow-' + step.s);
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = !!done[step.t];
    cb.disabled = step.s === 'blocked';
    cb.addEventListener('change', () => {
      if (cb.checked) done[step.t] = true; else delete done[step.t];
      save(); refresh();
    });
    const txt = el('span', 'flow-text', (i + 1 < 10 ? '0' : '') + (i + 1) + '. ' + step.t);
    const tag = el('span', 'sbadge sbadge-' + (step.s === 'ready' ? 'confirmed' : 'open'),
      step.s === 'ready' ? 'Ready' : 'Blocked');
    row.append(cb, txt, tag);
    list.append(row);
  });

  body.append(list, summary);
  refresh();
};
