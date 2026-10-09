/* ===========================================================================
   chatbot.js — the project assistant

   Composition and UI. The pieces it sits on:
     kb.js         generated chunks from the real project files
     retrieval.js  BM25 + intent detection + sentence extraction
     facts.js      curated direct answers with accuracy guards

   The shape of every answer is deliberate and always the same:

     1. the direct answer to the question that was asked
     2. what is Confirmed / Inferred / Open about it
     3. the evidence, quoted, with file and line
     4. full detail, collapsed
     5. sources used, collapsed, split into project files vs background
     6. follow-up questions that lead somewhere real

   It runs entirely in the browser. There is no model and no network call, so
   it never generates prose: everything it shows is either a curated sentence
   or a quotation from a project file. That is a limitation, and it is also
   why it cannot hallucinate a test result.
   =========================================================================== */

/* ------------------------------------------------------- fact matching */

const FACT_STOP = Retrieval.tokens;

const FACT_DF = (() => {
  const df = {};
  FACTS.forEach(e => new Set(Retrieval.tokens(e.k)).forEach(t => { df[t] = (df[t] || 0) + 1; }));
  return df;
})();

function scoreFact(fact, qTokens) {
  const kt = new Set(Retrieval.tokens(fact.k));
  let score = 0;
  for (const t of new Set(qTokens)) {
    let hit = kt.has(t);
    if (!hit) {
      for (const k of kt) {
        if (k.length > 3 && t.length > 3 && (k.startsWith(t) || t.startsWith(k))) { hit = true; break; }
      }
    }
    if (hit) score += Math.log(1 + FACTS.length / (FACT_DF[t] || 1)) + 1;
  }
  return score;
}

/* "What are the inputs of hall_decoder?" wants the port list out of the file,
   not a curated paragraph about Hall sensing. When the question names a real
   module and asks about its interface, skip the curated layer entirely and
   let retrieval quote the source. */
const MODULE_NAMES = (typeof KB_CHUNKS !== 'undefined' ? KB_CHUNKS : [])
  .filter(c => c.kind === 'rtl' || c.kind === 'matlab')
  .map(c => c.file.replace(/^.*\//, '').replace(/\.(v|m)$/, ''));

function isInterfaceQuestion(question) {
  const n = question.toLowerCase();
  if (!/\b(input|output|port|signal|parameter|argument|interface|declaration)s?\b/.test(n)) return false;
  return MODULE_NAMES.some(name => n.includes(name) || n.includes(name.replace(/_/g, ' ')));
}

/* A guard match beats every lexical score. This is what keeps "has anything
   been simulated" pinned to the honest answer instead of drifting to a
   passage that merely mentions simulation. */
function matchFact(question, qTokens) {
  if (isInterfaceQuestion(question)) return null;
  for (const f of FACTS) {
    if (f.must && f.must.test(question)) return { fact: f, guarded: true, score: 99 };
  }
  let best = null;
  for (const f of FACTS) {
    const s = scoreFact(f, qTokens);
    if (!best || s > best.score) best = { fact: f, guarded: false, score: s };
  }
  const threshold = Math.max(3.2, qTokens.length * 0.7);
  return best && best.score >= threshold ? best : null;
}

/* ------------------------------------------------------------- rendering */

function htmlEsc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* Chunk text keeps markdown-lite bullets; render them rather than dumping
   raw dashes into the panel. */
const CLIP = 230;
function clip(s) { return s.length > CLIP ? s.slice(0, CLIP).replace(/\s+\S*$/, '') + '…' : s; }

function renderExcerpt(text, limit = 3) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, limit);
  const bullets = lines.filter(l => /^[-*•]\s+|^\d+\.\s+/.test(l));
  if (bullets.length >= 2) {
    return '<ul>' + bullets.map(l => `<li>${htmlEsc(clip(l.replace(/^[-*•]\s+|^\d+\.\s+/, '')))}</li>`).join('') + '</ul>';
  }
  return lines.map(l => `<p>${htmlEsc(clip(l.replace(/^[-*•]\s+/, '')))}</p>`).join('');
}

const STATUS_LABEL = { confirmed: 'Confirmed', inferred: 'Inferred', open: 'Open' };

function sourceLink(chunk) {
  const where = chunk.lines ? `:${chunk.lines[0]}` : '';
  if (chunk.url) {
    return `<a href="${htmlEsc(chunk.url)}" target="_blank" rel="noopener">${htmlEsc(chunk.title)} ↗</a>`;
  }
  return `<a href="${htmlEsc(chunk.page)}" data-file="${htmlEsc(chunk.file)}">${htmlEsc(chunk.file)}${where}</a>`;
}

