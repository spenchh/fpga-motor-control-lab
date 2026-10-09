/* ===========================================================================
   facts.js — curated direct answers

   Retrieval (retrieval.js) finds evidence in the project files. This file
   supplies the *answer*: one or two sentences that address the question
   directly, with the longer explanation kept behind a disclosure so a short
   question gets a short reply.

   Each entry:
     id     stable key
     k      trigger keywords for the lexical matcher
     short  the direct answer — always shown first
     a      the full explanation — shown under "Full detail"
     must   optional guard: when this matches, the entry wins outright.
            These carry the project's accuracy rules, so that e.g. "has
            anything been simulated" can never be answered by a passage
            that merely discusses simulation.
     c      citations  [label, href]
     p      the site page that covers this topic
   =========================================================================== */

const FACTS = [
  {
    id: 'pcb-questions',
    short: `Ten are written down. The three that block fabrication: the <strong>OPA4388 pin numbering</strong> (netlist says pin 4 = GND, datasheet says pin 4 = V+), <strong>what sources <code>12V ISO</code></strong> (nothing does, as parsed), and <strong>how negative phase current is meant to be read</strong> when the diff amps sit at unity gain referenced to GND.`,
    k: 'questions ask pcb team board hardware people send list what should i ask them fab',
    must: /\b(ask|question|send).{0,24}(pcb|board|hardware)\s*(team|people|side)?\b|\bpcb team\b|\bboard questions\b/i,
    a: `<p>The full list lives in two places: <em>Questions to ask PCB team</em> in <code>PCB_CROSSCHECK_2026-08-05.md</code>, and section 10 of <code>FPGA_TODO.md</code>.</p>
        <p><strong>Fabrication blockers — ask first:</strong></p>
        <ol>
          <li><strong>OPA4388 symbol pinout.</strong> Both U10 and U12 show <code>GND</code> on pin 4 and <code>3V3</code> on pin 11; the datasheet says 4 = V+, 11 = V−. If the symbol is mirrored, neither current nor voltage sense works on a fabricated board.</li>
          <li><strong><code>12V ISO</code> source.</strong> The 15 W isolated module has placeholder designator <code>?</code> and six unrouted pads. Nothing else drives the net.</li>
          <li><strong>Negative current representation.</strong> The diff stage is unity gain referenced to GND, so negative phase current maps below 0 V and clips. FOC needs bidirectional current.</li>
        </ol>
        <p><strong>Needed before XDC:</strong> confirmed board-side net-to-header mapping, the analog route (Arty XADC, external ADC or other), the shunt value on the power board, and the shield header I/O bank voltage.</p>
        <p><strong>Also open:</strong> the Hall 5 V pull-ups versus 3.3 V Zynq I/O, the maximum Vm the design must survive (the "96V to 1V65" schematic note does not match the 1:76 divider), the dead-time resistor values still marked "Configurable", and the thermistor part number.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/questions'], ['FPGA_TODO.md', '#/questions']],
    p: '#/questions'
  },
  {
    id: 'vivado-files',
    short: `Add the six <code>fpga/rtl/*.v</code> modules as <strong>design sources</strong> and the six <code>fpga/tb/tb_*.v</code> files as <strong>simulation sources</strong>. That is enough to run behavioural simulation today — no XDC is needed until you target real pins.`,
    k: 'vivado files add project design sources simulation sources setup create what do i need behavioral',
    must: /\bvivado\b.{0,30}\b(files?|sources?|project|add|need|setup|set up)\b|\b(files?|sources?)\b.{0,20}\bvivado\b/i,
    a: `<p><strong>Design sources</strong> — <code>fpga/rtl/</code>:</p>
        <ul>
          <li><code>pwm_3phase_center_aligned.v</code></li>
          <li><code>hall_decoder.v</code></li>
          <li><code>pcb_disable_control.v</code></li>
          <li><code>phase_current_balance_monitor.v</code></li>
          <li><code>phase_current_limit_monitor.v</code></li>
          <li><code>voltage_sense_monitor.v</code></li>
        </ul>
        <p><strong>Simulation sources</strong> — <code>fpga/tb/</code>, one <code>tb_*.v</code> per module above.</p>
        <p><strong>Not needed yet:</strong> an XDC. Behavioural simulation does not touch package pins, which is precisely why running the testbenches is unblocked while the pin map is still unknown.</p>
        <p><strong>Missing before a bitstream:</strong> the top-level wrapper tying the six modules together, the AXI register interface, ADC interface logic, the FOC datapath, and the XDC itself — which needs the confirmed board mapping, the Arty Z7 variant, the Hall voltage fix, the ADC route and the I/O bank voltage.</p>
        <p><strong>Status:</strong> no simulator has ever run these files. When last checked, <code>vivado</code>, <code>xvlog</code>, <code>xelab</code>, <code>iverilog</code> and <code>verilator</code> were all absent from PATH.</p>`,
    c: [['FPGA_KNOWN_INFO_2026-08-05.md', '#/vivado'], ['fpga/README.md', '#/fpga'], ['FPGA_TODO.md', '#/vivado']],
    p: '#/vivado'
  },
  {
    id: 'disable',
    short: `Active high — drive it <strong>LOW to run</strong>, HIGH to kill. It reaches the <code>DIS</code> pin of all three UCC21222 gate drivers, and a floating pin leaves them disabled, which is the safe direction.`,
    k: 'disable dis pin polarity active high low run kill gate driver inhibit safe floating pull-up',
    a: `<p><code>DISABLE</code> is the single line that tells all three gate drivers to stop switching.</p>
        <ul>
          <li>It lands on <strong>J4.10</strong> and goes to the <code>DIS</code> pin (pin 5) of all three UCC21222 devices, plus test point TP5.</li>
          <li>It is <strong>active high</strong>: drive it <strong>low to run</strong>, high to kill.</li>
          <li>There is <strong>no pull resistor</strong> anywhere on the net. The UCC21222 pulls DIS high internally, so a floating pin — which is what you get from an unconfigured FPGA — leaves the drivers <strong>disabled</strong>. That is the safe direction, and it costs nothing.</li>
        </ul>
        <p>In RTL, <code>pcb_disable_control.v</code> owns it. Its <code>DISABLE_ACTIVE_LEVEL = 1'b1</code> default matches the hardware.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb-chips'], ['TI UCC21222 datasheet', 'https://www.ti.com/lit/ds/symlink/ucc21222.pdf'], ['fpga/rtl/pcb_disable_control.v', '#/fpga-safety']],
    p: '#/fpga-safety'
  },
  {
    id: 'xdc',
    short: `Five things, and only one of them is yours to answer: board-side net-to-header mapping, the Arty Z7 variant, the Hall 5 V pull-up fix, the ADC route, and the shield I/O bank voltage.`,
    k: 'xdc constraints before need pin map package pin iostandard write constraint blocked bitstream',
    a: `<p>Five things, and four of them are not mine to answer:</p>
        <ol>
          <li><strong>Board-side net-to-header mapping</strong> — confirmed by the PCB team, including connector orientation. The header positions are known from the netlist, but turning them into Arduino D/A names is currently an inference.</li>
          <li><strong>Arty Z7 variant</strong> — Z7-10 or Z7-20. They differ in how many shield pins reach the PL.</li>
          <li><strong>Hall 5 V pull-up resolution</strong> — this decides whether those three pins can be connected at all.</li>
          <li><strong>ADC route</strong> — whether the analog pins need XADC constraints or nothing.</li>
          <li><strong>Shield header I/O bank voltage</strong> — sets the <code>IOSTANDARD</code>.</li>
        </ol>
        <p>With those answered, writing the XDC is mechanical: combine the confirmed board mapping with the header-to-package-pin table in the Arty Z7 reference manual.</p>
        <p>Item 5 can be answered without anyone else — build a throwaway LED blink project and check.</p>`,
    c: [['FPGA_KNOWN_INFO_2026-08-05.md', '#/vivado'], ['Digilent Arty Z7 reference manual', 'https://digilent.com/reference/programmable-logic/arty-z7/reference-manual']],
    p: '#/vivado'
  },
  {
    id: 'current-path',
    must: /\b(current sens\w*|csense|phase current path|current path|current chain)\b/i,
    short: `<code>shunt → AMC1300 (gain 8.2) → OPA4388 (unity) → MCU CSENSE A/B/C → J3.1/2/3</code>. All three phases are measured, and the shunt itself sits on the power board, not this one.`,
    k: 'current sensing path csense shunt amc1300 opa4388 chain measure phase amps scaling gain',
    a: `<p>The chain, in order:</p>
        <p><code>shunt → AMC1300 → OPA4388 → MCU CSENSE A/B/C → J3.1/2/3</code></p>
        <ul>
          <li>The <strong>shunt is not on the driver board</strong>. The AMC1300 measures <code>PHASE x+</code> against <code>PHASE x−</code> through the H1/H2/H3 headers, which puts the shunt on the power board.</li>
          <li><strong>AMC1300</strong> (U2/U4/U6) — isolated amplifier, fixed gain <strong>8.2</strong>, ±250 mV input range.</li>
          <li><strong>OPA4388</strong> (U10) — four-resistor 3.3 kΩ differential stage at <strong>unity gain</strong>.</li>
          <li>All <strong>three phases</strong> are measured. Phase-C reconstruction is demoted to a cross-check idea, not the main path.</li>
        </ul>
        <p>So <code>MCU CSENSE ≈ 8.2 × V_shunt</code>. Everything except the shunt value is known, which is why <code>cfg.current.sensitivity_V_per_A</code> is correctly left as <code>NaN</code>.</p>
        <p><strong>Two open problems:</strong> the shunt value is unknown, and the diff stage references GND at unity gain — so negative current maps below 0 V and would clip. FOC needs bidirectional current, and nothing visible in the netlist provides an offset.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb-chips'], ['TI AMC1300 datasheet', 'https://www.ti.com/lit/ds/symlink/amc1300.pdf'], ['matlab/board_interface_config.m', '#/matlab']],
    p: '#/pcb-chips'
  },
  {
    id: 'sensorless',
    short: `<strong>No.</strong> The near-term path is Hall-assisted FOC and board bring-up. Sensorless FOC is future research, not the current implementation.`,
    must: /\bsensorless\b/i,
    k: 'sensorless foc hall assisted are we doing direction strategy near-term future observer back-emf',
    a: `<p>No — not yet, and that is deliberate.</p>
        <p>The near-term path is <strong>Hall-assisted FOC and board bring-up</strong>. Hall sensors are confirmed on the updated PCB (digital, on J5) and <code>hall_decoder.v</code> is written.</p>
        <p><strong>Sensorless FOC is future research</strong>, not the immediate bring-up assumption. The reason is concrete: an observer is only as good as the measurements feeding it, and right now the current-sense sign convention, the shunt value, the ADC route and the voltage scaling are all open. A sensorless estimator built on an uncalibrated current path produces confident, wrong angles — a worse failure mode than a Hall sensor that simply stops reporting.</p>
        <p>Hall also works from standstill, which sensorless does not, and it fails readably: codes 000 and 111 are illegal and already counted in RTL.</p>
        <p>The sensible research framing is stage 6: add an observer later and compare it against the Halls while they are still connected as ground truth.</p>`,
    c: [['FPGA_KNOWN_INFO_2026-08-05.md', '#/foc'], ['FPGA_TODO.md', '#/foc']],
    p: '#/foc'
  },
  {
    id: 'rtl-files',
    short: `Six modules in <code>fpga/rtl/</code> with six matching testbenches in <code>fpga/tb/</code>. Still missing: top-level wrapper, AXI register interface, ADC interface logic, and the FOC datapath itself.`,
    k: 'rtl files need which modules verilog list source design what do i need',
    a: `<p>Six RTL modules, all in <code>fpga/rtl/</code>:</p>
        <ul>
          <li><code>pwm_3phase_center_aligned.v</code> — three duties in, six HI/LO out, with a non-overlap window</li>
          <li><code>hall_decoder.v</code> — three Hall inputs to a six-step sector, plus direction and error counts</li>
          <li><code>pcb_disable_control.v</code> — owns the DISABLE line and the latching protection state</li>
          <li><code>phase_current_balance_monitor.v</code> — checks ia + ib + ic (a measurement-health check)</li>
          <li><code>phase_current_limit_monitor.v</code> — per-phase absolute overcurrent</li>
          <li><code>voltage_sense_monitor.v</code> — window check on phase and bus voltage</li>
        </ul>
        <p>Six matching testbenches sit in <code>fpga/tb/</code>, one per module.</p>
        <p><strong>Removed on purpose:</strong> <code>fault_manager.v</code> (depended on <code>nOC</code>/<code>FAULT</code>, which do not exist on this board) and the phase-C reconstruction module (all three phases are measured now).</p>
        <p><strong>Still missing:</strong> a top-level wrapper, the AXI register interface, ADC interface logic, and the FOC datapath itself.</p>`,
    c: [['FPGA_KNOWN_INFO_2026-08-05.md', '#/fpga'], ['README.md', '#/fpga']],
    p: '#/fpga'
  },
  {
    id: 'meeting',
    short: `Lead with what the netlist cross-check confirmed, name the two corrections (Hall decoder, six PWM inputs), then say plainly that nothing has been simulated or tested.`,
    k: 'meeting say update professor short summary status report advisor what should i say',
    a: `<p>Something close to this:</p>
        <p><em>"I cross-checked our FPGA and MATLAB work against the updated driver board by parsing the actual Altium netlist. Most of our assumptions held up: all three phase currents are measured, voltage sense mirrors current sense, and there's no dedicated fault line — protection is the driver chip plus our disable logic, and I confirmed disable is active-high and fails safe.</em></p>
        <p><em>Two corrections: Hall sensors do come in digitally, so we're adding a small Hall decoder, and the board takes six PWM inputs, so our three-phase generator drives complementary pairs. I also flagged board-level issues to the PCB team — op-amp pin mapping and the isolated supply — before this goes to fab.</em></p>
        <p><em>Next I need confirmed pin mapping, the ADC path, Hall voltage safety, current-sense offset and the dead-time policy before final XDC and full Vivado integration."</em></p>
        <p>If asked what is <em>not</em> done: be straight about it. Nothing has been simulated and nothing has been tested on hardware.</p>`,
    c: [['FPGA_KNOWN_INFO_2026-08-05.md', '#/state'], ['PCB_CROSSCHECK_2026-08-05.md', '#/state']],
    p: '#/state'
  },
  {
    id: 'pwm-count',
    short: `Both numbers are right. <strong>Three duty commands</strong> is the control architecture; <strong>six PWM lines plus DISABLE</strong> is the pin count. The FPGA expands each duty into a HI/LO pair.`,
    must: /\b(six|6|three|3)\b[\s\S]*\bpwm\b|\bpwm\b[\s\S]*\b(six|6|three|3)\b/i,
    k: '6 six pwm lines three 3 duty how many outputs complementary hi lo why',
    a: `<p>Both numbers are right, they just describe different layers.</p>
        <ul>
          <li><strong>Three duty commands</strong> — <code>duty_a</code>, <code>duty_b</code>, <code>duty_c</code> — is the <em>control architecture</em>. That has not changed.</li>
          <li><strong>Six PWM lines plus DISABLE</strong> — seven digital outputs — is the <em>pin count</em>.</li>
        </ul>
        <p>The FPGA expands each duty command into a physical HI/LO pair. This was corrected on 2026-08-05: the earlier assumption was that the gate driver generated the complementary output, which would have meant three lines plus an enable.</p>
        <p>The UCC21222 inserts dead time and interlock <em>between two signals you provide</em>. It does not create the second one. <code>INB</code> is an independent input and there is no inverter on the board.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb'], ['TI UCC21222 datasheet', 'https://www.ti.com/lit/ds/symlink/ucc21222.pdf']],
    p: '#/pcb'
  },
  {
    id: 'hall-5v',
    short: `<strong>Not safe as drawn.</strong> Each Hall line has a 10 kΩ pull-up to 5 V and Zynq I/O banks are not 5 V tolerant. Move the pull-ups to <code>3V3</code> before connecting anything.`,
    must: /\bhall\b[\s\S]*\b(5 ?v|3\.3 ?v|tolerant|safe|level|damage|connect\w*|hook\w* up|wire up)\b|\b(5 ?v|3\.3 ?v|connect\w*)\b[\s\S]*\bhall\b/i,
    k: 'hall 5v 3.3v level pullup safe zynq tolerant voltage protection blocker damage',
    a: `<p>This is a real hardware blocker, not a detail.</p>
        <p>Each Hall line has a <strong>10 kΩ pull-up to 5 V</strong>, then 100 Ω series and 100 nF to ground, before reaching J5. <strong>Zynq I/O banks are not 5 V tolerant.</strong></p>
        <p>The 100 Ω series resistor limits current into the input clamp diode but leaves the pin above its absolute maximum rating. It is not adequate protection on its own.</p>
        <p>The clean fix is to move the pull-ups to <code>3V3</code>. The 5 V supply feeding the Hall connector itself can stay, since many Hall sensors want it.</p>
        <p>Until this is resolved, do not connect the Hall lines to the FPGA.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb-flags'], ['FPGA_KNOWN_INFO_2026-08-05.md', '#/questions']],
    p: '#/questions'
  },
  {
    id: 'simulated',
    short: `<strong>No — nothing has been simulated and nothing has been tested on hardware.</strong> Six modules and six testbenches are written, but no simulator has ever executed them.`,
    must: /\b(simulat\w*|tested|testing|hardware test|compil\w*|proven|verified|any results|has anything|did .*(run|work)|signed off|ever (run|been run))\b/i,
    k: 'simulated tested compile run vivado results pass fail hardware proven verified evidence',
    a: `<p><strong>Nothing has been simulated and nothing has been tested on hardware.</strong></p>
        <ul>
          <li>Six RTL modules and six self-checking testbenches are written. <strong>No simulator has ever executed them.</strong> When last checked, <code>vivado</code>, <code>xvlog</code>, <code>xelab</code>, <code>iverilog</code> and <code>verilator</code> were all absent from PATH.</li>
          <li>There are no oscilloscope captures, no bring-up logs and no photographs of a powered board. The PCB has not been fabricated.</li>
        </ul>
        <p>What <em>has</em> produced real output: <code>board_interface_check.m</code> ran in MATLAB and its output is saved in <code>board_interface_check_LAST_RUN.txt</code>. That is a numerical consistency check, not a hardware test.</p>
        <p>The interactive models on this site are JavaScript reimplementations of the described behaviour. They are explanatory tools, not simulator output.</p>`,
    c: [['FPGA_KNOWN_INFO_2026-08-05.md', '#/overview'], ['matlab/board_interface_check_LAST_RUN.txt', '#/matlab']],
    p: '#/overview'
  },
  {
    id: 'pinmap',
    short: `Header positions are <strong>confirmed</strong> from the netlist. The Arduino D/A names are <strong>inferred</strong> and need confirming before XDC.`,
    k: 'pin map header j3 j4 j5 arduino d11 d10 a0 which pin where mapping shield',
    a: `<p>Header positions are <strong>confirmed from the netlist</strong>. The Arduino D/A names are <strong>inferred</strong> and need confirming before XDC.</p>
        <p><strong>Digital out:</strong> MCU HI A = J4.7, MCU LO A = J4.8, MCU HI B = J4.9, MCU LO B = J5.2, MCU HI C = J5.3, MCU LO C = J5.5, DISABLE = J4.10.</p>
        <p><strong>Digital in:</strong> MCU HALL A = J5.1, HALL B = J5.4, HALL C = J5.6.</p>
        <p><strong>Analog in:</strong> J3.1–J3.6 = CSENSE A, CSENSE B, CSENSE C, VSENSE A, VSENSE Vm, MOTOR THERM.</p>
        <p>The inferred Arduino reading is DISABLE = D8, HI B = D9, LO A = D10, HI A = D11, LO C = D3, HI C = D5, LO B = D6, Hall on D2/D4/D7, analog A0–A5 in J3 order. All six PWM nets land on classic Uno PWM pins, which supports the reading — but it is still an inference.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb'], ['FPGA_KNOWN_INFO_2026-08-05.md', '#/pcb']],
    p: '#/pcb'
  },
  {
    id: 'deadtime',
    short: `<strong>Still open.</strong> Two mechanisms exist — the FPGA <code>nonoverlap_ticks</code> parameter and the UCC21222 <code>DT</code> resistor — and the policy between them has not been decided.`,
    k: 'dead time deadtime nonoverlap non-overlap ticks dt resistor shoot through policy how much',
    a: `<p>There are two mechanisms and the policy between them is <strong>still open</strong>.</p>
        <ul>
          <li><strong>FPGA side:</strong> <code>pwm_3phase_center_aligned.v</code> has a <code>nonoverlap_ticks</code> parameter. The window is symmetric, so the both-off time per crossing is <strong>2 × nonoverlap_ticks</strong>. At 100 MHz with the placeholder value of 20, that is 40 cycles = 400 ns.</li>
          <li><strong>Driver side:</strong> the UCC21222 has a resistor-programmed dead time on its DT pin (R28/R36/R61 to GND). The schematic comment on all three is literally "Configurable" — the value is not final.</li>
        </ul>
        <p>Stacking both is the safe default: total dead time is the sum and no single failure removes it. The cost is modulation range. Relying on the driver alone gives cleaner range but requires trusting a resistor value that has not been set.</p>
        <p>Until the team decides, FPGA-side non-overlap is the safer default and stays a parameter.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/fpga-pwm'], ['fpga/rtl/pwm_3phase_center_aligned.v', '#/fpga-pwm'], ['TI UCC21222 datasheet', 'https://www.ti.com/lit/ds/symlink/ucc21222.pdf']],
    p: '#/fpga-pwm'
  },
  {
    id: 'pspl',
    short: `PL takes anything that must happen inside the PWM period; PS takes anything measured in milliseconds or in human decisions. There is <strong>no AXI register map yet</strong>.`,
    k: 'ps pl split zynq arm fabric processing system programmable logic what goes where partition',
    a: `<p>The test is: <strong>does a late answer break something?</strong></p>
        <p><strong>PL (fabric)</strong> — anything inside the PWM period:</p>
        <ul><li>PWM timing and HI/LO generation</li><li>Hall capture and sector decode</li><li>Current and voltage limit checks</li><li>Fast inhibit and DISABLE</li><li>Sample timing</li><li>Eventually the fixed-point FOC blocks</li></ul>
        <p><strong>PS (ARM)</strong> — anything measured in milliseconds or in human decisions:</p>
        <ul><li>Startup mode and the state machine</li><li>Commands and setpoints</li><li>Thresholds written into fabric registers</li><li>Logging, telemetry, communications</li><li>Recovery policy after a latched trip</li></ul>
        <p>A PWM edge 50 µs late produces the wrong motor voltage. A log line 50 ms late is still a fine log line.</p>
        <p><strong>There is no AXI register map yet.</strong> It should be defined after the pin map and ADC route are known.</p>`,
    c: [['FPGA_KNOWN_INFO_2026-08-05.md', '#/architecture'], ['PCB_CROSSCHECK_2026-08-05.md', '#/architecture']],
    p: '#/architecture'
  },
  {
    id: 'adc',
    short: `<strong>Still open</strong>, and one of the four biggest blockers. Six analog channels land on J3, but whether they reach XADC, an external ADC, or a PS-side path is unconfirmed.`,
    k: 'adc xadc analog route where sample external convert measurement path six channels',
    a: `<p><strong>Still open.</strong> This is one of the four biggest blockers.</p>
        <p>Six analog channels terminate on the J3 header: CSENSE A/B/C, VSENSE A, VSENSE Vm and MOTOR THERM. On an Arty Z7 those pins reach the XADC — but that is platform knowledge, not something the board files state.</p>
        <p>Why it matters: whether the design uses XADC, an external ADC, or a PS-side path changes the sample timing and the latency budget for the current loop. If XADC is multiplexed across channels, simultaneous three-phase sampling becomes a control-loop concern.</p>
        <p>For context, an Arty Z7 has six single-ended 0–3.3 V XADC inputs and four differential 0–1.0 V inputs. The single-ended count matching the six channels is suggestive but is not confirmation.</p>
        <p>Related unknowns: the min/max voltage reaching the ADC for each signal, and the full-scale needed to convert the monitor limits into volts.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/questions'], ['AMD XADC User Guide UG480', 'https://docs.amd.com/r/en-US/ug480_7Series_XADC'], ['Digilent Arty Z7 reference manual', 'https://digilent.com/reference/programmable-logic/arty-z7/reference-manual']],
    p: '#/questions'
  },
  {
    id: 'opa-flag',
    short: `The netlist puts <code>GND</code> on OPA4388 pin 4 and <code>3V3</code> on pin 11, but the datasheet says pin 4 = V+ and pin 11 = V−. Most likely a mirrored schematic symbol — needs visual confirmation in Altium before fab.`,
    must: /\bopa4388\b|\bpin (4|11)\b|mirrored|reversed pin/i,
    k: 'opa4388 pin reversed mirrored symbol supply backwards v+ v- fab error red flag',
    a: `<p>This is the most serious netlist finding.</p>
        <p>On both U10 and U12 the netlist puts <code>GND</code> on pin 4 and <code>3V3</code> on pin 11. The TI datasheet for the SOIC-14 OPA4388 says <strong>pin 4 = V+</strong> and <strong>pin 11 = V−</strong>.</p>
        <p>The feedback networks also land on what the datasheet calls the non-inverting pins. Everything is consistent with the custom schematic symbol carrying a mirrored pin-number map (roughly 2↔3, 4↔11, 5↔6, 9↔10).</p>
        <p><strong>If the symbol is wrong,</strong> a fabricated board would have both quad op-amps powered backwards and there would be no working current or voltage sense at all.</p>
        <p>This needs someone to open the symbol in Altium and check it against the datasheet. Netlist extraction is not visual confirmation. The project notes record that the team already knows about this and that Angelina said she will fix it.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb-flags'], ['TI OPA2388/OPA4388 datasheet', 'https://www.ti.com/lit/ds/symlink/opa2388.pdf'], ['FPGA_KNOWN_INFO_2026-08-05.md', '#/pcb-flags']],
    p: '#/pcb-flags'
  },
  {
    id: 'qformat',
    short: `One sign bit and fifteen fractional bits in a 16-bit integer; scale 2^15 = 32768. Range −1.0 to +0.99997, resolution ≈ 3.05e−5.`,
    k: 'q format q1.15 fixed point quantise quantize scale encode decode saturate bits fractional',
    a: `<p>Q1.15 means one sign bit and fifteen fractional bits in a 16-bit integer. The scale is 2^15 = 32768.</p>
        <ul><li>0.5 encodes as 16384</li><li>0.25 encodes as 8192</li><li>Range is −1.0 to +0.99997, resolution 1/32768 ≈ 3.05e−5</li></ul>
        <p>Two implementation details in the MATLAB scripts matter:</p>
        <ol>
          <li><strong>Saturate, never wrap.</strong> If an out-of-range value wrapped, a slightly-too-large positive current would read as a large negative one, and the control loop would push harder in exactly the wrong direction.</li>
          <li><strong>Round before shifting.</strong> Multiplying two Q1.15 values gives Q2.30; getting back to Q1.15 means shifting right by 15. A naive shift truncates toward negative infinity and biases every product slightly negative — which accumulates in an integrator running at 20 kHz. <code>q_mul_q15</code> adds half an LSB first, giving round-half-away-from-zero.</li>
        </ol>`,
    c: [['matlab/foc_fixed_point_starter.m', '#/matlab-fixed'], ['matlab/stage1_3pwm_foc_sim.m', '#/matlab-fixed']],
    p: '#/matlab-fixed'
  },
  {
    id: 'clarke-park',
    short: `Clarke drops three phases to two stationary components; Park rotates them by the rotor angle so they hold still. <code>i_d</code> is commanded to zero, <code>i_q</code> makes the torque.`,
    k: 'clarke park transform inverse alpha beta d q id iq rotating frame why theta angle',
    a: `<p>They turn three moving phase currents into two numbers that hold still.</p>
        <p><strong>Clarke</strong> drops three phases to two orthogonal stationary components. Because ia + ib + ic = 0 with no neutral, the third carries no extra information: <code>alpha = ia</code>, <code>beta = (ia + 2·ib)/√3</code>.</p>
        <p><strong>Park</strong> rotates that frame by the rotor electrical angle so it turns <em>with</em> the rotor: <code>id = alpha·cos θ + beta·sin θ</code>, <code>iq = −alpha·sin θ + beta·cos θ</code>. In steady state the sinusoids become constants.</p>
        <p><code>i_d</code> is aligned with the rotor field and produces flux, not torque — it is commanded to <strong>zero</strong> for a surface PMSM or BLDC. <code>i_q</code> is perpendicular and produces the torque.</p>
        <p><strong>Inverse Park</strong> is the same rotation backwards, taking the PI loops' <code>v_d</code>/<code>v_q</code> output back to the stationary frame so it can become duty cycles.</p>
        <p>Everything here depends on knowing θ. Three Hall sensors resolve it to within 60°, which is why the angle is the weak link in the near-term plan.</p>`,
    c: [['matlab/foc_fixed_point_starter.m', '#/matlab-clarke'], ['MathWorks: Clarke and Park transforms', 'https://www.mathworks.com/discovery/clarke-and-park-transforms.html']],
    p: '#/matlab-clarke'
  },
  {
    id: 'pwm-freq',
    short: `100 MHz fabric clock, 20 kHz PWM, <code>period = 2500</code> counts. Both numbers are <strong>working assumptions</strong>, not confirmed.`,
    k: 'pwm frequency 20khz period counts 2500 clock 100mhz resolution how fast switching',
    a: `<p>The working numbers are 100 MHz fabric clock and 20 kHz PWM, giving <code>period = 2500</code> counts.</p>
        <p>Because the counter ramps up and back down, one full PWM period is <code>2 × period</code> ticks, so <code>f_pwm = f_clk / (2 × period)</code>. 100e6 / (2 × 2500) = exactly 20000.00 Hz — no rounding error. Duty resolution is 2500 steps, about 11.3 bits.</p>
        <p>Two caveats:</p>
        <ul>
          <li>The 100 MHz clock is a <strong>placeholder</strong>. The real PL fabric clock has not been confirmed in Vivado.</li>
          <li>20 kHz has <strong>not been confirmed</strong> as the frequency the driver board is designed around. It is a working assumption carried through the MATLAB config.</li>
        </ul>`,
    c: [['matlab/board_interface_check_LAST_RUN.txt', '#/fpga-pwm'], ['matlab/board_interface_config.m', '#/fpga-pwm']],
    p: '#/fpga-pwm'
  },
  {
    id: 'voltage-path',
    must: /\b(voltage sens\w*|vsense|amc1311|divider ratio|voltage path|voltage chain)\b/i,
    short: `<code>divider (20/1520 ≈ 1:76) → AMC1311 → OPA4388 → MCU VSENSE A / VSENSE Vm → J3.4 and J3.5</code>.`,
    k: 'voltage sense vsense divider amc1311 vm bus 750k 20k ratio 96v scaling',
    a: `<p>Voltage sense mirrors the current-sense architecture, on two channels:</p>
        <ul>
          <li><strong>VSENSE A</strong>: PHASE A− → 750 kΩ + 750 kΩ with 20 kΩ to PGND → AMC1311 (U11) → OPA4388 (U12) → <code>MCU VSENSE A</code> → J3.4</li>
          <li><strong>VSENSE Vm</strong>: Vm connector pin 1 → identical divider → AMC1311 (U14) → U12 → <code>MCU VSENSE Vm</code> → J3.5</li>
        </ul>
        <p>Divider ratio is 20/1520 ≈ <strong>1:76</strong>. A 96 V input gives about 1.26 V at the AMC1311, inside its 0–2 V range.</p>
        <p><strong>Open:</strong> a schematic note reads "96V to 1V65", which does not match 96/76 ≈ 1.26 V. The maximum Vm the design must survive is also unstated, and the ADC-side full-scale is unknown — so the monitor limits in <code>voltage_sense_monitor.v</code> cannot yet be converted into volts.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb-chips'], ['TI AMC1311 datasheet', 'https://www.ti.com/lit/ds/symlink/amc1311.pdf'], ['matlab/board_interface_check_LAST_RUN.txt', '#/pcb-chips']],
    p: '#/pcb-chips'
  },
  {
    id: 'monitors',
    short: `The balance monitor checks <code>|ia+ib+ic|</code> for measurement faults; the limit monitor checks each phase for real overcurrent. Each alone has a blind spot the other covers.`,
    k: 'balance limit monitor current two why separate sum kirchhoff overcurrent per phase difference',
    a: `<p>They catch different failures, and each alone has a blind spot.</p>
        <p><strong>Balance monitor</strong> checks |ia + ib + ic| against a limit. In a healthy three-phase system with no neutral, that sum must be about zero — that is Kirchhoff, not a control choice. A persistent non-zero sum means a <em>measurement</em> problem: a broken or mis-scaled channel.</p>
        <p><strong>Limit monitor</strong> checks |ia|, |ib| and |ic| each against an absolute limit, and reports which phase tripped.</p>
        <p>The reason both exist: three <em>genuinely</em> large currents can sum to nearly zero. That is real overcurrent that a balance test cannot see. Conversely a single channel reading wrong while magnitudes stay small is invisible to the limit test.</p>
        <p>Both are purely combinational — no clock port — and both gate on <code>sample_valid</code>.</p>`,
    c: [['fpga/rtl/phase_current_balance_monitor.v', '#/fpga-safety'], ['fpga/rtl/phase_current_limit_monitor.v', '#/fpga-safety'], ['FPGA_KNOWN_INFO_2026-08-05.md', '#/fpga-safety']],
    p: '#/fpga-safety'
  },
  {
    id: 'fault',
    short: `<strong>They do not exist</strong> on the updated board — zero nets, zero pads, zero schematic labels. That is why <code>fault_manager.v</code> was removed.`,
    must: /\bnoc\b|\bn?fault\b|fault_manager/i,
    k: 'noc fault nfault protection status signal exist fault_manager removed error line',
    a: `<p><code>nOC</code> and <code>FAULT</code> <strong>do not exist</strong> on the updated board — zero nets, zero pads, zero schematic labels.</p>
        <p>The protection story is: UCC21222 internal interlock and dead time, plus the DIS pin, plus whatever the controller decides from CSENSE and VSENSE. The board cannot tell the FPGA that something went wrong; everything the FPGA knows comes from its own measurements.</p>
        <p>That is why <code>fault_manager.v</code> was <strong>removed</strong> rather than kept, and why the current and voltage monitors matter.</p>
        <p>Watch out for stale documents: the July 29 and August 3 notes mention <code>nOC</code>/<code>FAULT</code>, but those describe the <em>old</em> board and are superseded.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb'], ['UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md', '#/timeline']],
    p: '#/fpga-safety'
  },
  {
    id: 'blockers',
    short: `Four block the most: board-side net-to-header mapping, the ADC route, bidirectional current representation, and the Hall 5 V pull-ups into 3.3 V I/O.`,
    k: 'blockers blocked open questions biggest what is stopping problems issues top priority',
    a: `<p>Sixteen open items are tracked. The four that block the most:</p>
        <ol>
          <li><strong>Board-side net-to-header mapping</strong> — blocks XDC and any hardware connection.</li>
          <li><strong>ADC route</strong> — blocks the current-loop timing budget and all analog scaling.</li>
          <li><strong>Bidirectional current representation</strong> — blocks FOC itself. As parsed, the chain is ground-referenced at unity gain, so negative current clips.</li>
          <li><strong>Hall 5 V pull-ups into 3.3 V I/O</strong> — a hardware safety issue that blocks connecting the Hall lines at all.</li>
        </ol>
        <p>Two fabrication blockers on the PCB side: the OPA4388 pin mapping and the fact that nothing sources <code>12V ISO</code>.</p>
        <p>The one high-value task blocked by <em>nothing</em>: run the six testbenches in Vivado.</p>`,
    c: [['FPGA_KNOWN_INFO_2026-08-05.md', '#/questions'], ['PCB_CROSSCHECK_2026-08-05.md', '#/questions']],
    p: '#/questions'
  },
  {
    id: 'next',
    short: `<strong>Run the six testbenches in Vivado.</strong> Highest value, blocked by nothing, and they have never been executed.`,
    k: 'next do now todo start task priority what should i work on first',
    a: `<p>Highest value and blocked by nothing: <strong>run the six testbenches in Vivado.</strong> They have never been executed. Expect to find things.</p>
        <p>Also unblocked right now:</p>
        <ul>
          <li>Install Vivado and the Digilent board files</li>
          <li>Build a throwaway LED blink project to learn the XDC workflow — this also answers the fabric clock and I/O bank voltage questions without anyone else's input</li>
          <li>Write the top-level wrapper tying the six modules together</li>
          <li>Send the ten PCB questions, prioritising the OPA4388 pinout and the 12V ISO source since both are fabrication blockers</li>
        </ul>
        <p>Blocked and waiting: XDC constraints, Hall connection, current and voltage scaling, the final non-overlap value.</p>`,
    c: [['FPGA_TODO.md', '#/state'], ['FPGA_KNOWN_INFO_2026-08-05.md', '#/state']],
    p: '#/state'
  },
  {
    id: 'ucc',
    short: `An isolated dual-channel gate driver with a disable pin — three of them, U5/U9/U13. <code>INB</code> is independent: the chip adds dead time and interlock but does <em>not</em> generate the complementary signal.`,
    k: 'ucc21222 gate driver interlock isolated what does it do chip u5 u9 u13',
    a: `<p>The UCC21222 is an isolated dual-channel gate driver with a disable pin. Three of them, U5/U9/U13, one per phase.</p>
        <ul>
          <li><code>INA</code> takes the high-side signal, <code>INB</code> takes the low-side. Each arrives through a 49.9 Ω / 33 pF RC filter from the shield header.</li>
          <li><code>DIS</code> (pin 5) is the shared DISABLE line — active high, internally pulled high.</li>
          <li><code>DT</code> sets dead time via a resistor to ground (R28/R36/R61), currently marked "Configurable".</li>
          <li>Output stages run on <code>12V ISO</code> with bootstrap-style diode feeds (ER2D + 1.5 Ω) for the high-side <code>VDDA</code>.</li>
        </ul>
        <p>The important structural point: <code>INB</code> is <strong>independent</strong>. The chip adds dead time and interlock between two signals you provide — it does not generate the complementary signal.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb-chips'], ['TI UCC21222 datasheet', 'https://www.ti.com/lit/ds/symlink/ucc21222.pdf']],
    p: '#/pcb-chips'
  },
  {
    id: 'hall-decode',
    short: `It maps <code>{hall_a,hall_b,hall_c}</code> to sectors 0–5, flags 000 and 111 as illegal, and only updates direction on adjacent steps. The sector ordering is a <strong>placeholder</strong> until motor commissioning.`,
    k: 'hall decoder sector 001 101 illegal 000 111 sequence commutation decode table direction',
    a: `<p><code>hall_decoder.v</code> maps <code>{hall_a, hall_b, hall_c}</code> as: 001→0, 101→1, 100→2, 110→3, 010→4, 011→5. Codes <strong>000 and 111 are illegal</strong> and decode to 7, raising <code>illegal_state</code>.</p>
        <p>Two flip-flop stages synchronise the asynchronous inputs before anything uses them. There is no extra RTL debounce — the board provides a 100 Ω / 100 nF filter (≈10 µs).</p>
        <p>Direction only updates on an <em>adjacent</em> sector step. A jump from sector 0 to sector 3 is physically impossible at any sane speed, so it increments <code>bad_transition_count</code> instead. That distinguishes "the motor reversed" from "the Hall wiring is unreliable".</p>
        <p><strong>Important:</strong> the sector ordering is a <strong>placeholder</strong>. Which physical rotor position matches which code depends on how the sensors were installed in the specific motor. It has to be found during motor commissioning.</p>`,
    c: [['fpga/rtl/hall_decoder.v', '#/fpga-hall'], ['FPGA_KNOWN_INFO_2026-08-05.md', '#/fpga-hall']],
    p: '#/fpga-hall'
  },
  {
    id: 'therm',
    short: `The motor thermistor, on J3.6 with a 499 Ω pull-up to <code>3V3</code>. It surfaced in the August 5 netlist extraction and is why the analog channel count went from five to six.`,
    k: 'motor therm thermistor temperature sixth analog channel 499 new signal',
    a: `<p><code>MCU MOTOR THERM</code> is the motor thermistor. It comes from CC1.6 with a 499 Ω pull-up to <code>3V3</code>, landing on J3.6.</p>
        <p>It is notable because it appeared in <strong>no earlier FPGA or MATLAB document</strong> — it was discovered during the August 5 netlist extraction, and it is why the analog channel count went from 5 to 6.</p>
        <p>Converting its voltage into a temperature needs the thermistor part and its resistance-temperature curve, which are not in the driver-board files. That is an open question, though a low-severity one.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb'], ['matlab/board_interface_check_LAST_RUN.txt', '#/pcb']],
    p: '#/pcb'
  },
  {
    id: 'why-fpga',
    short: `Determinism and parallelism. A PWM edge lands on the clock cycle you specified, and all three phase currents can be checked against limits at the same instant.`,
    k: 'why fpga instead microcontroller mcu benefit advantage determinism reason purpose',
    a: `<p>Determinism and parallelism — and only in specific places.</p>
        <p>In fabric, a PWM edge happens on the clock cycle you specified, not "in the interrupt handler after whatever else was running finished". At a 20 kHz control rate each update has 50 µs, and a software system spends part of that budget on jitter it cannot fully control. Fabric spends none.</p>
        <p>Parallelism: three phase currents can be checked against limits at the same instant rather than in sequence, and a shutdown path can react in a handful of clock cycles without asking a processor.</p>
        <p>The honest counter-argument, which this project should be able to answer: an FPGA costs more, takes longer to develop, and burns more static power. Whether the determinism is worth it is exactly what the SURG research is measuring.</p>`,
    c: [['SURG_FPGA_FOC.md', '#/overview'], ['README.md', '#/overview']],
    p: '#/overview'
  },
  {
    id: '12viso',
    short: `<strong>Nothing drives the <code>12V ISO</code> net.</strong> The DC-DC module carries placeholder designator <code>?</code> and all six pads are unrouted. This is a fabrication blocker.`,
    must: /\b12 ?v ?iso\b|isolated supply|iso rail/i,
    k: '12v iso isolated supply power source module unrouted designator gate drive powered',
    a: `<p><strong>Nothing drives the <code>12V ISO</code> net.</strong> This is a fabrication blocker.</p>
        <p>The 15 W isolated DC-DC module carries the placeholder designator <code>?</code> and all six of its pads are unrouted. No other component sources the net. As parsed, the entire isolated gate-drive side has no power source.</p>
        <p>Related loose ends in the same area: pin 2 of the 3-pin Vm connector (<code>H??</code>) is unrouted, and the designators <code>?</code>, <code>H??</code> and <code>U?</code> are unassigned.</p>
        <p>This needs the PCB team to give the module a real designator and connect it before fab.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb-flags']],
    p: '#/pcb-flags'
  },
  {
    id: 'power',
    short: `Two domains that share no ground: logic (12 V in → <code>3V3</code> and <code>5V</code>) and isolated (<code>12V ISO</code> → <code>5V ISO</code>). The only path between them is the isolation barrier inside the UCC21222, AMC1300 and AMC1311.`,
    k: 'power rails 3v3 5v 12v buck j1 supply domain pgnd gnd isolation power-up sequence',
    a: `<p>Two electrical domains that share no ground.</p>
        <p><strong>Logic side (GND):</strong> 12 V in at J1 (Molex 39-30-1021) → U1 buck to <code>3V3</code>, U3 buck to <code>5V</code>. The 5 V rail feeds the Hall pull-ups.</p>
        <p><strong>Isolated side (PGND):</strong> <code>12V ISO</code> → U7 buck to <code>5V ISO</code>. Gate-driver output stages run from <code>12V ISO</code> with bootstrap-style diode feeds (ER2D + 1.5 Ω) for the high-side supply.</p>
        <p>The only path between the domains is the isolation barrier inside the UCC21222, AMC1300 and AMC1311 packages.</p>
        <p><strong>Two open items:</strong> nothing sources <code>12V ISO</code> as parsed, and the board puts 12 V on the shield VIN position (J2.8) while the shield 5V/3V3/IOREF/RESET pins are unconnected — which needs to be intentional if the Arty is also USB-powered. No written power-up order exists yet.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb'], ['FPGA_KNOWN_INFO_2026-08-05.md', '#/questions']],
    p: '#/pcb'
  },
  {
    id: 'duty-gen',
    short: `Inverse Clarke, then add <code>v_zero = −0.5 × (max + min)</code> to all three phases, then clamp to 0.02–0.98. The common-mode offset buys about 15% more usable bus voltage.`,
    k: 'duty generation svpwm centring centering min max clamp 0.02 0.98 space vector modulation',
    a: `<p>After inverse Park there are two stationary-frame voltages. Turning them into three duties takes an inverse Clarke, then a common-mode trick:</p>
        <p><code>v_zero = −0.5 × (max(va,vb,vc) + min(va,vb,vc))</code>, added to all three.</p>
        <p>Adding the same offset to every phase changes nothing the motor can see — the motor responds to <em>differences</em> between phase voltages, and a common offset cancels out of every difference. That freedom is worth about 15% more usable bus voltage, which is the practical benefit of space-vector modulation over plain sine. The characteristic flat-topped duty waveform is the offset doing its work.</p>
        <p>The clamp is 0.02 to 0.98, not 0 to 1, because a duty of exactly 0 or 1 means one switch never turns off. That breaks the bootstrap supply for the high-side driver, which needs the switch node to go low periodically to recharge, and it removes the window for a PWM-centre current sample.</p>`,
    c: [['matlab/stage1_3pwm_foc_sim.m', '#/matlab-pi']],
    p: '#/matlab-pi'
  },
  {
    id: 'antiwindup',
    short: `The integrator only commits its new value when the output is not saturated into the direction the error is pushing. The gains are sandbox values against a synthetic plant, not motor-tuned.`,
    k: 'pi loop anti windup integrator saturate gains kp ki tuning current loop',
    a: `<p>The PI loops regulate <code>i_d</code> and <code>i_q</code> independently. The interesting part is the anti-windup.</p>
        <p><code>pi_fixed_step</code> computes an <code>integ_candidate</code>, uses it to produce the output, and only <em>then</em> conditionally commits it. If the output is saturated <em>and</em> the error is still pushing further into that limit, the integrator freezes instead of accumulating.</p>
        <p>Without that, a saturated integrator keeps accumulating error it cannot act on. When the reference comes back into range, the loop has to unwind all of it before responding — which shows up as large overshoot and slow recovery.</p>
        <p>Current gains in <code>stage1_3pwm_foc_sim.m</code>: <code>kp_d = 0.22</code>, <code>ki_d = 0.012</code>, <code>kp_q = 0.30</code>, <code>ki_q = 0.016</code>, output limit 0.46. These are sandbox values against a synthetic first-order plant, not values tuned on a real motor.</p>`,
    c: [['matlab/stage1_3pwm_foc_sim.m', '#/matlab-pi'], ['matlab/foc_fixed_point_starter.m', '#/matlab-pi']],
    p: '#/matlab-pi'
  },
  {
    id: 'shunt',
    short: `<strong>Unknown, and not on this board.</strong> The shunt sits on the power board between <code>PHASE x+</code> and <code>PHASE x−</code>, which is exactly why <code>cfg.current.sensitivity_V_per_A</code> is <code>NaN</code>.`,
    k: 'shunt value resistor where power board unknown missing current scaling amps',
    a: `<p>The shunts are <strong>not on the driver board</strong> and their value is unknown.</p>
        <p>The AMC1300 measures <code>PHASE x+</code> against <code>PHASE x−</code> through the H1/H2/H3 headers (6-pin, wired 1 = GATE HI x, 2 = PHASE x+, 3 = PHASE x−, 4/6 = PGND, 5 = GATE LO x). That places the shunt on the <em>power board</em>, between those two nodes.</p>
        <p>Consequence: the end-to-end amps-to-volts chain cannot be closed. Everything else in it is known — AMC1300 gain 8.2 from the datasheet, OPA4388 diff stage at unity — so <code>MCU CSENSE ≈ 8.2 × V_shunt</code>, but <code>V_shunt</code> per amp is missing.</p>
        <p>This is why <code>cfg.current.sensitivity_V_per_A</code> is deliberately <code>NaN</code> rather than a plausible-looking placeholder.</p>`,
    c: [['PCB_CROSSCHECK_2026-08-05.md', '#/pcb-chips'], ['matlab/board_interface_config.m', '#/matlab']],
    p: '#/questions'
  },
  {
    id: 'nan',
    short: `Deliberate. Unknown values are <code>NaN</code> rather than plausible guesses, so they propagate loudly instead of silently reaching generated HDL and a bitstream.`,
    k: 'nan why placeholder config scaling unknown values matlab board_interface_config',
    a: `<p>Deliberate discipline. <code>board_interface_config.m</code> holds every board assumption in one place so MATLAB, HDL Coder and Vivado cannot drift apart — and every value that is genuinely unknown is set to <code>NaN</code> rather than to a plausible guess.</p>
        <p>A plausible-looking placeholder would propagate silently into the fixed-point scaling, into generated HDL, and eventually into a bitstream driving real hardware. <code>NaN</code> propagates loudly: anything computed from it becomes <code>NaN</code> and the problem surfaces immediately.</p>
        <p>Currently <code>NaN</code>: current <code>ref_V</code> and <code>sensitivity_V_per_A</code>, voltage-sense <code>ref_V</code>, <code>scale_V_per_V</code> and <code>max_adc_V</code>.</p>`,
    c: [['matlab/board_interface_config.m', '#/matlab']],
    p: '#/matlab'
  },
  {
    id: 'centre-aligned',
    short: `The counter ramps up to <code>period</code> and back down rather than resetting, making each pulse symmetric about the peak — better harmonics, and a quiet point to sample current.`,
    k: 'center centre aligned counter triangle up down why sample strobe peak',
    a: `<p>The counter ramps up to <code>period</code> and back down to zero rather than resetting to zero. That makes each pulse symmetric about the counter peak.</p>
        <p>Two benefits. Switching edges land symmetrically around the peak, which is better for harmonic content than edge-aligned PWM. And the counter peak is a clean, predictable point to sample phase current — far from every switching edge, where the measurement is quietest.</p>
        <p><code>pwm_peak_strobe</code> pulses at the peak and <code>cycle_strobe</code> pulses at zero. The zero crossing is also where all three duties are loaded together, so a control update can never apply a new <code>duty_a</code> against an old <code>duty_b</code>.</p>
        <p>Note that <code>pwm_peak_strobe</code> is described in the project notes as a <strong>provisional</strong> timing marker, not a finalised ADC trigger — that depends on the unresolved ADC route.</p>`,
    c: [['fpga/rtl/pwm_3phase_center_aligned.v', '#/fpga-pwm'], ['FPGA_KNOWN_INFO_2026-08-05.md', '#/fpga-pwm']],
    p: '#/fpga-pwm'
  }
];
