/* ===========================================================================
   build-kb.mjs — knowledge-base builder for the SURG project assistant

   Reads the real project files (markdown notes, Verilog RTL, MATLAB sources)
   and emits assets/js/kb.js: a flat array of retrieval chunks, each carrying
   the metadata the assistant needs to answer a *specific* question and cite
   exactly where the answer came from.

   Run:  node tools/build-kb.mjs
   ===========================================================================

   Chunking is by topic boundary, never by blind character count:
     markdown  -> one chunk per heading section, long sections split at
                  sub-headings or paragraph groups
     verilog   -> port list, parameters, and each commented logic block
     matlab    -> %% sections, function bodies, cfg.<group> runs

   Every chunk gets:  file, path, heading, lines, topics, status, tier,
   updated, page.  Status is inferred from heading wording and inline
   markers, then hand-corrected by OVERRIDES below where the wording lies.
   =========================================================================== */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'js', 'kb.js');

/* ------------------------------------------------------------------ inputs */

const MD_FILES = [
  'README.md',
  'FPGA_KNOWN_INFO_2026-08-05.md',
  'FPGA_TODO.md',
  'PCB_CROSSCHECK_2026-08-05.md',
  'UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md',
  'PCB_REVIEW_PROMPT_2026-08-05.md',
  'SURG_FPGA_FOC.md',
  'PROJECT_NOTE_2026-07-27_PCB_FPGA_FOC.md',
  'FPGA_BOARD_INTERFACE_2026-07-29.md',
  'FPGA_SOFTWARE_PROGRESS_2026-07-29.md',
  'FPGA_SOFTWARE_WORKPLAN.md',
  'TOMORROW_3PWM_SIMPLEFOC_AND_PROGRESS_GUIDE_2026-08-01.md',
  'ARDUINO_STARTER_KIT_AND_SIMPLEFOC_PROGRESS_2026-08-03.md',
  'fpga/README.md',
  'matlab/README.md',
];

const RTL_FILES = [
  'fpga/rtl/pwm_3phase_center_aligned.v',
  'fpga/rtl/hall_decoder.v',
  'fpga/rtl/pcb_disable_control.v',
  'fpga/rtl/phase_current_balance_monitor.v',
  'fpga/rtl/phase_current_limit_monitor.v',
  'fpga/rtl/voltage_sense_monitor.v',
];

const TB_FILES = [
  'fpga/tb/tb_pwm_3phase_center_aligned.v',
  'fpga/tb/tb_hall_decoder.v',
  'fpga/tb/tb_pcb_disable_control.v',
  'fpga/tb/tb_phase_current_balance_monitor.v',
  'fpga/tb/tb_phase_current_limit_monitor.v',
  'fpga/tb/tb_voltage_sense_monitor.v',
];

const M_FILES = [
  'matlab/board_interface_config.m',
  'matlab/board_interface_check.m',
  'matlab/foc_fixed_point_starter.m',
  'matlab/stage1_3pwm_foc_sim.m',
];

/* file -> the site page that explains it, so answers can deep-link */
const PAGE_FOR = {
  'README.md': '#/overview',
  'FPGA_KNOWN_INFO_2026-08-05.md': '#/state',
  'FPGA_TODO.md': '#/questions',
  'PCB_CROSSCHECK_2026-08-05.md': '#/pcb',
  'UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md': '#/pcb',
  'PCB_REVIEW_PROMPT_2026-08-05.md': '#/pcb',
  'SURG_FPGA_FOC.md': '#/foc',
  'PROJECT_NOTE_2026-07-27_PCB_FPGA_FOC.md': '#/timeline',
  'FPGA_BOARD_INTERFACE_2026-07-29.md': '#/signals',
  'FPGA_SOFTWARE_PROGRESS_2026-07-29.md': '#/timeline',
  'FPGA_SOFTWARE_WORKPLAN.md': '#/timeline',
  'TOMORROW_3PWM_SIMPLEFOC_AND_PROGRESS_GUIDE_2026-08-01.md': '#/timeline',
  'ARDUINO_STARTER_KIT_AND_SIMPLEFOC_PROGRESS_2026-08-03.md': '#/timeline',
  'fpga/README.md': '#/fpga',
  'matlab/README.md': '#/matlab',
};

