/* ===========================================================================
   SURG 2026 — structured project data
   Every entry traces back to a local project file or an official vendor doc.
   Status vocabulary:
     confirmed  — read directly out of a project file or a vendor datasheet
     assumption — reasoned inference, not yet verified against the source
     open       — unanswered question / blocker
   =========================================================================== */

const SRC = {
  crosscheck: { label: 'PCB_CROSSCHECK_2026-08-05.md', path: './PCB_CROSSCHECK_2026-08-05.md' },
  known:      { label: 'FPGA_KNOWN_INFO_2026-08-05.md', path: './FPGA_KNOWN_INFO_2026-08-05.md' },
  todo:       { label: 'FPGA_TODO.md', path: './FPGA_TODO.md' },
  readme:     { label: 'README.md', path: './README.md' },
  review:     { label: 'UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md', path: './UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md' },
  research:   { label: 'SURG_FPGA_FOC.md', path: './SURG_FPGA_FOC.md' },
  projnote:   { label: 'PROJECT_NOTE_2026-07-27_PCB_FPGA_FOC.md', path: './PROJECT_NOTE_2026-07-27_PCB_FPGA_FOC.md' },
  boardif:    { label: 'FPGA_BOARD_INTERFACE_2026-07-29.md (superseded)', path: './FPGA_BOARD_INTERFACE_2026-07-29.md' },
  prompt:     { label: 'PCB_REVIEW_PROMPT_2026-08-05.md', path: './PCB_REVIEW_PROMPT_2026-08-05.md' },
  cfg:        { label: 'matlab/board_interface_config.m', path: './matlab/board_interface_config.m' },
  lastrun:    { label: 'matlab/board_interface_check_LAST_RUN.txt', path: './matlab/board_interface_check_LAST_RUN.txt' },
  check:      { label: 'matlab/board_interface_check.m', path: './matlab/board_interface_check.m' },
  focstarter: { label: 'matlab/foc_fixed_point_starter.m', path: './matlab/foc_fixed_point_starter.m' },
  stage1:     { label: 'matlab/stage1_3pwm_foc_sim.m', path: './matlab/stage1_3pwm_foc_sim.m' },
  schdoc:     { label: 'DriverBoard.SchDoc', path: './PCB_CROSSCHECK_2026-08-05.md' },
  pcbdoc:     { label: 'ActualDriverBoard.PcbDoc', path: './PCB_CROSSCHECK_2026-08-05.md' },
  bomdoc:     { label: 'HV Motor Driver.BomDoc', path: './PCB_CROSSCHECK_2026-08-05.md' },
  rtlPwm:     { label: 'fpga/rtl/pwm_3phase_center_aligned.v', path: 'https://github.com/spenchh/FPGA-foc-motor-control/blob/main/rtl/design/pwm_3phase_center_aligned.sv' },
  rtlHall:    { label: 'fpga/rtl/hall_decoder.v', path: 'https://github.com/spenchh/FPGA-foc-motor-control/blob/main/rtl/design/hall_decoder.sv' },
  rtlDis:     { label: 'fpga/rtl/pcb_disable_control.v', path: 'https://github.com/spenchh/FPGA-foc-motor-control/blob/main/rtl/design/pcb_disable_control.sv' },
  rtlBal:     { label: 'fpga/rtl/phase_current_balance_monitor.v', path: 'https://github.com/spenchh/FPGA-foc-motor-control/blob/main/rtl/design/phase_current_balance_monitor.sv' },
  rtlLim:     { label: 'fpga/rtl/phase_current_limit_monitor.v', path: 'https://github.com/spenchh/FPGA-foc-motor-control/blob/main/rtl/design/phase_current_limit_monitor.sv' },
  rtlVolt:    { label: 'fpga/rtl/voltage_sense_monitor.v', path: 'https://github.com/spenchh/FPGA-foc-motor-control/blob/main/rtl/design/voltage_sense_monitor.sv' },
  ds_ucc:     { label: 'TI UCC21222 datasheet', url: 'https://www.ti.com/lit/ds/symlink/ucc21222.pdf' },
  ds_amc1300: { label: 'TI AMC1300 datasheet', url: 'https://www.ti.com/lit/ds/symlink/amc1300.pdf' },
  ds_amc1311: { label: 'TI AMC1311 datasheet', url: 'https://www.ti.com/lit/ds/symlink/amc1311.pdf' },
  ds_opa:     { label: 'TI OPA2388/OPA4388 datasheet', url: 'https://www.ti.com/lit/ds/symlink/opa2388.pdf' },
  arty_rm:    { label: 'Digilent Arty Z7 reference manual', url: 'https://digilent.com/reference/programmable-logic/arty-z7/reference-manual' },
  xadc:       { label: 'AMD XADC User Guide UG480', url: 'https://docs.amd.com/r/en-US/ug480_7Series_XADC' },
  repo:       { label: 'github.com/spenchh/fpga-motors', url: 'https://github.com/spenchh/fpga-motors' }
};

/* --------------------------------------------------------------- navigation */
const NAV = [
  { id: 'overview',     num: '1',  title: 'Project Overview',      group: 'Start here',
    children: [
      { id: 'overview',        title: 'What this project is' },
      { id: 'state',           title: 'Current known info & my role' }
    ] },
  { id: 'architecture', num: '2',  title: 'System Architecture',   group: 'Start here' },
  { id: 'pcb',          num: '3',  title: 'PCB Interface',         group: 'Hardware',
    children: [
      { id: 'pcb',        title: 'Headers & board interface' },
      { id: 'pcb-chips',  title: 'Chip roles & signal paths' },
      { id: 'pcb-flags',  title: 'Netlist red flags' }
    ] },
  { id: 'signals',      num: '4',  title: 'Signal Map',            group: 'Hardware' },
  { id: 'fpga',         num: '5',  title: 'FPGA / RTL',            group: 'Hardware',
    children: [
      { id: 'fpga',        title: 'Module reference' },
      { id: 'fpga-pwm',    title: 'PWM generator (interactive)' },
      { id: 'fpga-hall',   title: 'Hall decoder (interactive)' },
      { id: 'fpga-safety', title: 'Monitors & DISABLE' },
      { id: 'fpga-tb',     title: 'Testbenches' }
    ] },
  { id: 'matlab',       num: '6',  title: 'MATLAB / FOC Math',     group: 'Control',
    children: [
      { id: 'matlab',        title: 'Scripts & what they do' },
      { id: 'matlab-fixed',  title: 'Fixed point & Q-format' },
      { id: 'matlab-clarke', title: 'Clarke / Park / inverse Park' },
      { id: 'matlab-pi',     title: 'PI loop & duty generation' }
    ] },
  { id: 'foc',          num: '7',  title: 'FOC Strategy',          group: 'Control' },
  { id: 'vivado',       num: '8',  title: 'Vivado Starter Guide',  group: 'Toolchain' },
  { id: 'tools',        num: '9',  title: 'Software & Tools',      group: 'Toolchain' },
  { id: 'questions',    num: '10',  title: 'Open Questions',        group: 'Tracking' },
  { id: 'timeline',     num: '11', title: 'Timeline & Progress',   group: 'Tracking' },
  { id: 'links',        num: '12', title: 'Resource Library',      group: 'Reference' },
  { id: 'glossary',     num: '13', title: 'Glossary',              group: 'Reference' }
];

