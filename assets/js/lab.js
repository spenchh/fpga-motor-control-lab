(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain = html => {const d=document.createElement('div');d.innerHTML=html;return d.textContent.replace(/\s+/g,' ').trim();};
  const aliases={state:'overview',signals:'pcb',fpga:'rtl','fpga-pwm':'pwm','fpga-hall':'motor','fpga-safety':'protection','fpga-tb':'verification',matlab:'fixed','matlab-fixed':'fixed','matlab-clarke':'transforms','matlab-pi':'pi',vivado:'implementation',tools:'resources',links:'resources',glossary:'resources',questions:'architecture',timeline:'implementation','pcb-chips':'pcb','pcb-flags':'pcb'};
  const pages=LAB.pages;
  let current='home';
  let sourceMode='design';
  let selectedModule='adc_current_scaler_q15';
  let lineNotes=false;
  let chatBusy=false;
  let modelAvailable=null;
  const history=[];
  const storedTheme=localStorage.getItem('motor-lab-theme');
  document.documentElement.dataset.theme=storedTheme==='dark'?'dark':'light';
  $('#theme-toggle').onclick=()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('motor-lab-theme',next);document.dispatchEvent(new Event('themechange'));};
  function menu(open){$('#sidebar').classList.toggle('open',open);$('#scrim').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));}
  $('#menu-toggle').onclick=()=>menu(!$('#sidebar').classList.contains('open'));
  $('#scrim').onclick=()=>menu(false);
  let group='';
  $('#navigation').innerHTML=pages.map((p,i)=>{const g=p.group!==group?`<div class="nav-group">${escape(p.group)}</div>`:'';group=p.group;return `${g}<a href="#/${p.id}"><span>${String(i+1).padStart(2,'0')}</span>${escape(p.nav)}</a>`;}).join('');
  const allSections=pages.flatMap(p=>p.sections.map(s=>({...s,page:p.id,pageTitle:p.title,text:plain(s.body),titleText:plain(s.title)})));
  const tokens=s=>(s.toLowerCase().match(/[a-z0-9_]+/g)||[]).filter(t=>!new Set(['what','is','the','a','an','of','to','do','does','how','in','on','for','our','we','this','it','and','are','can','you','me','i']).has(t));
  function search(query){const terms=tokens(query);if(!terms.length)return [];return allSections.map(s=>{const body=(s.titleText+' '+s.text).toLowerCase(),title=s.titleText.toLowerCase();let matches=0,score=0;for(const t of terms){if(body.includes(t)){matches++;score+=title.includes(t)?8:1;}}score+=matches/terms.length*5;return {...s,score,matches};}).filter(s=>s.matches>0).sort((a,b)=>b.score-a.score).slice(0,7);}
  $('#search').addEventListener('input',e=>{const q=e.target.value;const results=search(q);$('#search-results').innerHTML=results.length?results.map(s=>`<a href="#/${s.page}/${s.id}">${escape(s.titleText)}<small>${escape(s.pageTitle)}</small></a>`).join(''):'<p>No matching documentation.</p>';$('#search-results').hidden=!q.trim();$('#search').setAttribute('aria-expanded',String(!!q.trim()));});
  $('#search').addEventListener('keydown',e=>{if(e.key==='Escape'){$('#search-results').hidden=true;e.target.blur();}if(e.key==='ArrowDown'){e.preventDefault();$('#search-results a')?.focus();}if(e.key==='Enter'){$('#search-results a')?.click();}});
  $('#search-results').addEventListener('keydown',e=>{const links=[...$('#search-results').querySelectorAll('a')],i=links.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();links[(i+1)%links.length]?.focus();}if(e.key==='ArrowUp'){e.preventDefault();links[(i-1+links.length)%links.length]?.focus();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search')){$('#search-results').hidden=true;$('#search').setAttribute('aria-expanded','false');}});
  function lineExplanation(raw,moduleName){
    const line=raw.trim();
    if(!line)return '';
    if(line.startsWith('//'))return 'Source comment: '+line.slice(2).trim();
    if(line.startsWith('`timescale'))return 'Sets the simulation time unit to 1 ns and time precision to 1 ps. It does not set the FPGA clock.';
    if(/^module\b/.test(line))return 'Declares this hardware module. The following parameter and port lists define its reusable interface.';
    if(/^parameter\b/.test(line)||/^localparam\b/.test(line))return 'Declares an elaboration-time constant used for widths, fractional scaling, or fixed coefficients. It is not a runtime register.';
    if(/^input\b/.test(line))return 'Declares an input driven by the enclosing module or testbench. signed makes arithmetic interpret this vector as two’s complement.';
    if(/^output\b/.test(line))return 'Declares a signal driven by this module. A clocked assignment infers storage; combinational assignments infer logic.';
    if(/^always_ff/.test(line)||/^always @\(posedge/.test(line))return 'Starts clocked logic. Nonblocking assignments evaluate old register values at this rising clock edge.';
    if(/^always_comb/.test(line)||/^always @\*/.test(line))return 'Starts combinational logic. Every result must be assigned on every path to avoid unintended storage.';
    if(/^function\b/.test(line))return 'Defines a reusable combinational calculation. A function has no independent clock or pipeline stage.';
    if(/^if \(rst/.test(line))return 'Selects reset behavior, clearing pipeline validity, state, and outputs as listed below.';
    if(/if \(v[123]\)/.test(line))return 'Runs this stage only when the previous stage contains valid data. The stage number follows the local valid pipeline.';
    if(/sample_valid/.test(line)&&/if \(/.test(line))return 'Accepts the input transaction only while sample_valid is asserted and any listed enable condition is satisfied.';
    if(/(?:current_valid|duty_valid|sincos_valid)/.test(line)&&/^if/.test(line))return 'Uses a completed-result event to update the persistent readiness or held data state.';
    if(/sensor_ready.*<=/.test(line))return 'Remembers whether any current sample has completed. This state stays set until reset.';
    if(/duty_ready.*<=/.test(line))return 'Remembers whether any duty result has completed, so PWM is not inhibited between valid pulses.';
    if(/sin_theta_hold|cos_theta_hold/.test(line)&&/<=/.test(line))return 'Stores the latest angle lookup result. This hold register does not align the angle to each transaction through the full loop.';
    if(/phase_over_limit.*<=|current_out_of_range.*<=|balance_out_of_range.*<=/.test(line))return 'Registers a protection result before it drives global disable/PWM gating; this shortens the combinational timing path.';
    if(/v[123]\s*<=|_valid\s*<=/.test(line))return 'Registers a validity event with the corresponding data stage. The right-hand side uses values from before this edge.';
    if(/p_term_s3\s*<=|integrator_s3\s*<=/.test(line))return 'Creates the added PI pipeline boundary before the final output addition and clamp.';
    if(/clamp_data\s*=|sat_(?:q|sum|error|product)\s*=/.test(line))return 'Returns the selected clamped value or the in-range result. Bounds are checked before narrowing to the output width.';
    if(/>>>/.test(line))return 'Arithmetic right shift rescales a signed product by a power of two while propagating its sign bit.';
    if(/\{\{.*\[.*-1\]/.test(line))return 'Replicates the sign bit to widen a signed value without changing its numeric meaning.';
    if(/\s\*\s/.test(line))return 'Forms a multiplication with the declared product width. The pipeline and rescaling logic determine when and how it is used.';
    if(/^assign/.test(line)||/^wire.*=/.test(line))return 'Continuously evaluates a combinational expression; it does not create a clocked register.';
    if(/quarter_sin_q15\s*=/.test(line))return 'Stores one quarter-wave Q1.15 table value. Symmetry supplies the other quadrants.';
    if(/count_up\s*<=/.test(line))return 'Stores which direction the center-aligned PWM counter will move on subsequent edges.';
    if(/_active\s*<=/.test(line))return 'Commits one setting from the shadow bank to the active PWM configuration at the update boundary.';
    if(/_shadow\s*<=/.test(line))return 'Captures the requested setting without immediately changing the active PWM comparison.';
    if(/pwm_(?:hi|lo)_[abc]\s*<=/.test(line))return 'Registers one physical half-bridge logic output from its gated next-state comparison.';
    if(/protection_latched\s*<=/.test(line))return 'Updates retained fault history. Present inhibits and the explicit clear policy decide whether switching can resume.';
    if(/status_code\s*<=/.test(line))return 'Stores the highest-priority selected protection reason for external status reporting.';
    if(/\.\w+\(/.test(line))return 'Connects a named child-module port or overrides a parameter. The expression in parentheses comes from this enclosing module.';
    if(/^logic\b|^reg\b|^wire\b/.test(line))return 'Declares an internal signal. Its width and signedness constrain arithmetic; its driver determines combinational logic versus storage.';
    if(/<=/.test(line))return 'Schedules this register’s next value at the active clock edge. Other clocked statements in this edge still read its old value.';
    if(/\$fatal|\$stop/.test(line))return 'Terminates or stops simulation on a detected check failure. This code belongs to verification rather than synthesized hardware.';
    if(/\$display/.test(line))return 'Prints testbench progress, expected/actual values, or the final PASS marker in the simulator log.';
    if(/\$finish/.test(line))return 'Ends the completed testbench. This timestamp measures the test duration, not datapath latency.';
    if(/#\d/.test(line))return 'Advances simulation time or observes values after nonblocking updates. Delays are verification constructs.';
    if(/^task\b/.test(line))return 'Defines reusable stimulus or checking operations in the testbench.';
    if(/^while|^repeat/.test(line))return 'Repeats a simulation operation or waits for a completed-result event as specified.';
    if(/^if|^else if/.test(line))return 'Selects a conditional path. Priority follows the source order within this process.';
    if(/^case/.test(line))return 'Selects a combinational mapping for the encoded value, such as quadrant or Hall sector.';
    if(/=/.test(line))return 'Evaluates the named arithmetic or control expression within this combinational function or verification process.';
    if(/end|begin|[();]/.test(line))return 'Delimits the surrounding port list, branch, function, or process.';
    return `Part of ${moduleName}’s declared datapath or control structure.`;
  }
  function sourceChunks(code){
    const lines=code.split('\n'),out=[];let start=0;
    for(let i=1;i<lines.length;i++){
      const boundary=(lines[i].trim()===''&&i-start>=8)||(/^(    )(function|always_ff|always_comb|always @)/.test(lines[i])&&i-start>=4);
      if(boundary){out.push({start,end:i});start=i;}
    }
    if(start<lines.length)out.push({start,end:lines.length});
    return out.filter(c=>lines.slice(c.start,c.end).some(l=>l.trim()));
  }
  function chunkTitle(code){if(/module\s/.test(code))return 'Module, parameters, and interface';if(/function/.test(code))return 'Reusable arithmetic function';if(/if \(rst\)/.test(code))return 'Reset state';if(/if \(v3\)/.test(code))return 'Output stage';if(/if \(v2\)/.test(code))return 'Third pipeline stage';if(/if \(v1\)/.test(code))return 'Second pipeline stage';if(/sample_valid/.test(code)&&/if \(/.test(code))return 'Input acceptance';if(/always_comb|always @\*/.test(code))return 'Combinational decision';if(/always_ff|always @\(posedge/.test(code))return 'Clocked process';if(/wire.*=/.test(code))return 'Combinational arithmetic';if(/localparam/.test(code))return 'Arithmetic widths and constants';if(/logic|reg/.test(code))return 'Pipeline signals';if(/\$display|\$fatal|check_/.test(code))return 'Verification checks';if(/\.clk\(/.test(code))return 'Submodule connection';return 'Datapath and control';}
  function renderSource(){
    const host=$('#source-explorer');if(!host)return;
    const design=SOURCE_DATA.files.filter(f=>f.path.startsWith('rtl/design'));
    const m=LAB.modules[selectedModule]||LAB.modules.adc_current_scaler_q15;
    const filename=sourceMode==='test'?`tb_${selectedModule}.sv`:`${selectedModule}.sv`;
    const file=SOURCE_DATA.files.find(f=>f.name===filename);
    host.innerHTML=`<div class="source-toolbar"><label>Module<select id="module-select">${design.map(f=>{const id=f.name.slice(0,-3);return `<option value="${id}"${id===selectedModule?' selected':''}>${escape(f.name)}</option>`;}).join('')}</select></label><a class="source-link" href="${file.url}" target="_blank" rel="noopener">Pinned source ↗</a></div><div class="source-meta">Revision ${SOURCE_DATA.commit.slice(0,7)} · ${escape(file.path)}</div><p>${escape(m.role)}</p>${LAB.table(['Inputs','Outputs','Local timing'],[[`<code>${escape(m.inputs)}</code>`,`<code>${escape(m.outputs)}</code>`,escape(m.latency)]])}<h3>Why this block exists</h3><p>${escape(m.why)}</p><div class="equation">${m.equation}</div><p>${escape(m.detail)}</p><div class="note">${escape(m.boundaries)}</div><div class="source-options"><button type="button" id="design-source" aria-pressed="${sourceMode==='design'}">Design source</button><button type="button" id="test-source" aria-pressed="${sourceMode==='test'}">Testbench</button><button type="button" id="notes-source" aria-pressed="${lineNotes}">Line explanations</button><button type="button" id="copy-source">Copy source</button></div><div id="source-blocks"></div>`;
    const lines=file.code.split('\n');
    $('#source-blocks').innerHTML=sourceChunks(file.code).map(({start,end})=>{const block=lines.slice(start,end),title=chunkTitle(block.join('\n'));const relevant=block.filter(l=>l.trim()&&!/^\s*\/\//.test(l)&&!/^\s*(end|begin|[();])\s*$/.test(l)).slice(0,2);return `<section class="source-step"><div class="explanation"><h3>Lines ${start+1}–${end} · ${title}</h3><div>${relevant.map(l=>escape(lineExplanation(l,selectedModule))).join(' ')}</div></div><div class="code">${block.map((l,i)=>`<div class="code-row"><span class="line-no">${start+i+1}</span><code>${escape(l)||' '}</code></div>`).join('')}</div>${lineNotes?`<ul class="line-notes">${block.map((l,i)=>l.trim()?`<li><code>L${start+i+1}</code><span>${escape(lineExplanation(l,selectedModule))}</span></li>`:'').join('')}</ul>`:''}</section>`;}).join('');
    $('#module-select').onchange=e=>{selectedModule=e.target.value;window.history.replaceState(null,'',`#/rtl/${selectedModule}`);renderSource();};
    $('#design-source').onclick=()=>{sourceMode='design';renderSource();};$('#test-source').onclick=()=>{sourceMode='test';renderSource();};$('#notes-source').onclick=()=>{lineNotes=!lineNotes;renderSource();};
    $('#copy-source').onclick=async e=>{try{await navigator.clipboard.writeText(file.code);e.target.textContent='Copied';}catch{e.target.textContent='Clipboard unavailable';}};
  }
  const times={adc_current_scaler_q15:166,alpha_beta_to_duty:166,clarke_park_transform:246,foc_current_loop_top:516,hall_decoder:136,inverse_park_transform:106,pcb_disable_control:196,phase_current_balance_monitor:4,phase_current_limit_monitor:3,pi_controller_q15:216,pwm_3phase_center_aligned:7115,sincos_lut_q15:160,voltage_sense_monitor:3};
  const checks={adc_current_scaler_q15:'Offset, sign, one-count change, gain change',alpha_beta_to_duty:'Zero and ±alpha duty vectors',clarke_park_transform:'0° / 90° projection, balance flag',foc_current_loop_top:'Enable, phase ordering, overcurrent latch',hall_decoder:'Legal sector, forward step, invalid state',inverse_park_transform:'0° and 90° rotation',pcb_disable_control:'Reset, startup, fault latch / clear',phase_current_balance_monitor:'Balance, edge, invalid-sample suppression',phase_current_limit_monitor:'Magnitude and valid gating',pi_controller_q15:'Accumulation, positive clamp, clear',pwm_3phase_center_aligned:'Non-overlap, strobes, inhibit, invalid config',sincos_lut_q15:'Axes and diagonal angles',voltage_sense_monitor:'Nominal, phase low, bus high'};
  function render(){
    const parts=location.hash.replace(/^#\/?/,'').split('/');let id=aliases[parts[0]]||parts[0]||'home';const page=pages.find(p=>p.id===id)||pages[0];current=page.id;
    if(current==='rtl'&&LAB.modules[parts[1]])selectedModule=parts[1];
    LabModels.clear();
    document.body.classList.toggle('is-home',!!page.home);
    const i=pages.indexOf(page);document.title=`${page.nav} | Motor Control Lab`;
    $('#chapter-meta').textContent=`${String(i+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')} · ${page.group}`;
    const opening=page.home?`<div class="research-hero"><div data-model="research"></div><div class="research-hero-copy"><div class="research-kicker">Northwestern University · Summer Undergraduate Research</div><h1>FPGA Field-Oriented Control<br> <span>for Lightweight Motors</span></h1><p>${escape(page.lede)}</p><div class="research-actions"><a class="research-primary" href="#/overview">Explore the project <span aria-hidden="true">→</span></a><a href="#/home/research-question">Research question ↓</a></div></div><div class="research-figure-label">Electrical field · rotating reference frame</div></div><div class="research-byline"><span>Spencer Kogoma</span><span>Computer Engineering · SURG 2026</span><span>June–August 2026</span></div>`:`<h1>${escape(page.title)}</h1><p class="lede">${escape(page.lede)}</p>`;
    $('#page').innerHTML=`${opening}<div class="${page.home?'research-body':'chapter-body'}">${page.sections.map(s=>`<section aria-labelledby="${s.id}"><h2 id="${s.id}">${s.title}</h2>${s.body}</section>`).join('')}</div>`;
    $('#toc').innerHTML=`<strong>On this page</strong>${page.sections.map(s=>`<a href="#/${page.id}/${s.id}">${s.title}</a>`).join('')}`;
    $('#pager').innerHTML=`${i?`<a href="#/${pages[i-1].id}"><small>PREVIOUS</small>← ${escape(pages[i-1].nav)}</a>`:'<span></span>'}${i<pages.length-1?`<a href="#/${pages[i+1].id}"><small>NEXT</small>${escape(pages[i+1].nav)} →</a>`:'<span></span>'}`;
    document.querySelectorAll('#navigation a').forEach(a=>{if(a.hash===`#/${page.id}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.querySelectorAll('[data-model]').forEach(el=>LabModels.mount(el,el.dataset.model));
    if($('#source-explorer'))renderSource();
    if($('#test-table'))$('#test-table').innerHTML=LAB.table(['Testbench','Directed checks','End time'],Object.entries(times).map(([n,t])=>[`<a href="#/rtl/${n}"><code>tb_${n}</code></a>`,checks[n],`${t} ns <span class="tag pass">PASS</span>`]));
    menu(false);$('#search-results').hidden=true;
    if(parts[1]&&!LAB.modules[parts[1]])requestAnimationFrame(()=>document.getElementById(parts[1])?.scrollIntoView());else window.scrollTo({top:0,behavior:'instant'});
  }
  window.addEventListener('hashchange',render);
  // Keep answers short and tied to a specific documented result or module.
  const facts=[
    {pattern:/clamp_data|clamp function|function.*clamp/i,page:'rtl',section:'pi_controller_q15',answer:'clamp_data sign-extends the configured lo and hi limits to the product width, then compares the full signed value with them. Values above hi return hi; values below lo return lo. In-range values return the lower DATA_WIDTH bits, which is safe because the bounds were checked first.',file:LAB.source('pi_controller_q15')},
    {pattern:/timing|wns|tns|100\s*mhz|critical path/i,page:'implementation',section:'fix',answer:'The XC7Z010 implementation wrapper initially had −0.335 ns WNS at a 10 ns target. Adding a PI output register stage and registering current/balance protection before global gating produced +0.557 ns WNS, zero TNS, and +0.034 ns worst hold slack. The final worst setup path is in duty generation.',file:'assets/evidence/after-timing.rpt'},
    {pattern:/motor.*(model|using|use|which)|what motor|pole pair|resistance|inductance/i,page:'motor',section:'parameters',answer:'The enabled BLDC block in BLDC_qsparam_working.slx uses 16 pole pairs, Rs=0.014 Ω, Ld=Lq=150 µH, flux linkage=0.05 Wb, and inertia=0.15 kg·m². These are simulation parameters. A physical motor model number is not established in the accessible project sources.'},
    {pattern:/sensorless|hall.*(integrat|angle|connect)|where.*angle/i,page:'motor',section:'feedback',answer:'The FOC top accepts electrical_angle_q directly. The standalone Hall decoder identifies six 60° electrical sectors but is not connected to that angle input. Hall interpolation and calibration are unfinished; there is no sensorless observer.'},
    {pattern:/pwm.*(frequency|rate)|20\s*khz|50\s*khz/i,page:'pwm',section:'frequency',answer:'The saved wrapper sets period=1000. With its 100 MHz clock, center-aligned PWM calculates to 100 MHz/(2×1000)=50 kHz. The earlier 20 kHz target would require period=2500 at that clock. Neither rate is a physical scope measurement.'},
    {pattern:/test.*pass|simulat.*(run|pass)|13|verif.*result/i,page:'verification',section:'regression',answer:'All 13 directed SystemVerilog testbenches passed in the current Icarus rerun. Preserved Vivado/xsim evidence also records the integrated current-loop test passing at 516 ns and the PI test at 216 ns. Those timestamps are test finish times, not datapath latencies.',file:'assets/evidence/regression.txt'},
    {pattern:/hardware.*test|motor.*(spun|spin|running)|bitstream|program.*board/i,page:'overview',section:'result',answer:'The published evidence establishes behavioral simulation and routed wrapper timing. It does not establish a programmed board, generated deployment bitstream, measured gate waveforms, or operation of a physical motor.'},
    {pattern:/pi\b|integrator|anti.?windup|clamp/i,page:'pi',section:'equations',answer:'Each PI computes error=reference−feedback, P=Kp×error, and a clamped accumulated I term; its output is clamp(P+I). Products shift right by 15 for Q1.15 rescaling. Clearing I preserves the proportional response. An added register splits the final output add/clamp from the integrator update.'},
    {pattern:/clarke|clark\b/i,page:'transforms',section:'clarke',answer:'The implemented balanced-current Clarke transform is iα=ia and iβ=(ib−ic)/√3. It converts phase currents into two stationary components. The Q1.15 coefficient for 1/√3 is 18919. The phase-current sum is monitored separately.'},
    {pattern:/inverse park/i,page:'transforms',section:'inverse',answer:'Inverse Park computes vα=vd cosθ−vq sinθ and vβ=vd sinθ+vq cosθ. Four products register first; full-width sums then shift and saturate. This returns the controller’s rotating dq voltage commands to the stationary frame.'},
    {pattern:/park/i,page:'transforms',section:'park',answer:'Park rotates stationary currents into the rotor frame: id=iα cosθ+iβ sinθ and iq=iβ cosθ−iα sinθ. At θ=0, d=α and q=β. At θ=90°, d=β and q=−α.'},
    {pattern:/ps\b|pl\b|arm|partition|axi/i,page:'architecture',section:'partition',answer:'The intended split puts transforms, current PI, PWM timing, and fault gating in PL for deterministic arithmetic and switching. PS handles slower configuration, calibration, communication, and logging. The PL datapath exists; PS firmware and an AXI configuration/status register interface are proposed integration work.'},
    {pattern:/q1?\.?15|fixed.point|>>>|sign extension/i,page:'fixed',section:'q15',answer:'Q1.15 stores a signed fractional value as an integer divided by 32768. For example 16384 means 0.5. Two Q1.15 values produce 30 fractional product bits, so signed >>>15 returns to 15 fractional bits; saturation prevents overflow from wrapping.'},
    {pattern:/adc|scale_q|current counts|delta/i,page:'fixed',section:'adc',answer:'The scaler subtracts each phase’s zero-current ADC offset, multiplies the signed delta by scale_q, shifts right by 15, and saturates. With offset=2048 and ADC=2148, delta=100. The test gain 32768 returns integer code 100; actual amperes require sensor and base-current calibration.'},
    {pattern:/sensor_ready|duty_ready|readiness/i,page:'pipeline',section:'readiness',answer:'sensor_ready and duty_ready remain set after the first valid current or duty result. current_valid and duty_valid mark individual completed samples and may be one-cycle pulses. Holding readiness avoids disabling PWM in the gaps between sample events; stale-data detection needs a separate timeout.'},
    {pattern:/latency|pipeline|valid|alignment/i,page:'pipeline',section:'alignment',answer:'Local register-stage counts are 3 for current scaling, 4 for Clarke/Park, 4 for PI, 2 for inverse Park, and 3 for duty generation. Top-level registered handoffs add cycles. The isolated-sample figure traces these stages; arbitrary changing samples and their angles are not yet transaction-aligned by the top.'},
    {pattern:/sincos|sine|cosine|lookup/i,page:'rtl',section:'source',answer:'The sin/cos generator uses a 65-entry quarter-wave Q1.15 table, mirrored addresses, and quadrant sign changes. It uses only the upper eight bits of the 16-bit angle, giving 256 electrical positions (1.40625° steps). It maps to logic, with no BRAM in the reported implementation.'},
    {pattern:/disable|fault|overcurrent|imbalance/i,page:'protection',section:'disable',answer:'DISABLE is active high: 1 inhibits the drivers. Current magnitude, current imbalance, voltage, and external inhibits block enable. A current/voltage/external fault latches until its source clears and clear_latch is requested. Startup waits for sensor readiness without retaining a fault.'},
    {pattern:/dsp|lut|register.*count|utilization|resources/i,page:'implementation',section:'resources',answer:'The wrapper uses 1,292 LUTs, 668 registers, 20 DSP48E1 slices, and zero BRAM. DSPs divide into current scaling 3, Clarke/Park 5, d PI 2, q PI 2, inverse Park 4, and duty generation 4. All 20 DSPs belong to the current-loop instance.',file:'assets/evidence/utilization.rpt'},
    {pattern:/wrapper|449|230|pins/i,page:'implementation',section:'wrapper',answer:'The raw current-loop top exposes 449 I/O bits, exceeding the target package’s 230 usable I/O pins. The implementation wrapper supplies changing internal inputs, fixed configuration, and a 16-bit debug sink so the datapath can be placed and routed. Its result is specific to that wrapper, not a board-ready top.'},
    {pattern:/cora|arty|board.*target/i,page:'architecture',section:'boards',answer:'The saved 100 MHz route targets xc7z010clg400-1 from the earlier Arty Z7-10 work. The team’s later foc.xdc identifies Cora Z7-07S Rev B and a 50 MHz clk_50m input. The older wrapper result must not be relabeled as a verified Cora implementation.'},
    {pattern:/foc|field.oriented/i,page:'foc',section:'frames',answer:'FOC expresses phase current in coordinates rotating with the rotor field. Clarke converts abc to stationary αβ; Park rotates αβ to dq. Two PI regulators compare dq current with references, and inverse transforms produce phase voltage requests for PWM.'}
  ];
  function localAnswer(question){
    const terms=tokens(question);
    let module=Object.keys(LAB.modules).find(n=>question.toLowerCase().includes(n));
    if(!module&&/\bpi\b/i.test(question))module='pi_controller_q15';
    if(!module&&/inverse.?park/i.test(question))module='inverse_park_transform';
    if(!module&&/clarke|clark\b/i.test(question))module='clarke_park_transform';
    const lineMatch=question.match(/\bline\s+(\d+)/i);
    if(module&&lineMatch){const file=SOURCE_DATA.files.find(f=>f.path===`rtl/design/${module}.sv`),n=Number(lineMatch[1]),lines=file.code.split('\n');if(n<1||n>lines.length)return {answer:`${module}.sv contains ${lines.length} lines; line ${n} is outside this pinned source.`,page:'rtl',section:module,file:file.url};return {answer:`Line ${n} of ${module}.sv: ${lines[n-1].trim()} ${lineExplanation(lines[n-1],module)}`,page:'rtl',section:module,file:`${file.url}#L${n}`};}
    if(module&&/port|input|output|parameter/i.test(question)){const m=LAB.modules[module];return {answer:`${module}: inputs are ${m.inputs}. Outputs are ${m.outputs}. ${m.latency}.`,page:'rtl',section:module,file:LAB.source(module)};}
    const fact=facts.find(f=>f.pattern.test(question));if(fact)return fact;
    const hit=search(question)[0];if(!hit||hit.matches/Math.max(terms.length,1)<.5)return {answer:'No matching project evidence was found for that question.',page:'resources',section:'project'};
    const temp=document.createElement('div');temp.innerHTML=hit.body;const paragraph=[...temp.querySelectorAll('p')].map(n=>n.textContent).sort((a,b)=>tokens(b).filter(t=>terms.includes(t)).length-tokens(a).filter(t=>terms.includes(t)).length)[0];
    return {answer:paragraph||hit.text.slice(0,360),page:hit.page,section:hit.id};
  }
  function openChat(open){$('#assistant').hidden=!open;$('#ask-toggle').setAttribute('aria-expanded',String(open));if(open)$('#question').focus();else $('#ask-toggle').focus();}
  $('#ask-toggle').onclick=()=>openChat($('#assistant').hidden);$('#ask-close').onclick=()=>openChat(false);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#assistant').hidden)openChat(false);menu(false);$('#search-results').hidden=true;}});
  async function ask(question){
    if(chatBusy||!question.trim())return;chatBusy=true;$('#chat-form button').disabled=true;const log=$('#chat-log');const q=document.createElement('div');q.className='chat-user';q.textContent=question;log.append(q);const a=document.createElement('div');a.className='chat-answer';log.append(a);
    const answer=localAnswer(question);const citation=`<div class="sources"><a href="#/${answer.page}/${answer.section}">Read the source section →</a>${answer.file?`<a href="${escape(answer.file)}" target="_blank" rel="noopener">Evidence ↗</a>`:''}</div>`;
    a.innerHTML=`<p>${escape(answer.answer)}</p>${citation}`;
    // The static deployment always has a deterministic local answer. Existing hosted API remains optional.
    if(modelAvailable!==false&&location.hostname!=='spenchh.github.io'){
      const matches=search(question).slice(0,3);const body={question,mode:'quick',history:history.slice(-4),chunks:[{file:'Current project fact',heading:answer.section,text:answer.answer,tier:1,status:'confirmed'},...matches.map(s=>({file:`Documentation: ${s.pageTitle}`,heading:s.titleText,text:s.text.slice(0,1500),tier:1,status:'confirmed'}))]};
      try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(18000)});if(!response.ok)throw Error('API unavailable');const reader=response.body.getReader(),decoder=new TextDecoder();let text='';for(;;){const {value,done}=await reader.read();if(done)break;text+=decoder.decode(value,{stream:true});a.innerHTML=`<p>${escape(text).replace(/\n/g,'<br>')}</p>${citation}`;}modelAvailable=true;$('#assistant-status').textContent='Model answer · cited project context';}catch{modelAvailable=false;$('#assistant-status').textContent='Local project sources';a.innerHTML=`<p>${escape(answer.answer)}</p>${citation}`;}
    } else $('#assistant-status').textContent='Local project sources';
    history.push({role:'user',content:question},{role:'assistant',content:answer.answer});chatBusy=false;$('#chat-form button').disabled=false;log.scrollTop=log.scrollHeight;
  }
  $('#chat-form').onsubmit=e=>{e.preventDefault();const q=$('#question').value;$('#question').value='';ask(q);};
  document.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>ask(b.dataset.question));
  window.LabDocs={search,localAnswer,pages,renderSource};render();
})();