const TIER_LABEL = {
  1: 'Project file', 2: 'Datasheet', 3: 'Official docs', 4: 'Application note', 5: 'Video / learning aid',
};

/* --------------------------------------------------------- answer build */

function buildAnswer(question, mode) {
  const { hits, intent, qTokens } = Retrieval.search(question, { mode, limit: 8 });
  const m = Retrieval.MODES[mode] || Retrieval.MODES.quick;
  const fact = matchFact(question, qTokens);
  const conf = Retrieval.confidenceOf(hits, qTokens);

  /* Nothing curated and nothing convincing retrieved: say so plainly rather
     than dressing up the best of a bad set. Coverage is the deciding test —
     an off-topic question can still score on one incidental word, which is
     how "airspeed velocity of a swallow" once came back as a MathWorks note
     about velocity control. */
  const weak = !hits.length || conf.pct < 28 || conf.coverage < 0.34;
  if (!fact && weak) {
    return { html: fallbackHtml(question), plain: 'No reliable source found in the project files.', followUps: [] };
  }

  const projectHits = hits.filter(h => h.chunk.tier === 1);
  const backgroundHits = hits.filter(h => h.chunk.tier > 1);

  let html = '';
  let plain = '';

  /* 1 — the direct answer */
  let lead;
  if (fact) {
    lead = fact.fact.short;
  } else {
    const sents = Retrieval.bestSentences(hits[0].chunk, qTokens, m.sentences);
    lead = sents.length
      ? sents.map(s => `<p>${htmlEsc(s)}</p>`).join('')
      : `<p>${htmlEsc((Retrieval.chunkText(hits[0].chunk) || '').slice(0, 260))}…</p>`;
  }
  html += `<div class="ans-lead">${fact ? `<p>${lead}</p>` : lead}</div>`;
  plain += String(lead).replace(/<[^>]+>/g, '') + '\n\n';

  /* 2 — confidence and how settled the topic is */
  const groups = Retrieval.groupByStatus(hits);
  const chips = [];
  chips.push(`<span class="conf conf-${conf.level}" title="${htmlEsc(conf.label)}">Confidence ${conf.pct}%</span>`);
  if (fact && fact.guarded) chips.push('<span class="conf conf-guard">Project rule</span>');
  for (const k of ['confirmed', 'inferred', 'open']) {
    if (groups[k].length) chips.push(`<span class="sbadge sbadge-${k}">${STATUS_LABEL[k]} ${groups[k].length}</span>`);
  }
  html += `<div class="ans-chips">${chips.join('')}</div>`;

  /* 3 — the evidence, quoted from the files */
  const evidence = (projectHits.length ? projectHits : hits).slice(0, m.evidence);
  if (evidence.length) {
    html += '<div class="ans-evidence"><b>From the project files</b>';
    for (const h of evidence) {
      const c = h.chunk;
      const body = c.code && m.code
        ? `<pre class="ans-code"><code>${htmlEsc(c.code.split('\n').slice(0, 14).join('\n'))}</code></pre>`
        : renderExcerpt(Retrieval.chunkText(c), 3);
      html += `<figure class="ev">
        <figcaption>
          <span class="sbadge sbadge-${c.status}">${STATUS_LABEL[c.status] || c.status}</span>
          ${sourceLink(c)}
          ${c.heading ? `<em>${htmlEsc(c.heading)}</em>` : ''}
          ${c.superseded ? '<span class="sbadge sbadge-stale">superseded note</span>' : ''}
          ${c.updated ? `<span class="ev-date">updated ${htmlEsc(c.updated)}</span>` : ''}
        </figcaption>
        ${body}
      </figure>`;
      plain += `[${c.file}${c.lines ? ':' + c.lines[0] : ''}] ${Retrieval.chunkText(c).split('\n')[0]}\n`;
    }
    html += '</div>';
  }

  /* 4 — the long explanation, out of the way unless wanted */
  if (fact) {
    html += `<details class="ans-more"><summary>Full detail</summary>${fact.fact.a}</details>`;
  }

  /* 5 — every source, split by whether it is ours or background reading */
  html += '<details class="ans-src"><summary>Sources used</summary>';
  if (projectHits.length) {
    html += '<div class="src-group"><b>Known from project files</b><ul>' +
      projectHits.map(h => `<li>${sourceLink(h.chunk)} <em>${htmlEsc(h.chunk.heading || '')}</em></li>`).join('') +
      '</ul></div>';
  }
  if (backgroundHits.length) {
    html += '<div class="src-group"><b>General background</b><ul>' +
      backgroundHits.map(h => `<li>${sourceLink(h.chunk)} <span class="tier">${TIER_LABEL[h.chunk.tier]}</span></li>`).join('') +
      '</ul></div>';
  }
  if (fact) {
    html += '<div class="src-group"><b>Cited by this answer</b><ul>' +
      fact.fact.c.map(([label, href]) => {
        const ext = href && href.startsWith('http');
        return `<li><a href="${htmlEsc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${htmlEsc(label)}${ext ? ' ↗' : ''}</a></li>`;
      }).join('') + '</ul></div>';
  }
  html += `<p class="src-note">Ranking: project files first, then datasheets, then official docs,
    then application notes. Video is treated as a learning aid, never as evidence.</p>`;
  html += '</details>';

  /* 6 — guardrail, whenever the question is anywhere near validation */
  if (/simulat|test|verif|valid|proven|works|hardware|scope|measure|safe to (order|build|fab)/i.test(question)) {
    html += `<p class="ans-guard">Nothing in this project has been simulated or tested on hardware,
      and the PCB has not been fabricated. Any claim here is read from a file, not from a result.</p>`;
  }

  const followUps = Retrieval.followUps(hits, question, 3);
  return { html, plain, followUps, page: fact ? fact.fact.p : (hits[0] && hits[0].chunk.page) };
}