/* ------------------------------------------------------- controller signals */
/* Header positions are read from the netlist. Arduino D/A names are inferred. */
const SIGNALS = [
  { net: 'MCU HI A',        dir: 'out',    type: 'digital', hdr: 'J4.7',  ard: 'D11', status: 'confirmed', ardStatus: 'assumption',
    note: 'RC filter 49.9 Ω / 33 pF → UCC21222 U5 INA (high side, phase A)' },
  { net: 'MCU LO A',        dir: 'out',    type: 'digital', hdr: 'J4.8',  ard: 'D10', status: 'confirmed', ardStatus: 'assumption',
    note: 'RC filter → UCC21222 U5 INB (low side, phase A)' },
  { net: 'MCU HI B',        dir: 'out',    type: 'digital', hdr: 'J4.9',  ard: 'D9',  status: 'confirmed', ardStatus: 'assumption',
    note: 'RC filter → UCC21222 U9 INA' },
  { net: 'MCU LO B',        dir: 'out',    type: 'digital', hdr: 'J5.2',  ard: 'D6',  status: 'confirmed', ardStatus: 'assumption',
    note: 'RC filter → UCC21222 U9 INB' },
  { net: 'MCU HI C',        dir: 'out',    type: 'digital', hdr: 'J5.3',  ard: 'D5',  status: 'confirmed', ardStatus: 'assumption',
    note: 'RC filter → UCC21222 U13 INA' },
  { net: 'MCU LO C',        dir: 'out',    type: 'digital', hdr: 'J5.5',  ard: 'D3',  status: 'confirmed', ardStatus: 'assumption',
    note: 'RC filter → UCC21222 U13 INB' },
  { net: 'DISABLE',         dir: 'out',    type: 'digital', hdr: 'J4.10', ard: 'D8',  status: 'confirmed', ardStatus: 'assumption',
    note: 'DIS pin 5 on all three UCC21222 + test point TP5. No pull resistor on the net. Active high; floating = disabled.' },
  { net: 'MCU HALL A',      dir: 'in',     type: 'digital', hdr: 'J5.1',  ard: 'D7',  status: 'confirmed', ardStatus: 'assumption',
    note: 'CC1.3 → 10 kΩ pull-up to 5 V → 100 Ω series + 100 nF to GND' },
  { net: 'MCU HALL B',      dir: 'in',     type: 'digital', hdr: 'J5.4',  ard: 'D4',  status: 'confirmed', ardStatus: 'assumption',
    note: 'CC1.2 → same 5 V pull-up + RC filter' },
  { net: 'MCU HALL C',      dir: 'in',     type: 'digital', hdr: 'J5.6',  ard: 'D2',  status: 'confirmed', ardStatus: 'assumption',
    note: 'CC1.1 → same 5 V pull-up + RC filter' },
  { net: 'MCU CSENSE A',    dir: 'in',     type: 'analog',  hdr: 'J3.1',  ard: 'A0',  status: 'confirmed', ardStatus: 'assumption',
    note: 'Shunt (power board) → AMC1300 U2 → OPA4388 U10 unity diff stage' },
  { net: 'MCU CSENSE B',    dir: 'in',     type: 'analog',  hdr: 'J3.2',  ard: 'A1',  status: 'confirmed', ardStatus: 'assumption',
    note: 'Shunt → AMC1300 U4 → OPA4388 U10' },
  { net: 'MCU CSENSE C',    dir: 'in',     type: 'analog',  hdr: 'J3.3',  ard: 'A2',  status: 'confirmed', ardStatus: 'assumption',
    note: 'Shunt → AMC1300 U6 → OPA4388 U10' },
  { net: 'MCU VSENSE A',    dir: 'in',     type: 'analog',  hdr: 'J3.4',  ard: 'A3',  status: 'confirmed', ardStatus: 'assumption',
    note: 'PHASE A− → 750k+750k / 20k divider (≈1:76) → AMC1311 U11 → OPA4388 U12' },
  { net: 'MCU VSENSE Vm',   dir: 'in',     type: 'analog',  hdr: 'J3.5',  ard: 'A4',  status: 'confirmed', ardStatus: 'assumption',
    note: 'Vm connector pin 1 → identical divider → AMC1311 U14 → OPA4388 U12' },
  { net: 'MCU MOTOR THERM', dir: 'in',     type: 'analog',  hdr: 'J3.6',  ard: 'A5',  status: 'confirmed', ardStatus: 'assumption',
    note: 'Motor thermistor from CC1.6, 499 Ω pull-up to 3V3. Sixth analog channel.' },
  { net: 'pin12 / pin13',   dir: 'spare',  type: 'digital', hdr: 'J4.5 / J4.6', ard: 'D13 / D12', status: 'confirmed', ardStatus: 'assumption',
    note: 'Spare nets present on J4. Not assigned to any function.' }
];

const UNROUTED = [
  'J4.1–J4.3 (SCL / SDA / AREF positions) — unrouted',
  'J5.7 and J5.8 (the D0 / D1 positions) — unrouted',
  'Shield 5V, 3V3, IOREF and RESET pins — unconnected; the board self-powers from J1',
  'J2.8 (shield VIN position) — carries 12 V from the board'
];

