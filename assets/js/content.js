/* ===========================================================================
   SURG 2026 — page content
   Every factual claim carries a status badge and a source.
   =========================================================================== */

/* ------------------------------------------------------------- helpers */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Code block with a copy button. `file` shows in the header bar. */
function cb(file, lang, src) {
  return `<div class="codeblock" data-lang="${lang}">
    <div class="codeblock-head"><span>${file}</span><span class="lang">${lang}</span>
      <button class="copy-btn" type="button">Copy</button></div>
    <pre><code>${esc(src.replace(/^\n/, '').replace(/\s+$/, ''))}</code></pre>
  </div>`;
}

/* Source citation line. Keys refer to SRC in data.js; plain strings pass through. */
function cite(...keys) {
  const parts = keys.map(k => {
    if (typeof k === 'string' && SRC[k]) {
      const s = SRC[k];
      return s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>` : `<code>${s.label}</code>`;
    }
    return k;
  });
  return `<p class="cite-line"><span class="cite-icon">↳</span> Source: ${parts.join(' · ')}</p>`;
}

function badge(kind) {
  const map = {
    confirmed: 'Confirmed', assumption: 'Assumption', open: 'Open',
    danger: 'Blocker', neutral: 'Note',
    inferred: 'Inferred',
    pcbteam: 'Needs PCB team',      // blocked on someone outside the FPGA work
    ready: 'Ready for simulation',  // doable today, blocked by nothing
  };
  return `<span class="badge badge-${kind}">${map[kind] || kind}</span>`;
}

/* A dated fact is a different thing from an undated one, so key claims carry
   the date the underlying note was written. */
function updated(date) {
  return `<span class="updated-tag" title="Date of the project note this is read from">updated ${date}</span>`;
}

function callout(kind, title, body) {
  return `<div class="callout callout-${kind}"><div class="callout-body">
    <div class="callout-title">${title}</div>${body}</div></div>`;
}

function collapse(title, tag, body, open) {
  return `<details class="collapse"${open ? ' open' : ''}><summary>${title}${tag ? `<span class="summary-tag">${tag}</span>` : ''}</summary>
    <div class="collapse-body">${body}</div></details>`;
}

function widget(name, title, note) {
  return `<div class="widget"><div class="widget-head"><h4>${title}</h4>
    <span class="badge badge-neutral">Interactive model</span></div>
    <div data-widget="${name}"></div>
    ${note ? `<div class="figure-cap"><span class="gen-note">${note}</span></div>` : ''}</div>`;
}

function figure(label, caption, svg, generated) {
  return `<figure class="figure"><div class="figure-body">${svg}</div>
    <figcaption class="figure-cap"><span class="fig-label">${label}</span>${caption}
    ${generated !== false ? ' <span class="gen-note">Generated explanatory diagram.</span>' : ''}</figcaption></figure>`;
}

function table(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const g = t => `<span class="gloss" data-term="${t}">${t}</span>`;

/* ======================================================== SVG DIAGRAMS */

const SVG_SYSTEM = `
<svg viewBox="0 0 900 400" role="img" aria-label="System block diagram from battery through the power board and driver board to the Arty Z7 and the motor">
  <rect x="18" y="150" width="108" height="66" rx="6" class="d-box"/>
  <text x="72" y="176" class="d-text-title" text-anchor="middle">Battery</text>
  <text x="72" y="194" class="d-text-sm" text-anchor="middle">96 V nominal</text>
  <text x="72" y="208" class="d-text-sm" text-anchor="middle">(12 V bench)</text>

  <rect x="162" y="122" width="130" height="122" rx="6" class="d-box"/>
  <text x="227" y="146" class="d-text-title" text-anchor="middle">Power board</text>
  <text x="227" y="166" class="d-text-sm" text-anchor="middle">MOSFET bridge</text>
  <text x="227" y="182" class="d-text-sm" text-anchor="middle">phase shunts</text>
  <text x="227" y="202" class="d-text-sm" text-anchor="middle" fill="#f0883e">shunt value</text>
  <text x="227" y="216" class="d-text-sm" text-anchor="middle" fill="#f0883e">unknown</text>

  <rect x="330" y="72" width="200" height="240" rx="6" class="d-box-accent"/>
  <text x="430" y="96" class="d-text-title" text-anchor="middle">Driver board</text>
  <text x="430" y="112" class="d-text-sm" text-anchor="middle">(the Altium files)</text>
  <rect x="346" y="126" width="168" height="34" rx="4" class="d-box"/>
  <text x="430" y="147" class="d-text-mono" text-anchor="middle">3 × UCC21222</text>
  <rect x="346" y="168" width="168" height="34" rx="4" class="d-box"/>
  <text x="430" y="189" class="d-text-mono" text-anchor="middle">3 × AMC1300</text>
  <rect x="346" y="210" width="168" height="34" rx="4" class="d-box"/>
  <text x="430" y="231" class="d-text-mono" text-anchor="middle">2 × AMC1311</text>
  <rect x="346" y="252" width="168" height="34" rx="4" class="d-box"/>
  <text x="430" y="273" class="d-text-mono" text-anchor="middle">2 × OPA4388</text>

  <rect x="568" y="72" width="200" height="240" rx="6" class="d-box"/>
  <text x="668" y="96" class="d-text-title" text-anchor="middle">Arty Z7 · Zynq</text>
  <text x="668" y="112" class="d-text-sm" text-anchor="middle">Uno-style shield headers</text>
  <rect x="584" y="126" width="168" height="76" rx="4" class="d-box-ok"/>
  <text x="668" y="147" class="d-text-title" text-anchor="middle">PL — fabric</text>
  <text x="668" y="164" class="d-text-sm" text-anchor="middle">PWM · Hall · monitors</text>
  <text x="668" y="180" class="d-text-sm" text-anchor="middle">DISABLE · sample timing</text>
  <text x="668" y="196" class="d-text-sm" text-anchor="middle">future: FOC blocks</text>
  <rect x="584" y="212" width="168" height="74" rx="4" class="d-box"/>
  <text x="668" y="233" class="d-text-title" text-anchor="middle">PS — ARM</text>
  <text x="668" y="250" class="d-text-sm" text-anchor="middle">startup · commands</text>
  <text x="668" y="266" class="d-text-sm" text-anchor="middle">thresholds · logging</text>
  <text x="668" y="280" class="d-text-sm" text-anchor="middle">recovery policy</text>

  <rect x="806" y="150" width="80" height="66" rx="6" class="d-box"/>
  <text x="846" y="180" class="d-text-title" text-anchor="middle">Motor</text>
  <text x="846" y="198" class="d-text-sm" text-anchor="middle">BLDC / PMSM</text>

  <path d="M126 183 L160 183" class="d-line-accent" marker-end="url(#ar)"/>
  <path d="M292 160 L328 160" class="d-line-accent" marker-end="url(#ar)"/>
  <text x="310" y="152" class="d-text-sm" text-anchor="middle">gates</text>
  <path d="M292 206 L328 206" class="d-line" marker-end="url(#ar)"/>
  <text x="310" y="224" class="d-text-sm" text-anchor="middle">phase ±</text>

  <path d="M566 150 L532 150" class="d-line-accent" marker-end="url(#ar)"/>
  <text x="549" y="142" class="d-text-sm" text-anchor="middle">6 PWM</text>
  <path d="M566 172 L532 172" class="d-line-accent" marker-end="url(#ar)"/>
  <text x="549" y="188" class="d-text-sm" text-anchor="middle">DISABLE</text>
  <path d="M532 238 L566 238" class="d-line" marker-end="url(#ar)"/>
  <text x="549" y="256" class="d-text-sm" text-anchor="middle">6 analog</text>
  <path d="M532 262 L566 262" class="d-line" marker-end="url(#ar)"/>
  <text x="549" y="280" class="d-text-sm" text-anchor="middle">3 Hall</text>

  <path d="M292 232 C 340 360, 700 360, 804 200" class="d-line" marker-end="url(#ar)"/>
  <text x="548" y="356" class="d-text-sm" text-anchor="middle">three motor phases</text>

  <text x="430" y="336" class="d-text-sm" text-anchor="middle" fill="#f0883e">isolation barrier: GND (logic) vs PGND (motor)</text>
  <line x1="330" y1="344" x2="530" y2="344" class="d-line" stroke-dasharray="4 4"/>

  <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0 1 L7 4 L0 7 z" fill="currentColor" stroke="none" class="d-text"/></marker></defs>
</svg>`;

const SVG_GATE = `
<svg viewBox="0 0 880 250" role="img" aria-label="Gate drive path from FPGA pin through RC filter and UCC21222 to the half bridge">
  <rect x="14" y="70" width="112" height="80" rx="6" class="d-box-ok"/>
  <text x="70" y="98" class="d-text-title" text-anchor="middle">FPGA (PL)</text>
  <text x="70" y="118" class="d-text-mono" text-anchor="middle">pwm_hi_a</text>
  <text x="70" y="136" class="d-text-mono" text-anchor="middle">pwm_lo_a</text>

  <rect x="176" y="70" width="120" height="80" rx="6" class="d-box"/>
  <text x="236" y="96" class="d-text-title" text-anchor="middle">RC filter</text>
  <text x="236" y="118" class="d-text-mono" text-anchor="middle">49.9 Ω</text>
  <text x="236" y="136" class="d-text-mono" text-anchor="middle">33 pF</text>

  <rect x="346" y="42" width="170" height="140" rx="6" class="d-box-accent"/>
  <text x="431" y="66" class="d-text-title" text-anchor="middle">UCC21222</text>
  <text x="431" y="82" class="d-text-sm" text-anchor="middle">U5 / U9 / U13</text>
  <text x="356" y="106" class="d-text-mono">INA ←── HI</text>
  <text x="356" y="126" class="d-text-mono">INB ←── LO</text>
  <text x="356" y="146" class="d-text-mono">DIS ←── DISABLE</text>
  <text x="356" y="168" class="d-text-sm">DT ── R28/R36/R61</text>

  <rect x="566" y="42" width="150" height="140" rx="6" class="d-box"/>
  <text x="641" y="66" class="d-text-title" text-anchor="middle">Half bridge</text>
  <text x="641" y="86" class="d-text-sm" text-anchor="middle">(power board)</text>
  <rect x="600" y="98" width="82" height="30" rx="3" class="d-box"/>
  <text x="641" y="118" class="d-text-mono" text-anchor="middle">high side</text>
  <rect x="600" y="140" width="82" height="30" rx="3" class="d-box"/>
  <text x="641" y="160" class="d-text-mono" text-anchor="middle">low side</text>

  <rect x="762" y="86" width="100" height="52" rx="6" class="d-box"/>
  <text x="812" y="110" class="d-text-title" text-anchor="middle">Phase A</text>
  <text x="812" y="128" class="d-text-sm" text-anchor="middle">to motor</text>

  <path d="M126 110 L174 110" class="d-line-accent" marker-end="url(#ar2)"/>
  <path d="M296 110 L344 110" class="d-line-accent" marker-end="url(#ar2)"/>
  <path d="M516 112 L564 112" class="d-line-accent" marker-end="url(#ar2)"/>
  <path d="M716 112 L760 112" class="d-line" marker-end="url(#ar2)"/>

  <text x="431" y="212" class="d-text-sm" text-anchor="middle">INB is an independent input — the board contains no inverter and no complementary-generation logic.</text>
  <text x="431" y="230" class="d-text-sm" text-anchor="middle">The driver adds dead time and interlock between the two signals you provide; it does not create the second one.</text>

  <defs><marker id="ar2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0 1 L7 4 L0 7 z" fill="currentColor" stroke="none" class="d-text"/></marker></defs>
</svg>`;

const SVG_CURRENT = `
<svg viewBox="0 0 880 210" role="img" aria-label="Current sense path from the shunt through AMC1300 and OPA4388 to the controller">
  <rect x="14" y="58" width="122" height="84" rx="6" class="d-box"/>
  <text x="75" y="84" class="d-text-title" text-anchor="middle">Shunt</text>
  <text x="75" y="104" class="d-text-sm" text-anchor="middle">on power board</text>
  <text x="75" y="122" class="d-text-sm" text-anchor="middle" fill="#f0883e">value unknown</text>

  <rect x="184" y="58" width="130" height="84" rx="6" class="d-box"/>
  <text x="249" y="84" class="d-text-title" text-anchor="middle">AMC1300</text>
  <text x="249" y="102" class="d-text-sm" text-anchor="middle">U2 / U4 / U6</text>
  <text x="249" y="120" class="d-text-mono" text-anchor="middle">gain 8.2 · ±250 mV</text>

  <rect x="362" y="58" width="140" height="84" rx="6" class="d-box"/>
  <text x="432" y="84" class="d-text-title" text-anchor="middle">OPA4388 U10</text>
  <text x="432" y="102" class="d-text-sm" text-anchor="middle">4 × 3.3 kΩ diff stage</text>
  <text x="432" y="120" class="d-text-mono" text-anchor="middle">gain 1 · ref = GND</text>

  <rect x="550" y="58" width="140" height="84" rx="6" class="d-box-ok"/>
  <text x="620" y="84" class="d-text-title" text-anchor="middle">MCU CSENSE</text>
  <text x="620" y="102" class="d-text-mono" text-anchor="middle">A / B / C</text>
  <text x="620" y="120" class="d-text-sm" text-anchor="middle">J3.1 / J3.2 / J3.3</text>

  <rect x="738" y="58" width="126" height="84" rx="6" class="d-box-warn"/>
  <text x="801" y="88" class="d-text-title" text-anchor="middle">ADC</text>
  <text x="801" y="108" class="d-text-sm" text-anchor="middle">XADC? external?</text>
  <text x="801" y="124" class="d-text-sm" text-anchor="middle">still open</text>

  <path d="M136 100 L182 100" class="d-line-accent" marker-end="url(#ar3)"/>
  <text x="159" y="92" class="d-text-sm" text-anchor="middle">PHASE ±</text>
  <path d="M314 100 L360 100" class="d-line-accent" marker-end="url(#ar3)"/>
  <text x="337" y="92" class="d-text-sm" text-anchor="middle">CSENSE ±</text>
  <path d="M502 100 L548 100" class="d-line-accent" marker-end="url(#ar3)"/>
  <path d="M690 100 L736 100" class="d-line" stroke-dasharray="4 4" marker-end="url(#ar3)"/>

  <text x="440" y="176" class="d-text-sm" text-anchor="middle">Isolated side (PGND)  |  Logic side (GND)</text>
  <line x1="330" y1="34" x2="330" y2="160" class="d-line" stroke-dasharray="5 4"/>
  <text x="440" y="194" class="d-text-sm" text-anchor="middle" fill="#f0883e">The diff stage references GND at unity gain, so as parsed, negative current maps below 0 V.</text>

  <defs><marker id="ar3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0 1 L7 4 L0 7 z" fill="currentColor" stroke="none" class="d-text"/></marker></defs>
</svg>`;

const SVG_VOLTAGE = `
<svg viewBox="0 0 880 190" role="img" aria-label="Voltage sense path from the resistive divider through AMC1311 and OPA4388 to the controller">
  <rect x="14" y="52" width="132" height="86" rx="6" class="d-box"/>
  <text x="80" y="76" class="d-text-title" text-anchor="middle">Divider</text>
  <text x="80" y="96" class="d-text-mono" text-anchor="middle">750k + 750k</text>
  <text x="80" y="114" class="d-text-mono" text-anchor="middle">over 20k</text>
  <text x="80" y="131" class="d-text-sm" text-anchor="middle">≈ 1 : 76</text>

  <rect x="194" y="52" width="136" height="86" rx="6" class="d-box"/>
  <text x="262" y="78" class="d-text-title" text-anchor="middle">AMC1311</text>
  <text x="262" y="97" class="d-text-sm" text-anchor="middle">U11 (phase A)</text>
  <text x="262" y="114" class="d-text-sm" text-anchor="middle">U14 (Vm)</text>
  <text x="262" y="131" class="d-text-mono" text-anchor="middle">0–2 V input</text>

  <rect x="378" y="52" width="132" height="86" rx="6" class="d-box"/>
  <text x="444" y="80" class="d-text-title" text-anchor="middle">OPA4388 U12</text>
  <text x="444" y="102" class="d-text-sm" text-anchor="middle">diff stage</text>
  <text x="444" y="120" class="d-text-mono" text-anchor="middle">gain 1</text>

  <rect x="558" y="52" width="150" height="86" rx="6" class="d-box-ok"/>
  <text x="633" y="80" class="d-text-title" text-anchor="middle">MCU VSENSE</text>
  <text x="633" y="100" class="d-text-mono" text-anchor="middle">A → J3.4</text>
  <text x="633" y="118" class="d-text-mono" text-anchor="middle">Vm → J3.5</text>

  <rect x="756" y="52" width="108" height="86" rx="6" class="d-box-warn"/>
  <text x="810" y="86" class="d-text-title" text-anchor="middle">ADC</text>
  <text x="810" y="106" class="d-text-sm" text-anchor="middle">route open</text>

  <path d="M146 95 L192 95" class="d-line-accent" marker-end="url(#ar4)"/>
  <path d="M330 95 L376 95" class="d-line-accent" marker-end="url(#ar4)"/>
  <path d="M510 95 L556 95" class="d-line-accent" marker-end="url(#ar4)"/>
  <path d="M708 95 L754 95" class="d-line" stroke-dasharray="4 4" marker-end="url(#ar4)"/>

  <text x="440" y="170" class="d-text-sm" text-anchor="middle">96 V through the divider gives about 1.26 V at the AMC1311, comfortably inside its 0–2 V window.</text>

  <defs><marker id="ar4" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0 1 L7 4 L0 7 z" fill="currentColor" stroke="none" class="d-text"/></marker></defs>
</svg>`;

const SVG_HALL = `
<svg viewBox="0 0 880 170" role="img" aria-label="Hall sensor path from the motor connector to the shield header">
  <rect x="14" y="46" width="130" height="80" rx="6" class="d-box"/>
  <text x="79" y="72" class="d-text-title" text-anchor="middle">Motor Halls</text>
  <text x="79" y="92" class="d-text-sm" text-anchor="middle">CC1 Microfit 2×3</text>
  <text x="79" y="110" class="d-text-sm" text-anchor="middle">open-drain type</text>

  <rect x="192" y="46" width="140" height="80" rx="6" class="d-box-warn"/>
  <text x="262" y="72" class="d-text-title" text-anchor="middle">Pull-up</text>
  <text x="262" y="92" class="d-text-mono" text-anchor="middle">10 kΩ to 5 V</text>
  <text x="262" y="112" class="d-text-sm" text-anchor="middle" fill="#f0883e">not 3.3 V safe</text>

  <rect x="380" y="46" width="130" height="80" rx="6" class="d-box"/>
  <text x="445" y="72" class="d-text-title" text-anchor="middle">RC filter</text>
  <text x="445" y="92" class="d-text-mono" text-anchor="middle">100 Ω + 100 nF</text>
  <text x="445" y="112" class="d-text-sm" text-anchor="middle">τ ≈ 10 µs</text>

  <rect x="558" y="46" width="140" height="80" rx="6" class="d-box-ok"/>
  <text x="628" y="72" class="d-text-title" text-anchor="middle">MCU HALL</text>
  <text x="628" y="92" class="d-text-mono" text-anchor="middle">A / B / C</text>
  <text x="628" y="110" class="d-text-sm" text-anchor="middle">J5.1 / J5.4 / J5.6</text>

  <rect x="746" y="46" width="118" height="80" rx="6" class="d-box-ok"/>
  <text x="805" y="78" class="d-text-title" text-anchor="middle">hall_decoder</text>
  <text x="805" y="98" class="d-text-sm" text-anchor="middle">2-FF sync</text>
  <text x="805" y="114" class="d-text-sm" text-anchor="middle">6-step sector</text>

  <path d="M144 86 L190 86" class="d-line" marker-end="url(#ar5)"/>
  <path d="M332 86 L378 86" class="d-line" marker-end="url(#ar5)"/>
  <path d="M510 86 L556 86" class="d-line" marker-end="url(#ar5)"/>
  <path d="M698 86 L744 86" class="d-line-accent" marker-end="url(#ar5)"/>

  <text x="440" y="154" class="d-text-sm" text-anchor="middle" fill="#f0883e">Blocker: these lines idle near 5 V but Zynq banks are not 5 V tolerant. 100 Ω of series resistance is not adequate protection on its own.</text>

  <defs><marker id="ar5" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0 1 L7 4 L0 7 z" fill="currentColor" stroke="none" class="d-text"/></marker></defs>
</svg>`;

const SVG_FOCLOOP = `
<svg viewBox="0 0 900 300" role="img" aria-label="FOC control loop from current references through PI loops, inverse Park and duty generation to the inverter and back">
  <rect x="16" y="96" width="86" height="52" rx="5" class="d-box"/>
  <text x="59" y="118" class="d-text-mono" text-anchor="middle">id_ref = 0</text>
  <text x="59" y="136" class="d-text-mono" text-anchor="middle">iq_ref</text>

  <circle cx="140" cy="108" r="14" class="d-box"/><text x="140" y="113" class="d-text" text-anchor="middle">−</text>
  <circle cx="140" cy="150" r="14" class="d-box"/><text x="140" y="155" class="d-text" text-anchor="middle">−</text>

  <rect x="176" y="82" width="88" height="42" rx="5" class="d-box-accent"/>
  <text x="220" y="108" class="d-text-title" text-anchor="middle">PI (d)</text>
  <rect x="176" y="130" width="88" height="42" rx="5" class="d-box-accent"/>
  <text x="220" y="156" class="d-text-title" text-anchor="middle">PI (q)</text>

  <rect x="298" y="96" width="104" height="62" rx="5" class="d-box-accent"/>
  <text x="350" y="122" class="d-text-title" text-anchor="middle">Inverse</text>
  <text x="350" y="140" class="d-text-title" text-anchor="middle">Park</text>

  <rect x="436" y="96" width="112" height="62" rx="5" class="d-box-accent"/>
  <text x="492" y="120" class="d-text-title" text-anchor="middle">Duty gen</text>
  <text x="492" y="140" class="d-text-sm" text-anchor="middle">min/max centring</text>

  <rect x="582" y="88" width="120" height="78" rx="5" class="d-box-ok"/>
  <text x="642" y="112" class="d-text-title" text-anchor="middle">PWM RTL</text>
  <text x="642" y="130" class="d-text-sm" text-anchor="middle">centre-aligned</text>
  <text x="642" y="148" class="d-text-sm" text-anchor="middle">HI/LO + non-overlap</text>

  <rect x="736" y="88" width="146" height="78" rx="5" class="d-box"/>
  <text x="809" y="112" class="d-text-title" text-anchor="middle">Inverter + motor</text>
  <text x="809" y="132" class="d-text-sm" text-anchor="middle">UCC21222 → bridge</text>
  <text x="809" y="150" class="d-text-sm" text-anchor="middle">three phases</text>

  <rect x="436" y="222" width="126" height="52" rx="5" class="d-box-accent"/>
  <text x="499" y="244" class="d-text-title" text-anchor="middle">Park</text>
  <text x="499" y="262" class="d-text-sm" text-anchor="middle">αβ → dq</text>

  <rect x="598" y="222" width="126" height="52" rx="5" class="d-box-accent"/>
  <text x="661" y="244" class="d-text-title" text-anchor="middle">Clarke</text>
  <text x="661" y="262" class="d-text-sm" text-anchor="middle">abc → αβ</text>

  <rect x="756" y="222" width="126" height="52" rx="5" class="d-box-warn"/>
  <text x="819" y="242" class="d-text-title" text-anchor="middle">ADC + scaling</text>
  <text x="819" y="262" class="d-text-sm" text-anchor="middle">route still open</text>

  <rect x="290" y="222" width="120" height="52" rx="5" class="d-box-warn"/>
  <text x="350" y="242" class="d-text-title" text-anchor="middle">θ estimate</text>
  <text x="350" y="262" class="d-text-sm" text-anchor="middle">Hall-assisted</text>

  <path d="M102 122 L124 112" class="d-line" marker-end="url(#ar6)"/>
  <path d="M102 128 L124 146" class="d-line" marker-end="url(#ar6)"/>
  <path d="M154 106 L174 104" class="d-line" marker-end="url(#ar6)"/>
  <path d="M154 152 L174 152" class="d-line" marker-end="url(#ar6)"/>
  <path d="M264 104 L296 118" class="d-line" marker-end="url(#ar6)"/>
  <path d="M264 152 L296 136" class="d-line" marker-end="url(#ar6)"/>
  <path d="M402 127 L434 127" class="d-line-accent" marker-end="url(#ar6)"/>
  <text x="418" y="118" class="d-text-sm" text-anchor="middle">vα vβ</text>
  <path d="M548 127 L580 127" class="d-line-accent" marker-end="url(#ar6)"/>
  <text x="564" y="118" class="d-text-sm" text-anchor="middle">3 duties</text>
  <path d="M702 127 L734 127" class="d-line-accent" marker-end="url(#ar6)"/>
  <text x="718" y="118" class="d-text-sm" text-anchor="middle">6 HI/LO</text>

  <path d="M809 166 L809 220" class="d-line" marker-end="url(#ar6)"/>
  <path d="M754 248 L726 248" class="d-line" marker-end="url(#ar6)"/>
  <path d="M596 248 L566 248" class="d-line" marker-end="url(#ar6)"/>
  <path d="M434 248 L412 248" class="d-line" stroke-dasharray="4 4"/>
  <path d="M436 236 L436 236" class="d-line"/>
  <path d="M350 222 L350 190 L140 190 L140 164" class="d-line" marker-end="url(#ar6)"/>
  <path d="M470 222 L470 190" class="d-line" stroke-dasharray="0"/>
  <text x="470" y="206" class="d-text-sm" text-anchor="middle">id iq measured</text>
  <path d="M470 190 L140 190" class="d-line"/>

  <path d="M350 296 L350 276" class="d-line" marker-end="url(#ar6)"/>
  <text x="350" y="296" class="d-text-sm" text-anchor="middle">from hall_decoder sector</text>

  <defs><marker id="ar6" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0 1 L7 4 L0 7 z" fill="currentColor" stroke="none" class="d-text"/></marker></defs>
</svg>`;

const SVG_PSPL = `
<svg viewBox="0 0 880 330" role="img" aria-label="Zynq processing system and programmable logic split with the AXI register interface between them">
  <rect x="40" y="24" width="380" height="128" rx="8" class="d-box"/>
  <text x="230" y="50" class="d-text-title" text-anchor="middle">Processing System (PS) — ARM Cortex-A9</text>
  <text x="230" y="72" class="d-text-sm" text-anchor="middle">Software. Runs when it runs. No hard timing guarantee.</text>
  <rect x="58" y="86" width="112" height="48" rx="4" class="d-box"/>
  <text x="114" y="106" class="d-text-sm" text-anchor="middle">startup &amp; mode</text>
  <text x="114" y="122" class="d-text-sm" text-anchor="middle">state machine</text>
  <rect x="182" y="86" width="112" height="48" rx="4" class="d-box"/>
  <text x="238" y="106" class="d-text-sm" text-anchor="middle">thresholds</text>
  <text x="238" y="122" class="d-text-sm" text-anchor="middle">calibration</text>
  <rect x="306" y="86" width="98" height="48" rx="4" class="d-box"/>
  <text x="355" y="106" class="d-text-sm" text-anchor="middle">logging</text>
  <text x="355" y="122" class="d-text-sm" text-anchor="middle">comms</text>

  <rect x="40" y="186" width="380" height="128" rx="8" class="d-box-ok"/>
  <text x="230" y="212" class="d-text-title" text-anchor="middle">Programmable Logic (PL) — FPGA fabric</text>
  <text x="230" y="234" class="d-text-sm" text-anchor="middle">Hardware. Every cycle accounted for.</text>
  <rect x="58" y="248" width="112" height="48" rx="4" class="d-box"/>
  <text x="114" y="268" class="d-text-sm" text-anchor="middle">PWM timing</text>
  <text x="114" y="284" class="d-text-sm" text-anchor="middle">HI/LO output</text>
  <rect x="182" y="248" width="112" height="48" rx="4" class="d-box"/>
  <text x="238" y="268" class="d-text-sm" text-anchor="middle">Hall capture</text>
  <text x="238" y="284" class="d-text-sm" text-anchor="middle">monitors</text>
  <rect x="306" y="248" width="98" height="48" rx="4" class="d-box"/>
  <text x="355" y="268" class="d-text-sm" text-anchor="middle">fast inhibit</text>
  <text x="355" y="284" class="d-text-sm" text-anchor="middle">DISABLE</text>

  <rect x="176" y="158" width="108" height="24" rx="4" class="d-box-accent"/>
  <text x="230" y="175" class="d-text-mono" text-anchor="middle">AXI registers</text>
  <path d="M206 152 L206 158" class="d-line"/>
  <path d="M254 182 L254 186" class="d-line"/>

  <rect x="470" y="40" width="380" height="256" rx="8" class="d-box"/>
  <text x="660" y="66" class="d-text-title" text-anchor="middle">The deciding question for each block</text>
  <text x="492" y="98" class="d-text">Does a late answer break something?</text>
  <text x="504" y="126" class="d-text-sm">A PWM edge that arrives 50 µs late produces the</text>
  <text x="504" y="144" class="d-text-sm">wrong voltage on the motor. → PL</text>
  <text x="504" y="172" class="d-text-sm">A log line that arrives 50 ms late is still a fine</text>
  <text x="504" y="190" class="d-text-sm">log line. → PS</text>
  <text x="492" y="222" class="d-text">Rule of thumb used here</text>
  <text x="504" y="248" class="d-text-sm">PL owns anything inside the PWM period.</text>
  <text x="504" y="266" class="d-text-sm">PS owns anything measured in milliseconds</text>
  <text x="504" y="284" class="d-text-sm">or in human decisions.</text>
</svg>`;

const SVG_STRATEGY = `
<svg viewBox="0 0 900 300" role="img" aria-label="Comparison of six-step commutation, Hall-assisted FOC, encoder FOC and sensorless FOC">
  <text x="450" y="24" class="d-text-title" text-anchor="middle">Rotor angle knowledge, left to right</text>

  <rect x="20" y="48" width="200" height="200" rx="8" class="d-box"/>
  <text x="120" y="74" class="d-text-title" text-anchor="middle">Six-step</text>
  <text x="120" y="94" class="d-text-sm" text-anchor="middle">Hall only</text>
  <text x="34" y="122" class="d-text-sm">Angle: 6 sectors, 60°</text>
  <text x="34" y="144" class="d-text-sm">Current: not regulated</text>
  <text x="34" y="166" class="d-text-sm">Torque ripple: high</text>
  <text x="34" y="188" class="d-text-sm">Effort: lowest</text>
  <text x="120" y="222" class="d-text-sm" text-anchor="middle">Not this project</text>

  <rect x="238" y="48" width="200" height="200" rx="8" class="d-box-ok"/>
  <text x="338" y="74" class="d-text-title" text-anchor="middle">Hall-assisted FOC</text>
  <text x="338" y="94" class="d-text-sm" text-anchor="middle">near-term direction</text>
  <text x="252" y="122" class="d-text-sm">Angle: 60° + interpolation</text>
  <text x="252" y="144" class="d-text-sm">Current: fully regulated</text>
  <text x="252" y="166" class="d-text-sm">Torque ripple: moderate</text>
  <text x="252" y="188" class="d-text-sm">Effort: moderate</text>
  <text x="338" y="222" class="d-text-title" text-anchor="middle" fill="#3fb950">Where this project is</text>

  <rect x="456" y="48" width="200" height="200" rx="8" class="d-box"/>
  <text x="556" y="74" class="d-text-title" text-anchor="middle">Encoder / resolver</text>
  <text x="556" y="94" class="d-text-sm" text-anchor="middle">FOC</text>
  <text x="470" y="122" class="d-text-sm">Angle: continuous, precise</text>
  <text x="470" y="144" class="d-text-sm">Current: fully regulated</text>
  <text x="470" y="166" class="d-text-sm">Torque ripple: low</text>
  <text x="470" y="188" class="d-text-sm">Effort: extra hardware</text>
  <text x="556" y="222" class="d-text-sm" text-anchor="middle">Not on this board</text>

  <rect x="674" y="48" width="206" height="200" rx="8" class="d-box-warn"/>
  <text x="777" y="74" class="d-text-title" text-anchor="middle">Sensorless FOC</text>
  <text x="777" y="94" class="d-text-sm" text-anchor="middle">future research</text>
  <text x="688" y="122" class="d-text-sm">Angle: estimated from</text>
  <text x="688" y="140" class="d-text-sm">current and voltage</text>
  <text x="688" y="162" class="d-text-sm">Current: fully regulated</text>
  <text x="688" y="184" class="d-text-sm">Weak at low speed</text>
  <text x="777" y="222" class="d-text-sm" text-anchor="middle" fill="#f0883e">Needs trusted analog first</text>

  <path d="M30 272 L870 272" class="d-line"/>
  <text x="40" y="292" class="d-text-sm">less angle information</text>
  <text x="860" y="292" class="d-text-sm" text-anchor="end">angle inferred, no sensor</text>
</svg>`;

const SVG_HEADER = `
<svg viewBox="0 0 880 320" role="img" aria-label="Shield header map showing which project signal lands on each header position">
  <text x="20" y="26" class="d-text-title">J4 — digital, 10 positions</text>
  ${['SCL (unrouted)', 'SDA (unrouted)', 'AREF (unrouted)', 'GND', 'pin13', 'pin12', 'MCU HI A', 'MCU LO A', 'MCU HI B', 'DISABLE']
    .map((n, i) => {
      const used = !n.includes('unrouted') && n !== 'GND' && !n.startsWith('pin');
      const x = 20 + i * 84;
      return `<rect x="${x}" y="40" width="76" height="46" rx="4" class="${used ? 'd-box-accent' : 'd-box'}"/>
              <text x="${x + 38}" y="60" class="d-text-sm" text-anchor="middle">J4.${i + 1}</text>
              <text x="${x + 38}" y="77" class="${used ? 'd-text-mono' : 'd-text-sm'}" text-anchor="middle" font-size="9.5">${n}</text>`;
    }).join('')}

  <text x="20" y="130" class="d-text-title">J5 — digital, 8 positions</text>
  ${['MCU HALL A', 'MCU LO B', 'MCU HI C', 'MCU HALL B', 'MCU LO C', 'MCU HALL C', 'unrouted', 'unrouted']
    .map((n, i) => {
      const used = n !== 'unrouted';
      const x = 20 + i * 84;
      return `<rect x="${x}" y="144" width="76" height="46" rx="4" class="${used ? 'd-box-accent' : 'd-box'}"/>
              <text x="${x + 38}" y="164" class="d-text-sm" text-anchor="middle">J5.${i + 1}</text>
              <text x="${x + 38}" y="181" class="${used ? 'd-text-mono' : 'd-text-sm'}" text-anchor="middle" font-size="9.5">${n}</text>`;
    }).join('')}

  <text x="20" y="234" class="d-text-title">J3 — analog, 6 positions</text>
  ${['MCU CSENSE A', 'MCU CSENSE B', 'MCU CSENSE C', 'MCU VSENSE A', 'MCU VSENSE Vm', 'MCU MOTOR THERM']
    .map((n, i) => {
      const x = 20 + i * 84;
      return `<rect x="${x}" y="248" width="76" height="46" rx="4" class="d-box-ok"/>
              <text x="${x + 38}" y="268" class="d-text-sm" text-anchor="middle">J3.${i + 1}</text>
              <text x="${x + 38}" y="285" class="d-text-mono" text-anchor="middle" font-size="9">${n}</text>`;
    }).join('')}
  <text x="530" y="240" class="d-text-sm">Header positions are read from the netlist.</text>
  <text x="530" y="256" class="d-text-sm" fill="#d29922">The Arduino D/A names are inferred, not confirmed.</text>
</svg>`;

/* ============================================================== PAGES */
const PAGES = {};

/* ---------------------------------------------------------- 1. OVERVIEW */
PAGES.overview = {
  title: 'Project Overview',
  lede: 'A motor controller where the fast control loop lives in FPGA fabric instead of in software. This page is the fastest way to understand what exists, what is proven, and what is still unknown.',
  html: `
<div class="quicknav">
  <a class="qn-card" href="#/state">
    <span class="qn-k">Start here</span><span class="qn-t">I'm new</span>
    <span class="qn-d">What exists, what is proven, and what is still unknown — in one page.</span></a>
  <a class="qn-card" href="#/signals">
    <span class="qn-k">Hardware</span><span class="qn-t">Signal map</span>
    <span class="qn-d">All 17 nets crossing the connector, filterable by direction and type.</span></a>
  <a class="qn-card" href="#/pcb">
    <span class="qn-k">Hardware</span><span class="qn-t">PCB interface</span>
    <span class="qn-d">Gate drivers, current and voltage sense chains, netlist red flags.</span></a>
  <a class="qn-card" href="#/fpga">
    <span class="qn-k">Hardware</span><span class="qn-t">FPGA / RTL</span>
    <span class="qn-d">Six modules and six testbenches, with interactive waveform models.</span></a>
  <a class="qn-card" href="#/matlab">
    <span class="qn-k">Control</span><span class="qn-t">MATLAB / FOC math</span>
    <span class="qn-d">Fixed point, Clarke and Park, the PI loop, duty generation.</span></a>
  <a class="qn-card" href="#/vivado">
    <span class="qn-k">Toolchain</span><span class="qn-t">Vivado</span>
    <span class="qn-d">Which files to add, and exactly what is missing before a bitstream.</span></a>
  <a class="qn-card" href="#/foc">
    <span class="qn-k">Control</span><span class="qn-t">FOC strategy</span>
    <span class="qn-d">Hall-assisted now, sensorless as future research — and why.</span></a>
  <a class="qn-card" href="#/questions">
    <span class="qn-k">Tracking</span><span class="qn-t">Open blockers</span>
    <span class="qn-d">Every unresolved item, ranked by what it stops you doing.</span></a>
  <a class="qn-card" href="#/links">
    <span class="qn-k">Reference</span><span class="qn-t">Links</span>
    <span class="qn-d">Datasheets, official docs and tutorials, grouped by topic.</span></a>
</div>

<h2 id="what">What this project is</h2>
<p>SURG 2026 is a research project on the cost and energy efficiency of FPGA-based ${g('FOC')} for lightweight motors — Spencer Kogoma. The deliverable is a working three-phase motor controller split across two pieces of hardware:</p>
<ul>
  <li>A <strong>custom high-voltage driver board</strong>, designed in Altium, carrying three isolated gate drivers, isolated current sensing on all three phases, isolated voltage sensing, and a Hall interface. It presents itself to the controller as an Arduino-Uno-style shield header set.</li>
  <li>An <strong>Arty Z7 / Zynq board</strong> as the controller, where the ARM processing system handles supervision and the FPGA fabric handles everything that has to happen on time.</li>
</ul>
${cite('research', 'crosscheck')}

<h2 id="why-fpga">Why an FPGA at all</h2>
<p>A microcontroller can run FOC perfectly well. The argument for fabric is determinism, and it only pays off in specific places.</p>
<p>In an FPGA, a PWM edge happens on the clock cycle you specified. Not "in the interrupt handler, after whatever else was running finished". When the current loop runs at 20 kHz, every control update has 50 µs to complete, and a software system spends part of that budget on jitter it cannot fully control. Fabric spends none.</p>
<p>The second argument is parallelism. Three phase currents can be checked against limits at the same instant rather than in sequence, and a shutdown path can react in a handful of clock cycles without asking a processor for permission.</p>
<p>The honest counter-argument, which this project should be able to answer by the end: an FPGA costs more, takes longer to develop, and burns more static power than a microcontroller. Whether the determinism is worth that is precisely what the research is measuring.</p>
${cite('research')}

${figure('Figure 1', 'End-to-end system, from battery to motor. The driver board is the part covered by the local Altium files.', SVG_SYSTEM)}

<h2 id="role">My role</h2>
<p>I own the FPGA and control-math side:</p>
<ul>
  <li>The RTL that turns control commands into physical driver-input signals and watches the measurements.</li>
  <li>The MATLAB fixed-point work that will eventually become HDL through Simulink and HDL Coder.</li>
  <li>The interface contract between the FPGA and the PCB — which is why parsing the Altium netlist mattered enough to do carefully.</li>
  <li>Turning confirmed board-side mapping into Arty/Zynq ${g('XDC')} constraints.</li>
</ul>
<p>The PCB itself is the hardware team's work. Several findings on the <a href="#/pcb-flags">netlist red flags</a> page are things I flagged back to them.</p>
${cite('known')}

<h2 id="state">Current state</h2>
<p>The single most important thing to understand about this project's status:</p>
${callout('open', '⚠ Nothing has been simulated and nothing has been tested on hardware',
  `<p>Six RTL modules and six matching testbenches exist and are written to be self-checking. <strong>No simulator has ever executed them.</strong> When this was last checked, <code>vivado</code>, <code>xvlog</code>, <code>xelab</code>, <code>iverilog</code> and <code>verilator</code> were all absent from PATH.</p>
   <p>There are no oscilloscope captures, no bring-up logs, no photographs of a powered board. The PCB has not been fabricated. Any statement anywhere that sounds like a test result is either a MATLAB numerical run or a model on this site — both are labelled as such.</p>`)}
${cite('known')}

<h3 id="done">What has been done</h3>
${table(['Area', 'State', 'Evidence'], [
  ['Board netlist extraction', badge('confirmed') + ' Complete', '93 nets, 175 components, 556 pads parsed from <code>ActualDriverBoard.PcbDoc</code>. Parser validated against known-good UCC21222, AMC1300 and AMC1311 pinouts.'],
  ['Controller interface definition', badge('confirmed') + ' Complete', '7 digital outputs, 3 digital inputs, 6 analog inputs identified with header positions.'],
  ['RTL modules', badge('confirmed') + ' Written', 'Six modules covering PWM, Hall, two current monitors, voltage monitor and disable control.'],
  ['Testbenches', badge('confirmed') + ' Written, ' + badge('open') + ' never run', 'Six self-checking benches. No simulator available.'],
  ['MATLAB interface check', badge('confirmed') + ' Run', '<code>board_interface_check_LAST_RUN.txt</code> holds dated output.'],
  ['MATLAB FOC math', badge('confirmed') + ' Written', 'Fixed-point PI, Clarke/Park, duty generation. No saved run artifact for these two scripts.'],
  ['Vivado project', badge('open') + ' Not started', 'Enough files exist to begin behavioural simulation.'],
  ['XDC constraints', badge('open') + ' Blocked', 'Waiting on confirmed board-side pin mapping.'],
  ['Hardware bring-up', badge('open') + ' Not started', 'Board not fabricated. Several blockers outstanding.']
])}

<h3 id="unknown">What is still unknown</h3>
<p>Sixteen open items are tracked in detail on the <a href="#/questions">Open Questions</a> page. The four that block the most downstream work:</p>
<ol>
  <li><strong>Board-side net-to-header mapping.</strong> Until the PCB team confirms it, XDC constraints cannot be written and nothing can be safely connected.</li>
  <li><strong>The ADC route.</strong> Whether the six analog channels reach XADC, an external ADC, or the PS changes the whole current-loop timing budget.</li>
  <li><strong>Bidirectional current representation.</strong> FOC needs signed current. As parsed, the sense chain is ground-referenced at unity gain, so negative current would clip.</li>
  <li><strong>Hall 5 V pull-ups into 3.3 V I/O.</strong> A hardware safety issue that must be resolved before the Hall lines touch the FPGA.</li>
</ol>

<h2 id="model">The control model, stated once</h2>
${callout('confirmed', 'Three duty commands in, six physical signals out',
  `<p>The control math produces three phase duty commands: <code>duty_a</code>, <code>duty_b</code>, <code>duty_c</code>. That has always been the model and it has not changed.</p>
   <p>What changed on 2026-08-05 is the output stage. The updated PCB exposes six independent driver-input pins, so the FPGA expands each duty command into a physical HI/LO pair. The UCC21222 inserts dead time and interlock between two signals you provide — it does not generate the second one for you.</p>
   <p>So: three duty commands is the control architecture. Six PWM lines plus DISABLE is the pin count. Both statements are true at the same time.</p>`)}
${cite('crosscheck', 'known')}
`
};

/* ------------------------------------------------------ 1b. STATE PAGE */
PAGES.state = {
  title: 'Current State & My Role',
  lede: 'A closer look at what is finished, what is in progress, and what the next concrete step is.',
  html: `
<h2 id="ready">Ready to do right now</h2>
<p>These need nothing from anyone else:</p>
<ul>
  <li>Install Vivado and the Digilent board files.</li>
  <li>Create a Vivado project, add the six RTL files as design sources and the six testbenches as simulation sources.</li>
  <li>Run behavioural simulation and find out for the first time whether the modules do what they were written to do.</li>
  <li>Build a separate LED blink project to learn the XDC workflow without risking anything.</li>
</ul>
${cite('known', 'todo')}

<h2 id="blocked">Blocked on other people</h2>
${table(['Task', 'Waiting on', 'Who'], [
  ['Final XDC constraints', 'Board-side net-to-header mapping', 'PCB team'],
  ['Connecting Hall lines', '5 V pull-up resolution', 'PCB team'],
  ['Fixed-point current scaling', 'Shunt value + zero-current voltage + sign convention', 'PCB team'],
  ['Voltage scaling', 'ADC-side path and full-scale', 'PCB team + me'],
  ['Final <code>nonoverlap_ticks</code>', 'Dead-time policy decision', 'Team decision'],
  ['Period constant', 'PWM frequency confirmation', 'Team decision']
])}

<h2 id="next">Next-step checklist for me</h2>
<div class="checklist" id="fpga-checklist"></div>

<h2 id="update">The short version for a meeting</h2>
${callout('info', 'Twenty seconds, no jargon',
  `<p>"I cross-checked our FPGA and MATLAB work against the updated driver board by parsing the actual Altium netlist. Most of our assumptions held up: all three phase currents are measured, voltage sense mirrors current sense, and there's no dedicated fault line — protection is the driver chip plus our disable logic, and I confirmed disable is active-high and fails safe.</p>
   <p>Two corrections: Hall sensors do come in digitally, so we're adding a small Hall decoder, and the board takes six PWM inputs, so our three-phase generator drives complementary pairs. I also flagged board-level issues to the PCB team — op-amp pin mapping and the isolated supply — before this goes to fab.</p>
   <p>Next I need confirmed pin mapping, the ADC path, Hall voltage safety, current-sense offset and the dead-time policy before final XDC and full Vivado integration."</p>`)}
${cite('crosscheck', 'known')}
`
};

/* ------------------------------------------------------ 2. ARCHITECTURE */
PAGES.architecture = {
  title: 'System Architecture',
  lede: 'How the pieces fit: power flow, signal flow, the PS/PL split, and where each tool in the workflow sits.',
  html: `
${figure('Figure 2', 'System block diagram. The driver board sits between the power stage and the controller and is the only board fully described by the local files.', SVG_SYSTEM)}

<h2 id="domains">Two electrical domains</h2>
<p>The driver board is deliberately split into an isolated side and a logic side, and they share no ground.</p>
${table(['', 'Logic side', 'Isolated / motor side'], [
  ['Ground', '<code>GND</code>', '<code>PGND</code>'],
  ['Rails', '12 V in (J1) → <code>3V3</code> (U1 buck), <code>5V</code> (U3 buck)', '<code>12V ISO</code> → <code>5V ISO</code> (U7 buck)'],
  ['What lives here', 'Shield header, Hall pull-ups, OPA4388 diff stages, controller-facing nets', 'Gate driver output stages, AMC input sides, phase connections'],
  ['Crossing method', 'The isolation barrier inside the UCC21222, AMC1300 and AMC1311 packages', 'The only path between the two domains']
])}
${callout('open', 'Blocker: nothing sources 12V ISO',
  `<p>As parsed, no component drives the <code>12V ISO</code> net. The 15 W isolated DC-DC module carries the placeholder designator <code>?</code> and all six of its pads are unrouted. The entire isolated gate-drive side has no power source in the extraction. See <a href="#/questions">Open Questions</a>.</p>`)}
${cite('crosscheck')}

<h2 id="pspl">The PS / PL split</h2>
<p>A ${g('PS')} is a hardened ARM processor. A ${g('PL')} is FPGA fabric. On a Zynq they sit on the same die and talk over ${g('AXI')}. Deciding what goes where is the main architectural choice in this project, and there is a simple test for it.</p>
${figure('Figure 3', 'Which side owns what, and the question that decides it.', SVG_PSPL)}

${widget('pspl', 'PS / PL partition — click any item',
  'Generated explanatory model. The partition reflects the split described in the project notes; the AXI register map that would connect the two sides is not yet defined.')}

<h3 id="pl-side">PL — the fabric side</h3>
<ul>
  <li>Deterministic PWM timing and HI/LO output generation</li>
  <li>Hall capture and sector decode</li>
  <li>Current and voltage limit checking</li>
  <li>Fast inhibit and the DISABLE output</li>
  <li>Sample timing for the measurement path</li>
  <li>Eventually the fixed-point FOC blocks themselves</li>
</ul>
<h3 id="ps-side">PS — the software side</h3>
<ul>
  <li>Startup mode and the overall state machine</li>
  <li>Commands and setpoints</li>
  <li>Threshold values written into fabric registers</li>
  <li>Logging, telemetry and communications</li>
  <li>Recovery policy after a latched trip</li>
</ul>
${callout('assumption', 'This split is coherent but not final',
  `<p>All board signals land on shield pins that are PL-connected on an Arty Z7, so PWM, Hall and DISABLE in fabric with the PS doing supervision over AXI registers is a consistent plan. Nothing in the PCB contradicts it.</p>
   <p>There is no AXI register map yet. It should be defined after the pin map and the ADC route are known, not before.</p>`)}
${cite('known', 'crosscheck')}

<h2 id="tools">Where each tool fits</h2>
${table(['Tool', 'Role in this project', 'State'], [
  ['<strong>Altium</strong>', 'Driver board schematic and layout. Source of truth for the hardware interface.', badge('confirmed') + ' Files parsed'],
  ['<strong>MATLAB</strong>', 'Fixed-point FOC math, Q-format experiments, board-interface consistency checking.', badge('confirmed') + ' Scripts written and partly run'],
  ['<strong>Simulink</strong>', 'Where the PI / Clarke / Park blocks move once the MATLAB math is settled.', badge('open') + ' Not started'],
  ['<strong>HDL Coder</strong>', 'Generates synthesisable Verilog from the fixed-point Simulink model.', badge('open') + ' Not started'],
  ['<strong>Vivado</strong>', 'Simulation, synthesis, XDC constraints, bitstream.', badge('open') + ' Not started'],
  ['<strong>Verilog</strong>', 'Hand-written RTL for the interface and safety layer.', badge('confirmed') + ' Six modules written'],
  ['<strong>Git / GitHub</strong>', 'Version control for RTL, MATLAB and notes.', badge('confirmed') + ' Repo exists'],
  ['<strong>SimpleFOC</strong>', 'Reference implementation only — a known-good design to compare against. Not the architecture being built.', badge('neutral') + ' Reference']
])}

<h3 id="flow">The intended flow</h3>
${figure('Figure 4', 'Tool flow from control math to bitstream. The dashed portion has not been started.', `
<svg viewBox="0 0 880 150" role="img" aria-label="Workflow from MATLAB through Simulink and HDL Coder into Vivado">
  <rect x="16" y="46" width="130" height="58" rx="6" class="d-box-ok"/>
  <text x="81" y="70" class="d-text-title" text-anchor="middle">MATLAB</text>
  <text x="81" y="88" class="d-text-sm" text-anchor="middle">fixed-point math</text>
  <rect x="186" y="46" width="130" height="58" rx="6" class="d-box"/>
  <text x="251" y="70" class="d-text-title" text-anchor="middle">Simulink</text>
  <text x="251" y="88" class="d-text-sm" text-anchor="middle">model the loop</text>
  <rect x="356" y="46" width="130" height="58" rx="6" class="d-box"/>
  <text x="421" y="70" class="d-text-title" text-anchor="middle">HDL Coder</text>
  <text x="421" y="88" class="d-text-sm" text-anchor="middle">generate Verilog</text>
  <rect x="526" y="46" width="150" height="58" rx="6" class="d-box"/>
  <text x="601" y="70" class="d-text-title" text-anchor="middle">Vivado</text>
  <text x="601" y="88" class="d-text-sm" text-anchor="middle">sim · synth · XDC</text>
  <rect x="716" y="46" width="146" height="58" rx="6" class="d-box"/>
  <text x="789" y="70" class="d-text-title" text-anchor="middle">Arty Z7</text>
  <text x="789" y="88" class="d-text-sm" text-anchor="middle">bitstream</text>
  <path d="M146 75 L184 75" class="d-line-accent" marker-end="url(#ar7)"/>
  <path d="M316 75 L354 75" class="d-line" stroke-dasharray="4 4" marker-end="url(#ar7)"/>
  <path d="M486 75 L524 75" class="d-line" stroke-dasharray="4 4" marker-end="url(#ar7)"/>
  <path d="M676 75 L714 75" class="d-line" stroke-dasharray="4 4" marker-end="url(#ar7)"/>
  <text x="440" y="130" class="d-text-sm" text-anchor="middle">Hand-written Verilog for the interface and safety layer joins at the Vivado stage.</text>
  <defs><marker id="ar7" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0 1 L7 4 L0 7 z" fill="currentColor" stroke="none" class="d-text"/></marker></defs>
</svg>`)}
`
};

/* ------------------------------------------------------------- 3. PCB */
PAGES.pcb = {
  title: 'PCB Interface',
  lede: 'The complete controller-facing signal map, read from the parsed Altium netlist rather than from label guessing.',
  html: `
<h2 id="how">How this was extracted</h2>
<p>The Altium files are binary, but the <code>PcbDoc</code> net list, component list and pad-to-net assignments parse cleanly. The connectivity below is read from the actual PCB netlist.</p>
${table(['File', 'What came out'], [
  ['<code>ActualDriverBoard.PcbDoc</code>', '93 nets · 175 components · 556 pads'],
  ['<code>DriverBoard.SchDoc</code>', '183 schematic parts · 78 net labels'],
  ['<code>HV Motor Driver.BomDoc</code>', 'LiveBOM part choices']
])}
${callout('confirmed', 'The parser was validated before its output was trusted',
  `<p>UCC21222, AMC1300 and AMC1311 all land on their datasheet supply and ground pins exactly. That cross-check is what makes the rest of the extraction credible.</p>
   <p>Two limits worth stating plainly: anything depending on <strong>symbol graphics</strong> or on <strong>copper-level visual inspection</strong> is not covered, and chip behaviour such as DIS polarity and dead time comes from TI datasheets rather than from the board files. Netlist extraction is not a substitute for visual DRC or layout review.</p>`)}
${cite('crosscheck', 'pcbdoc', 'schdoc', 'bomdoc')}

<h2 id="map">Controller signal map</h2>
<p>The controller interface is an Arduino-Uno-style shield header set: J2 power, J3 analog (6-pin), J4 digital (10-pin), J5 digital (8-pin).</p>
${figure('Figure 5', 'Every header position and what lands on it. Header numbers are confirmed; the Arduino D/A names are inferred.', SVG_HEADER)}

<div id="signal-table"></div>

<h3 id="unrouted">Unrouted and unconnected positions</h3>
<ul>${UNROUTED.map(u => `<li>${u}</li>`).join('')}</ul>
${cite('crosscheck')}

<h2 id="budget">I/O budget</h2>
${table(['Class', 'Count', 'Signals'], [
  ['Digital out', '<strong>7</strong>', 'Six PWM (HI/LO × A/B/C) plus DISABLE'],
  ['Digital in', '<strong>3</strong>', 'MCU HALL A / B / C'],
  ['Analog in', '<strong>6</strong>', 'CSENSE A/B/C, VSENSE A, VSENSE Vm, MOTOR THERM']
])}
${callout('confirmed', 'Corrected on 2026-08-05: seven digital outputs, not four',
  `<p>An earlier assumption held that the gate driver generated the complementary output, which would have meant three PWM lines plus an enable. The netlist shows six independent driver inputs. The FPGA output count is seven.</p>`)}
${cite('lastrun', 'crosscheck')}

<h2 id="power">Power architecture</h2>
${table(['Rail', 'Source', 'Notes'], [
  ['12 V in', 'J1 — Molex 39-30-1021, 2 position', 'The board self-powers from here'],
  ['<code>3V3</code>', 'U1 buck', 'Logic side'],
  ['<code>5V</code>', 'U3 buck', 'Logic side. Feeds the Hall pull-ups.'],
  ['<code>12V ISO</code>', badge('danger') + ' nothing drives it', 'Isolated module unrouted, designator <code>?</code>'],
  ['<code>5V ISO</code>', 'U7 buck from <code>12V ISO</code>', 'Isolated side'],
  ['Shield VIN (J2.8)', '12 V from the board', 'Deliberate? See open questions.'],
  ['Shield 5V / 3V3 / IOREF / RESET', 'Unconnected', 'The board does not draw from or drive the shield rails']
])}
<p>Gate-driver output stages run on <code>12V ISO</code>, with ${g('bootstrap')}-style diode feeds (ER2D + 1.5 Ω) supplying the high-side <code>VDDA</code>.</p>
${cite('crosscheck')}

<h2 id="absent">What is deliberately absent</h2>
${callout('confirmed', 'No nOC and no FAULT net exists on this board',
  `<p>Zero nets, zero pads, zero schematic labels. The protection story is: UCC21222 internal interlock and dead time, plus DIS, plus whatever the controller decides from CSENSE and VSENSE.</p>
   <p>This is why the old <code>fault_manager.v</code> was removed rather than kept. Do not add protection RTL that depends on a status signal until a real routed signal is confirmed.</p>
   <p>Note that the July 29 and August 3 notes mention <code>nOC</code> / <code>FAULT</code> — those describe the <em>old</em> board and are superseded.</p>`)}
${cite('crosscheck', 'review')}
`
};

PAGES['pcb-chips'] = {
  title: 'Chip Roles & Signal Paths',
  lede: 'What each part on the driver board does, and the four signal chains that matter to the FPGA.',
  html: `
<h2 id="roles">The four part families</h2>
${table(['Part', 'Designators', 'Role', 'Datasheet'], [
  ['<strong>UCC21222</strong>', 'U5 / U9 / U13', 'Isolated dual-channel gate driver with a disable pin. One per phase, driving the high-side and low-side switches. Provides input interlock and resistor-programmed dead time.', `<a href="${SRC.ds_ucc.url}" target="_blank" rel="noopener">TI</a>`],
  ['<strong>AMC1300</strong>', 'U2 / U4 / U6', 'Isolated amplifier for phase-current sensing. Fixed gain 8.2, ±250 mV input range. Measures across the shunt on the power board.', `<a href="${SRC.ds_amc1300.url}" target="_blank" rel="noopener">TI</a>`],
  ['<strong>AMC1311</strong>', 'U11 / U14', 'Isolated amplifier for precision voltage sensing, 2 V input range. One for phase A, one for the Vm bus.', `<a href="${SRC.ds_amc1311.url}" target="_blank" rel="noopener">TI</a>`],
  ['<strong>OPA4388</strong>', 'U10 / U12', 'Quad precision op-amp. Forms the unity-gain differential stages that convert the isolated amplifier outputs into single-ended controller signals.', `<a href="${SRC.ds_opa.url}" target="_blank" rel="noopener">TI</a>`]
])}

<h2 id="gate">Gate drive path</h2>
${figure('Figure 6', 'From an FPGA pin to a motor phase.', SVG_GATE)}
<p>Each of the six PWM lines passes through a 49.9 Ω / 33 pF RC filter — labelled "LOW PASSES FOR MCU PWM" on the schematic — into the UCC21222. HI goes to <code>INA</code> and LO goes to <code>INB</code>.</p>
${callout('confirmed', 'The critical structural fact',
  `<p><code>INB</code> is an <strong>independent input</strong>. There is no on-board inverter and no complementary-generation logic. The UCC21222 adds dead time and interlock between the two signals you give it; it does not create the second signal.</p>
   <p>The dead-time value is set by R28 / R36 / R61 to ground. The schematic comment on all three is literally "Configurable" — the value is not final. That is why the <a href="#/questions">dead-time policy</a> is still an open question.</p>`)}
${cite('crosscheck', 'ds_ucc')}

<h2 id="disable-path">DISABLE path</h2>
<p><code>DISABLE</code> arrives at J4.10, goes to the <code>DIS</code> pin (pin 5) of all three UCC21222 devices, and also reaches test point TP5. <strong>There is no pull resistor anywhere on the net.</strong></p>
<p>Per the UCC21222 datasheet, DIS disables both driver outputs when driven high, enables them when set low, and is <em>internally pulled high if left floating</em>. Three consequences:</p>
<ul>
  <li>Drive <strong>low to run</strong>, high to kill.</li>
  <li>An unconfigured FPGA, with its pins floating, leaves the gate drivers <strong>disabled</strong>. That is the safe direction and it happens for free.</li>
  <li>The safe state depends entirely on the driver's internal pull-up, since the board adds none.</li>
</ul>
<p>The <code>DISABLE_ACTIVE_LEVEL = 1'b1</code> default in <code>pcb_disable_control.v</code> is therefore correct.</p>
${cite('crosscheck', 'ds_ucc', 'rtlDis')}

<h2 id="current">Current sense path</h2>
${figure('Figure 7', 'All three phases are measured. The shunts are not on this board.', SVG_CURRENT)}
<p>H1 / H2 / H3 are 6-pin headers to the power board, wired 1 = GATE HI x, 2 = PHASE x+, 3 = PHASE x−, 4 and 6 = PGND, 5 = GATE LO x. The AMC1300 measures PHASE x+ against PHASE x− through a series resistor and 10 nF — which places the ${g('shunt')} on the <em>power board</em>, between those two nodes.</p>
<p>The AMC1300 outputs (<code>CSENSE x±</code>) then pass through a four-resistor 3.3 kΩ unity-gain differential stage on the OPA4388 (U10) to reach <code>MCU CSENSE A/B/C</code>.</p>
<h3 id="scaling">Scaling, as far as it can be closed</h3>
${cb('current scaling chain', 'text', `
V_shunt   = I_phase × R_shunt        R_shunt is UNKNOWN (power board)
V_amc_out = V_shunt × 8.2            AMC1300 fixed gain, datasheet
V_mcu     = V_amc_out × 1.0          OPA4388 diff stage, all 3.3k = unity

  => MCU CSENSE ≈ 8.2 × V_shunt

Everything except R_shunt is known. That single missing value is why
cfg.current.sensitivity_V_per_A is correctly left as NaN.`)}
${callout('open', 'Two unresolved problems in this chain',
  `<ol><li><strong>The shunt value is not on this board.</strong> Without it the amps-to-volts conversion cannot be closed.</li>
   <li><strong>The diff stage references GND at unity gain</strong> (R38 / R45 / R60 to GND). Negative phase current therefore maps below 0 V and would clip. FOC needs bidirectional current, so something has to provide an offset — and nothing visible in the netlist does.</li></ol>`)}
${cite('crosscheck', 'ds_amc1300', 'cfg')}

<h2 id="voltage">Voltage sense path</h2>
${figure('Figure 8', 'Voltage sense mirrors the current-sense architecture, on two channels.', SVG_VOLTAGE)}
${table(['Channel', 'Source', 'Divider', 'Isolator', 'Lands on'], [
  ['<code>VSENSE A</code>', 'PHASE A−', '750 kΩ + 750 kΩ over 20 kΩ (ERA-6AEB754V / ERA-6AEB203V)', 'AMC1311 U11 → OPA4388 U12', 'J3.4'],
  ['<code>VSENSE Vm</code>', 'Vm connector pin 1 (pin 3 = PGND)', 'Identical divider', 'AMC1311 U14 → OPA4388 U12', 'J3.5']
])}
<p>The divider ratio is 20 / 1520 ≈ <strong>1 : 76</strong>. A 96 V input gives about 1.26 V at the AMC1311, comfortably inside its 0–2 V range.</p>
${callout('open', 'A number that does not quite line up',
  `<p>A schematic note reads "96V to 1V65", but 96 V × 1/76 ≈ 1.26 V. One of the two is not the intended scaling. Worth resolving alongside the maximum-Vm question.</p>`)}
${cite('crosscheck', 'ds_amc1311', 'lastrun')}

<h2 id="hall-path">Hall path</h2>
${figure('Figure 9', 'Hall sensors arrive digitally. The pull-up rail is the problem.', SVG_HALL)}
<p>CC1 is a Molex Microfit 2×3 connector: 1 = HALL C, 2 = HALL B, 3 = HALL A, 4 = GND, 5 = 5V, 6 = MCU MOTOR THERM. Each Hall line gets a 10 kΩ pull-up to <strong>5 V</strong>, then 100 Ω series and 100 nF to ground — the "LOW PASSES FOR MCU HALL" network — before reaching J5.</p>
<p>This is what justified adding <code>hall_decoder.v</code> to the required RTL set. It also created a hardware blocker: see the <a href="#/questions">Hall 5 V question</a>.</p>
${cite('crosscheck')}

<h2 id="therm">Motor thermistor</h2>
<p><code>MCU MOTOR THERM</code> comes from CC1.6 with a 499 Ω pull-up to <code>3V3</code>, landing on J3.6. It is a sixth analog channel that appeared in <strong>no earlier FPGA or MATLAB document</strong> — it was found during the netlist extraction. Converting its voltage into a temperature needs the thermistor part and curve, which are not in the driver-board files.</p>
${cite('crosscheck')}
`
};

PAGES['pcb-flags'] = {
  title: 'Netlist Red Flags',
  lede: 'Six findings from the parsed netlist that need someone to open Altium and look before the board is fabricated. These are the highest-value items in the files.',
  html: `
${callout('info', 'How to read this page',
  `<p>Everything here comes from the parsed netlist. None of it has been visually confirmed in Altium, and netlist extraction is not a substitute for visual DRC or layout review. Each item is written as something to check, not as a proven defect.</p>`)}

<h2 id="f1">1. OPA4388 supply pins appear reversed</h2>
${badge('danger')} <strong>Fabrication blocker if real</strong>
<p>On both U10 and U12 the netlist puts <code>GND</code> on pin 4 and <code>3V3</code> on pin 11. The TI datasheet for the SOIC-14 OPA4388 has <strong>pin 4 = V+</strong> and <strong>pin 11 = V−</strong>.</p>
<p>The feedback networks also land on what the datasheet calls the <em>non-inverting</em> pins (R31 output → pin 3, R41 → pin 5, and so on). Everything is consistent with the custom schematic symbol carrying a mirrored pin-number map — roughly 2↔3, 4↔11, 5↔6, 9↔10.</p>
${callout('danger', 'Why this matters',
  `<p>If the symbol is wrong, a fabricated board would have both quad op-amps powered backwards, and there would be <strong>no working current or voltage sense at all</strong>. If the remap is intentional and correct somewhere else in the design, that is fine — but it has to be checked against the datasheet before fab.</p>
   <p>The project notes record that this is already known to the team and that Angelina said she will fix it.</p>`)}
${cite('crosscheck', 'known', 'ds_opa')}

<h2 id="f2">2. Nothing sources 12V ISO</h2>
${badge('danger')} <strong>Fabrication blocker</strong>
<p>The 15 W isolated DC-DC module — the component with designator <code>?</code>, THL15-style footprint — has all six pads unrouted, and no other component drives the <code>12V ISO</code> net. As parsed, the entire isolated gate-drive side has no power source.</p>
<p>Related loose ends in the same area: pin 2 of the 3-pin Vm connector (<code>H??</code>) is unrouted, and the designators <code>?</code>, <code>H??</code> and <code>U?</code> are unassigned.</p>
${cite('crosscheck')}

<h2 id="f3">3. Current-sense outputs are ground-referenced at unity gain</h2>
${badge('danger')} <strong>Blocks FOC</strong>
<p>The OPA4388 differential stage references to GND (R38 / R45 / R60 to GND) with unity gain. Negative phase current therefore maps below 0 V and would clip before reaching the ADC.</p>
<p>FOC fundamentally requires bidirectional current measurement — the whole point of regulating <code>i_q</code> is that it goes both positive and negative. Something must provide a mid-rail offset, a differential ADC mode, or an equivalent, and nothing visible in the netlist does.</p>
${cite('crosscheck')}

<h2 id="f4">4. 5 V Hall levels into 3.3 V shield pins</h2>
${badge('danger')} <strong>Hardware safety</strong>
<p>Hall pull-ups go to 5 V. Zynq banks are not 5 V tolerant. The 100 Ω series resistor limits current into the input clamp diode but leaves the pin above its absolute maximum rating — it is not adequate protection on its own.</p>
<p>The cleanest fix is to move the pull-ups to <code>3V3</code>. The 5 V supply feeding the Hall connector itself can stay, since many Hall sensors want it.</p>
${cite('crosscheck')}

<h2 id="f5">5. Six resistors carry a capacitor part number</h2>
${badge('open')} <strong>BOM correctness</strong>
<p>R6, R11, R23, R24, R26 and R27 — the AMC input series resistors — carry the comment <code>CL21B103KBANNNC</code>, which is a 10 nF capacitor MPN. The schematic itself contains the note "SPEC THESE RESISTORS RIGHT", which is presumably about exactly this.</p>
${cite('crosscheck')}

<h2 id="f6">6. Inconsistent buck-module part numbers</h2>
${badge('open')} <strong>BOM correctness</strong>
${table(['Designator', 'Part number in the files'], [
  ['U1', '<code>TPSM33610S3QRDNRQ1</code>'],
  ['U3', '<code>TPSM33620S5QRDNRQ1</code>'],
  ['U7', '<code>PSM33620S5QRDNRQ1</code>'],
  ['<code>U?</code> (unplaced)', '<code>PSM33620S3QRDNRQ1</code>']
])}
<p>Earlier notes referred to "PSM33610S3" as if there were a single part. Note the <code>TPSM</code> versus <code>PSM</code> prefix difference across positions.</p>
${cite('crosscheck')}

<h2 id="ask">The message to send the PCB team</h2>
${collapse('Ten questions, ready to paste', 'copy-friendly', `
${cb('questions for the PCB team', 'text', `
1. The netlist shows GND on OPA4388 pin 4 and 3V3 on pin 11 (datasheet says
   4 = V+, 11 = V-), on both U10 and U12. Can you open the OPA4388 symbol and
   check its pin numbering against the datasheet? If the symbol is mirrored,
   current/voltage sense will not function on the fabricated board.

2. The 15 W isolated module (designator "?") is fully unrouted and nothing else
   sources 12V ISO. What powers the gate-drive side, and can the module get a
   real designator and connections?

3. The current-sense diff amps reference to GND with gain 1 - how is negative
   phase current supposed to be read? (Mid-rail offset? Differential ADC?)

4. Hall pull-ups go to 5V but the Zynq shield pins are 3.3 V and not 5 V
   tolerant - can the pull-ups move to 3V3? (The Hall connector 5V can stay.)

5. What are the intended values for the "Configurable" dead-time resistors
   R28/R36/R61 - and do you want the FPGA to insert dead time as well, or rely
   on the driver DT?

6. R6/R11/R23/R24/R26/R27 carry a capacitor MPN (CL21B103KBANNNC) - what are
   the real AMC input resistor values? (The "SPEC THESE RESISTORS RIGHT" note.)

7. Confirm the shield pin map. My reading: DISABLE=D8, HI B=D9, LO A=D10,
   HI A=D11, LO C=D3, HI C=D5, LO B=D6, HALL on D2/D4/D7, analog A0-A5 =
   CSENSE A/B/C, VSENSE A, VSENSE Vm, THERM.

8. What is the shunt value on the power board (for end-to-end current scaling)?

9. The Vm divider gives ~1:76 - what is the maximum Vm the design should
   survive? (The "96V to 1V65" schematic note does not quite match
   96 V x 1/76 = 1.26 V.)

10. Is 12 V on the shield VIN pin (J2.8) intentional when the Arty is also
    USB-powered?`)}`)}
${cite('crosscheck')}
`
};

/* ------------------------------------------------------------ 4. FPGA */
PAGES.fpga = {
  title: 'FPGA / RTL',
  lede: 'Six Verilog modules covering the control interface and safety layer. This is bring-up and interface logic, not the FOC datapath itself — that comes later through HDL Coder.',
  html: `
${callout('open', 'None of this has been simulated',
  `<p>All six modules and all six testbenches are written. No simulator has run them. When last checked, <code>vivado</code>, <code>xvlog</code>, <code>xelab</code>, <code>iverilog</code> and <code>verilator</code> were all absent from PATH.</p>
   <p>Everything on this page is derived from reading the source. The interactive models reimplement the described behaviour in JavaScript so you can explore it — they are explanatory tools, not simulator output.</p>`)}
${cite('known')}

<h2 id="overview">Module overview</h2>
<div id="rtl-table"></div>

${figure('Figure 10', 'How the modules relate. Only the PWM generator and the Hall decoder are clocked sequential logic; the three monitors are pure combinational checks.', `
<svg viewBox="0 0 880 330" role="img" aria-label="RTL module relationships">
  <rect x="20" y="24" width="180" height="56" rx="6" class="d-box"/>
  <text x="110" y="46" class="d-text-title" text-anchor="middle">PS / control layer</text>
  <text x="110" y="66" class="d-text-sm" text-anchor="middle">duty, enable, thresholds</text>

  <rect x="20" y="120" width="220" height="90" rx="6" class="d-box-ok"/>
  <text x="130" y="144" class="d-text-title" text-anchor="middle">pwm_3phase_center_aligned</text>
  <text x="130" y="164" class="d-text-sm" text-anchor="middle">sequential · shadowed config</text>
  <text x="130" y="182" class="d-text-mono" text-anchor="middle">3 duties → 6 HI/LO</text>
  <text x="130" y="200" class="d-text-sm" text-anchor="middle">+ peak / cycle strobes</text>

  <rect x="330" y="120" width="200" height="90" rx="6" class="d-box-accent"/>
  <text x="430" y="144" class="d-text-title" text-anchor="middle">pcb_disable_control</text>
  <text x="430" y="164" class="d-text-sm" text-anchor="middle">sequential · latching</text>
  <text x="430" y="182" class="d-text-mono" text-anchor="middle">pwm_enable, disable_cmd</text>
  <text x="430" y="200" class="d-text-sm" text-anchor="middle">status_code</text>

  <rect x="620" y="24" width="240" height="52" rx="6" class="d-box"/>
  <text x="740" y="46" class="d-text-title" text-anchor="middle">phase_current_limit_monitor</text>
  <text x="740" y="65" class="d-text-sm" text-anchor="middle">combinational · per-phase magnitude</text>

  <rect x="620" y="88" width="240" height="52" rx="6" class="d-box"/>
  <text x="740" y="110" class="d-text-title" text-anchor="middle">phase_current_balance_monitor</text>
  <text x="740" y="129" class="d-text-sm" text-anchor="middle">combinational · ia+ib+ic</text>

  <rect x="620" y="152" width="240" height="52" rx="6" class="d-box"/>
  <text x="740" y="174" class="d-text-title" text-anchor="middle">voltage_sense_monitor</text>
  <text x="740" y="193" class="d-text-sm" text-anchor="middle">combinational · window check</text>

  <rect x="330" y="252" width="200" height="56" rx="6" class="d-box-ok"/>
  <text x="430" y="276" class="d-text-title" text-anchor="middle">hall_decoder</text>
  <text x="430" y="295" class="d-text-sm" text-anchor="middle">sequential · 2-FF sync + sector</text>

  <rect x="20" y="252" width="200" height="56" rx="6" class="d-box-warn"/>
  <text x="120" y="276" class="d-text-title" text-anchor="middle">Board pins</text>
  <text x="120" y="295" class="d-text-sm" text-anchor="middle">6 PWM · DISABLE · 3 Hall</text>

  <path d="M110 80 L110 118" class="d-line" marker-end="url(#ar8)"/>
  <path d="M240 165 L328 165" class="d-line" stroke-dasharray="4 4"/>
  <text x="284" y="158" class="d-text-sm" text-anchor="middle">pwm_inhibit</text>
  <path d="M328 172 L242 172" class="d-line-accent" marker-end="url(#ar8)"/>
  <path d="M618 50 L534 152" class="d-line" marker-end="url(#ar8)"/>
  <path d="M618 114 L534 160" class="d-line" marker-end="url(#ar8)"/>
  <path d="M618 178 L534 172" class="d-line" marker-end="url(#ar8)"/>
  <path d="M430 210 L430 250" class="d-line" stroke-dasharray="4 4"/>
  <path d="M130 210 L120 250" class="d-line-accent" marker-end="url(#ar8)"/>
  <path d="M400 250 L230 285" class="d-line" marker-end="url(#ar8)"/>
  <defs><marker id="ar8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <path d="M0 1 L7 4 L0 7 z" fill="currentColor" stroke="none" class="d-text"/></marker></defs>
</svg>`)}

<h2 id="detail">Module reference</h2>
<div id="rtl-detail"></div>

<h2 id="missing">What is not written yet</h2>
${table(['Missing piece', 'Why it matters', 'Blocked by'], [
  ['Top-level wrapper', 'Nothing currently ties the six modules together into a synthesisable top.', 'Nothing — this can be written now'],
  ['AXI register interface', 'The PS has no way to write duty, enable, mode or thresholds, or to read status.', 'Pin map and ADC route should be settled first'],
  ['ADC interface logic', 'Nothing acquires the six analog channels.', 'ADC route decision'],
  ['Sample-strobe timing', '<code>pwm_peak_strobe</code> exists but is a provisional marker, not a finalised ADC trigger.', 'ADC route decision'],
  ['FOC datapath', 'Clarke, Park, inverse Park and the PI loops are still MATLAB only.', 'Simulink + HDL Coder work'],
  ['Angle estimation', 'Hall gives 60° sectors; FOC wants a continuous angle.', 'Motor commissioning']
])}
${cite('known', 'todo')}
`
};

PAGES['fpga-pwm'] = {
  title: 'PWM Generator',
  lede: 'pwm_3phase_center_aligned.v — the module that turns three duty commands into six physical driver-input signals.',
  html: `
<h2 id="idea">The core idea</h2>
<p>A counter ramps up to <code>period</code> and back down to zero. Each phase output switches when the counter crosses that phase's duty value. Because the counter is symmetric, each pulse ends up centred in its period — which is what ${g('centre-aligned')} means, and why there is a clean point at the counter peak to sample current away from the switching edges.</p>

<h3 id="equations">The output equations</h3>
${cb('fpga/rtl/pwm_3phase_center_aligned.v', 'verilog', `
wire active = enable && !pwm_inhibit && !configuration_error;

wire hi_a_next = active && ((counter_ext + nonoverlap_ext) <  duty_a_ext);
wire lo_a_next = active && ( counter_ext                   > (duty_a_ext + nonoverlap_ext));`)}
<p>Read them together and the non-overlap window falls out. HI turns off at <code>duty − nonoverlap</code>. LO turns on at <code>duty + nonoverlap</code>. Between those two points neither side is on.</p>
${callout('confirmed', 'The window is symmetric, so the both-off time is 2 × nonoverlap_ticks',
  `<p>This is easy to get wrong when sizing dead time. At a 100 MHz fabric clock, <code>nonoverlap_ticks = 20</code> gives 40 clock cycles of both-off per crossing, which is <strong>400 ns</strong>, not 200 ns.</p>`)}

${widget('pwm', 'Centre-aligned PWM with non-overlap',
  'JavaScript reimplementation of the output equations above. Not simulator output.')}

<h2 id="threephase">All three phases together</h2>
<p>The three duties are independent, but they are loaded together. Watch how the six outputs relate across one full counter cycle.</p>
${widget('pwm3', 'Six outputs from three duty commands',
  'The dashed markers show where cycle_strobe and pwm_peak_strobe fire.')}

<h2 id="shadow">Shadowed configuration — why updates are atomic</h2>
<p>Every clock, the module copies its inputs into shadow registers. The shadows are only promoted into the active registers at a cycle boundary:</p>
${cb('fpga/rtl/pwm_3phase_center_aligned.v', 'verilog', `
end else if (counter == {COUNTER_WIDTH{1'b0}}) begin
    count_up     <= 1'b1;
    counter      <= 1;
    cycle_strobe <= 1'b1;
    period_active     <= period_shadow;
    nonoverlap_active <= nonoverlap_shadow;
    duty_a_active     <= duty_a_shadow;
    duty_b_active     <= duty_b_shadow;
    duty_c_active     <= duty_c_shadow;
    configuration_error <= !shadow_config_valid;
end`)}
<p>All three duties change on the same clock cycle. Without this, a control update landing mid-period could apply the new <code>duty_a</code> against the old <code>duty_b</code> and <code>duty_c</code> — producing a voltage vector that was never commanded. On a motor that shows up as a torque glitch once per update.</p>

<h2 id="validity">Configuration validity</h2>
${cb('fpga/rtl/pwm_3phase_center_aligned.v', 'verilog', `
wire shadow_config_valid = (period_shadow != 0) &&
    (nonoverlap_shadow < period_shadow) &&
    (two_nonoverlap_shadow_ext < period_shadow_ext) &&
    (duty_a_shadow <= period_shadow) &&
    (duty_b_shadow <= period_shadow) &&
    (duty_c_shadow <= period_shadow);`)}
<p>Four things are checked: a non-zero period, a non-overlap smaller than the period, a <em>doubled</em> non-overlap that still fits inside the period, and every duty within the period. The comparisons use width-extended values so the doubling cannot wrap around.</p>
<p><code>configuration_error</code> feeds directly into <code>active</code>, so an invalid configuration cannot produce switching. On reset the error bit is <strong>set</strong>, meaning the module refuses to switch until it has been configured at least once.</p>

<h2 id="freq">Frequency and resolution</h2>
<p>One full PWM period is <code>2 × period</code> clock ticks, because the counter goes up and comes back down.</p>
${cb('period calculation', 'text', `
f_pwm = f_clk / (2 x period)

At the project's working numbers:
  f_clk  = 100 MHz
  f_pwm  = 20 kHz
  period = 100e6 / (2 x 20e3) = 2500 counts     <- exact, no rounding error

Duty resolution = 2500 steps, about 11.3 bits.`)}
${widget('pwmfreq', 'PWM frequency and resolution calculator',
  'Explores the arithmetic above. The 100 MHz fabric clock is a placeholder until the real PL clock is confirmed in Vivado.')}
${cite('rtlPwm', 'lastrun')}

<h2 id="deadtime">The dead-time question</h2>
${callout('open', 'Two mechanisms, one policy decision',
  `<p>This module inserts its own non-overlap window. The UCC21222 <em>also</em> has a resistor-programmed dead time on its DT pin. Both can be active at once.</p>
   <ul><li><strong>Both stacking</strong> is the safe default — total dead time is the sum, and no single failure removes it. The cost is modulation range and a small distortion at low duty.</li>
   <li><strong>Driver only</strong> gives cleaner range, but the DT resistors are marked "Configurable" in the schematic, so the value is not final and cannot yet be trusted.</li></ul>
   <p>Until the policy is decided, FPGA-side non-overlap is the safer default and <code>nonoverlap_ticks</code> stays a parameter rather than a fixed constant.</p>`)}
${cite('crosscheck', 'ds_ucc')}
`
};

PAGES['fpga-hall'] = {
  title: 'Hall Decoder',
  lede: 'hall_decoder.v — synchronises three Hall inputs, decodes a six-step sector, and counts what goes wrong.',
  html: `
<h2 id="why">Why this module exists at all</h2>
<p>Until the August 5 netlist extraction, Hall was listed as "not confirmed" and this module was not in the required set. The extraction showed <code>MCU HALL A/B/C</code> as real digital inputs on J5, so the decoder moved from optional to required.</p>
${cite('crosscheck')}

<h2 id="sync">Synchronising first</h2>
${cb('fpga/rtl/hall_decoder.v', 'verilog', `
wire [2:0] hall_raw = {hall_a, hall_b, hall_c};
...
hall_sync_0 <= hall_raw;      // stage 1
hall_sync_1 <= hall_sync_0;   // stage 2 - everything downstream uses this`)}
<p>Hall inputs are asynchronous to the fabric clock — the rotor does not know about your clock domain. Sampling them directly into logic risks metastability. Two flip-flop stages give the first one time to resolve before anything acts on the value.</p>
<p>There is no additional debounce in RTL. The board supplies a 100 Ω / 100 nF RC filter on each line, giving roughly a 10 µs time constant.</p>

<h2 id="decode">The decode table</h2>
${cb('fpga/rtl/hall_decoder.v', 'verilog', `
case (hall)                        // hall = {hall_a, hall_b, hall_c}
    3'b001: decode_sector = 3'd0;
    3'b101: decode_sector = 3'd1;
    3'b100: decode_sector = 3'd2;
    3'b110: decode_sector = 3'd3;
    3'b010: decode_sector = 3'd4;
    3'b011: decode_sector = 3'd5;
    default: decode_sector = 3'd7;   // 000 and 111 are illegal
endcase`)}
<p>Three sensors give eight codes. Six are valid and correspond to 60° windows of rotor electrical position. The two remaining codes — all-low and all-high — cannot occur with correctly wired working sensors, so they indicate a broken sensor, a disconnected cable or a supply problem.</p>

${widget('hall', 'Hall sector decoder',
  'Sweep the rotor angle to see the code and sector change, or force an illegal code. JavaScript model of the decode table above.')}

${callout('assumption', 'The sector ordering is a placeholder',
  `<p>Which physical rotor position corresponds to which Hall code depends on how the sensors were installed in the specific motor. The mapping in the RTL is a reasonable default, not a measured fact.</p>
   <p>It has to be found during motor commissioning — spin the motor slowly and record the code sequence. SimpleFOC's <a href="https://docs.simplefoc.com/alignment_procedure" target="_blank" rel="noopener">alignment procedure</a> describes the same job for a comparable setup.</p>`)}
${cite('known')}

<h2 id="direction">Direction and error tracking</h2>
<p>Direction is only updated when the new sector is <em>adjacent</em> to the previous one in the forward or reverse ring:</p>
${cb('fpga/rtl/hall_decoder.v', 'verilog', `
if (is_forward_step(last_sector, decode_sector(hall_sync_1))) begin
    direction_forward <= 1'b1;
end else if (is_reverse_step(last_sector, decode_sector(hall_sync_1))) begin
    direction_forward <= 1'b0;
end else begin
    bad_transition       <= 1'b1;
    bad_transition_count <= bad_transition_count + 32'd1;
end`)}
<p>A jump from sector 0 straight to sector 3 is physically impossible at any sane speed, so it means a missed reading or a noisy line rather than a real direction change. Counting these separately gives a diagnostic that distinguishes "the motor reversed" from "the Hall wiring is unreliable".</p>
<p>After an illegal code the module drops <code>last_valid</code>, so it re-seeds from the next good reading instead of reporting a phantom transition.</p>

<h2 id="limits">What Hall can and cannot give you</h2>
${table(['Question', 'Answer from three Hall sensors'], [
  ['Which 60° sector is the rotor in?', badge('confirmed') + ' Directly'],
  ['Which direction is it turning?', badge('confirmed') + ' From the sector sequence'],
  ['How fast is it turning?', badge('assumption') + ' From the time between transitions'],
  ['What is the exact electrical angle?', badge('open') + ' Not directly — needs interpolation between edges'],
  ['Where is the rotor at standstill?', badge('assumption') + ' Only to within 60°']
])}
<p>That last row is what separates Hall-assisted FOC from encoder-based FOC. See <a href="#/foc">FOC Strategy</a> for how the project plans to work within it.</p>
`
};

PAGES['fpga-safety'] = {
  title: 'Monitors & DISABLE',
  lede: 'Three combinational checks and one latching state machine that together decide whether the gate drivers are allowed to switch.',
  html: `
<h2 id="layers">Layered protection</h2>
<p>Protection on this system sits in three layers, fastest first:</p>
<ol>
  <li><strong>The UCC21222 itself</strong> — input interlock and dead time, in hardware, with no software involvement.</li>
  <li><strong>FPGA fabric</strong> — the monitors and <code>pcb_disable_control</code> on this page, reacting within a few clock cycles.</li>
  <li><strong>The PS</strong> — logging, recovery policy and operator decisions, in milliseconds.</li>
</ol>
${callout('confirmed', 'There is no dedicated fault line from the board',
  `<p><code>nOC</code> and <code>FAULT</code> do not exist on the updated board — zero nets, zero pads, zero labels. The board cannot tell the FPGA that something went wrong. Everything the FPGA knows comes from its own measurements.</p>
   <p>That is exactly why the current and voltage monitors matter, and why <code>fault_manager.v</code> was deleted rather than kept.</p>`)}
${cite('crosscheck')}

<h2 id="disable">pcb_disable_control.v</h2>
<p>The enable logic is a single expression, and every term can block independently:</p>
${cb('fpga/rtl/pcb_disable_control.v', 'verilog', `
wire startup_inhibit = !sensor_data_valid;
wire any_inhibit = startup_inhibit || current_out_of_range ||
    voltage_out_of_range || external_inhibit_request;

assign pwm_enable  = !rst && enable_request && !protection_latched && !any_inhibit;
assign disable_cmd = pwm_enable ? ~DISABLE_ACTIVE_LEVEL : DISABLE_ACTIVE_LEVEL;`)}
<p>Note the asymmetry in latching. Current, voltage and external inhibits <strong>latch</strong> — once tripped they stay tripped until explicitly cleared, so a fault that flickers cannot leave the system quietly running. The startup inhibit does <strong>not</strong> latch; it simply holds the part off until measurements come good, because "we have not measured anything yet" is a normal condition, not a fault.</p>

${widget('disable', 'DISABLE and protection state model',
  'Toggle the inputs to explore the logic above. Try tripping a current fault, clearing the fault input, then pulsing clear_latch.')}

<h3 id="safe">Why the safe state is free</h3>
${callout('confirmed', 'A floating pin means disabled',
  `<p>The UCC21222 DIS pin is internally pulled high, and the board adds no pull resistor to the <code>DISABLE</code> net. So during FPGA configuration, when the pins are floating, the gate drivers are already disabled.</p>
   <p>This is the correct direction for a safe default and it costs nothing. It also means the safe state depends entirely on the driver's internal pull-up, since nothing on the board backs it up.</p>`)}
${cite('crosscheck', 'ds_ucc')}

<h2 id="current-monitors">Two current monitors, deliberately separate</h2>
<p>This split is the interesting design decision in the safety layer, and it exists because either check alone has a blind spot.</p>
${table(['', '<code>phase_current_balance_monitor</code>', '<code>phase_current_limit_monitor</code>'], [
  ['Checks', '|ia + ib + ic| against a limit', '|ia|, |ib|, |ic| each against a limit'],
  ['Catches', 'A broken or mis-scaled measurement channel', 'Real overcurrent on any phase'],
  ['Misses', 'Balanced overcurrent — all three high, summing to zero', 'A single channel reading wrong while magnitudes stay small'],
  ['Output', 'One flag', 'Three flags, one per phase'],
  ['Logic type', 'Combinational', 'Combinational']
])}
<p>In a healthy three-phase system with no neutral connection, the three currents must sum to approximately zero — that is Kirchhoff, not a control choice. A persistent non-zero sum means a measurement problem rather than a motor problem. But three <em>genuinely</em> large currents can also sum to nearly zero, which is precisely the dangerous case a balance test cannot see.</p>

${widget('current', 'Current monitor behaviour',
  'Try the preset button to reach the case where the balance check passes but the limit check trips.')}

<h3 id="abs-note">One case worth simulating carefully</h3>
${callout('assumption', 'Observation from reading the code, not a simulator result',
  `<p><code>phase_current_limit_monitor</code> computes magnitude as <code>(x &lt; 0) ? -x : x</code> within the same <code>WIDTH</code>. In two's complement the most negative value negates to itself and stays negative, so a full-negative-scale reading would compare as <em>not</em> over limit.</p>
   <p>Whether that value is reachable depends on the analog scaling, which is still unresolved. It is worth a directed test case when the testbenches are first run.</p>`)}

<h2 id="voltage-monitor">voltage_sense_monitor.v</h2>
<p>The smallest module in the set — three continuous assignments, no clock, no state:</p>
${cb('fpga/rtl/voltage_sense_monitor.v', 'verilog', `
assign phase_v_out_of_range = (phase_v_q < phase_v_min_q) || (phase_v_q > phase_v_max_q);
assign bus_v_out_of_range   = (bus_v_q   < bus_v_min_q)   || (bus_v_q   > bus_v_max_q);
assign voltage_out_of_range = phase_v_out_of_range || bus_v_out_of_range;`)}
<p>Both undervoltage and overvoltage are caught, because each signal is tested against a minimum and a maximum. Values are unsigned, which suits a sensed rail that never goes below zero at the ADC.</p>
${callout('open', 'Two gaps',
  `<ul><li>The window limits are in raw fixed-point counts. Turning them into volts needs the divider ratio, the AMC1311 gain, the diff-stage gain and the ADC full-scale — and the last of those is unknown.</li>
   <li>There is no <code>sample_valid</code> gate on this module, unlike the two current monitors. Whatever drives it must guarantee the inputs hold meaningful data.</li></ul>`)}
${cite('rtlVolt', 'known')}
`
};

PAGES['fpga-tb'] = {
  title: 'Testbenches',
  lede: 'Six self-checking benches covering the six modules. Written, never executed.',
  html: `
${callout('open', 'Status: written, never run',
  `<p>Each bench drives its module through a sequence of cases and prints <code>ERROR: …</code> when a check fails, ending with a <code>PASS: …</code> line if it reaches the end. That structure means a simulator run produces a readable transcript.</p>
   <p><strong>No simulator has produced that transcript.</strong> The checks below are what the benches are written to verify, not results.</p>`)}
${cite('known')}

<div id="tb-table"></div>

<h2 id="detail">What each bench checks</h2>
<div id="tb-detail"></div>

<h2 id="firstrun">Running them for the first time</h2>
<p>The full walkthrough is on the <a href="#/vivado">Vivado Starter Guide</a> page. The short version:</p>
${cb('first simulation', 'text', `
1. Create a Vivado RTL project (no sources yet).
2. Add Design Sources:      fpga/rtl/*.v      (6 files)
3. Add Simulation Sources:  fpga/tb/*.v       (6 files)
4. Set the simulation top to one testbench at a time.
5. Run Behavioral Simulation.
6. Read the Tcl console. Look for ERROR lines first, then the PASS line.`)}
${callout('info', 'Expect to find things',
  `<p>Six modules and six benches have never met a simulator. It would be unusual for everything to pass first time. Finding failures is the point of running them — and finding none would itself be worth double-checking, since a bench that never fails may not be driving anything.</p>
   <p>Two specific things worth watching: the non-overlap assertion in the PWM bench, and the negative-magnitude edge case noted on the <a href="#/fpga-safety">Monitors</a> page.</p>`)}

<h2 id="gaps">Coverage gaps to add later</h2>
<ul>
  <li>No bench checks that dead time is ≥ the configured <code>nonoverlap_ticks</code> in measured cycles — only that HI and LO never overlap.</li>
  <li>No bench drives a full six-step Hall sequence through a complete revolution in both directions.</li>
  <li>No bench exercises the most-negative-value magnitude case in the current monitors.</li>
  <li>No integration bench ties the modules together, because there is no top-level wrapper yet.</li>
</ul>
`
};

/* ---------------------------------------------------------- 5. MATLAB */
PAGES.matlab = {
  title: 'MATLAB / FOC Math',
  lede: 'Where the control math lives today: fixed-point arithmetic, the Clarke and Park transforms, PI current loops and duty generation.',
  html: `
<h2 id="scripts">The scripts</h2>
${table(['Script', 'What it does', 'Run evidence'], [
  ['<code>foc_fixed_point_starter.m</code>', 'Compares floating-point against explicit Q1.15 math on a PI current loop, then on the Clarke/Park chain. Plots the difference and shows the PWM-centre sample strobe.', badge('open') + ' No saved output artifact'],
  ['<code>stage1_3pwm_foc_sim.m</code>', 'Control-chain sandbox: id/iq references → fixed-point PI loops → inverse Park → three duty cycles → centre-aligned PWM timing.', badge('open') + ' No saved output artifact'],
  ['<code>board_interface_config.m</code>', 'Single config file holding every board assumption, so MATLAB, HDL Coder and Vivado cannot drift apart. Unknown values are deliberately <code>NaN</code>.', badge('neutral') + ' Config, not a run'],
  ['<code>board_interface_check.m</code>', 'Validates the config against the board labels and prints an I/O budget, timing numbers and a TODO list.', badge('confirmed') + ' Run — output saved'],
  ['<code>board_interface_check_LAST_RUN.txt</code>', 'Dated output of the above.', badge('confirmed') + ' Evidence file']
])}
${callout('info', 'MATLAB is available on this machine',
  `<p>MATLAB R2026a is installed, so these scripts can be run. Only <code>board_interface_check.m</code> has a saved run artifact in the repository; the two simulation scripts produce figures rather than saved output, so there is no stored evidence of them having been run.</p>`)}
${cite('cfg', 'lastrun')}

<h2 id="lastrun">The last interface check</h2>
<p>This is real recorded output, not a model:</p>
${cb('matlab/board_interface_check_LAST_RUN.txt', 'text', `
PWM timing
fabric clock = 100.0 MHz
requested f_pwm = 20000 Hz
center-aligned period_counts = 2500
actual f_pwm = 20000.00 Hz
placeholder nonoverlap ticks = 20

IO budget from updated board labels
confirmed digital inputs to FPGA = 3
digital outputs from FPGA = 7
analog inputs listed = 6
disable polarity = active-high disable, drive low to run

Current-sense path from updated board
chain = shunt -> AMC1300BDWV/AMC1300BDWVR -> OPA4388IDR -> MCU CSENSE
AMC1300 gain = 8.20
OPA4388 diff-stage gain = 1.00
WARNING: final current-sense A-to-V scaling is not known yet

Voltage-sense path from updated board
divider ratio = 0.013158
96 V input into divider gives 1.263 V before isolation amp
WARNING: final ADC-side voltage scaling still needs the Arty/ADC pin path`)}
${cite('lastrun')}

<h2 id="nan">Why the unknowns are NaN on purpose</h2>
${cb('matlab/board_interface_config.m', 'matlab', `
cfg.current.ref_V             = NaN;   % TODO confirm OPA4388 output offset
cfg.current.sensitivity_V_per_A = NaN; % TODO derive from shunt, AMC1300, OPA4388 gain
cfg.current.amc1300_gain      = 8.2;   % datasheet nominal, shunt value still needed
cfg.current.opa4388_diff_gain = 1.0;   % updated cross-check found 3.3k unity diff stage

cfg.voltage_sense.ref_V          = NaN; % TODO confirm voltage-sense output offset
cfg.voltage_sense.scale_V_per_V  = NaN; % TODO derive from divider, AMC1311, output path
cfg.voltage_sense.max_adc_V      = NaN; % TODO confirm ADC input limit for this path`)}
<p>This is a discipline worth keeping. A plausible-looking placeholder number would propagate silently into the fixed-point scaling, into HDL Coder, and eventually into a bitstream driving real hardware. <code>NaN</code> propagates loudly instead — anything computed from it becomes <code>NaN</code> and the problem surfaces immediately.</p>
${cite('cfg')}

<h2 id="control">The control chain</h2>
${figure('Figure 11', 'The FOC loop. Solid blocks exist in MATLAB today; the ADC path and angle estimation are still open.', SVG_FOCLOOP)}
<p>Each stage has its own page section:</p>
<ul>
  <li><a href="#/matlab-fixed">Fixed point and Q-format</a> — how fractional numbers survive in integer hardware</li>
  <li><a href="#/matlab-clarke">Clarke, Park and inverse Park</a> — why three phases become two DC values</li>
  <li><a href="#/matlab-pi">PI loop and duty generation</a> — regulation and the trip back to three duties</li>
</ul>
`
};

PAGES['matlab-fixed'] = {
  title: 'Fixed Point & Q-Format',
  lede: 'FPGAs multiply integers cheaply and floating-point numbers expensively. Fixed point is how fractional math gets done in fabric.',
  html: `
<h2 id="why">Why not floating point</h2>
<p>A floating-point multiplier in fabric costs many times what an integer multiplier costs in DSP slices and routing, and it adds pipeline latency. An Arty Z7-10 has 80 DSP slices in total. Spending them on float when the algorithm needs a range of roughly −1 to +1 is poor economics.</p>
<p>Fixed point keeps the cheap integer hardware and moves the binary point into your head — you decide where it sits and remember it consistently.</p>

<h2 id="qformat">Q-format</h2>
<p>${g('Q-format')} is written Qm.n, where n bits sit below the binary point. The project uses <strong>Q1.15</strong>: one sign bit, fifteen fractional bits, in a 16-bit integer.</p>
${cb('the encoding', 'text', `
Q1.15  =>  scale = 2^15 = 32768

  real value 0.5   ->  round(0.5   x 32768) =  16384
  real value 0.25  ->  round(0.25  x 32768) =   8192
  real value -0.75 ->  round(-0.75 x 32768) = -24576

  range      : -1.0 to +0.99997
  resolution : 1/32768 = 3.05e-5

Anything at or beyond +1.0 saturates. That is a feature, not a bug: it means
the representation matches the per-unit convention the control math uses.`)}
${cb('matlab/foc_fixed_point_starter.m', 'matlab', `
function y = q_encode(x, scale, q_min, q_max)
    y = int32(round(x .* scale));
    y = min(max(y, q_min), q_max);      % saturate, never wrap
end

function x = q_decode(y, scale)
    x = double(y) ./ scale;
end`)}
<p>The saturation matters. If an out-of-range value <em>wrapped</em> instead of saturating, a slightly-too-large positive current would read as a large negative one — and a control loop would respond by pushing harder in exactly the wrong direction.</p>

${widget('qformat', 'Q-format quantisation explorer',
  'Reimplements q_encode, q_decode and q_mul_q15 from the MATLAB scripts. Drop the fractional bits and watch the error grow.')}

<h2 id="multiply">The multiply is where it gets subtle</h2>
<p>Multiplying two Q1.15 numbers gives a Q2.30 result in 32 bits. Getting back to Q1.15 means shifting right by 15 — but a naive shift always truncates toward negative infinity, which biases every product slightly negative. Over an integrator running at 20 kHz, a consistent one-sided bias accumulates into real drift.</p>
${cb('matlab/foc_fixed_point_starter.m', 'matlab', `
function y = q_mul_q15(a_q15, b_q15, q_frac, q_min, q_max)
    raw = int64(a_q15) * int64(b_q15);        % full-width product, no loss yet
    if raw >= 0
        raw = raw + int64(2^(q_frac - 1));    % round half away from zero
    else
        raw = raw - int64(2^(q_frac - 1));
    end
    shifted = int64(floor(double(raw) / 2^q_frac));
    y = sat16(shifted, q_min, q_max);         % back to Q1.15, saturating
end`)}
<p>Adding half an LSB before the shift converts truncation into round-half-away-from-zero, which is symmetric about zero and removes the bias.</p>

<h2 id="perunit">Per-unit scaling</h2>
<p>The scripts work in ${g('per-unit')} rather than in amps and volts. Every quantity is divided by a chosen base so it lands in the −1 to +1 range that Q1.15 represents natively.</p>
${cb('base values', 'matlab', `
% foc_fixed_point_starter.m
base_current_A = 100;     base_voltage_V = 96;

% stage1_3pwm_foc_sim.m  (low-voltage bench stage)
base_current_A = 20;      base_bus_V = 12;`)}
<p>So <code>iq = 0.35 pu</code> means 35 A on the 100 A base, or 7 A on the 20 A base. The controller gains stay the same across both; only the interpretation of the numbers changes. This is what will make the eventual transition from bench testing at 12 V to the real 96 V system a scaling change rather than a rewrite.</p>
${cite('focstarter', 'stage1')}

<h2 id="hdl">What this becomes in HDL</h2>
<p>The MATLAB fixed-point work is deliberately written the way hardware behaves — explicit encode, explicit saturate, explicit rounded multiply — so the HDL Coder conversion has a clear target. MathWorks documents the same path in its <a href="https://www.mathworks.com/videos/fpga-design-with-matlab-part-4-converting-to-fixed-point-1569474465192.html" target="_blank" rel="noopener">fixed-point conversion workflow</a>.</p>
`
};

PAGES['matlab-clarke'] = {
  title: 'Clarke, Park & Inverse Park',
  lede: 'The transforms that turn three moving phase currents into two numbers that hold still.',
  html: `
<h2 id="problem">The problem they solve</h2>
<p>A three-phase motor has three currents, all sinusoidal, all moving, all coupled to each other and to rotor position. Regulating them directly means chasing three moving targets whose relationship changes with speed.</p>
<p>${g('FOC')} makes that problem go away in two steps. First collapse three signals into two. Then rotate those two into a frame that spins with the rotor — at which point, in steady state, they stop moving entirely and become DC values a plain PI loop can hold.</p>

<h2 id="clarke">Step 1 — Clarke transform</h2>
<p>Three phase currents in a system with no neutral connection are not independent: ia + ib + ic = 0. So the third one carries no information the first two lack. The ${g('Clarke transform')} drops to two orthogonal stationary-frame components.</p>
${cb('matlab/foc_fixed_point_starter.m', 'matlab', `
function [alpha, beta] = clarke_float(ia, ib)
    alpha = ia;
    beta  = (ia + 2 .* ib) ./ sqrt(3);
end`)}
<p>Note that only <code>ia</code> and <code>ib</code> are used — this is the form that exploits the sum-to-zero property. The alpha axis is aligned with phase A; beta is 90° from it.</p>
${callout('confirmed', 'This board measures all three phases anyway',
  `<p>Since ic is not needed by the transform, some designs reconstruct it or skip measuring it. This board measures all three. The third measurement is not wasted — it feeds <code>phase_current_balance_monitor</code>, which uses the sum-to-zero property as a health check on the measurement chain itself.</p>`)}

<h2 id="park">Step 2 — Park transform</h2>
<p>The alpha/beta pair still rotates as the motor turns. The ${g('Park transform')} rotates the coordinate frame by the rotor electrical angle, so the frame turns <em>with</em> the rotor and the values inside it stand still.</p>
${cb('matlab/foc_fixed_point_starter.m', 'matlab', `
function [id, iq] = park_float(alpha, beta, theta)
    id =  alpha .* cos(theta) + beta .* sin(theta);
    iq = -alpha .* sin(theta) + beta .* cos(theta);
end`)}
${table(['Component', 'Physical meaning', 'Commanded to'], [
  ['<code>i_d</code>', 'Current aligned with the rotor magnetic field. Produces flux, not torque.', '<strong>0</strong> for a surface PMSM or BLDC — it does no useful work and only causes losses.'],
  ['<code>i_q</code>', 'Current perpendicular to the field. This is the component that produces torque.', 'Whatever torque is being asked for.']
])}
<p>That table is the entire payoff. Torque control becomes "regulate one DC number", and the machine's magnetic state becomes "hold another DC number at zero".</p>

${widget('clarke', 'Clarke and Park transform visualiser',
  'Uses the exact formulas above. Press rotate and watch i_d and i_q hold steady while the three phase currents swing.')}

<h2 id="fixed">The same thing in Q1.15</h2>
<p>The starter script implements the transform chain twice — once in floating point, once in explicit fixed point — and plots the difference. That comparison is the point of the script.</p>
${cb('matlab/foc_fixed_point_starter.m', 'matlab', `
alpha_q15    = ia_q15;
beta_sum_q15 = sat16(int32(ia_q15) + 2 * int32(ib_q15), q_min, q_max);
beta_q15     = q_mul_q15(beta_sum_q15, one_over_sqrt3_q15, q_frac, q_min, q_max);

cos_q15 = q_encode(cos(theta(idx)), scale, q_min, q_max);
sin_q15 = q_encode(sin(theta(idx)), scale, q_min, q_max);

alpha_cos = q_mul_q15(alpha_q15, cos_q15, q_frac, q_min, q_max);
beta_sin  = q_mul_q15(beta_q15,  sin_q15, q_frac, q_min, q_max);
alpha_sin = q_mul_q15(alpha_q15, sin_q15, q_frac, q_min, q_max);
beta_cos  = q_mul_q15(beta_q15,  cos_q15, q_frac, q_min, q_max);

id_q15 = sat16( int32(alpha_cos) + int32(beta_sin), q_min, q_max);
iq_q15 = sat16(-int32(alpha_sin) + int32(beta_cos), q_min, q_max);`)}
<p>Two implementation details worth noticing. The <code>1/sqrt(3)</code> constant is pre-encoded once rather than recomputed, because in hardware it is a constant multiplier. And <code>beta_sum</code> is saturated <em>before</em> the multiply, since <code>ia + 2·ib</code> can exceed the Q1.15 range even when both inputs are inside it.</p>
${cite('focstarter')}

<h2 id="invpark">Step 3 — Inverse Park, on the way back out</h2>
<p>The PI loops produce voltage commands in the rotating frame, <code>v_d</code> and <code>v_q</code>. Those have to come back to the stationary frame before they can become duty cycles. ${g('inverse Park')} is the same rotation, backwards:</p>
${cb('matlab/stage1_3pwm_foc_sim.m', 'matlab', `
function [alpha, beta] = inverse_park(d, q, theta)
    alpha = d * cos(theta) - q * sin(theta);
    beta  = d * sin(theta) + q * cos(theta);
end`)}
<p>Notice that only the sign pattern differs from the forward transform. In hardware both directions reuse the same multiplier structure, which is part of why FOC maps onto fabric so neatly.</p>

<h2 id="angle">The angle this all depends on</h2>
${callout('open', 'Every transform above needs θ',
  `<p>Both Park transforms take the rotor electrical angle as an input. Get it wrong and the d/q decomposition is wrong — current that was supposed to produce torque produces flux instead, and the motor draws current without doing useful work.</p>
   <p>Three Hall sensors resolve the angle to within 60°. That is enough to get started and not enough for high-quality FOC. See <a href="#/foc">FOC Strategy</a>.</p>`)}
`
};

PAGES['matlab-pi'] = {
  title: 'PI Loop & Duty Generation',
  lede: 'Regulating i_d and i_q, then converting the resulting voltage commands into three duty cycles.',
  html: `
<h2 id="pi">The PI current loop</h2>
<p>Once Clarke and Park have done their work there are two DC-ish quantities to regulate, so two independent PI loops suffice. The interesting part is not the PI itself — it is the ${g('anti-windup')}.</p>
${cb('matlab/stage1_3pwm_foc_sim.m', 'matlab', `
function [out_q15, integ_next_q15] = pi_fixed_step(err_q15, kp_q15, ki_q15, ...
                                                   integ_q15, out_limit_real, ...
                                                   q_frac, q_min, q_max)
    p_q15      = q_mul_q15(err_q15, kp_q15, q_frac, q_min, q_max);
    i_step_q15 = q_mul_q15(err_q15, ki_q15, q_frac, q_min, q_max);

    integ_candidate = sat16(int32(integ_q15) + int32(i_step_q15), q_min, q_max);
    unsat           = sat16(int32(p_q15) + int32(integ_candidate), q_min, q_max);

    out_limit_q15 = int32(round(out_limit_real * 2^q_frac));
    out_q15       = int32(min(max(unsat, -out_limit_q15), out_limit_q15));

    % Conditional integration: only commit the integrator if we are not
    % saturated and still pushing further into the limit.
    pushing_high = (out_q15 >=  out_limit_q15) && (err_q15 > 0);
    pushing_low  = (out_q15 <= -out_limit_q15) && (err_q15 < 0);
    if pushing_high || pushing_low
        integ_next_q15 = integ_q15;        % freeze
    else
        integ_next_q15 = integ_candidate;  % commit
    end
end`)}
<p>Without the freeze, an integrator that saturates keeps accumulating error it cannot act on. When the reference finally comes back into range, the loop has to unwind all that accumulated value before it can respond — which shows up as a large overshoot and a slow recovery.</p>
<p>The <code>integ_candidate</code> pattern is worth noting: the candidate is computed, used to produce the output, and only <em>then</em> conditionally committed. That ordering is what makes the freeze decision depend on the actual output rather than on a prediction of it.</p>

${widget('piloop', 'PI current loop — fixed vs floating point',
  'Both loops use the same gains against the same first-order plant. Reduce the fractional bits and watch the fixed-point trace degrade.')}

<h3 id="limit">Why the output limit is 0.46</h3>
${cb('matlab/stage1_3pwm_foc_sim.m', 'matlab', `
v_limit = 0.46;   % Keep voltage vector inside duty-cycle range.`)}
<p>The duty generation adds 0.5 to centre each phase around mid-rail, so a voltage command of ±0.46 maps to a duty span of roughly 0.04 to 0.96. Limiting the PI output is what keeps the modulator out of saturation, where it would stop being linear and the current loop would lose control authority.</p>

<h2 id="duty">Duty generation</h2>
<p>After inverse Park there are two stationary-frame voltages, <code>v_alpha</code> and <code>v_beta</code>. Turning them into three duties takes an inverse Clarke followed by a common-mode trick:</p>
${cb('matlab/stage1_3pwm_foc_sim.m', 'matlab', `
function [duty_a, duty_b, duty_c] = svpwm_3pwm_duties(v_alpha, v_beta)
    va = v_alpha;
    vb = -0.5 * v_alpha + (sqrt(3) / 2) * v_beta;
    vc = -0.5 * v_alpha - (sqrt(3) / 2) * v_beta;

    v_max  = max([va, vb, vc]);
    v_min  = min([va, vb, vc]);
    v_zero = -0.5 * (v_max + v_min);        % the min/max centring offset

    va = va + v_zero;  vb = vb + v_zero;  vc = vc + v_zero;

    duty_a = clamp(0.5 + va, 0.02, 0.98);
    duty_b = clamp(0.5 + vb, 0.02, 0.98);
    duty_c = clamp(0.5 + vc, 0.02, 0.98);
end`)}
<h3 id="centring">The min/max centring trick</h3>
<p>Adding the same offset to all three phases changes nothing the motor can see. The motor responds to <em>differences</em> between phase voltages, and a common offset cancels out of every difference.</p>
<p>That freedom is worth about 15% more usable bus voltage. Centring the three values within the available range before clamping means a larger voltage vector fits, which is the practical benefit of ${g('SVPWM')} over plain sine modulation. The characteristic flat-topped duty waveform is the offset doing its work.</p>

${widget('duty', 'Duty generation with and without centring',
  'Toggle centring off and compare the peak duty excursion for the same v_d and v_q.')}

<h3 id="clamp">Why the clamp is 0.02 to 0.98, not 0 to 1</h3>
<p>A duty of exactly 0 or 1 means one switch never turns off. That breaks two things: the ${g('bootstrap')} supply for the high-side driver needs the switch node to go low periodically to recharge, and a current measurement synchronised to the PWM centre needs a window in which to take the sample. Keeping a couple of percent at each end preserves both.</p>
${cite('stage1')}

<h2 id="tohw">From here to the hardware</h2>
<p>The three duties are per-unit numbers between 0 and 1. The RTL wants counter ticks:</p>
${cb('duty in per-unit to counter ticks', 'text', `
duty_ticks = round(duty_pu x period)

  period = 2500        (100 MHz fabric, 20 kHz centre-aligned)
  duty_a = 0.62 pu  ->  1550 ticks

The RTL then expands each duty into pwm_hi_x / pwm_lo_x with the
non-overlap window applied. Three numbers in, six signals out.`)}
`
};

/* ------------------------------------------------------------- 6. FOC */
PAGES.foc = {
  title: 'FOC Strategy',
  lede: 'What this project is doing now, why Hall sensors are the right starting point, and where sensorless FOC fits as future research.',
  html: `
<h2 id="position">Where this project sits</h2>
${callout('confirmed', 'Hall-assisted FOC is the near-term direction',
  `<p>The project is doing FOC. The near-term path is <strong>Hall-assisted FOC and board bring-up</strong>, not fully sensorless FOC. Hall sensors exist on the updated PCB and can be used for startup, rough rotor sector and early testing.</p>
   <p>Sensorless FOC is research for later, once measured current and voltage behaviour is understood. It is not the immediate hardware bring-up assumption.</p>`)}
${cite('known', 'todo')}

${figure('Figure 12', 'The four approaches ordered by how much rotor angle information they have.', SVG_STRATEGY)}

<h2 id="compare">Comparing the four</h2>
${table(['', 'Six-step', 'Hall-assisted FOC', 'Encoder FOC', 'Sensorless FOC'], [
  ['<strong>Angle source</strong>', '3 Halls', '3 Halls + interpolation', 'Encoder / resolver', 'Estimated from current and voltage'],
  ['<strong>Angle resolution</strong>', '60°', '60° measured, interpolated between', 'Continuous, high', 'Continuous, estimator-dependent'],
  ['<strong>Current regulation</strong>', 'None — applies voltage patterns', 'Full d/q regulation', 'Full d/q regulation', 'Full d/q regulation'],
  ['<strong>Torque ripple</strong>', 'High — a step every 60°', 'Moderate', 'Low', 'Low above base speed'],
  ['<strong>Standstill behaviour</strong>', 'Works', 'Works — sector known', 'Works', 'Poor — no back-EMF to observe'],
  ['<strong>Extra hardware</strong>', 'None beyond Halls', 'None beyond Halls', 'Encoder + cabling', 'None'],
  ['<strong>Depends on analog quality</strong>', 'Barely', 'Yes — current sense', 'Yes — current sense', 'Critically — current <em>and</em> voltage'],
  ['<strong>Status here</strong>', 'Not the goal', badge('confirmed') + ' Near-term', 'Not on this board', badge('open') + ' Future research']
])}

<h2 id="whyhall">Why Hall is the right starting point</h2>
<ol>
  <li><strong>It works from standstill.</strong> The sensors report position with the motor stopped, so startup needs no special case. Sensorless estimators have nothing to observe at zero speed and require a separate open-loop startup routine.</li>
  <li><strong>It fails in a readable way.</strong> Codes 000 and 111 are illegal, so a broken sensor or disconnected cable announces itself. <code>hall_decoder.v</code> already counts these. An estimator that drifts gives no equivalent signal — the angle is simply wrong.</li>
  <li><strong>It separates the variables.</strong> During bring-up, "is the current loop working?" and "is the angle right?" become independent questions. That is worth a great deal when nothing has ever been powered before.</li>
  <li><strong>The hardware is already there.</strong> Confirmed on J5, RC-filtered, decoder written.</li>
  <li><strong>It does not depend on unresolved analog.</strong> Which matters, because the current-sense sign convention and the ADC route are both open questions.</li>
</ol>

<h2 id="limits">Where Hall runs out</h2>
<p>Three sensors give six sectors. Between edges the rotor keeps turning while the reported sector does not change. Using the sector centre as the angle means the error sweeps ±30° across each sector.</p>
${callout('assumption', 'What a 30° angle error costs',
  `<p>Torque scales with cos of the angle error, so ±30° costs roughly 13% of torque at the extremes, and the loss varies cyclically within each sector. That variation <em>is</em> the torque ripple.</p>
   <p>It also breaks the clean d/q separation the transforms were supposed to give: current intended for <code>i_q</code> partly lands in <code>i_d</code>, producing flux and heat instead of torque.</p>
   <p>This is a standard result rather than something measured on this hardware.</p>`)}
<p>The usual mitigation is interpolation — measure the time between Hall edges, assume the speed is roughly constant, and extrapolate the angle forward between them. It works well at steady speed and degrades during acceleration, when the constant-speed assumption stops holding. That is the natural next increment after basic Hall FOC works.</p>

<h2 id="sensorless">Sensorless FOC as future research</h2>
<p>Sensorless FOC removes the position sensor and infers the angle from what the motor's own electrical behaviour reveals — typically by observing back-EMF through a flux or sliding-mode observer, or by injecting a high-frequency signal at low speed and reading the saliency response.</p>
<h3 id="prereq">What it would need first</h3>
${table(['Prerequisite', 'Current state'], [
  ['Trustworthy bidirectional current measurement', badge('open') + ' Sign convention unresolved; the chain is ground-referenced as parsed'],
  ['Known current-sense scaling', badge('open') + ' Shunt value unknown'],
  ['Voltage measurement with confirmed scaling', badge('open') + ' ADC-side path unknown'],
  ['Motor parameters — resistance, inductance, flux linkage', badge('open') + ' Not characterised'],
  ['A working current loop to build on', badge('open') + ' Not yet simulated'],
  ['Deterministic sample timing', badge('assumption') + ' <code>pwm_peak_strobe</code> exists but is provisional']
])}
<p>Every one of those is a prerequisite, and every one is currently open. An observer is only as good as the measurements feeding it — a sensorless estimator built on an uncalibrated current path produces confident, wrong angles. That is a worse failure mode than a Hall sensor that simply stops reporting.</p>
${callout('info', 'The research framing',
  `<p>Sensorless FOC is genuinely interesting for this project because it removes sensor cost and a cable — which speaks directly to the cost-efficiency question the SURG proposal is asking. It is a good second-phase research direction. It is not a shortcut past the analog work.</p>`)}

<h2 id="path">The path forward</h2>
${cb('control development sequence', 'text', `
Stage 0  Simulate the existing RTL.                        <- blocked only by tooling
Stage 1  Open-loop PWM into a bench motor at low voltage.  <- needs pin map
Stage 2  Read Hall, confirm the sector sequence on the
         real motor, fix the decode table.                 <- needs Hall 5V fix
Stage 3  Close the current loop using measured ia/ib/ic.   <- needs analog answers
Stage 4  Hall-assisted FOC with sector-based angle.
Stage 5  Add inter-edge interpolation for smoother angle.
Stage 6  (Research) Add an observer, compare against Hall
         while the Halls are still connected as ground truth.`)}
<p>Stage 6 is where sensorless work belongs, and running the observer alongside working Hall sensors is what makes it measurable rather than a leap of faith.</p>
`
};

/* ---------------------------------------------------------- 7. VIVADO */
PAGES.vivado = {
  title: 'Vivado Starter Guide',
  lede: 'How to get from six Verilog files to a first behavioural simulation — and exactly what is still missing before a bitstream.',
  html: `
${callout('confirmed', 'Enough exists to start simulating. Not enough exists for a bitstream.',
  `<p>These are two different thresholds and it is worth being precise about the gap between them. Simulation needs only RTL and testbenches, both of which exist. A bitstream needs pin constraints, which need a confirmed board mapping, which does not exist yet.</p>`)}
${cite('known')}

<h2 id="flow">The whole flow, in order ${badge('ready')}</h2>
${widget('vivadoflow', 'Vivado flow checklist',
  'Generated explanatory model. Ticks are stored in your browser only and record intent, not results — no step here has been executed.')}

<h2 id="install">Step 1 — Install</h2>
<ul>
  <li>Vivado (the free WebPACK edition covers the Zynq-7000 devices on an Arty Z7).</li>
  <li>Digilent board files, so the Arty Z7 appears as a selectable board rather than a bare part number.</li>
</ul>
${callout('open', 'Which Arty Z7 variant?',
  `<p>The Z7-10 uses an XC7Z010; the Z7-20 uses an XC7Z020. They differ in logic cells (28,000 vs 85,000), DSP slices (80 vs 220) and — importantly here — how many shield digital I/O reach the FPGA (26 vs 49). The MATLAB config currently assumes <code>Arty Z7-10</code>. Confirm before creating the project.</p>`)}
${cite('research', 'cfg')}

<h2 id="project">Step 2 — Create the simulation project</h2>
${cb('project setup', 'text', `
File > Project > New
  Project type : RTL Project
  [x] Do not specify sources at this time
  Board        : Arty Z7-10  (or Z7-20 once confirmed)

Then add sources:

  Add Sources > Add or create design sources
    fpga/rtl/pwm_3phase_center_aligned.v
    fpga/rtl/hall_decoder.v
    fpga/rtl/pcb_disable_control.v
    fpga/rtl/phase_current_balance_monitor.v
    fpga/rtl/phase_current_limit_monitor.v
    fpga/rtl/voltage_sense_monitor.v

  Add Sources > Add or create simulation sources
    fpga/tb/tb_pwm_3phase_center_aligned.v
    fpga/tb/tb_hall_decoder.v
    fpga/tb/tb_pcb_disable_control.v
    fpga/tb/tb_phase_current_balance_monitor.v
    fpga/tb/tb_phase_current_limit_monitor.v
    fpga/tb/tb_voltage_sense_monitor.v`)}
${callout('info', 'No XDC file yet — and that is correct',
  `<p>Behavioural simulation does not need constraints. Adding a speculative XDC now would only create something that has to be rewritten once the real pin map arrives. Leave it out until the mapping is confirmed.</p>`)}

<h2 id="simulate">Step 3 — Run the first simulation</h2>
<ol>
  <li>In the Sources panel, set the simulation top to one testbench — start with <code>tb_pcb_disable_control</code>, the simplest self-contained one.</li>
  <li>Flow Navigator → <strong>Run Simulation</strong> → <strong>Run Behavioral Simulation</strong>.</li>
  <li>Read the Tcl console. The benches print <code>ERROR: …</code> on a failed check and <code>PASS: …</code> at the end.</li>
  <li>Repeat for each of the six benches by changing the simulation top.</li>
</ol>
${callout('open', 'This has never been done. Expect findings.',
  `<p>Six modules and six benches that have never met a simulator will usually turn up something. Finding failures is the point. Finding <em>nothing</em> would be worth double-checking, since a bench that never fails may not be driving anything.</p>
   <p>Two specific things to watch: the non-overlap assertion in the PWM bench, and the negative-magnitude edge case described on the <a href="#/fpga-safety">Monitors</a> page.</p>`)}

<h2 id="checklist">First-simulation checklist</h2>
<div class="checklist" id="vivado-checklist"></div>

<h2 id="xdc">Understanding XDC constraints</h2>
<p>An ${g('XDC')} file tells Vivado three kinds of thing: which package pin each top-level port connects to, what electrical standard that pin uses, and what timing the design must meet.</p>
${cb('what an XDC entry looks like', 'tcl', `
# Physical pin assignment - the package pin is board-specific
set_property -dict { PACKAGE_PIN <PIN> IOSTANDARD LVCMOS33 } [get_ports { pwm_hi_a }]

# Clock definition - period in ns
create_clock -period 10.000 -name sys_clk [get_ports { clk }]

# NOTE: <PIN> above cannot be filled in yet. It requires
#   (a) the confirmed board-side net-to-header mapping, and
#   (b) the Arty Z7 reference manual's header-to-package-pin table.
# Writing a speculative value here would be worse than writing nothing.`)}
<p>The <code>IOSTANDARD</code> matters as much as the pin. <code>LVCMOS33</code> declares a 3.3 V interface — which is exactly why the <a href="#/questions">Hall 5 V pull-up question</a> is a blocker rather than a detail.</p>
${cite('arty_rm')}

<h2 id="needed">What is needed from the PCB team before final XDC</h2>
${table(['Needed', 'Why', 'Status'], [
  ['Board-side net-to-header mapping', 'Turns net names into header positions with a confirmed orientation', badge('open')],
  ['Arty Z7 variant', 'Determines the package and which shield pins reach the PL', badge('open')],
  ['Hall level safety resolution', 'Decides whether those three pins can be connected at all', badge('open')],
  ['ADC route decision', 'Determines whether analog pins need XADC constraints or nothing', badge('open')],
  ['I/O bank voltage for the shield header', 'Sets the IOSTANDARD', badge('open')]
])}
<p>With those five answered, writing the XDC is mechanical: combine the confirmed board mapping with the header-to-package-pin table in the <a href="https://digilent.com/reference/programmable-logic/arty-z7/reference-manual" target="_blank" rel="noopener">Arty Z7 reference manual</a>.</p>

<h2 id="bitstream">Still missing before a bitstream</h2>
${table(['Missing', 'Category'], [
  ['Confirmed Arty Z7 board part / exact Zynq part', 'Decision'],
  ['Confirmed board-side net-to-header mapping', 'Blocked on PCB team'],
  ['Arty / Zynq XDC package pins', 'Follows from the above'],
  ['I/O voltage constraints', 'Follows from the above'],
  ['Safe Hall voltage level', 'Blocked on PCB team'],
  ['ADC route', 'Blocked on PCB team'],
  ['Current and voltage scaling', 'Blocked on PCB team'],
  ['Top-level wrapper tying the modules together', 'My work — can start now'],
  ['AXI / register interface', 'My work — after the pin map']
])}
${cite('known')}

<h2 id="led">Step 4 — Learn XDC safely, in parallel</h2>
<p>The XDC workflow can be learned right now on a throwaway project that touches nothing important:</p>
<ol>
  <li>New project, Arty Z7 board, a single Verilog file that blinks an LED from a counter.</li>
  <li>Constrain the clock and one LED pin using the reference manual.</li>
  <li>Synthesise, implement, generate bitstream, program the board.</li>
  <li>Confirm the PL fabric clock is what you expected, and confirm the shield header I/O bank voltage.</li>
</ol>
<p>That exercise answers two of the open Vivado questions — the actual fabric clock and the bank voltage — without any dependency on the driver board.</p>
${cite('todo')}
`
};

/* ----------------------------------------------------------- 8. TOOLS */
PAGES.tools = {
  title: 'Software & Tools',
  lede: 'Every tool in this project, what it is for, and where it currently stands.',
  html: `
<h2 id="matrix">At a glance</h2>
${table(['Tool', 'Purpose here', 'Status'], [
  ['MATLAB', 'Fixed-point control math', badge('confirmed') + ' In use'],
  ['Simulink', 'Model the control loop as blocks', badge('open') + ' Not started'],
  ['HDL Coder', 'Generate Verilog from the fixed-point model', badge('open') + ' Not started'],
  ['Vivado', 'Simulation, synthesis, constraints, bitstream', badge('open') + ' Not started'],
  ['Verilog', 'Hand-written interface and safety RTL', badge('confirmed') + ' Six modules'],
  ['Zynq SoC', 'The target device', badge('assumption') + ' Variant unconfirmed'],
  ['Arty Z7', 'The target board', badge('assumption') + ' Working assumption'],
  ['Altium', 'Driver board design', badge('confirmed') + ' Files parsed'],
  ['Git / GitHub', 'Version control', badge('confirmed') + ' In use'],
  ['SimpleFOC', 'Reference implementation only', badge('neutral') + ' Reference'],
  ['TI components', 'Gate drivers and isolated sensing', badge('confirmed') + ' On the board']
])}

${collapse('MATLAB', 'in use', `
<p>Where the control math lives today. The scripts are written deliberately hardware-shaped — explicit fixed-point encode, explicit saturation, explicit rounded multiply — so that the eventual HDL conversion has a clear target rather than a floating-point model that has to be reinterpreted.</p>
<p>MATLAB R2026a is installed on this machine. Relevant files: <code>foc_fixed_point_starter.m</code>, <code>stage1_3pwm_foc_sim.m</code>, <code>board_interface_config.m</code>, <code>board_interface_check.m</code>. See <a href="#/matlab">MATLAB / FOC Math</a>.</p>
${cite('focstarter', 'stage1', 'cfg')}`)}

${collapse('Simulink', 'not started', `
<p>The next step for the control math. Simulink models the loop as connected blocks with explicit sample times, which is both easier to reason about than a script loop and a prerequisite for HDL Coder.</p>
<p>The migration target is the PI, Clarke, Park and inverse Park blocks — the parts that will eventually run in fabric. The interface and safety RTL stays hand-written, because it is about pins and timing rather than about math.</p>
${cite('todo')}`)}

${collapse('HDL Coder', 'not started', `
<p>Generates synthesisable Verilog or VHDL from fixed-point MATLAB and Simulink. The reason it matters here is that MathWorks documents exactly the partitioning pattern this project wants: high-rate algorithm blocks generate HDL for fabric, low-rate blocks generate C for the ARM.</p>
<p>Their <a href="https://www.mathworks.com/help/hdlcoder/ug/field-oriented-control-of-a-PMSM.html" target="_blank" rel="noopener">FOC of a PMSM</a> example partitions electrical position, rotor velocity, overcurrent checks and FOC into HDL, while mode scheduling, velocity control and encoder-offset calibration become C software. That is a close match to the PS/PL split on the <a href="#/architecture">Architecture</a> page.</p>
${cite('research')}`)}

${collapse('Vivado', 'not started', `
<p>AMD's toolchain for 7-series and Zynq devices: simulation, synthesis, implementation, constraints and bitstream generation. The free WebPACK edition covers the Zynq-7000 parts on an Arty Z7.</p>
<p>Full walkthrough on the <a href="#/vivado">Vivado Starter Guide</a> page.</p>`)}

${collapse('Verilog / SystemVerilog', 'in use', `
<p>All six current modules are plain Verilog-2001 — no SystemVerilog constructs, which keeps them portable across simulators. The testbenches use <code>$display</code>-based self-checking rather than SystemVerilog assertions, for the same reason.</p>
<p>Vivado's simulator does support SystemVerilog if it becomes useful later; the <a href="https://docs.amd.com/r/en-US/ug900-vivado-logic-simulation/SystemVerilog-Support-in-Vivado-Simulator" target="_blank" rel="noopener">support matrix</a> is worth checking before relying on any specific construct.</p>`)}

${collapse('Zynq SoC', 'target device', `
<p>A Zynq-7000 combines a hardened dual-core ARM Cortex-A9 processing system with 7-series programmable logic on one die, connected by AXI. The reason it suits this project is that it removes the need for a separate microcontroller — the "MCU side" of the architecture can be the Zynq PS itself.</p>
${table(['', 'Z7-10 (XC7Z010)', 'Z7-20 (XC7Z020)'], [
  ['Logic cells', '28,000', '85,000'],
  ['DSP slices', '80', '220'],
  ['Shield digital I/O to FPGA', 'up to 26', 'up to 49']
])}
<p>The MATLAB config assumes Z7-10. That has not been confirmed as the actual board, and it matters — DSP slice count constrains how much of the FOC datapath fits in fabric.</p>
${cite('research', 'cfg')}`)}

${collapse('Arty Z7', 'target board', `
<p>Digilent's Zynq development board with Arduino/chipKIT shield headers — which is precisely why the driver board was designed as a shield. Processor is a 650 MHz dual-core Cortex-A9.</p>
<p>Analog: six single-ended 0–3.3 V XADC inputs and four differential 0–1.0 V inputs. That single-ended count exactly matches the six analog channels the driver board presents, which is suggestive but not confirmation that XADC is the intended route.</p>
<p>The <a href="https://digilent.com/reference/programmable-logic/arty-z7/reference-manual" target="_blank" rel="noopener">reference manual</a> is the authority for the header-to-package-pin mapping needed for XDC.</p>
${cite('research', 'arty_rm')}`)}

${collapse('Altium Designer', 'PCB design', `
<p>The driver board schematic and layout tool. The three project files are <code>DriverBoard.SchDoc</code>, <code>ActualDriverBoard.PcbDoc</code> and <code>HV Motor Driver.BomDoc</code>.</p>
<p>These are binary formats, but the PcbDoc netlist, component list and pad-to-net assignments parse cleanly enough to extract connectivity — which is how the <a href="#/pcb">PCB Interface</a> page was built. What that cannot cover is anything depending on symbol graphics or on copper-level visual inspection, which is why the <a href="#/pcb-flags">red flags</a> page asks for visual confirmation rather than declaring defects.</p>
${cite('crosscheck')}`)}

${collapse('Git / GitHub', 'in use', `
<p>Version control for RTL, MATLAB and notes. The repository is <a href="https://github.com/spenchh/fpga-motors" target="_blank" rel="noopener">spenchh/fpga-motors</a>, which is also what this documentation site deploys from.</p>
<p>Guidance from the cross-check on what belongs in the repo: RTL, testbenches, MATLAB scripts and dated notes should be tracked. Altium binaries, backup directories, meeting <code>.docx</code> files and planning spreadsheets are better kept local or handled deliberately, since binaries in git history are effectively permanent.</p>
${cite('crosscheck')}`)}

${collapse('SimpleFOC — reference only', 'reference', `
<p>SimpleFOC is an open-source Arduino FOC library. It is <strong>not</strong> the architecture being built here — it runs on a microcontroller, not in fabric, and targets much lower voltages.</p>
<p>Its value is as a known-good reference. Their <a href="https://docs.simplefoc.com/test_driver" target="_blank" rel="noopener">driver test</a>, <a href="https://docs.simplefoc.com/test_sensor" target="_blank" rel="noopener">sensor test</a> and <a href="https://docs.simplefoc.com/alignment_procedure" target="_blank" rel="noopener">alignment procedure</a> pages describe a sensible incremental bring-up order that applies regardless of implementation technology. The alignment procedure in particular addresses the open Hall-sequence commissioning question.</p>
<p>Historical note from the research log: SimpleFOC DriveShield v1.2 is rated 30 V maximum input — a study reference, not a template for 96 V hardware.</p>
${cite('research')}`)}

${collapse('TI components on the board', 'in use', `
<p>Four part families, all Texas Instruments, all with public datasheets:</p>
<ul>
<li><strong><a href="${SRC.ds_ucc.url}" target="_blank" rel="noopener">UCC21222</a></strong> — isolated dual-channel gate driver with disable. Source for the active-high DIS behaviour and the resistor-programmed dead time.</li>
<li><strong><a href="${SRC.ds_amc1300.url}" target="_blank" rel="noopener">AMC1300</a></strong> — isolated amplifier, fixed gain 8.2, ±250 mV input. Phase current.</li>
<li><strong><a href="${SRC.ds_amc1311.url}" target="_blank" rel="noopener">AMC1311</a></strong> — isolated amplifier, 2 V input range. Voltage sense.</li>
<li><strong><a href="${SRC.ds_opa.url}" target="_blank" rel="noopener">OPA4388</a></strong> — quad precision op-amp forming the unity-gain diff stages. Its pinout is the subject of the most serious open red flag.</li>
</ul>
<p>Chip behaviour throughout this site comes from these datasheets, never from the board files. The board files establish connectivity; the datasheets establish what the connected parts do.</p>
${cite('crosscheck')}`)}
`
};

/* ------------------------------------------------------- 9. QUESTIONS */
PAGES.questions = {
  title: 'Open Questions & Blockers',
  lede: 'Everything unresolved, who owns it, and what it blocks. This is the working list — answering the top four unblocks most of the project.',
  html: `
<div id="q-summary"></div>
<h2 id="all">The full list</h2>
<div id="q-list"></div>

<h2 id="ask">Sending these out</h2>
<p>The ten PCB-team questions are collected in copy-ready form on the <a href="#/pcb-flags">Netlist Red Flags</a> page. The ten FPGA-relevant questions from the project notes are below.</p>
${collapse('FPGA-side questions, ready to paste', 'copy-friendly', cb('FPGA questions', 'text', `
1.  Can the PCB team confirm the board-side net-to-header mapping so I can write
    the Arty/Zynq XDC?
2.  Are MCU HALL A/B/C 3.3 V safe at the Arty input, or still pulled to 5 V?
3.  Are MCU CSENSE A/B/C, MCU VSENSE A, MCU VSENSE Vm, and MCU MOTOR THERM going
    to Arty XADC, an external ADC, or something else?
4.  What min/max voltage reaches the ADC for each analog signal?
5.  What voltage equals zero current on MCU CSENSE A/B/C?
6.  How are positive and negative phase currents represented?
7.  Should the FPGA generate non-overlap between HI/LO, or should the UCC21222
    dead-time resistors handle the full timing?
8.  Can DISABLE be treated as active-high, low-to-run, and held high until FPGA
    logic and sensor data are ready?
9.  Is 20 kHz the target PWM frequency?
10. Is the first control goal Hall-assisted FOC bring-up, with sensorless FOC as
    later research?`))}
${cite('known')}
`
};

/* -------------------------------------------------------- 10. TIMELINE */
PAGES.timeline = {
  title: 'Timeline & Progress',
  lede: 'What happened, in order, including what turned out to be wrong and had to be corrected.',
  html: `
<div id="timeline-list"></div>

<h2 id="corrections">Corrections that mattered</h2>
<p>Three assumptions were wrong and were caught by the August 5 netlist extraction. They are worth recording because each would have caused real problems downstream.</p>
${table(['Was believed', 'Actually true', 'Consequence if uncaught'], [
  ['The gate driver generates the complementary output, so the FPGA needs 3 PWM lines plus enable', 'The UCC21222 inserts dead time between two signals you provide. The FPGA needs 6 PWM lines plus DISABLE.', 'Three of the six driver inputs would have been left floating. The bridge would not have switched correctly.'],
  ['Hall input was not confirmed, so the decoder was optional', '<code>MCU HALL A/B/C</code> are real digital inputs on J5', 'The near-term Hall-assisted FOC path would have had no angle source in RTL.'],
  ['There are 5 analog channels', 'There are 6 — <code>MCU MOTOR THERM</code> appeared in no earlier FPGA or MATLAB document', 'A routed board signal would have had nowhere to go on the controller side.']
])}
${cite('crosscheck')}

<h2 id="superseded">Superseded documents</h2>
${callout('open', 'Two notes describe the OLD board — do not use them for decisions',
  `<ul>
   <li><code>FPGA_BOARD_INTERFACE_2026-07-29.md</code> — describes TMCS1126 current sensing, <code>nOC A/B</code> fault lines, and current measured on phases A and B only. All three are wrong for the current board.</li>
   <li><code>UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md</code> — explicitly marked superseded. Two of its claims were corrected: <code>nOC</code>/<code>FAULT</code> do not appear in the updated extraction, and Hall is confirmed digital.</li>
   </ul>
   <p>Both are kept as history. If a claim in either contradicts the August 5 cross-check, the cross-check wins.</p>`)}
${cite('boardif', 'review', 'crosscheck')}

<h2 id="ready">Ready vs not ready</h2>
${table(['', 'Ready for Vivado simulation', 'Ready for a bitstream'], [
  ['RTL files', badge('confirmed') + ' Six modules exist', badge('open') + ' No top-level wrapper'],
  ['Testbenches', badge('confirmed') + ' Six benches exist', '—'],
  ['Constraints', 'Not needed', badge('open') + ' Blocked on pin map'],
  ['Board part', 'Not needed', badge('open') + ' Variant unconfirmed'],
  ['Analog path', 'Not needed', badge('open') + ' Route and scaling unknown'],
  ['I/O safety', 'Not needed', badge('open') + ' Hall 5 V unresolved'],
  ['<strong>Verdict</strong>', '<strong>' + badge('confirmed') + ' Go</strong>', '<strong>' + badge('open') + ' Blocked</strong>']
])}

<h2 id="next">What to do next</h2>
<div class="checklist" id="timeline-checklist"></div>
`
};

/* ----------------------------------------------------------- 11. LINKS */
PAGES.links = {
  title: 'Resource Library',
  lede: 'Categorised references, weighted toward official vendor documentation. Videos are marked and are learning resources — final technical claims should come from datasheets and manuals.',
  html: `
${callout('info', 'Source hierarchy used throughout this site',
  `<p>Official documentation from TI, MathWorks, AMD/Xilinx, Digilent, Arduino, SimpleFOC, Tektronix, Keysight and Altium is preferred for technical claims. YouTube videos are included as learning resources and marked with a video tag. Where a claim on this site comes from a datasheet, the datasheet is cited directly.</p>`)}

<h2 id="order">Suggested learning order</h2>
<p>If you are new to this project, work through these in sequence.</p>
<div id="learning-order"></div>

<h2 id="library">Full library</h2>
<div id="links-library"></div>
`
};

/* -------------------------------------------------------- 12. GLOSSARY */
/* -------------------------------------------------------- 4. SIGNAL MAP */
PAGES.signals = {
  title: 'Signal Map',
  lede: 'Every net that crosses between the driver board and the controller, in one filterable table. Header positions are read from the parsed netlist; the Arduino pin names are inferred from the standard Uno layout and are not yet confirmed.',
  html: `
<h2 id="counts">What crosses the connector</h2>
<p class="meta-line">${badge('confirmed')} Header positions read from the parsed netlist ${updated('2026-08-05')}</p>
<p>Seventeen nets in total: <strong>seven digital outputs</strong> (six PWM plus DISABLE),
<strong>three digital inputs</strong> (Hall A/B/C), <strong>six analog inputs</strong>
(three current, two voltage, one thermistor), and one spare pair.</p>
<p>The distinction that matters for RTL: the controller emits <em>three</em> duty commands, and the
FPGA expands each into a physical HI/LO pair. Six pins, three commands — see
<a href="#/fpga-pwm">the PWM generator</a>.</p>
${cite('crosscheck', 'known')}

<h2 id="map">Full signal map</h2>
<div id="signal-map"></div>

<h2 id="unrouted">Unrouted and unconnected positions</h2>
<div id="signal-unrouted"></div>

<h2 id="vdiv">Voltage sense scaling</h2>
${widget('vdiv', 'Voltage divider calculator',
  'Generated explanatory model. Resistor values are read from the netlist; the ADC full scale is unknown, so the last stage of the chain cannot be computed.')}

<h2 id="levels">Voltage levels ${badge('open')} ${badge('pcbteam')}</h2>
<p>Two level questions are unresolved and both block connecting hardware:</p>
<ul>
  <li>The three <strong>Hall inputs</strong> carry 10 kΩ pull-ups to <strong>5 V</strong>. Zynq I/O banks are
  not 5 V tolerant, and the 100 Ω series resistor is not adequate protection on its own.
  Until the pull-ups move to <code>3V3</code>, do not connect these lines.</li>
  <li>The <strong>shield header I/O bank voltage</strong> is unconfirmed, which sets the
  <code>IOSTANDARD</code> in the XDC. This one can be answered without anyone else — build a throwaway
  LED blink project and check.</li>
</ul>
${cite('crosscheck', 'arty_rm')}

<h2 id="analog">Where the analog signals go ${badge('open')} ${badge('pcbteam')}</h2>
<p>All six analog channels terminate on J3. Whether they reach the XADC, an external ADC, or a
PS-side path is <strong>not established by the board files</strong> — an Arty Z7 having six
single-ended XADC inputs is suggestive, not confirmation. This blocks the current-loop timing
budget and every analog scaling constant.</p>
${cite('crosscheck', 'xadc')}`
};

PAGES.glossary = {
  title: 'Glossary',
  lede: 'Terms used across this site. Any underlined term in the body text shows its definition on hover.',
  html: `<div id="glossary-list"></div>`
};

/* --------------------------------------------------------- checklists */
const CHECKLISTS = {
  'fpga-checklist': [
    'Install Vivado and the Digilent Arty Z7 board files',
    'Create a Vivado project, add the six RTL files and the six testbenches',
    'Run behavioural simulation on each bench and record what actually happens',
    'Add a directed test for the negative-magnitude case in the current limit monitor',
    'Add a dead-time measurement check to the PWM bench, not just non-overlap',
    'Build a separate LED blink project to learn the XDC workflow',
    'Confirm the real PL fabric clock and the shield header I/O bank voltage from that project',
    'Write a top-level wrapper tying the six modules together',
    'Send the ten PCB questions and get the pin map confirmed',
    'Once the pin map lands, write the XDC',
    'Fill in current and voltage scaling in board_interface_config.m and re-run the check',
    'Move PI / Clarke / Park into Simulink, then HDL Coder'
  ],
  'vivado-checklist': [
    'Vivado installed and licensed',
    'Digilent board files installed and Arty Z7 selectable',
    'Arty Z7 variant confirmed with the team (Z7-10 vs Z7-20)',
    'RTL project created with no sources initially',
    'Six RTL files added as design sources',
    'Six testbenches added as simulation sources',
    'No XDC added yet — correct at this stage',
    'Simulation top set to a single testbench',
    'Behavioural simulation runs to completion',
    'Tcl console checked for ERROR lines before trusting the PASS line',
    'Result recorded for each of the six benches',
    'Waveform inspected for the PWM non-overlap window specifically'
  ],
  'timeline-checklist': [
    'Run the six testbenches in Vivado — the single highest-value unblocked task',
    'Send the ten PCB questions, prioritising the OPA4388 pinout and the 12V ISO source',
    'Get the Hall 5 V pull-up resolved before any hardware connection',
    'Decide the dead-time policy with the team',
    'Confirm 20 kHz as the target PWM frequency',
    'Write the top-level wrapper',
    'Learn the XDC workflow on a throwaway LED project',
    'Keep board_interface_config.m as the single source of truth and re-run the check after every answer'
  ]
};
