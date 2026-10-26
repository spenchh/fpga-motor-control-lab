import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'..');
const context={};context.window=context;vm.createContext(context);
for(const file of ['source-data.js','handbook.js','learning-guide.js'])vm.runInContext(readFileSync(join(root,'assets/js',file),'utf8'),context,{filename:file});
const {LAB,SOURCE_DATA}=context;
assert.equal(LAB.pages.length,22);
assert.equal(LAB.pages[0].id,'home');
assert.match(LAB.pages[0].sections[0].body,/research|controller/i);
assert.equal(Object.keys(LAB.modules).length,13);
assert.equal(SOURCE_DATA.files.length,27);
assert.equal(new Set(LAB.pages.map(p=>p.id)).size,LAB.pages.length);
for(const id of ['start','reproduce','walkthrough','decisions','history','study'])assert.ok(LAB.pages.some(p=>p.id===id),`Missing learning chapter ${id}`);
assert.equal(LAB.review.date,'2026-10-26');
let sections=0;
for(const page of LAB.pages){
  assert.ok(page.lede.length<300,`${page.id}: concise lead`);
  assert.equal(new Set(page.sections.map(s=>s.id)).size,page.sections.length);
  for(const section of page.sections){
    sections++;
    for(const match of section.body.matchAll(/href="#\/([^"/]+)(?:\/([^"/]+))?"/g)){
      const destination=LAB.pages.find(p=>p.id===match[1]);
      assert.ok(destination,`Missing chapter ${match[1]}`);
      if(match[2])assert.ok(destination.sections.some(s=>s.id===match[2])||LAB.modules[match[2]],`Missing section ${match[1]}/${match[2]}`);
    }
    for(const match of section.body.matchAll(/(?:src|href)="([^"#]+)"/g)){
      const url=match[1];if(!/^(https?:|data:)/.test(url))assert.ok(existsSync(join(root,url)),`Missing asset ${url}`);
    }
  }
}
for(const file of SOURCE_DATA.files){
  assert.equal(createHash('sha256').update(file.code).digest('hex'),file.sha256);
  assert.ok(file.url.includes(SOURCE_DATA.commit),'Permanent source link');
}
for(const name of Object.keys(LAB.modules)){
  assert.ok(SOURCE_DATA.files.some(f=>f.path===`rtl/design/${name}.sv`));
  assert.ok(SOURCE_DATA.files.some(f=>f.path===`rtl/verif/tb_${name}.sv`));
  assert.ok(LAB.modules[name].why&&LAB.modules[name].detail&&LAB.modules[name].boundaries);
}
const overview=LAB.pages[0].sections.map(s=>s.body).join(' ');
assert.ok(overview.includes('field')||LAB.pages[0].lede.includes('field'));
const banned=[/short version for a meeting/i,/twenty seconds,? no jargon/i,/20.second professor/i,/what (?:you|I) should (?:tell|say)/i,/resume.safe/i,/nothing has ever been simulated/i,/meeting\s*:\s*'/i];
function walk(dir){return readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?walk(p):[p];});}
const published=[join(root,'index.html'),...walk(join(root,'assets/js')),...walk(join(root,'api')),...readdirSync(root).filter(n=>n.endsWith('.md')).map(n=>join(root,n))];
for(const path of published){for(const rule of banned)assert.ok(!rule.test(readFileSync(path,'utf8')),`${path}: forbidden stale prose ${rule}`);}
const report=readFileSync(join(root,'assets/evidence/after-timing.rpt'),'utf8');
assert.match(report,/0\.557\s+0\.000/);assert.match(report,/0\.034\s+0\.000/);
assert.match(readFileSync(join(root,'assets/evidence/regression.txt'),'utf8'),/13\/13 testbenches passed/);
assert.equal(100e6/(2*1000),50000);assert.equal(100e6/(2*2500),20000);
const vq=(4096*16384)>>15, beta=(vq*32767)>>15, phase=(beta*28378)>>15;
assert.deepEqual([500,500+((phase*1000)>>16),500+((-phase*1000)>>16)],[500,527,472]);
console.log(`PASS: ${LAB.pages.length} chapters, ${sections} sections, 13 documented modules, 27 pinned sources; assets, hashes, timing, and content checks passed.`);