/* ------------------------------------------------------------- RTL modules */
const RTL_MODULES = [
  {
    id: 'pwm', file: 'pwm_3phase_center_aligned.v', src: 'rtlPwm', lines: 127,
    role: 'Turns three duty commands into six physical HI/LO driver-input signals with a non-overlap window.',
    params: [['COUNTER_WIDTH', '16', 'Width of the counter, period, duty and non-overlap values']],
    ports: [
      ['clk',                 'in',  '1',              'Fabric clock'],
      ['rst',                 'in',  '1',              'Synchronous reset. Forces all outputs low and sets configuration_error.'],
      ['enable',              'in',  '1',              'Master enable from the control layer'],
      ['pwm_inhibit',         'in',  '1',              'Fast inhibit. Drops all six outputs without clearing state.'],
      ['period',              'in',  'COUNTER_WIDTH',  'Half-period in clock ticks (counter ramps 0→period→0)'],
      ['nonoverlap_ticks',    'in',  'COUNTER_WIDTH',  'Ticks of guard band on each side of the duty crossing'],
      ['duty_a / b / c',      'in',  'COUNTER_WIDTH',  'Three phase duty commands, in counter ticks'],
      ['pwm_hi_a / b / c',    'out', '1',              'High-side driver inputs → UCC21222 INA'],
      ['pwm_lo_a / b / c',    'out', '1',              'Low-side driver inputs → UCC21222 INB'],
      ['pwm_peak_strobe',     'out', '1',              'Pulses when the counter reaches its peak. Provisional sample marker.'],
      ['cycle_strobe',        'out', '1',              'Pulses when the counter returns to zero. Marks the reload boundary.'],
      ['configuration_error', 'out', '1',              'High when the shadowed configuration fails its validity check']
    ],
    behaviour: [
      'The counter ramps up to <code>period</code> then back down to zero, which is what makes the modulation centre-aligned.',
      '<code>period</code>, <code>nonoverlap_ticks</code> and all three duties are shadowed every clock and copied into the active registers together, only at the counter-zero boundary (or from an idle state where <code>period_active</code> is zero). All three phases therefore change on the same cycle — no torn updates.',
      'Output equations are <code>hi_x = active &amp;&amp; ((counter + nonoverlap) &lt; duty_x)</code> and <code>lo_x = active &amp;&amp; (counter &gt; (duty_x + nonoverlap))</code>. Both sides are off while the counter is inside ±<code>nonoverlap_ticks</code> of the duty value, which is the non-overlap window.',
      '<code>active = enable &amp;&amp; !pwm_inhibit &amp;&amp; !configuration_error</code>, so an invalid configuration cannot produce switching.',
      'Validity requires a non-zero period, <code>nonoverlap &lt; period</code>, <code>2 × nonoverlap &lt; period</code>, and every duty ≤ period. Comparisons are done on width-extended values to avoid wrap.',
      'On reset every output is driven low and <code>configuration_error</code> is set high, so the part cannot switch before it has been configured.'
    ],
    notes: [
      'The non-overlap window is symmetric: the total both-off time per crossing is <code>2 × nonoverlap_ticks</code> clock cycles, not one.',
      'This is FPGA-side non-overlap. The UCC21222 also has a resistor-programmed dead time on its DT pin. Whether the two should stack is still an open policy question.',
      '<code>pwm_peak_strobe</code> is described in the project notes as a provisional timing marker, not a finalised ADC trigger.'
    ]
  },
  {
    id: 'hall', file: 'hall_decoder.v', src: 'rtlHall', lines: 111,
    role: 'Synchronises three Hall inputs, decodes a six-step sector, and tracks direction plus error counts.',
    params: [],
    ports: [
      ['clk / rst',            'in',  '1',  'Clock and synchronous reset'],
      ['hall_a / b / c',       'in',  '1',  'Digital Hall inputs from J5'],
      ['sector',               'out', '3',  'Decoded sector 0–5, or 7 for an illegal code'],
      ['hall_valid',           'out', '1',  'High when the current code is one of the six legal states'],
      ['direction_forward',    'out', '1',  'Latched direction from the last recognised step'],
      ['transition_strobe',    'out', '1',  'One-cycle pulse on any sector change'],
      ['illegal_state',        'out', '1',  'High while the code is 000 or 111'],
      ['bad_transition',       'out', '1',  'Pulses on a sector jump that is neither a forward nor a reverse step'],
      ['transition_count',     'out', '32', 'Free-running count of sector changes'],
      ['bad_transition_count', 'out', '32', 'Count of illegal codes and non-adjacent jumps']
    ],
    behaviour: [
      'Two flip-flop stages (<code>hall_sync_0</code> → <code>hall_sync_1</code>) synchronise the asynchronous Hall inputs before anything else uses them.',
      'The decode table maps <code>{hall_a, hall_b, hall_c}</code> as 001→0, 101→1, 100→2, 110→3, 010→4, 011→5. Codes 000 and 111 decode to 7 and raise <code>illegal_state</code>.',
      'Direction is only updated when the new sector is adjacent to the previous one in the forward or reverse ring. Any other jump increments <code>bad_transition_count</code>.',
      'After an illegal state the module drops <code>last_valid</code>, so it re-seeds from the next good reading instead of reporting a false transition.'
    ],
    notes: [
      'The sector ordering is a placeholder. The real mapping depends on how the motor Hall sensors are physically installed and has to be found during motor commissioning.',
      'Debounce beyond the two-stage synchroniser is not implemented in RTL. The board supplies a 100 Ω / 100 nF RC filter on each Hall line.',
      'The 5 V Hall pull-up question below must be resolved before these pins are connected to Zynq I/O.'
    ]
  },
  {
    id: 'disable', file: 'pcb_disable_control.v', src: 'rtlDis', lines: 55,
    role: 'Owns the PCB DISABLE line and decides when PWM is permitted to switch.',
    params: [['DISABLE_ACTIVE_LEVEL', "1'b1", 'Matches the UCC21222 active-high DIS pin']],
    ports: [
      ['clk / rst',                'in',  '1', 'Clock and synchronous reset'],
      ['sensor_data_valid',        'in',  '1', 'Low until measurement data is trustworthy'],
      ['enable_request',           'in',  '1', 'Run request from the control layer'],
      ['current_out_of_range',     'in',  '1', 'From the current monitors'],
      ['voltage_out_of_range',     'in',  '1', 'From the voltage monitor'],
      ['external_inhibit_request', 'in',  '1', 'Any other inhibit source'],
      ['clear_latch',              'in',  '1', 'Operator or PS request to clear a latched trip'],
      ['pwm_enable',               'out', '1', 'Gates the PWM generator'],
      ['disable_cmd',              'out', '1', 'Drives the physical DISABLE pin'],
      ['protection_latched',       'out', '1', 'High once a trip has latched'],
      ['status_code',              'out', '4', '0 none, 1 current, 2 voltage, 3 external, 4 startup']
    ],
    behaviour: [
      '<code>pwm_enable = !rst &amp;&amp; enable_request &amp;&amp; !protection_latched &amp;&amp; !any_inhibit</code>, so reset, a latched trip, or any live inhibit all block switching independently.',
      '<code>disable_cmd</code> is the inverse of <code>pwm_enable</code> mapped through <code>DISABLE_ACTIVE_LEVEL</code>: run means drive the pin low, anything else drives it high.',
      'Current, voltage and external inhibits latch. They stay latched until <code>clear_latch</code> is asserted while no inhibit condition is present.',
      'The startup inhibit (<code>!sensor_data_valid</code>) does not latch — it simply holds the part off and reports status 4 until measurements come good.'
    ],
    notes: [
      'The active-high default matches the UCC21222 datasheet and the netlist: DIS is internally pulled high, so an unconfigured FPGA leaves the gate drivers disabled. That is the safe direction.',
      'There is no pull resistor anywhere on the DISABLE net on the board, so the safe state depends entirely on the driver-internal pull-up.'
    ]
  },
  {
    id: 'balance', file: 'phase_current_balance_monitor.v', src: 'rtlBal', lines: 36,
    role: 'Consistency check on the three measured phase currents. Not overcurrent protection.',
    params: [['WIDTH', '16', 'Per-phase current word width'], ['BALANCE_WIDTH', 'WIDTH + 2', 'Headroom for the three-way sum']],
    ports: [
      ['sample_valid',         'in',  '1',             'Gates the check to valid samples'],
      ['ia_q / ib_q / ic_q',   'in',  'WIDTH signed',  'Measured phase currents, fixed point'],
      ['balance_limit_q',      'in',  'BALANCE_WIDTH', 'Allowed magnitude of the sum'],
      ['balance_error_q',      'out', 'BALANCE_WIDTH', 'ia + ib + ic'],
      ['balance_abs_q',        'out', 'BALANCE_WIDTH', 'Absolute value of that sum'],
      ['balance_out_of_range', 'out', '1',             'High when the magnitude exceeds the limit']
    ],
    behaviour: [
      'Purely combinational — there is no clock port. The result follows the inputs directly.',
      'Inputs are sign-extended to <code>BALANCE_WIDTH</code> before summing, so a three-way sum cannot overflow.',
      'In a healthy three-phase system with no neutral connection, ia + ib + ic should be approximately zero. A persistent non-zero sum points at a broken or mis-scaled measurement channel rather than at a motor fault.'
    ],
    notes: [
      'This is deliberately separate from the per-phase limit check. A large current on all three phases at once can sum to nearly zero and slip past a balance test, which is exactly why the limit monitor exists alongside it.'
    ]
  },
  {
    id: 'limit', file: 'phase_current_limit_monitor.v', src: 'rtlLim', lines: 27,
    role: 'Absolute per-phase overcurrent check.',
    params: [['WIDTH', '16', 'Per-phase current word width']],
    ports: [
      ['sample_valid',        'in',  '1',            'Gates the check to valid samples'],
      ['ia_q / ib_q / ic_q',  'in',  'WIDTH signed', 'Measured phase currents'],
      ['current_limit_q',     'in',  'WIDTH signed', 'Magnitude limit applied to every phase'],
      ['phase_over_limit',    'out', '3',            'One bit per phase, A in bit 0'],
      ['current_out_of_range','out', '1',            'OR of the three phase bits']
    ],
    behaviour: [
      'Also purely combinational.',
      'Each phase is compared on magnitude, so it catches motoring and regenerating current equally.',
      'The per-phase bits are kept separate on the output so the fault reason can identify which phase tripped.'
    ],
    notes: [
      'Worth a targeted simulation case: the absolute value is computed as <code>(x &lt; 0) ? -x : x</code> in the same <code>WIDTH</code>. In two\'s complement the most negative value negates to itself and stays negative, so a full-negative-scale reading would compare as not-over-limit. This is an observation from reading the code, not a simulator result. Whether it can be reached in practice depends on the analog scaling, which is still unresolved.'
    ]
  },
  {
    id: 'voltage', file: 'voltage_sense_monitor.v', src: 'rtlVolt', lines: 18,
    role: 'Window check on the phase and bus voltage measurements.',
    params: [['WIDTH', '16', 'Voltage word width']],
    ports: [
      ['phase_v_q',              'in',  'WIDTH', 'Phase voltage measurement (MCU VSENSE A path)'],
      ['bus_v_q',                'in',  'WIDTH', 'Bus voltage measurement (MCU VSENSE Vm path)'],
      ['phase_v_min_q / max_q',  'in',  'WIDTH', 'Phase voltage window'],
      ['bus_v_min_q / max_q',    'in',  'WIDTH', 'Bus voltage window'],
      ['phase_v_out_of_range',   'out', '1',     'Phase measurement outside its window'],
      ['bus_v_out_of_range',     'out', '1',     'Bus measurement outside its window'],
      ['voltage_out_of_range',   'out', '1',     'OR of the two']
    ],
    behaviour: [
      'The smallest module in the set: three continuous assignments, no clock and no state.',
      'Both an undervoltage and an overvoltage condition are caught, because each signal is tested against a min and a max.',
      'Values are treated as unsigned, which suits a sensed rail that never goes below zero at the ADC.'
    ],
    notes: [
      'The window limits are in raw fixed-point counts. Converting them into volts needs the divider ratio, the AMC1311 gain, the diff-stage gain and the ADC full-scale — and the last of those is still unknown.',
      'There is no <code>sample_valid</code> gate on this module, unlike the two current monitors. Whichever block drives it has to make sure the inputs hold meaningful data.'
    ]
  }
];

const TESTBENCHES = [
  { file: 'tb_pwm_3phase_center_aligned.v', lines: 90, dut: 'pwm_3phase_center_aligned', checks: [
      'A continuous assertion that a HI/LO pair is never high at the same time ("HI/LO pair overlapped")',
      'A valid configuration is not incorrectly flagged as an error',
      'pwm_peak_strobe fires the expected number of times',
      'cycle_strobe fires the expected number of times',
      'All outputs shut off when pwm_inhibit is asserted',
      'A duty larger than the period raises configuration_error' ] },
  { file: 'tb_hall_decoder.v', lines: 65, dut: 'hall_decoder', checks: [
      'Hall code 001 decodes to sector 0',
      'Hall code 101 decodes to sector 1 and reports forward direction',
      'An illegal Hall code raises illegal_state' ] },
  { file: 'tb_pcb_disable_control.v', lines: 87, dut: 'pcb_disable_control', checks: [
      'Reset forces PWM off and DISABLE asserted',
      'PWM cannot enable before sensor_data_valid is high',
      'PWM enables once every inhibit is clear',
      'A current fault latches protection',
      'clear_latch restores the enable',
      'A voltage fault latches protection',
      'An external inhibit latches protection' ] },
  { file: 'tb_phase_current_balance_monitor.v', lines: 63, dut: 'phase_current_balance_monitor', checks: [
      'A balanced set of currents does not trip',
      'The exact limit edge case behaves as intended',
      'A positive out-of-range sum trips',
      'sample_valid low suppresses the warning' ] },
  { file: 'tb_phase_current_limit_monitor.v', lines: 51, dut: 'phase_current_limit_monitor', checks: [
      'In-range currents do not trip',
      'A single phase over the limit trips the right bit',
      'sample_valid low suppresses the trip' ] },
  { file: 'tb_voltage_sense_monitor.v', lines: 56, dut: 'voltage_sense_monitor', checks: [
      'A valid voltage pair passes',
      'A low phase voltage trips',
      'A high bus voltage trips' ] }
];