function fallbackHtml(question) {
  const near = Retrieval.search(question, { mode: 'quick', limit: 3 }).hits;
  let html = `<div class="ans-lead"><p><strong>I don't have a source for that.</strong>
    I answer only from the project files and the datasheets they cite, so rather than guess, this is a gap.</p></div>`;
  if (near.length) {
    html += '<div class="ans-evidence"><b>Closest things I do have</b><ul>' +
      near.map(h => `<li>${sourceLink(h.chunk)} <em>${htmlEsc(h.chunk.heading || '')}</em></li>`).join('') +
      '</ul></div>';
  }
  html += `<p class="ans-guard">If this is a real project question the documents do not cover, it belongs on the
    <a href="#/questions">Open Questions</a> page — that is where unresolved items are tracked.</p>`;
  return html;
}

/* ---------------------------------------------------------------- panel */

let CHAT_MODE = 'quick';

function chatAppend(html, who) {
  const log = document.getElementById('chatLog');
  const div = document.createElement('div');
  div.className = 'msg msg-' + who;
  div.innerHTML = html;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

/* ------------------------------------------------------------ live model */

/* The model is optional. Retrieval and citations happen here either way, so
   the sources under an answer are the same whether a model wrote the prose or
   the templates did — the model is handed passages and cannot cite anything
   it was not given. */
const AI = {
  endpoint: '/api/chat',
  state: 'unknown',        // unknown | live | offline
};

/* Minimal markdown so streamed model output reads properly. Deliberately
   narrow: no raw HTML passes through, everything is escaped first. */
function mdLite(src) {
  const blocks = htmlEsc(src).split(/\n{2,}/);
  return blocks.map(b => {
    const lines = b.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return '';
    const isList = lines.every(l => /^([-*•]|\d+\.)\s+/.test(l));
    if (isList) {
      const ordered = /^\d+\.\s/.test(lines[0]);
      const items = lines.map(l => `<li>${inline(l.replace(/^([-*•]|\d+\.)\s+/, ''))}</li>`).join('');
      return ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
    }
    return `<p>${inline(lines.join(' '))}</p>`;
  }).join('');

  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }
}

async function streamFromModel(question, mode, hits, onChunk) {
  const chunks = hits.slice(0, 8).map(h => ({
    file: h.chunk.file, heading: h.chunk.heading, lines: h.chunk.lines,
    status: h.chunk.status, tier: h.chunk.tier, updated: h.chunk.updated,
    superseded: !!h.chunk.superseded,
    text: Retrieval.chunkText(h.chunk).slice(0, 1800),
  }));

  const res = await fetch(AI.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, mode, chunks, history: CHAT_HISTORY.slice(-6) }),
  });

  if (!res.ok || !res.body) {
    const err = new Error('model unavailable (' + res.status + ')');
    err.status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += dec.decode(value, { stream: true });
    onChunk(full);
  }
  return full;
}

const CHAT_HISTORY = [];

