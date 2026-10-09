/* ===========================================================================
   test-assistant.mjs — regression harness for the project assistant

   Loads the same files the browser loads, asks a fixed set of questions, and
   asserts on the shape of the answer rather than its exact wording. The point
   is to catch the two failure modes that matter:

     1. a specific question answered with a generic topic dump
     2. an off-topic question answered at all

   Run:  node tools/test-assistant.mjs
         node tools/test-assistant.mjs -v     (print each answer's lead)
   =========================================================================== */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('-v');

const FILES = ['assets/js/data.js', 'assets/js/kb.js', 'assets/js/retrieval.js',
  'assets/js/facts.js', 'assets/js/chatbot.js'];

const stubEl = () => ({ style: {}, classList: { add() {}, remove() {} }, addEventListener() {}, appendChild() {}, append() {}, setAttribute() {}, children: [] });
const ctx = {
  console,
  document: { getElementById: () => null, createElement: stubEl, addEventListener() {}, querySelectorAll: () => [] },
  window: { addEventListener() {} },
  location: { hash: '#/overview' },
  navigator: {},
};
vm.createContext(ctx);
vm.runInContext(
  FILES.map(f => readFileSync(join(ROOT, f), 'utf8')).join('\n') +
  '\n;globalThis.__api = { buildAnswer, Retrieval, FACTS, KB_CHUNKS };',
  ctx, { filename: 'bundle.js' });
const { buildAnswer, KB_CHUNKS } = ctx.__api;

const text = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const lead = html => text((html.match(/<div class="ans-lead">([\s\S]*?)<\/div>/) || [, ''])[1]);

/* Each case: the question, and substrings the direct answer must contain.
   `no` marks substrings that must NOT appear — those encode the accuracy
   rules, e.g. never implying a simulation happened. */
const CASES = [
  { q: 'Is DISABLE active high or active low?', yes: ['active high', 'low to run'] },
  { q: 'What is the current sensing path?', yes: ['AMC1300', 'OPA4388', 'CSENSE'] },
  { q: 'What is the voltage sensing path?', yes: ['AMC1311', 'VSENSE'], no: ['CSENSE'] },
  { q: 'Are we doing sensorless FOC?', yes: ['No', 'Hall-assisted'], no: ['currently sensorless'] },
  { q: 'Has anything been simulated?', yes: ['nothing has been simulated', 'no simulator'] },
  { q: 'Has the RTL been compiled?', yes: ['nothing has been simulated'] },
  { q: 'What files do I need for Vivado?', yes: ['design sources', 'simulation sources'] },
  { q: 'What blocks final XDC?', yes: ['mapping'] },
  { q: 'What RTL files exist?', yes: ['Six modules', 'fpga/rtl'] },
  { q: 'What questions should I ask the PCB team?', yes: ['OPA4388', '12V ISO'] },
  { q: 'Are the Hall pins 5V safe?', yes: ['not safe', '5 V'] },
  { q: 'Can I connect the Hall lines now?', yes: ['not safe'] },
  { q: 'What should I do next?', yes: ['testbenches'] },
  { q: 'Why six PWM lines and not three?', yes: ['three duty', 'six PWM'] },
  { q: 'What shunt value do we use?', yes: ['Unknown'] },
  { q: 'Explain Q1.15 fixed point', yes: ['32768', 'fractional'] },
  { q: 'What is the divider ratio?', yes: ['1:76'] },
  { q: 'Is there a FAULT line?', yes: ['do not exist'] },
  { q: 'What powers the 12V ISO rail?', yes: ['Nothing drives'] },
  { q: 'What are the inputs of hall_decoder?', yes: ['hall_a'] },
  // Off-topic: the assistant must decline rather than reach.
  { q: 'What is the capital of France?', fallback: true },
  { q: 'How do I bake sourdough?', fallback: true },
  { q: 'Who won the world cup?', fallback: true },
];

let pass = 0;
const failures = [];

for (const c of CASES) {
  const r = buildAnswer(c.q, 'quick');
  const l = lead(r.html);
  const isFallback = /I don't have a source/.test(r.html);
  const problems = [];

  if (c.fallback) {
    if (!isFallback) problems.push(`expected a fallback, got: "${l.slice(0, 80)}"`);
  } else {
    if (isFallback) problems.push('unexpectedly fell back to "no source"');
    for (const want of (c.yes || [])) {
      if (!l.toLowerCase().includes(want.toLowerCase())) problems.push(`lead is missing "${want}"`);
    }
    for (const bad of (c.no || [])) {
      if (l.toLowerCase().includes(bad.toLowerCase())) problems.push(`lead should not contain "${bad}"`);
    }
    // A direct answer that runs long has reverted to being a topic dump.
    if (l.length > 460) problems.push(`lead is ${l.length} chars — too long to be a direct answer`);
  }

  if (problems.length) failures.push({ q: c.q, problems, lead: l });
  else pass++;

  if (VERBOSE) console.log(`${problems.length ? 'FAIL' : 'ok  '}  ${c.q}\n        ${l.slice(0, 150)}\n`);
}

/* Corpus sanity — a KB that silently shrinks is a broken build. */
const kbProblems = [];
if (KB_CHUNKS.length < 300) kbProblems.push(`only ${KB_CHUNKS.length} chunks; expected 300+`);
if (!KB_CHUNKS.some(c => c.kind === 'rtl')) kbProblems.push('no RTL chunks');
if (!KB_CHUNKS.some(c => c.kind === 'matlab')) kbProblems.push('no MATLAB chunks');
if (!KB_CHUNKS.some(c => c.status === 'open')) kbProblems.push('no open-status chunks');
if (KB_CHUNKS.some(c => !c.file || !c.page)) kbProblems.push('some chunks lack file or page metadata');

console.log(`\n${pass}/${CASES.length} answer cases passed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`\n  Q: ${f.q}`);
    f.problems.forEach(p => console.log(`     - ${p}`));
    console.log(`     lead: ${f.lead.slice(0, 160)}`);
  }
}
if (kbProblems.length) {
  console.log('\nKnowledge base problems:');
  kbProblems.forEach(p => console.log('  - ' + p));
} else {
  console.log(`knowledge base: ${KB_CHUNKS.length} chunks, metadata complete`);
}

process.exit(failures.length || kbProblems.length ? 1 : 0);