/* --------------------------------------------------------- open questions */
const QUESTIONS = [
  { id: 'q-pinmap', title: 'Board-side net-to-header mapping', owner: 'PCB team', sev: 'blocker',
    blocks: 'Final XDC constraints, any hardware connection',
    body: 'The netlist gives header positions (J3.1–J3.6, J4.5–J4.10, J5.1–J5.6). Turning those into Arduino D/A names, and then into Arty Z7 package pins, relies on assuming a standard Uno layout and a particular connector orientation. All six PWM nets do land on classic Uno PWM pins, which supports the reading — but it is still an inference.',
    ask: 'Can you confirm the board-side net-to-header mapping and the connector orientation so I can write the Arty/Zynq XDC?' },
  { id: 'q-xdc', title: 'Arty / Zynq XDC pin mapping', owner: 'Me (FPGA)', sev: 'blocker',
    blocks: 'Bitstream generation',
    body: 'Once the board-side mapping is confirmed, each signal needs an Arty Z7 package pin and an I/O standard in the XDC. This also depends on knowing which Arty Z7 variant is being used — the Z7-10 (XC7Z010) and Z7-20 (XC7Z020) differ in how much of the shield header reaches the PL.',
    ask: 'Which Arty Z7 variant is the target, and what board part should the Vivado project use?' },
  { id: 'q-hall5v', title: 'Hall 5 V pull-ups into 3.3 V I/O', owner: 'PCB team', sev: 'blocker',
    blocks: 'Connecting Hall lines to the FPGA at all',
    body: 'Each Hall line has a 10 kΩ pull-up to 5 V, then 100 Ω series and 100 nF to ground. Zynq I/O banks are not 5 V tolerant. A 100 Ω series resistor on its own is not adequate protection — it limits current into the clamp diode but leaves the pin above its absolute maximum.',
    ask: 'Can the Hall pull-ups move to 3V3? The 5 V supply to the Hall connector itself can stay.' },
  { id: 'q-adc', title: 'ADC path for the six analog channels', owner: 'PCB team + me', sev: 'blocker',
    blocks: 'Current loop timing, all analog scaling',
    body: 'Five sense signals plus the thermistor land on the analog header. On an Arty Z7 those pins reach the XADC. Whether the design uses XADC, an external ADC, or a PS-side path changes the sample timing and the latency budget for the current loop. If XADC is multiplexed across channels, simultaneous three-phase sampling becomes a control-loop concern.',
    ask: 'Do MCU CSENSE A/B/C, MCU VSENSE A, MCU VSENSE Vm and MCU MOTOR THERM go to Arty XADC, an external ADC, or somewhere else?' },
  { id: 'q-zero', title: 'Zero-current voltage on MCU CSENSE', owner: 'PCB team', sev: 'blocker',
    blocks: 'Fixed-point current scaling, FOC itself',
    body: 'The current-sense diff stage on the OPA4388 references to GND with unity gain, so as parsed, zero current maps to zero volts and negative current maps below ground — where it clips.',
    ask: 'What voltage corresponds to zero current at MCU CSENSE A/B/C?' },
  { id: 'q-bidir', title: 'How negative phase current is represented', owner: 'PCB team', sev: 'blocker',
    blocks: 'FOC current loop',
    body: 'FOC needs bidirectional current. Something has to provide a mid-rail offset, a differential ADC mode, or an equivalent. Nothing visible in the parsed netlist does this. Until it is answered, the sign convention for ia/ib/ic in RTL cannot be fixed.',
    ask: 'How is negative phase current supposed to be read — mid-rail offset network, differential ADC mode, or something not visible in the netlist?' },
  { id: 'q-deadtime', title: 'Dead-time policy', owner: 'PCB team + me', sev: 'high',
    blocks: 'Final nonoverlap_ticks value',
    body: 'The RTL inserts its own non-overlap window. The UCC21222 also has a resistor-programmed dead time on its DT pin, and the schematic comment on R28 / R36 / R61 is literally "Configurable", so the value is not final. Both mechanisms stacking is safe but costs modulation range; relying only on the driver requires trusting the resistor value.',
    ask: 'What are the intended DT resistor values, and should the FPGA insert dead time as well or rely on the driver?' },
  { id: 'q-fpwm', title: 'PWM frequency confirmation', owner: 'Team', sev: 'medium',
    blocks: 'Period constant, current ripple budget',
    body: '20 kHz is the working number across the MATLAB config and the last interface-check run. It has not been confirmed as the number the driver board is designed around.',
    ask: 'Is 20 kHz the target PWM frequency for this board?' },
  { id: 'q-shunt', title: 'Current shunt values', owner: 'PCB team', sev: 'high',
    blocks: 'End-to-end amps-per-volt scaling',
    body: 'The shunts are not on the driver board. The AMC1300 measures PHASE x+ against PHASE x− through the H1/H2/H3 headers, which means the shunt lives on the power board. Without its value the amps-to-volts chain cannot be closed, which is why the MATLAB config correctly leaves the scaling as NaN.',
    ask: 'What is the shunt value on the power board?' },
  { id: 'q-opa', title: 'OPA4388 symbol pin mapping', owner: 'PCB team', sev: 'blocker',
    blocks: 'Fabrication',
    body: 'On both U10 and U12 the netlist puts GND on pin 4 and 3V3 on pin 11. The TI datasheet for the SOIC-14 OPA4388 has pin 4 = V+ and pin 11 = V−. The feedback networks also land on what the datasheet calls the non-inverting pins. Everything is consistent with the schematic symbol carrying a mirrored pin-number map. If the symbol is wrong, a fabricated board would have both quad op-amps powered backwards and no working current or voltage sense.',
    ask: 'Can you open the OPA4388 symbol and check its pin numbering against the datasheet?',
    note: 'The project notes record that this is already known to the team and that Angelina said she will fix it.' },
  { id: 'q-12viso', title: '12V ISO source', owner: 'PCB team', sev: 'blocker',
    blocks: 'Fabrication, any power-up sequence',
    body: 'As parsed, nothing drives the 12V ISO net. The 15 W isolated DC-DC module carries the placeholder designator "?" and all six of its pads are unrouted. Pin 2 of the 3-pin Vm connector is also unrouted, and the designators "?", "H??" and "U?" are unassigned. The isolated gate-drive side therefore has no power source in the extraction.',
    ask: 'What powers the gate-drive side, and can the isolated module get a real designator and connections?' },
  { id: 'q-power', title: 'Power-up sequence', owner: 'Team', sev: 'high',
    blocks: 'Safe bring-up procedure',
    body: 'The board self-powers from J1 (12 V) and puts 12 V on the shield VIN position at J2.8, while the shield 5V / 3V3 / IOREF / RESET pins are unconnected. If the Arty is also USB-powered at the same time, the interaction needs to be intentional. A written order for board power, FPGA configuration and DISABLE release does not exist yet.',
    ask: 'Is 12 V on the shield VIN pin intentional when the Arty is also USB-powered, and what is the intended power-up order?' },
  { id: 'q-bom', title: 'Resistors carrying a capacitor part number', owner: 'PCB team', sev: 'medium',
    blocks: 'BOM correctness',
    body: 'R6, R11, R23, R24, R26 and R27 — the AMC input series resistors — carry the comment CL21B103KBANNNC, which is a 10 nF capacitor MPN. The schematic itself contains the note "SPEC THESE RESISTORS RIGHT".',
    ask: 'What are the real values for the AMC input series resistors?' },
  { id: 'q-vmax', title: 'Maximum Vm the divider must survive', owner: 'PCB team', sev: 'medium',
    blocks: 'Voltage-sense scaling and clamp design',
    body: 'The divider is 750 kΩ + 750 kΩ over 20 kΩ, so about 1:76. A 96 V input gives roughly 1.26 V at the AMC1311, comfortably inside its 0–2 V range. A schematic note reads "96V to 1V65", which does not quite match 96 / 76 ≈ 1.26 V.',
    ask: 'What is the maximum Vm the design should survive, and which number is the intended scaling?' },
  { id: 'q-therm', title: 'Motor thermistor scaling', owner: 'PCB team', sev: 'low',
    blocks: 'Temperature readout',
    body: 'MCU MOTOR THERM has a 499 Ω pull-up to 3V3. Converting the resulting voltage into a temperature needs the thermistor part and its curve, which is not in the driver-board files.',
    ask: 'Which thermistor is in the motor and what is its resistance-temperature curve?' },
  { id: 'q-buck', title: 'Inconsistent buck module part numbers', owner: 'PCB team', sev: 'low',
    blocks: 'BOM correctness',
    body: 'U1 = TPSM33610S3QRDNRQ1, U3 = TPSM33620S5QRDNRQ1, U7 = PSM33620S5QRDNRQ1, plus an unplaced U? = PSM33620S3QRDNRQ1. Earlier notes referred to "PSM33610S3" as if there were only one.',
    ask: 'Are the four buck-module part numbers intentional, and which are the real MPNs?' }
];