/* Notes that describe an older board revision. Retrieval keeps them but
   ranks them below current sources and labels them in the UI. */
const SUPERSEDED = new Set([
  'FPGA_BOARD_INTERFACE_2026-07-29.md',
  'FPGA_SOFTWARE_PROGRESS_2026-07-29.md',
  'FPGA_SOFTWARE_WORKPLAN.md',
  'TOMORROW_3PWM_SIMPLEFOC_AND_PROGRESS_GUIDE_2026-08-01.md',
]);

/* --------------------------------------------------------------- metadata */

const TOPIC_RULES = [
  ['disable', /\bdisable\b|\bdis pin\b|inhibit|fail[- ]safe|latch/i],
  ['pwm', /\bpwm\b|duty|carrier|center[- ]aligned|switching freq/i],
  ['deadtime', /dead[- ]?time|non[- ]?overlap|interlock|shoot[- ]through/i],
  ['hall', /\bhall\b|sector|commutation|120 degree|six[- ]step/i],
  ['current-sense', /csense|current sens|shunt|amc1300|overcurrent|phase current/i],
  ['voltage-sense', /vsense|voltage sens|divider|amc1311|bus voltage|dc link/i],
  ['gate-driver', /ucc21222|gate driver|half[- ]bridge|mosfet|bootstrap/i],
  ['opamp', /opa4388|op[- ]?amp|buffer|differential stage/i],
  ['pcb', /\bpcb\b|altium|schematic|netlist|header|connector|j[0-9]\.|footprint|silkscreen/i],
  ['fpga', /\bfpga\b|\brtl\b|verilog|module|testbench|\.v\b|synthesis/i],
  ['vivado', /vivado|bitstream|\bxdc\b|constraint|elaborat|implement/i],
  ['zynq', /zynq|arty|\bps\b\/\bpl\b|processing system|programmable logic|axi/i],
  ['adc', /\badc\b|xadc|sample|quantiz|lsb|conversion/i],
  ['matlab', /matlab|simulink|hdl coder|\.m\b|script/i],
  ['foc', /\bfoc\b|clarke|park|field[- ]oriented|\bd-?q\b|rotor angle/i],
  ['fixed-point', /fixed[- ]point|q1\.15|q[0-9]+\.[0-9]+|q-?format|saturat/i],
  ['pi-loop', /\bpi\b loop|integrator|anti[- ]windup|gain|controller tuning/i],
  ['sensorless', /sensorless|observer|back[- ]?emf|flux estimat/i],
  ['safety', /safety|protect|trip|fault|limit|clamp|damage|tolerant/i],
  ['thermal', /therm|temperature|ntc|overheat/i],
  ['blocker', /blocker|blocked|cannot|must be confirmed|before fab|red flag/i],
  ['next-steps', /next step|todo|to do|action|checklist|need to/i],
];

function topicsFor(text, extra = []) {
  const found = new Set(extra);
  for (const [name, re] of TOPIC_RULES) if (re.test(text)) found.add(name);
  return [...found];
}

/* Heading wording is the strongest status signal in these notes. */
const STATUS_BY_HEADING = [
  [/confirmed|verified|proven|extracted from/i, 'confirmed'],
  [/likely|needs confirmation|probable|assum|inferred|mapping/i, 'inferred'],
  [/question|open|still needed|unknown|blocker|red flag|wrong or stale|to ask|todo|next/i, 'open'],
];

function statusFor(heading, body) {
  for (const [re, s] of STATUS_BY_HEADING) if (re.test(heading)) return s;
  if (/^\s*-\s*\[ \]/m.test(body)) return 'open';
  if (/\bTODO\b|\bNaN\b|must be confirmed|not confirmed|unknown|needs? (visual|confirmation)/i.test(body)) return 'open';
  if (/\bcannot\b|\bblocked\b|do not assume/i.test(body)) return 'open';
  if (/likely|appears to|probably|inferred|assumption/i.test(body)) return 'inferred';
  return 'confirmed';
}

/* Source tiers drive ranking: lower wins.
   1 project files · 2 datasheets · 3 official docs · 4 app notes · 5 video */