function respond(question) {
  const res = buildAnswer(question, CHAT_MODE);

  // Offline answer is rendered immediately, then upgraded in place if a model
  // is reachable. A slow or missing backend therefore costs nothing.
  if (AI.state === 'offline') return renderAnswer(question, res);

  const { hits } = Retrieval.search(question, { mode: CHAT_MODE, limit: 8 });
  const node = chatAppend('<div class="ans-lead ans-streaming"><p><span class="typing"><i></i><i></i><i></i></span></p></div>', 'bot');
  const leadHost = node.querySelector('.ans-lead');

  streamFromModel(question, CHAT_MODE, hits, partial => {
    leadHost.classList.remove('ans-streaming');
    leadHost.innerHTML = mdLite(partial);
    const log = document.getElementById('chatLog');
    log.scrollTop = log.scrollHeight;
  }).then(full => {
    AI.state = 'live';
    CHAT_HISTORY.push({ role: 'user', content: question }, { role: 'assistant', content: full });
    leadHost.innerHTML = mdLite(full);
    // Attach the same deterministic evidence, sources and follow-ups.
    decorate(node, question, { ...res, plain: full }, true);
  }).catch(() => {
    AI.state = 'offline';
    node.remove();
    const fallback = renderAnswer(question, res);
    const note = document.createElement('p');
    note.className = 'ans-note';
    note.textContent = 'Offline mode — answering from the project files directly, without a model.';
    fallback.appendChild(note);
  });
}

function renderAnswer(question, res) {
  const node = chatAppend(res.html, 'bot');
  decorate(node, question, res, false);
  return node;
}

function decorate(node, question, res, live) {
  if (live) {
    const chips = document.createElement('div');
    chips.className = 'ans-chips';
    chips.innerHTML = '<span class="conf conf-live">Live model + project files</span>';
    node.appendChild(chips);
    const ev = res.html.match(/<div class="ans-evidence">[\s\S]*?<\/div>(?=<details|<p class="ans-guard"|$)/);
    if (ev) {
      const wrap = document.createElement('details');
      wrap.className = 'ans-src';
      wrap.innerHTML = '<summary>Passages the answer was given</summary>' + ev[0];
      node.appendChild(wrap);
    }
    const srcs = res.html.match(/<details class="ans-src">[\s\S]*?<\/details>/);
    if (srcs) node.insertAdjacentHTML('beforeend', srcs[0]);
    const guard = res.html.match(/<p class="ans-guard">[\s\S]*?<\/p>/);
    if (guard) node.insertAdjacentHTML('beforeend', guard[0]);
  }

  const bar = document.createElement('div');
  bar.className = 'ans-actions';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'chip';
  copy.textContent = 'Copy answer';
  copy.addEventListener('click', async () => {
    const text = (res.plain || node.textContent).trim();
    try { await navigator.clipboard.writeText(text); copy.textContent = 'Copied'; }
    catch { copy.textContent = 'Copy failed'; }
    setTimeout(() => { copy.textContent = 'Copy answer'; }, 1600);
  });
  bar.appendChild(copy);
  if (res.page) {
    const open = document.createElement('a');
    open.className = 'chip';
    open.href = res.page;
    open.textContent = 'Open the page';
    bar.appendChild(open);
  }
  node.appendChild(bar);

  if (res.followUps && res.followUps.length) {
    const fu = document.createElement('div');
    fu.className = 'ans-followups';
    fu.innerHTML = '<b>Next</b>';
    res.followUps.forEach(q => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = q;
      b.addEventListener('click', () => ask(q));
      fu.appendChild(b);
    });
    node.appendChild(fu);
  }
}

function ask(question) {
  chatAppend(htmlEsc(question), 'user');
  respond(question);
}