/* ------------------------------------------------------------------ timeline */
const TIMELINE = [
  { date: '2026-06-18', tag: 'Proposal', status: 'confirmed',
    title: 'SURG proposal on record',
    body: 'Cost and Energy Efficiency of FPGA-Based Field Oriented Control for Lightweight Motors — Spencer Kogoma.',
    src: null },
  { date: '2026-06-29', tag: 'Research', status: 'confirmed',
    title: 'Datasheet research log compiled',
    body: 'Gate-driver, current-sense and FPGA-platform candidates surveyed. Arty Z7 / Zynq becomes the working control-board assumption. The 3PWM-versus-6PWM decision rule is written down: 3PWM is only valid if the driver generates the complementary output itself.',
    src: 'research' },
  { date: '2026-07-27', tag: 'Notes', status: 'confirmed',
    title: 'PCB / FPGA / FOC project note',
    body: 'Consolidated project note covering the PCB, FPGA and FOC directions.',
    src: 'projnote' },
  { date: '2026-07-29', tag: 'Superseded', status: 'open',
    title: 'First board-interface analysis — now superseded',
    body: 'Described the OLD board: TMCS1126 current sensing, nOC A/B fault lines, current measured on phases A and B only. Kept as history. It contradicts the August 5 extraction and should not be used for decisions.',
    src: 'boardif' },
  { date: '2026-08-03', tag: 'Superseded', status: 'open',
    title: 'Driver board review — superseded and corrected',
    body: 'This review was explicitly marked superseded. Two of its claims were corrected: nOC/FAULT do not appear in the updated extraction (they came from the old board), and Hall is confirmed digital.',
    src: 'review' },
  { date: '2026-08-05', tag: 'Milestone', status: 'confirmed',
    title: 'Updated Altium files parsed against the FPGA and MATLAB work',
    body: 'ActualDriverBoard.PcbDoc parsed to 93 nets, 175 components and 556 pads. The parser was validated against known-good pinouts — UCC21222, AMC1300 and AMC1311 all land on their datasheet supply and ground pins exactly. Connectivity below the chip level is read from the netlist, not guessed from labels.',
    src: 'crosscheck' },
  { date: '2026-08-05', tag: 'Correction', status: 'confirmed',
    title: 'Six PWM lines, not three',
    body: 'The stale assumption that the gate driver generates the complementary output was corrected. The UCC21222 inserts dead time between two signals you provide; it does not create the second one. The FPGA interface is six PWM outputs plus DISABLE — seven digital outputs, not four. The control model is unchanged: software still produces three duty commands.',
    src: 'crosscheck' },
  { date: '2026-08-05', tag: 'Correction', status: 'confirmed',
    title: 'Hall confirmed digital, DISABLE polarity resolved, sixth analog channel found',
    body: 'Hall A/B/C are real digital inputs on J5, so the Hall decoder moved from "not required" to "required". DISABLE is active-high with a floating pin reading as disabled. MCU MOTOR THERM was discovered as a sixth analog channel that appeared in no earlier FPGA or MATLAB document.',
    src: 'crosscheck' },
  { date: '2026-08-05', tag: 'RTL', status: 'confirmed',
    title: 'Six RTL modules and six testbenches in place',
    body: 'PWM generator extended to complementary HI/LO pairs with a non-overlap parameter. Hall decoder added. Current checking split into a balance monitor and a separate per-phase limit monitor. fault_manager.v and the phase-C reconstruction module were removed as they no longer match the board.',
    src: 'known' },
  { date: '2026-08-05', tag: 'MATLAB', status: 'confirmed',
    title: 'board_interface_check.m run against the updated board',
    body: 'Recorded output: 100 MHz fabric clock placeholder, 20 kHz requested, centre-aligned period 2500 counts, actual 20000.00 Hz, 7 digital outputs, 3 confirmed digital inputs, 6 analog inputs, divider ratio 0.013158, 96 V giving 1.263 V before the isolation amp. Current and voltage scaling correctly left as NaN.',
    src: 'lastrun' },
  { date: '2026-08-05', tag: 'Blocked', status: 'open',
    title: 'RTL still unsimulated',
    body: 'No HDL compile or simulation has been verified. vivado, xvlog, xelab, iverilog and verilator were all absent from PATH when this was checked. The testbenches are written and self-checking, but no tool has executed them.',
    src: 'known' }
];

/* -------------------------------------------------------------- glossary */
const GLOSSARY = {
  'FOC': { term: 'Field-Oriented Control', def: 'A motor control method that transforms the three phase currents into a rotating reference frame aligned with the rotor, so torque and magnetising current become two independent DC-like quantities that a simple PI loop can regulate.', src: 'MathWorks: Field-Oriented Control' },
  'Clarke transform': { term: 'Clarke transform', def: 'Converts three phase quantities (a, b, c) into two orthogonal stationary-frame quantities (alpha, beta). Reduces three interdependent signals to two independent ones.', src: 'MathWorks: Clarke and Park transforms' },
  'Park transform': { term: 'Park transform', def: 'Rotates the stationary alpha/beta frame by the rotor electrical angle into the rotating d/q frame. In steady state the sinusoids become constants.', src: 'MathWorks: Clarke and Park transforms' },
  'inverse Park': { term: 'Inverse Park transform', def: 'The reverse rotation: takes the d/q voltage commands the PI loops produced and maps them back into the stationary alpha/beta frame so they can be turned into duty cycles.', src: 'matlab/stage1_3pwm_foc_sim.m' },
  'Q-format': { term: 'Q-format', def: 'A fixed-point convention written Qm.n, where n bits sit below the binary point. Q1.15 stores a number in the range −1 to just under +1 in a 16-bit integer, scaled by 2^15.', src: 'matlab/foc_fixed_point_starter.m' },
  'fixed point': { term: 'Fixed-point arithmetic', def: 'Representing fractional values as scaled integers with an implicit binary point. FPGAs prefer it because integer multipliers and adders are far cheaper in fabric than floating-point units.', src: 'MathWorks: fixed point for FPGA' },
  'PS': { term: 'Processing System (PS)', def: 'The hardened ARM Cortex-A9 side of a Zynq SoC. Runs software: startup, mode changes, communications, logging, recovery policy.', src: 'AMD Zynq-7000 TRM UG585' },
  'PL': { term: 'Programmable Logic (PL)', def: 'The FPGA fabric side of a Zynq SoC. Holds anything that needs deterministic, cycle-accurate timing: PWM generation, sensor capture, fast inhibit.', src: 'AMD Zynq-7000 TRM UG585' },
  'XADC': { term: 'XADC', def: 'The analog-to-digital converter block built into 7-series Xilinx devices. On an Arty Z7 the shield analog pins reach it, with on-board dividers bringing signals into range.', src: 'AMD UG480' },
  'XDC': { term: 'XDC constraints', def: 'Xilinx Design Constraints — the file that tells Vivado which package pin each top-level port maps to, what I/O standard it uses, and what the timing requirements are.', src: 'AMD UG903' },
  'HDL Coder': { term: 'MATLAB HDL Coder', def: 'A MathWorks tool that generates synthesisable Verilog or VHDL from MATLAB functions and Simulink models, including a fixed-point conversion workflow.', src: 'MathWorks HDL Coder docs' },
  'centre-aligned': { term: 'Centre-aligned PWM', def: 'PWM produced by a counter that ramps up and back down, so each pulse is centred in its period. It puts the switching edges symmetrically around the counter peak, which gives a clean point to sample current away from the edges.', src: 'fpga/rtl/pwm_3phase_center_aligned.v' },
  'dead time': { term: 'Dead time', def: 'A deliberate interval where both transistors in a half bridge are held off, so the incoming one cannot turn on before the outgoing one has finished turning off. Without it the bridge shoots through.', src: 'TI: PWM dead-band' },
  'non-overlap': { term: 'Non-overlap window', def: 'The name this project uses for the FPGA-generated both-off interval, to distinguish it from the dead time the UCC21222 adds through its DT resistor.', src: 'fpga/rtl/pwm_3phase_center_aligned.v' },
  'shoot-through': { term: 'Shoot-through', def: 'When the high-side and low-side transistors of one half bridge conduct at the same time, creating a near short across the DC bus. Usually destructive.', src: 'TI: half-bridge gate drivers' },
  'six-step': { term: 'Six-step commutation', def: 'The simplest BLDC drive scheme: energise two of three phases at a time, switching between six patterns as the rotor turns. Easy and Hall-friendly, but produces torque ripple at every step.', src: 'TI: FOC vs trapezoidal control' },
  'SVPWM': { term: 'Space-vector modulation', def: 'A modulation strategy that adds a common-mode offset to all three phases, extending usable bus voltage compared with plain sine modulation. The MATLAB script uses the min/max centring form of it.', src: 'matlab/stage1_3pwm_foc_sim.m' },
  'AXI': { term: 'AXI', def: 'The bus standard Zynq uses between the PS and the PL. An AXI-Lite register block is the usual way software reads and writes fabric registers.', src: 'AMD UG1037' },
  'shunt': { term: 'Shunt resistor', def: 'A low-value precision resistor placed in the current path. The voltage across it is proportional to current. On this design the shunts are on the power board, not the driver board.', src: 'PCB_CROSSCHECK_2026-08-05.md' },
  'per-unit': { term: 'Per-unit (pu)', def: 'Normalising a quantity by a chosen base value so it lands in a convenient range, typically −1 to +1. Makes fixed-point scaling straightforward.', src: 'matlab/foc_fixed_point_starter.m' },
  'anti-windup': { term: 'Integrator anti-windup', def: 'Stopping a PI integrator from accumulating while its output is already saturated. Without it the integrator keeps growing and the loop overshoots badly when it comes off the limit.', src: 'matlab/foc_fixed_point_starter.m' },
  'commutation': { term: 'Commutation', def: 'Switching current between motor phases as the rotor turns, so the produced torque keeps pushing in the same direction.', src: 'TI BLDC basics' },
  'bootstrap': { term: 'Bootstrap supply', def: 'A capacitor charged through a diode while the switch node is low, used to float the high-side gate driver supply above the switch node when it is high.', src: 'TI: isolated gate drivers' },
  'CMTI': { term: 'CMTI', def: 'Common-mode transient immunity — how fast the voltage across an isolation barrier can slew before the isolator produces bogus output. Measured in V/ns.', src: 'TI UCC21222 datasheet' },
  'sector': { term: 'Hall sector', def: 'One of the six 60-degree windows of rotor electrical position that a three-Hall-sensor set can resolve. Codes 000 and 111 are not valid and indicate a wiring or sensor fault.', src: 'fpga/rtl/hall_decoder.v' }
};