function tierForUrl(u) {
  if (/youtube\.com|youtu\.be|\/video/i.test(u)) return 5;
  if (/\/lit\/an\/|document-viewer\/lit|\/primer|whitepaper/i.test(u)) return 4;
  if (/\/lit\/ds\/|\/lit\/gpn\/|datasheet/i.test(u)) return 2;
  if (/docs\.amd\.com|digilent\.com\/reference|mathworks\.com\/help|docs\.arduino\.cc|docs\.simplefoc\.com|altium\.com\/documentation|source\.simplefoc\.com/i.test(u)) return 3;
  return 3;
}

/* Date from the filename where the note carries one, else git's last commit. */
const gitDateCache = new Map();
function updatedFor(rel) {
  const m = rel.match(/(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  if (gitDateCache.has(rel)) return gitDateCache.get(rel);
  let d = '';
  try {
    d = execSync(`git log -1 --format=%cs -- "${rel}"`, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch { /* file may be untracked; leave blank */ }
  gitDateCache.set(rel, d);
  return d;
}

/* ------------------------------------------------------------------ utils */

const chunks = [];
const seenIds = new Set();

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

function push(c) {
  let id = c.id;
  let n = 2;
  while (seenIds.has(id)) id = `${c.id}-${n++}`;
  seenIds.add(id);
  chunks.push({ ...c, id });
}

function clean(s) {
  return s.replace(/\r/g, '').replace(/[ \t]+$/gm, '').trim();
}

/* Words that carry no retrieval signal but bloat every chunk's term vector. */
function textOf(md) {
  return clean(md)
    .replace(/```[\s\S]*?```/g, m => m.replace(/```\w*\n?/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Drop keyword/tag dumps. They match almost any query on sheer term count
    // and read as noise when quoted back as evidence.
    .split('\n')
    .filter(l => !/^[-*]?\s*(keywords?|tags?)\s*[/\\]?\s*(tags?)?\s*:/i.test(l))
    .filter(l => (l.match(/;/g) || []).length < 8)
    .join('\n');
}

/* --------------------------------------------------------- markdown ingest */

/* Split a heading section further when it is long enough to hold several
   distinct facts — otherwise a 60-line "Confirmed from files" block answers
   every board question with the same wall of text, which is the exact
   failure this rewrite exists to remove. */
function splitLongSection(body, maxLines = 14) {
  const lines = body.split('\n');
  if (lines.length <= maxLines) return [body];

  const groups = [];
  let cur = [];
  for (const line of lines) {
    const isSubHeading = /^###+\s/.test(line);
    const isBoldLead = /^\*\*[^*]+\*\*/.test(line);
    const isBlank = /^\s*$/.test(line);
    if ((isSubHeading || isBoldLead) && cur.some(l => l.trim())) {
      groups.push(cur.join('\n'));
      cur = [line];
      continue;
    }
    if (isBlank && cur.length >= maxLines && cur.some(l => l.trim())) {
      groups.push(cur.join('\n'));
      cur = [];
      continue;
    }
    cur.push(line);
  }
  if (cur.some(l => l.trim())) groups.push(cur.join('\n'));
  return groups.filter(g => g.trim());
}

function ingestMarkdown(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) { console.warn('  ! missing', rel); return 0; }
  const raw = clean(readFileSync(abs, 'utf8'));
  const lines = raw.split('\n');

  const docTitle = (lines.find(l => /^#\s/.test(l)) || rel).replace(/^#\s*/, '');
  const page = PAGE_FOR[rel] || '#/overview';
  const updated = updatedFor(rel);
  const superseded = SUPERSEDED.has(rel);

  // Locate every heading; sections run to the next heading of same-or-higher level.
  const heads = [];
  lines.forEach((l, i) => {
    const m = l.match(/^(#{1,4})\s+(.*)$/);
    if (m) heads.push({ level: m[1].length, title: m[2].trim(), line: i });
  });

  let made = 0;
  const sections = [];
  if (!heads.length || heads[0].line > 0) {
    sections.push({ title: docTitle, line: 0, end: heads.length ? heads[0].line : lines.length });
  }
  heads.forEach((h, i) => {
    if (h.level === 1 && i === 0 && heads.length > 1) return; // doc title, not a section
    sections.push({ title: h.title, line: h.line + 1, end: heads[i + 1] ? heads[i + 1].line : lines.length });
  });

  for (const sec of sections) {
    const body = lines.slice(sec.line, sec.end).join('\n').trim();
    if (body.length < 40) continue;

    const parts = splitLongSection(body);
    parts.forEach((part, pi) => {
      const text = textOf(part);
      if (text.length < 40) return;
      const status = statusFor(sec.title, part);
      push({
        id: `${slug(basename(rel, '.md'))}--${slug(sec.title)}${parts.length > 1 ? '-' + (pi + 1) : ''}`,
        kind: 'doc',
        file: rel,
        path: './' + rel,
        title: sec.title === docTitle ? docTitle : `${docTitle} — ${sec.title}`,
        heading: sec.title,
        text,                        // markdown-lite: bullets survive, syntax does not
        topics: topicsFor(sec.title + '\n' + text),
        status,
        tier: 1,
        superseded,
        updated,
        page,
        lines: [sec.line + 1, sec.end],
      });
      made++;
    });
  }
  return made;
}

/* ---------------------------------------------------------- verilog ingest */

function ingestVerilog(rel, isTb) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) { console.warn('  ! missing', rel); return 0; }
  const raw = clean(readFileSync(abs, 'utf8'));
  const lines = raw.split('\n');
  const name = basename(rel, '.v');
  const updated = updatedFor(rel);
  const page = isTb ? '#/fpga-tb' : '#/fpga';
  let made = 0;

  const emit = (suffix, heading, from, to, extraTopics) => {
    const body = lines.slice(from, to).join('\n').trim();
    if (body.length < 30) return;
    push({
      id: `${slug(name)}--${suffix}`,
      kind: isTb ? 'tb' : 'rtl',
      file: rel,
      path: './' + rel,
      title: `${name}.v — ${heading}`,
      heading,
      code: body,                    // text is derived from this at load time
      lang: 'verilog',
      topics: topicsFor(name.replace(/_/g, ' ') + ' ' + heading + '\n' + body, extraTopics),
      status: 'confirmed',           // the file's own content is a fact
      tier: 1,
      superseded: false,
      updated,
      page,
      lines: [from + 1, to],
    });
    made++;
  };

  /* Name a block by what it drives, so "what sets pwm_enable" can match the
     block that assigns it rather than the whole file. */
  const drivenBy = (from, to) => {
    const sigs = new Set();
    for (let k = from; k < to; k++) {
      const m = lines[k].match(/^\s*([a-z_][a-z0-9_]*)\s*(?:\[[^\]]*\])?\s*<?=[^=]/i);
      if (m && !/^(if|else|case|begin|end|for|while)$/i.test(m[1])) sigs.add(m[1]);
    }
    return [...sigs].slice(0, 4).join(', ');
  };

  // 1. Header comment block, if the file opens with one.
  let i = 0;
  while (i < lines.length && (/^\s*($|`timescale)/.test(lines[i]) || /^\s*\/\//.test(lines[i]))) i++;
  if (i > 1 && lines.slice(0, i).some(l => /^\s*\/\//.test(l))) emit('header', 'purpose', 0, i, ['fpga']);

  // 2. Module declaration through the closing of the port list — the single
  //    most useful chunk for "what are the inputs and outputs of X".
  const modStart = lines.findIndex(l => /^\s*module\s/.test(l));
  if (modStart >= 0) {
    let depth = 0, portEnd = modStart;
    for (let k = modStart; k < lines.length; k++) {
      depth += (lines[k].match(/\(/g) || []).length;
      depth -= (lines[k].match(/\)/g) || []).length;
      if (depth <= 0 && k > modStart && /\)/.test(lines[k])) { portEnd = k + 1; break; }
    }
    emit('ports', 'module declaration, parameters and ports', modStart, portEnd, ['fpga']);
  }

  // 3. Split the body into declarations, each always/initial block, and the
  //    assign group. These files carry almost no inline comments, so block
  //    structure — not comment text — is what gives usable granularity.
  const bodyStart = lines.findIndex((l, k) => k > 0 && /^\s*(always|assign|localparam|reg |wire |initial)/.test(l));
  if (bodyStart < 0) return made;

  const blocks = [];
  for (let k = bodyStart; k < lines.length; k++) {
    const m = lines[k].match(/^\s*(always\s*@|always_ff|always_comb|initial\b)/);
    if (!m) continue;
    // Walk begin/end depth to find the block's true end.
    let depth = 0, started = false, end = k + 1;
    for (let j = k; j < lines.length; j++) {
      const opens = (lines[j].match(/\bbegin\b/g) || []).length;
      const closes = (lines[j].match(/\bend\b(?!module|case|function|task|generate)/g) || []).length;
      depth += opens - closes;
      if (opens) started = true;
      if (started && depth <= 0) { end = j + 1; break; }
      if (!started && /;\s*$/.test(lines[j]) && j > k) { end = j + 1; break; }
      end = j + 1;
    }
    blocks.push({ from: k, to: end });
    k = end - 1;
  }

  // Declarations = everything from bodyStart to the first block.
  const firstBlock = blocks.length ? blocks[0].from : lines.length;
  if (firstBlock > bodyStart) {
    // Purely combinational modules have no always block at all — what would
    // otherwise be "declarations" is in fact the whole implementation.
    const decls = lines.slice(bodyStart, firstBlock);
    const isAllLogic = !blocks.length && decls.some(l => /^\s*assign\s/.test(l));
    const driven = isAllLogic ? drivenBy(bodyStart, firstBlock) : '';
    emit(
      isAllLogic ? 'implementation' : 'declarations',
      isAllLogic
        ? `combinational implementation${driven ? ` driving ${driven}` : ''}`
        : 'parameters, registers and wires',
      bodyStart, firstBlock, ['fpga']
    );
  }

  blocks.forEach((b, i) => {
    // A comment immediately above the block is the best available label.
    let label = '';
    for (let k = b.from - 1; k >= Math.max(0, b.from - 3); k--) {
      const cm = lines[k].match(/^\s*\/\/\s*(.+)$/);
      if (cm && cm[1].length > 8) { label = cm[1].replace(/[.:]$/, '').toLowerCase(); break; }
      if (lines[k].trim()) break;
    }
    const driven = drivenBy(b.from, b.to);
    const heading = label || (driven ? `logic driving ${driven}` : `sequential block ${i + 1}`);
    emit(slug(heading) || 'block-' + (i + 1), heading, b.from, b.to, ['fpga']);
  });

  // Trailing continuous assignments, if any sit after the last block.
  const lastEnd = blocks.length ? blocks[blocks.length - 1].to : firstBlock;
  const tail = lines.slice(lastEnd).filter(l => /^\s*assign\s/.test(l));
  if (tail.length) {
    emit('assignments', `continuous assignments (${drivenBy(lastEnd, lines.length) || 'outputs'})`, lastEnd, lines.length, ['fpga']);
  }
  return made;
}

/* ----------------------------------------------------------- matlab ingest */

function ingestMatlab(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) { console.warn('  ! missing', rel); return 0; }
  const raw = clean(readFileSync(abs, 'utf8'));
  const lines = raw.split('\n');
  const name = basename(rel, '.m');
  const updated = updatedFor(rel);
  let made = 0;

  const emit = (suffix, heading, from, to) => {
    const body = lines.slice(from, to).join('\n').trim();
    if (body.length < 30) return;
    push({
      id: `${slug(name)}--${suffix}`,
      kind: 'matlab',
      file: rel,
      path: './' + rel,
      title: `${name}.m — ${heading}`,
      heading,
      code: body,                    // text is derived from this at load time
      lang: 'matlab',
      topics: topicsFor(name.replace(/_/g, ' ') + '\n' + body, ['matlab']),
      status: /TODO|NaN|verify|unknown/i.test(body) ? 'open' : 'confirmed',
      tier: 1,
      superseded: false,
      updated,
      page: '#/matlab',
      lines: [from + 1, to],
    });
    made++;
  };

  // %% cell markers where present
  const cells = [];
  lines.forEach((l, i) => { if (/^\s*%%\s?/.test(l)) cells.push({ i, title: l.replace(/^\s*%%\s?/, '').trim() }); });
  if (cells.length) {
    if (cells[0].i > 0) emit('header', 'header', 0, cells[0].i);
    cells.forEach((c, k) => emit(slug(c.title || 'section-' + k), c.title || `section ${k + 1}`, c.i, cells[k + 1] ? cells[k + 1].i : lines.length));
    return made;
  }

  // Config files: group consecutive cfg.<group> assignments.
  const groups = new Map();
  let headerEnd = 0;
  lines.forEach((l, i) => {
    const m = l.match(/^\s*cfg\.([a-z_]+)\./i);
    if (m) {
      if (!groups.has(m[1])) groups.set(m[1], { from: i, to: i });
      groups.get(m[1]).to = i + 1;
      if (!headerEnd) headerEnd = i;
    }
  });
  if (groups.size) {
    emit('header', 'purpose', 0, headerEnd);
    for (const [g, r] of groups) emit('cfg-' + slug(g), `cfg.${g} settings`, r.from, r.to);
    return made;
  }

  // Otherwise: leading comment header, then the whole body.
  let i = 0;
  while (i < lines.length && /^\s*(%|function|$)/.test(lines[i])) i++;
  if (i > 1) emit('header', 'purpose', 0, i);
  emit('body', 'implementation', i, lines.length);
  return made;
}

/* -------------------------------------------- online sources from data.js */

/* data.js declares plain consts, so evaluating it in a sandbox is the
   cheapest way to keep the link library and the KB from drifting apart. */
function loadDataJs() {
  const src = readFileSync(join(ROOT, 'assets', 'js', 'data.js'), 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  new vm.Script(src + '\n;globalThis.__out = { LINKS, SRC, SIGNALS, QUESTIONS, RTL_MODULES, GLOSSARY };')
    .runInContext(sandbox);
  return sandbox.__out;
}

function ingestLinks(LINKS) {
  let made = 0;
  for (const group of LINKS) {
    for (const item of group.items) {
      const tier = tierForUrl(item.u);
      const text = `${item.t}. ${item.d || ''}`;
      push({
        id: `link--${slug(item.t)}`,
        kind: 'link',
        file: group.cat,
        path: item.u,
        url: item.u,
        title: item.t,
        heading: group.cat,
        text,
        topics: topicsFor(`${group.cat} ${text}`),
        status: 'confirmed',
        tier,
        superseded: false,
        updated: '',
        page: '#/links',
        lines: null,
      });
      made++;
    }
  }
  return made;
}

/* ------------------------------------------------------------------- main */

console.log('Building knowledge base...\n');

let n;
console.log('markdown:');
for (const f of MD_FILES) { n = ingestMarkdown(f); if (n) console.log(`  ${String(n).padStart(3)}  ${f}`); }

console.log('\nverilog rtl:');
for (const f of RTL_FILES) { n = ingestVerilog(f, false); if (n) console.log(`  ${String(n).padStart(3)}  ${f}`); }

console.log('\nverilog testbenches:');
for (const f of TB_FILES) { n = ingestVerilog(f, true); if (n) console.log(`  ${String(n).padStart(3)}  ${f}`); }

console.log('\nmatlab:');
for (const f of M_FILES) { n = ingestMatlab(f); if (n) console.log(`  ${String(n).padStart(3)}  ${f}`); }

console.log('\nonline sources:');
const data = loadDataJs();
n = ingestLinks(data.LINKS);
console.log(`  ${String(n).padStart(3)}  from LINKS in data.js`);

/* ------------------------------------------------------------------ emit */

const byStatus = chunks.reduce((a, c) => (a[c.status] = (a[c.status] || 0) + 1, a), {});
const byKind = chunks.reduce((a, c) => (a[c.kind] = (a[c.kind] || 0) + 1, a), {});

if (!existsSync(dirname(OUT))) mkdirSync(dirname(OUT), { recursive: true });

const header = `/* ===========================================================================
   kb.js — GENERATED FILE, DO NOT EDIT BY HAND

   Built by tools/build-kb.mjs from the project's own markdown notes, Verilog
   RTL, MATLAB sources and the curated link library in data.js.

   Regenerate after editing any project file:   node tools/build-kb.mjs

   ${chunks.length} chunks · ${Object.entries(byKind).map(([k, v]) => k + ' ' + v).join(' · ')}
   status: ${Object.entries(byStatus).map(([k, v]) => k + ' ' + v).join(' · ')}
   =========================================================================== */

`;

writeFileSync(OUT, header + 'const KB_CHUNKS = ' + JSON.stringify(chunks, null, 0) + ';\n');

console.log(`\nwrote ${OUT.replace(ROOT + '\\', '').replace(ROOT + '/', '')}`);
console.log(`  ${chunks.length} chunks`);
console.log(`  kind:   ${Object.entries(byKind).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`  status: ${Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`  size:   ${(readFileSync(OUT).length / 1024).toFixed(0)} KB`);