/* Suggestions follow the page you are on, so they are useful where you are. */
const PAGE_SUGGESTIONS = {
  overview: ['What is this project building?', 'Why use an FPGA instead of a microcontroller?', 'Has anything been simulated?'],
  state: ['What should I do next?', 'What are the biggest blockers?', 'What is confirmed from the netlist?'],
  architecture: ['What runs in the PS versus the PL?', 'Where does MATLAB fit in?'],
  pcb: ['What is the current sensing path?', 'What should I ask the PCB team?', 'Why six PWM lines and not three?'],
  'pcb-chips': ['What does the UCC21222 do?', 'What is the voltage sensing path?'],
  'pcb-flags': ['What is wrong with the OPA4388 pinout?', 'What powers the 12V ISO rail?'],
  signals: ['What are the digital outputs?', 'Which pins are analog inputs?'],
  fpga: ['What RTL files exist?', 'What is still missing in RTL?', 'What are the inputs of hall_decoder?'],
  'fpga-pwm': ['What PWM frequency are we using?', 'What is the deadtime policy?', 'Why centre-aligned PWM?'],
  'fpga-hall': ['How does hall_decoder.v find the sector?', 'Are the Hall pins 5 V safe?'],
  'fpga-safety': ['What does DISABLE do?', 'Is there a FAULT line?', 'Why two current monitors?'],
  'fpga-tb': ['Have the testbenches been run?', 'What do the testbenches check?'],
  matlab: ['What do the MATLAB scripts do now?', 'Why are some config values NaN?'],
  'matlab-fixed': ['Explain Q1.15 fixed point', 'Why round before shifting?'],
  'matlab-clarke': ['Explain the Clarke and Park transforms', 'Why is i_d commanded to zero?'],
  'matlab-pi': ['How is anti-windup handled?', 'How are duty cycles generated?'],
  foc: ['Are we doing sensorless FOC?', 'Why Hall first instead of sensorless?'],
  vivado: ['What files do I need for Vivado?', 'What blocks final XDC?', 'Has the RTL been compiled?'],
  questions: ['What are the biggest blockers?', 'What is the ADC route?', 'What shunt value do we use?'],
  timeline: ['What was corrected on August 5?', 'What changed about the fault line?'],
  links: ['What should I read first?'],
  tools: ['Why use an FPGA instead of a microcontroller?'],
  glossary: ['Explain Q1.15 fixed point', 'Explain the Clarke and Park transforms'],
};

const DEFAULT_SUGGESTIONS = [
  'What files do I need for Vivado?',
  'What does DISABLE do?',
  'Are we doing sensorless FOC?',
  'What is the current sensing path?',
  'What blocks final XDC?',
  'What RTL files exist?',
  'What questions should I ask the PCB team?',
];

function currentPageId() {
  const h = (location.hash || '').replace(/^#\//, '');
  return h.split('?')[0] || 'overview';
}

function renderSuggestions() {
  const host = document.getElementById('chatSuggestions');
  if (!host) return;
  const page = currentPageId();
  const list = (PAGE_SUGGESTIONS[page] || []).concat(DEFAULT_SUGGESTIONS).slice(0, 5);
  const seen = new Set();
  host.innerHTML = '';
  for (const q of list) {
    if (seen.has(q)) continue;
    seen.add(q);
    const b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = q;
    b.addEventListener('click', () => ask(q));
    host.appendChild(b);
  }
}

function initChat() {
  const panel = document.getElementById('chatPanel');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const modeHost = document.getElementById('chatModes');

  const toggleBtn = document.getElementById('chatToggle');

  const open = () => {
    panel.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close project assistant');
    input.focus();
    if (!document.getElementById('chatLog').children.length) greet();
    renderSuggestions();
  };
  const close = () => {
    panel.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open project assistant');
    toggleBtn.focus();
  };

  toggleBtn.addEventListener('click', () => panel.hidden ? open() : close());
  document.getElementById('chatClose').addEventListener('click', close);

  const expand = document.getElementById('chatExpand');
  if (expand) {
    const KEY = 'surg-chat-wide';
    const setWide = on => {
      panel.classList.toggle('chat-wide', on);
      expand.setAttribute('aria-label', on ? 'Shrink assistant' : 'Expand assistant');
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* private mode */ }
    };
    let wide = false;
    try { wide = localStorage.getItem(KEY) === '1'; } catch { /* private mode */ }
    setWide(wide);
    expand.addEventListener('click', () => setWide(!panel.classList.contains('chat-wide')));
  }

  // Escape closes, matching the search overlay's behaviour.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) close();
  });
  window.addEventListener('hashchange', () => { if (!panel.hidden) renderSuggestions(); });

  if (modeHost) {
    Object.entries(Retrieval.MODES).forEach(([key, m]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = m.label;
      b.setAttribute('aria-pressed', String(key === CHAT_MODE));
      b.addEventListener('click', () => {
        CHAT_MODE = key;
        [...modeHost.children].forEach(c => c.setAttribute('aria-pressed', String(c === b)));
      });
      modeHost.appendChild(b);
    });
  }

  function greet() {
    const n = typeof KB_CHUNKS !== 'undefined' ? KB_CHUNKS.length : 0;
    chatAppend(
      `<div class="ans-lead"><p>Ask me something specific about the board, the RTL, the control math,
        or what is still unknown.</p></div>
       <p class="ans-note">I search ${n} chunks pulled straight from the project files and quote what I find,
       with the file and line. When the documents do not settle something, I say so instead of filling the gap.</p>
       <p class="ans-guard">Nothing has been simulated and nothing has been tested on hardware, so I will never
       tell you otherwise.</p>`,
      'bot');
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    ask(v);
  });
}