/* --------------------------------------------------------- resource library */
const LINKS = [
  { cat: 'This project', items: [
    { t: 'fpga-motors GitHub repository', u: 'https://github.com/spenchh/fpga-motors', d: 'Project repo: RTL, MATLAB, dated notes and the source for this site.', k: 'repo' }
  ]},
  { cat: 'Board & FPGA platform — Digilent / AMD', items: [
    { t: 'Arty Z7 resource center', u: 'https://digilent.com/reference/programmable-logic/arty-z7/start', d: 'Entry point for board files, demos and documentation.' },
    { t: 'Arty Z7 reference manual', u: 'https://digilent.com/reference/programmable-logic/arty-z7/reference-manual', d: 'The authority for shield pin mapping, XADC wiring and I/O bank voltages. Needed to close the XDC question.' },
    { t: 'Arty Z7 reference manual (DigiKey mirror)', u: 'https://www.digikey.com/en/htmldatasheets/production/2076926/0/0/1/arty-z7-reference-manual.html', d: 'Mirror of the same manual.' },
    { t: 'Arty Z7 reference manual (alternate mirror)', u: 'https://manuals.plus/m/08ea389ec3c4a41be1212f4fb31daa6180049384b2934339b8952e99e6a8186e', d: 'Second mirror.' },
    { t: 'Zynq-7000 TRM (UG585)', u: 'https://docs.amd.com/r/en-US/ug585-zynq-7000-SoC-TRM', d: 'Technical reference manual for the PS/PL architecture.' },
    { t: 'XADC User Guide (UG480)', u: 'https://docs.amd.com/r/en-US/ug480_7Series_XADC', d: 'Needed to decide whether XADC can serve the current loop.' },
    { t: 'XADC overview', u: 'https://docs.amd.com/r/en-US/ug480_7Series_XADC/XADC-Overview', d: 'Short-form introduction to the XADC block.' },
    { t: 'Vivado AXI Reference Guide (UG1037)', u: 'https://docs.amd.com/v/u/en-US/ug1037-vivado-axi-reference-guide', d: 'For the eventual PS/PL register interface.' },
    { t: 'Arty Z7 beginner playlist', u: 'https://www.youtube.com/playlist?list=PL0Gcxh26cB_fXbd1NRiLPqrXTIWqGrafx', d: 'Video walkthroughs.', v: true },
    { t: 'Creating a base Vivado project for Arty Z7', u: 'https://www.youtube.com/watch?v=i89v9T8Hdi0', d: 'Project creation walkthrough.', v: true },
    { t: 'Arty Z7 switch-and-LED Verilog project', u: 'https://www.youtube.com/watch?v=9LhgdpqPDsw', d: 'Good match for the first LED test project.', v: true },
    { t: 'Zynq PS vs PL introduction', u: 'https://www.youtube.com/watch?v=_odNhKOZjEo', d: 'Conceptual overview of the split.', v: true },
    { t: 'FPGA hardware clock tutorial', u: 'https://www.youtube.com/watch?v=SuGPceC9lIY', d: 'Clocking fundamentals.', v: true }
  ]},
  { cat: 'Gate drivers, half bridges & dead time — TI', items: [
    { t: 'UCC21222 product page', u: 'https://www.ti.com/product/UCC21222', d: 'The gate driver on this board — three of them, U5 / U9 / U13.', k: 'ucc' },
    { t: 'UCC21222 datasheet', u: 'https://www.ti.com/lit/ds/symlink/ucc21222.pdf', d: 'Source for the active-high DIS behaviour and the DT dead-time programming.', k: 'ucc' },
    { t: 'UCC21222 datasheet (alternate link)', u: 'https://www.ti.com/lit/gpn/UCC21222', d: 'Same document, alternate path.' },
    { t: 'UCC2122x design considerations', u: 'https://www.ti.com/video/6184746545001', d: 'Design notes for this driver family.', v: true },
    { t: 'TI isolated gate-driver video series', u: 'https://www.ti.com/video/series/precision-labs/ti-precision-labs-isolated-gate-drivers.html', d: 'Precision Labs series on isolated gate drive.', v: true },
    { t: 'TI PWM dead-band / dead time', u: 'https://www.ti.com/video/6304743885001', d: 'Directly relevant to the dead-time policy question.', v: true },
    { t: 'Gate-driver PCB layout recommendations', u: 'https://www.ti.com/document-viewer/lit/html/SLUAAM3', d: 'Layout guidance for gate drivers.' },
    { t: 'TI half-bridge gate-driver resources', u: 'https://www.ti.com/product-category/power-management/gate-drivers/half-bridge/overview.html', d: 'Category overview.' },
    { t: 'TI brushless-DC motor-driver overview', u: 'https://www.ti.com/product-category/motor-drivers/brushless-dc/overview.html', d: 'Category overview.' },
    { t: 'The H-bridge explained', u: 'https://www.youtube.com/watch?v=6XNnVYsbDfU', d: 'Fundamentals of bridge switching.', v: true },
    { t: 'Bootstrap gate-driver explanation', u: 'https://www.youtube.com/watch?v=em5BuCFSuBw', d: 'Why the high side needs a floating supply.', v: true },
    { t: 'MOSFET selection for BLDC/PMSM drives', u: 'https://www.youtube.com/watch?v=mKEaItSvM5Q', d: 'Switch selection criteria.', v: true },
    { t: 'DRV8316 evaluation module', u: 'https://www.ti.com/tool/DRV8316REVM', d: 'Reference hardware.' },
    { t: 'DRV8328 evaluation-board demo', u: 'https://www.youtube.com/watch?v=go8C037-Br0', d: 'Evaluation board walkthrough.', v: true },
    { t: 'Altium: how to select a gate driver IC', u: 'https://resources.altium.com/p/how-to-select-a-gate-driver-ic', d: 'Selection guidance.' }
  ]},
  { cat: 'Current & voltage sensing — TI', items: [
    { t: 'AMC1300 product page', u: 'https://www.ti.com/product/AMC1300', d: 'Isolated amplifier used for phase current — U2 / U4 / U6.', k: 'amc1300' },
    { t: 'AMC1300 datasheet', u: 'https://www.ti.com/lit/ds/symlink/amc1300.pdf', d: 'Source for the fixed gain of 8.2 and the ±250 mV input range.', k: 'amc1300' },
    { t: 'AMC1300B-Q1 datasheet', u: 'https://www.ti.com/lit/ds/symlink/amc1300b-q1.pdf', d: 'Automotive-qualified variant.' },
    { t: 'AMC1311 product page', u: 'https://www.ti.com/product/AMC1311', d: 'Isolated amplifier for voltage sense — U11 / U14.', k: 'amc1311' },
    { t: 'AMC1311 datasheet', u: 'https://www.ti.com/lit/ds/symlink/amc1311.pdf', d: 'Source for the 2 V input range that the 1:76 divider targets.', k: 'amc1311' },
    { t: 'OPA4388 product page', u: 'https://www.ti.com/product/OPA4388', d: 'Quad op-amp used for the diff stages — U10 / U12.', k: 'opa' },
    { t: 'OPA2388 / OPA4388 datasheet', u: 'https://www.ti.com/lit/ds/symlink/opa2388.pdf', d: 'The pinout that the schematic symbol needs to be checked against.', k: 'opa' },
    { t: 'TI isolated amplifiers and modulators series', u: 'https://www.ti.com/video/series/precision-labs/ti-precision-labs-isolated-amplifiers-and-modulators.html', d: 'Precision Labs series.', v: true },
    { t: 'TI op amp Precision Labs', u: 'https://www.ti.com/video/series/precision-labs/ti-precision-labs-op-amps.html', d: 'Op-amp fundamentals.', v: true },
    { t: 'Current sensing using different amplifier types', u: 'https://www.ti.com/video/6076312538001', d: 'Comparison of sensing approaches.', v: true },
    { t: 'How to choose a shunt resistor', u: 'https://www.ti.com/video/6076324596001', d: 'Relevant to the open shunt-value question.', v: true },
    { t: 'Inline and high-side current sensing', u: 'https://www.ti.com/document-viewer/lit/html/SLLA528', d: 'Topology comparison.' },
    { t: 'Single-shunt current reconstruction for FOC', u: 'https://www.ti.com/document-viewer/lit/html/SBOA587', d: 'Background on reconstruction, which this design does not need since all three phases are measured.' }
  ]},
  { cat: 'FOC & motor-control theory — MathWorks / TI', items: [
    { t: 'Field-Oriented Control overview', u: 'https://www.mathworks.com/discovery/field-oriented-control.html', d: 'Concept page.' },
    { t: 'Clarke and Park transforms', u: 'https://www.mathworks.com/discovery/clarke-and-park-transforms.html', d: 'The transform definitions used in the MATLAB scripts.' },
    { t: 'Understanding Field-Oriented Control (video)', u: 'https://www.mathworks.com/videos/motor-control-part-4-understanding-field-oriented-control-1587967749983.html', d: 'The clearest single explanation of why FOC works.', v: true },
    { t: 'Electric Motor Control overview', u: 'https://www.mathworks.com/discovery/electric-motor-control.html', d: 'Broader concept page.' },
    { t: 'Implement motor-speed control using FOC', u: 'https://www.mathworks.com/help/mcb/gs/implement-motor-speed-control-by-using-field-oriented-control-foc.html', d: 'Worked example.' },
    { t: 'Field-Oriented Current Controller block', u: 'https://www.mathworks.com/help/mcb/ref/fieldorientedcurrentcontroller.html', d: 'Block reference for the current loop.' },
    { t: 'Modeling motor, inverter and FOC controller', u: 'https://www.mathworks.com/videos/modeling-motor-inverter-and-field-oriented-controller-1538569648219.html', d: 'Modelling walkthrough.', v: true },
    { t: 'Space-vector modulation', u: 'https://www.mathworks.com/videos/space-vector-modulation-1610709895322.html', d: 'Background for the duty-generation step.', v: true },
    { t: 'FOC versus trapezoidal BLDC control', u: 'https://www.ti.com/document-viewer/lit/html/SSZTAP5', d: 'Direct comparison of the two control strategies.' }
  ]},
  { cat: 'Fixed point & FPGA FOC — MathWorks', items: [
    { t: 'Fixed-point made easy for FPGA', u: 'https://www.mathworks.com/videos/fpga-for-dsp-applications-fixed-point-made-easy-1495129243550.html', d: 'Introduction to fixed point for fabric.', v: true },
    { t: 'Converting MATLAB algorithms to fixed point', u: 'https://www.mathworks.com/videos/fpga-design-with-matlab-part-4-converting-to-fixed-point-1569474465192.html', d: 'The conversion workflow this project will follow.', v: true },
    { t: 'Fixed-point FOC HDL example', u: 'https://www.mathworks.com/help/hdlcoder/ug/field-oriented-control-of-a-permanent-magnet-synchronous-machine.html', d: 'Reference implementation.' },
    { t: 'Floating-point vs fixed-point FOC', u: 'https://www.mathworks.com/help/hdlcoder/ug/single-precision-field-oriented-control-pmsm-model.html', d: 'Trade-off comparison.' },
    { t: 'FOC partitioned between FPGA and ARM', u: 'https://www.mathworks.com/help/hdlcoder/ug/field-oriented-control-of-a-PMSM.html', d: 'The partitioning pattern this project is aiming at.' },
    { t: 'FOC using Motor Control Blockset on FPGA', u: 'https://www.mathworks.com/help/mcb/gs/foc-pmsm-using-mcb-blocks-fpga-hardware.html', d: 'Blockset-based FPGA FOC.' },
    { t: 'FOC on an FPGA SoC', u: 'https://www.mathworks.com/help/soc/ug/foc-motor-controller-on-trenz-board.html', d: 'SoC-targeted example.' },
    { t: 'Implementing FOC on an FPGA (video)', u: 'https://www.mathworks.com/videos/implementing-field-oriented-control-for-a-motor-on-an-fpga-1666278424479.html', d: 'Implementation walkthrough.', v: true },
    { t: 'Deploying motor-control algorithms to an FPGA (series)', u: 'https://www.mathworks.com/videos/series/deploying-motor-control-algorithms-to-an-fpga.html', d: 'Multi-part series.', v: true },
    { t: 'Same series (regional mirror)', u: 'https://jp.mathworks.com/videos/series/deploying-motor-control-algorithms-to-an-fpga.html', d: 'Mirror.', v: true },
    { t: 'FPGA motor control: getting started', u: 'https://www.mathworks.com/videos/deploy-motor-control-algorithms-to-fpgas-getting-started-1610009519664.html', d: 'Entry-level video.', v: true }
  ]},
  { cat: 'BLDC, Hall sensors & PWM', items: [
    { t: 'TI Brushless-DC basics', u: 'https://www.ti.com/video/6088830019001', d: 'Start here if BLDC motors are new.', v: true },
    { t: 'TI BLDC motor playlist', u: 'https://www.youtube.com/playlist?list=PLISmVLHAZbTQW1gK5ql0gq3HbwxF6BMjR', d: 'Full playlist.', v: true },
    { t: 'How BLDC motors, ESCs and PWM work', u: 'https://www.youtube.com/watch?v=yiD5nCfmbV0', d: 'System-level explanation.', v: true },
    { t: 'Hall sensing and sector detection', u: 'https://www.youtube.com/watch?v=UsYOnBivcY8', d: 'Directly relevant to hall_decoder.v.', v: true },
    { t: 'PWM basics', u: 'https://www.youtube.com/watch?v=DEMbi4RLdFU', d: 'Fundamentals.', v: true },
    { t: 'TI PWM basics', u: 'https://www.ti.com/video/6288207254001', d: 'Vendor version of the same fundamentals.', v: true },
    { t: 'MathWorks BLDC speed control using PWM', u: 'https://www.youtube.com/watch?v=b5J5qkR7msc', d: 'Speed control example.', v: true },
    { t: 'Trapezoidal BLDC control using Hall sensors (SPRABQ6)', u: 'https://www.ti.com/lit/an/sprabq6/sprabq6.pdf', d: 'Application note on Hall-based commutation.' },
    { t: 'Sensored three-phase BLDC control (SLAA503)', u: 'https://www.ti.com/lit/an/slaa503/slaa503.pdf', d: 'Application note.' },
    { t: 'TI Hall-sensored BLDC software architecture', u: 'https://software-dl.ti.com/msp430/esd/MSPM0-SDK/1_10_00_05/docs/english/middleware/motor_control_bldc_sensored_trap_hall/doc_guide/doc_guide-srcs/Hall_sensored_Motor_Control_Software_User_Guide.html', d: 'Software structure for Hall-sensored control.' }
  ]},
  { cat: 'Verilog, simulation, synthesis & timing — AMD', items: [
    { t: 'Vivado Simulation Tutorial (UG937)', u: 'https://docs.amd.com/r/en-US/ug937-vivado-design-suite-simulation-tutorial/Introduction', d: 'Follow this to run the existing testbenches for the first time.' },
    { t: 'Vivado Logic Simulation (UG900)', u: 'https://docs.amd.com/r/en-US/ug900-vivado-logic-simulation/Simulating-with-Vivado-Simulator', d: 'Simulator reference.' },
    { t: 'SystemVerilog support in Vivado Simulator', u: 'https://docs.amd.com/r/en-US/ug900-vivado-logic-simulation/SystemVerilog-Support-in-Vivado-Simulator', d: 'Language support notes.' },
    { t: 'Vivado Synthesis Guide (UG901)', u: 'https://docs.amd.com/r/en-US/ug901-vivado-synthesis/Using-Synthesis', d: 'Synthesis reference.' },
    { t: 'Running timing analysis', u: 'https://docs.amd.com/r/en-US/ug901-vivado-synthesis/Running-Timing-Analysis', d: 'Timing closure basics.' },
    { t: 'Vivado Constraints Guide (UG903)', u: 'https://docs.amd.com/r/en-US/ug903-vivado-using-constraints/Timing-Constraints', d: 'The XDC reference.' },
    { t: 'Basic Verilog testbench tutorial', u: 'https://www.youtube.com/watch?v=xYcTZmq4xb8', d: 'Testbench fundamentals.', v: true },
    { t: 'Vivado Verilog simulation tutorial', u: 'https://www.youtube.com/watch?v=7fB0-WjjZ2o', d: 'Simulation walkthrough.', v: true }
  ]},
  { cat: 'SimpleFOC & Arduino — reference only', items: [
    { t: 'SimpleFOC getting started', u: 'https://docs.simplefoc.com/example_from_scratch', d: 'Reference implementation, not the architecture this project uses.' },
    { t: 'SimpleFOC: test your driver', u: 'https://docs.simplefoc.com/test_driver', d: 'Bring-up methodology worth borrowing.' },
    { t: 'SimpleFOC BLDCDriver3PWM', u: 'https://docs.simplefoc.com/bldcdriver3pwm', d: 'Their 3PWM driver class.' },
    { t: 'BLDCDriver3PWM source reference', u: 'https://source.simplefoc.com/class_b_l_d_c_driver3_p_w_m.html', d: 'Source-level reference.' },
    { t: 'SimpleFOC driver configuration', u: 'https://docs.simplefoc.com/drivers_config', d: 'Configuration options.' },
    { t: 'SimpleFOC BLDC driver docs', u: 'https://docs.simplefoc.com/bldcdriver', d: 'Driver abstraction.' },
    { t: 'SimpleFOC: writing the code', u: 'https://docs.simplefoc.com/code', d: 'Code structure.' },
    { t: 'SimpleFOC motor and driver open-loop test', u: 'https://docs.simplefoc.com/test_motor_driver', d: 'Open-loop bring-up sequence.' },
    { t: 'SimpleFOC sensor test', u: 'https://docs.simplefoc.com/test_sensor', d: 'Sensor validation method.' },
    { t: 'SimpleFOC Hall sensors', u: 'https://docs.simplefoc.com/hall_sensors', d: 'Hall handling — useful comparison for hall_decoder.v.' },
    { t: 'SimpleFOC BLDC motor', u: 'https://docs.simplefoc.com/bldcmotor', d: 'Motor abstraction.' },
    { t: 'SimpleFOC alignment procedure', u: 'https://docs.simplefoc.com/alignment_procedure', d: 'Directly relevant to the open Hall-sequence commissioning question.' },
    { t: 'SimpleFOC monitoring', u: 'https://docs.simplefoc.com/monitoring', d: 'Telemetry approach.' },
    { t: 'SimpleFOC current sense overview', u: 'https://docs.simplefoc.com/current_sense', d: 'Current-sensing concepts.' },
    { t: 'SimpleFOC inline current sense', u: 'https://docs.simplefoc.com/inline_current_sense', d: 'Closest topology to this board.' },
    { t: 'SimpleFOC low-side current sense', u: 'https://docs.simplefoc.com/low_side_current_sense', d: 'Alternative topology.' },
    { t: 'SimpleFOC test current sense', u: 'https://docs.simplefoc.com/test_current', d: 'Validation method.' },
    { t: 'SimpleFOC current sense support', u: 'https://docs.simplefoc.com/current_sense_support', d: 'Platform support matrix.' },
    { t: 'SimpleFOC source code organization', u: 'https://docs.simplefoc.com/source_code', d: 'Repo layout.' },
    { t: 'SimpleFOC examples', u: 'https://docs.simplefoc.com/library_examples', d: 'Example index.' },
    { t: 'SimpleFOC practical guides', u: 'https://docs.simplefoc.com/practical_guides', d: 'Practical notes.' },
    { t: 'Arduino Uno R3 documentation', u: 'https://docs.arduino.cc/hardware/uno-rev3/', d: 'The shield-header geometry this board follows.' },
    { t: 'PlatformIO for VS Code', u: 'https://docs.platformio.org/en/latest/integration/ide/vscode.html', d: 'Toolchain for the Arduino-side reference work.' },
    { t: 'PlatformIO project configuration', u: 'https://docs.platformio.org/en/latest/projectconf/index.html', d: 'platformio.ini reference.' },
    { t: 'PlatformIO tutorial', u: 'https://www.youtube.com/watch?v=SAVczh7W1Oc', d: 'Setup walkthrough.', v: true },
    { t: 'SimpleFOC tuning part 1', u: 'https://www.youtube.com/watch?v=ufMs83Y3sXg', d: 'PI tuning in practice.', v: true },
    { t: 'SimpleFOC tuning part 2', u: 'https://www.youtube.com/watch?v=ENGGh0ajE2M', d: 'Continuation.', v: true },
    { t: 'SimpleFOC open-loop velocity demo', u: 'https://www.youtube.com/watch?v=QXtLRU_ObkM', d: 'Open-loop demonstration.', v: true },
    { t: 'Makerbase SimpleFOC playlist', u: 'https://www.youtube.com/playlist?list=PLc2RScfrSFEBJ6c9xGWglmU4QFI9JGxFa', d: 'Hardware-focused playlist.', v: true },
    { t: 'Arduino BLDC motor-control example', u: 'https://www.youtube.com/watch?v=qOzE5F5vFGs', d: 'Introductory example.', v: true },
    { t: 'Closed-loop Arduino FOC example', u: 'https://www.youtube.com/watch?v=MKNkZOja7-s', d: 'Closed-loop demonstration.', v: true },
    { t: 'FOC driver and magnetic-sensor example', u: 'https://www.youtube.com/watch?v=pzGRKyHlXsM', d: 'Sensor-based FOC demo.', v: true }
  ]},
  { cat: 'Lab instruments — Tektronix / Keysight', items: [
    { t: 'How to use an oscilloscope', u: 'https://www.youtube.com/watch?v=LaY47Qrfs0c', d: 'Basics.', v: true },
    { t: 'Measuring PWM with an oscilloscope', u: 'https://www.youtube.com/watch?v=1kCOA__Un-I', d: 'Exactly the measurement needed for PWM bring-up.', v: true },
    { t: 'Arduino PWM oscilloscope demo', u: 'https://www.youtube.com/watch?v=Cx_I5i-lJ4Y', d: 'Worked example.', v: true },
    { t: 'Tektronix oscilloscope primer', u: 'https://www.tek.com/en/documents/primer/xyzs-oscilloscopes-primer', d: 'Comprehensive primer.' },
    { t: 'Oscilloscope primer (PDF)', u: 'https://download.tek.com/document/XYZs-of-Oscilloscopes_Primer_03W-8605-8.pdf', d: 'PDF version.' },
    { t: 'Setting up and using an oscilloscope', u: 'https://www.tek.com/vn/documents/primer/setting-and-using-oscilloscope', d: 'Practical setup guide.' },
    { t: 'Tektronix probe fundamentals', u: 'https://www.tek.com/en/documents/whitepaper/abcs-probes-primer', d: 'Probing matters a lot on switching nodes.' },
    { t: 'Three-phase motor-drive measurements', u: 'https://www.tek.com/vn/documents/primer/making-measurements-on-3-phase-motor-drives-with-an-oscilloscope', d: 'Directly applicable when hardware bring-up starts.' },
    { t: 'Three-phase motor-drive measurement (PDF)', u: 'https://map-assets.tek.com/map-assets/asean/PDF/Primer-3-Phase_Motor_Drives_w_Oscilloscope_48W-73863-1.pdf', d: 'PDF version.' },
    { t: 'Three-phase PWM measurement (video)', u: 'https://www.youtube.com/watch?v=Fz9R3w0UCu0', d: 'Video walkthrough.', v: true },
    { t: 'Keysight oscilloscope triggering fundamentals', u: 'https://www.keysight.com/us/en/learn/course.oscilloscope-triggering-fundamentals.html', d: 'Triggering is the hard part on PWM.' },
    { t: 'Keysight bench power-supply tips', u: 'https://www.youtube.com/watch?v=cmduKuMLDsc', d: 'Supply setup.', v: true },
    { t: 'Keysight bench power-supply overview', u: 'https://www.keysight.com/blogs/en/tech/educ/2023/bench-power-supply', d: 'Overview.' },
    { t: 'Constant-voltage vs constant-current modes', u: 'https://www.keysight.com/us/en/assets/6123-1426/lessons/0027BenchPowerSupplyBasics004Using6UnderstandingConstantVoltageandConstantCurrentModes.html', d: 'Current limiting is the main safety net during first power-up.' }
  ]},
  { cat: 'PCB & Altium', items: [
    { t: 'Altium: managing project documents', u: 'https://www.altium.com/documentation/altium-designer/managing-project-documents', d: 'Project structure.' },
    { t: 'Altium: saving projects and documents', u: 'https://www.altium.com/documentation/altium-designer/saving-projects-documents', d: 'File handling.' },
    { t: 'High-voltage creepage and clearance', u: 'https://resources.altium.com/p/high-voltage-pcb-design-creepage-and-clearance-distance', d: 'Relevant to the isolated side of this board.' }
  ]}
];

const LEARNING_ORDER = [
  { n: 1,  t: 'SimpleFOC getting started', u: 'https://docs.simplefoc.com/example_from_scratch' },
  { n: 2,  t: 'TI BLDC basics', u: 'https://www.ti.com/video/6088830019001' },
  { n: 3,  t: 'TI PWM basics', u: 'https://www.ti.com/video/6288207254001' },
  { n: 4,  t: 'H-bridge and bootstrap videos', u: 'https://www.youtube.com/watch?v=6XNnVYsbDfU' },
  { n: 5,  t: 'UCC21222 datasheet', u: 'https://www.ti.com/lit/ds/symlink/ucc21222.pdf' },
  { n: 6,  t: 'AMC1300, AMC1311 and OPA4388 docs', u: 'https://www.ti.com/lit/ds/symlink/amc1300.pdf' },
  { n: 7,  t: 'MathWorks: Understanding FOC', u: 'https://www.mathworks.com/videos/motor-control-part-4-understanding-field-oriented-control-1587967749983.html' },
  { n: 8,  t: 'Clarke and Park transforms', u: 'https://www.mathworks.com/discovery/clarke-and-park-transforms.html' },
  { n: 9,  t: 'Fixed-point made easy', u: 'https://www.mathworks.com/videos/fpga-for-dsp-applications-fixed-point-made-easy-1495129243550.html' },
  { n: 10, t: 'Arty Z7 reference manual', u: 'https://digilent.com/reference/programmable-logic/arty-z7/reference-manual' },
  { n: 11, t: 'Vivado simulation tutorial', u: 'https://docs.amd.com/r/en-US/ug937-vivado-design-suite-simulation-tutorial/Introduction' },
  { n: 12, t: 'XADC user guide', u: 'https://docs.amd.com/r/en-US/ug480_7Series_XADC' },
  { n: 13, t: 'Oscilloscope and bench-supply primers', u: 'https://www.tek.com/en/documents/primer/xyzs-oscilloscopes-primer' }
];
