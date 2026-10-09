# Vivado / xsim Evidence Audit - 2026-08-22

## Update after direct xsim run on 2026-08-22

A direct standalone xsim run was completed after the original audit.

Vivado GUI/project batch startup failed because Vivado reported:

```text
ERROR: [Common 17-356] Failed to install all user apps.
ERROR: [Common 17-39] 'load_features' failed due to earlier errors.
```

That was a Vivado feature/app startup issue, not an RTL compile failure.

The simulator tools were then run directly:

```text
xvlog -sv adc_current_scaler_q15.sv sincos_lut_q15.sv clarke_park_transform.sv pi_controller_q15.sv inverse_park_transform.sv alpha_beta_to_duty.sv phase_current_limit_monitor.v phase_current_balance_monitor.v pcb_disable_control.v pwm_3phase_center_aligned.v foc_current_loop_top.sv tb_foc_current_loop_top.v
xelab --debug typical --relax --mt 2 -L work -snapshot tb_foc_current_loop_top_behav work.tb_foc_current_loop_top
xsim tb_foc_current_loop_top_behav -runall
```

New evidence files:

- `fpga/xsim_foc_run/xvlog_foc.log`
- `fpga/xsim_foc_run/xelab_foc.log`
- `fpga/xsim_foc_run/xsim_foc.log`

Result:

```text
Starting FOC current loop top testbench
PASS: FOC current loop top testbench completed
$finish called at time : 516 ns : File "C:/Users/HP/Documents/SURG/fpga/tb/tb_foc_current_loop_top.v" Line 165
```

This is now log-backed evidence that the current source set compiles, elaborates, and passes the `tb_foc_current_loop_top` behavioral testbench in xsim.

The testbench clock is still source-derived from `tb_foc_current_loop_top.v`:

- `always #5 clk = ~clk`
- 10 ns period
- 100 MHz simulated clock

## Original bottom line before the direct full-top run

The preserved Vivado/xsim log result at 180 ns is for `hall_decoder` only.
It is not the full `foc_current_loop_top.sv` path and it is not the PWM test.

There are waveform database/kernel completion artifacts for several individual support modules, including PWM, but the current preserved `simulate.log` only contains the Hall decoder PASS message.

No Vivado synthesis, implementation, timing, utilization, or bitstream evidence was found in the repo.

## Exact 180 ns result

Evidence files:

- `fpga/SURG/SURG.sim/sim_1/behav/xsim/compile.log`
- `fpga/SURG/SURG.sim/sim_1/behav/xsim/elaborate.log`
- `fpga/SURG/SURG.sim/sim_1/behav/xsim/simulate.log`
- `fpga/tb/tb_hall_decoder.v`
- `fpga/rtl/hall_decoder.v`

Compiled module and testbench:

```text
INFO: [VRFC 10-2263] Analyzing Verilog file "C:/Users/HP/Documents/SURG/fpga/rtl/hall_decoder.v" into library xil_defaultlib
INFO: [VRFC 10-311] analyzing module hall_decoder
INFO: [VRFC 10-2263] Analyzing Verilog file "C:/Users/HP/Documents/SURG/fpga/tb/tb_hall_decoder.v" into library xil_defaultlib
INFO: [VRFC 10-311] analyzing module tb_hall_decoder
```

Elaboration command:

```text
C:/AMDDesignTools/2026.1/Vivado/bin/unwrapped/win64.o/xelab.exe --incr --debug typical --relax --mt 2 -L xil_defaultlib -L unisims_ver -L unimacro_ver -L secureip --snapshot tb_hall_decoder_behav xil_defaultlib.tb_hall_decoder xil_defaultlib.glbl -log elaborate.log
```

Simulation command from `simulate.bat`:

```text
xsim tb_hall_decoder_behav -key {Behavioral:sim_1:Functional:tb_hall_decoder} -tclbatch tb_hall_decoder.tcl -log simulate.log
```

Tcl run command from `tb_hall_decoder.tcl`:

```text
run 1000ns
```

Vivado/xsim version and snapshot:

```text
Vivado Simulator v2026.1
Time Resolution for simulation is 1ps
Built simulation snapshot tb_hall_decoder_behav
```

Simulation output:

```text
Time resolution is 1 ps
Starting Hall decoder testbench
PASS: Hall decoder testbench completed
$finish called at time : 180 ns : File "C:/Users/HP/Documents/SURG/fpga/tb/tb_hall_decoder.v" Line 77
```

Testbench clock:

- `tb_hall_decoder.v` uses `always #5 clk = ~clk`
- Clock period = 10 ns
- Simulated clock frequency = 100 MHz

Pass condition from `tb_hall_decoder.v`:

- Hall state `001` must decode to sector 0 with `hall_valid` high
- Hall state `101` must decode as forward sector 1 with `direction_forward` high
- Hall state `111` must flag `illegal_state` and clear `hall_valid`

Module behavior from `hall_decoder.v`:

- Uses two synchronizer registers: `hall_sync_0`, `hall_sync_1`
- Decodes the synchronized Hall state into sectors 0 through 5
- Flags illegal Hall states as sector 7
- Tracks forward/reverse sector transitions
- Counts valid transitions and bad transitions

## Vivado project evidence

Project file found:

- `fpga/SURG/SURG.xpr`

Target part in the Vivado project:

- `xc7z010clg400-1`

Board part:

- Empty in the `.xpr`

Files included in the Vivado project:

- `rtl/hall_decoder.v`
- `rtl/pcb_disable_control.v`
- `rtl/phase_current_balance_monitor.v`
- `rtl/phase_current_limit_monitor.v`
- `rtl/pwm_3phase_center_aligned.v`
- `rtl/voltage_sense_monitor.v`
- `tb/tb_hall_decoder.v`
- `tb/tb_voltage_sense_monitor.v`
- `tb/tb_phase_current_limit_monitor.v`
- `tb/tb_phase_current_balance_monitor.v`
- `tb/tb_pcb_disable_control.v`
- `tb/tb_pwm_3phase_center_aligned.v`

Vivado simulation top in the project:

- `tb_hall_decoder`

Vivado source top in the project:

- `hall_decoder`

## Individual module simulation artifacts found

Waveform database files found:

- `tb_hall_decoder_behav.wdb`
- `tb_pcb_disable_control_behav.wdb`
- `tb_phase_current_balance_monitor_behav.wdb`
- `tb_phase_current_limit_monitor_behav.wdb`
- `tb_pwm_3phase_center_aligned_behav.wdb`
- `tb_voltage_sense_monitor_behav.wdb`

Each corresponding `xsimkernel.log` says:

- Design successfully loaded
- Simulation completed

This proves xsim generated/loaded waveform runs for those individual modules.
It does not preserve the PASS text for every testbench because the active `simulate.log` currently contains only the Hall decoder run.

## PWM simulation evidence

PWM files:

- `fpga/rtl/pwm_3phase_center_aligned.v`
- `fpga/tb/tb_pwm_3phase_center_aligned.v`
- `fpga/SURG/SURG.sim/sim_1/behav/xsim/tb_pwm_3phase_center_aligned_behav.wdb`
- `fpga/SURG/SURG.sim/sim_1/behav/xsim/xsim.dir/tb_pwm_3phase_center_aligned_behav/xsimkernel.log`

PWM xsim kernel log:

```text
Running: xsim.dir/tb_pwm_3phase_center_aligned_behav/xsimk.exe -simmode gui -wdb tb_pwm_3phase_center_aligned_behav.wdb -simrunnum 0 -socket 59043
Design successfully loaded
Simulation completed
```

PWM testbench source settings:

- Clock period: 10 ns
- Simulated clock frequency: 100 MHz
- `period = 8'd100`
- `nonoverlap_ticks = 8'd2`
- Initial duties: A = 25, B = 50, C = 75

PWM source-level checks:

- HI and LO outputs for the same phase must never overlap
- Valid configuration must not raise `configuration_error`
- Peak strobe must fire at least twice
- Cycle strobe must fire at least twice
- PWM outputs must shut off when `pwm_inhibit` is asserted
- Invalid duty must raise `configuration_error`

Preserved PWM PASS log:

- Not found in the current `simulate.log`

## Full FOC pipeline evidence

Original audit result before the direct xsim run:

No Vivado/xsim log or waveform database was found for:

- `foc_current_loop_top.sv`
- `tb_foc_current_loop_top.v`

The repo does contain the source and testbench:

- `fpga/rtl/foc_current_loop_top.sv`
- `fpga/tb/tb_foc_current_loop_top.v`

But the Vivado project file does not include the full FOC source set, and no xsim artifact proves that the full top-level FOC path was simulated in Vivado.

Updated result after direct xsim:

- `tb_foc_current_loop_top` now has a direct standalone xsim PASS at 516 ns
- This was not run through the existing `.xpr` project because Vivado project batch startup hit a user-app loading error
- This does not prove synthesis, implementation, timing closure, or hardware behavior

## FOC/math module simulation status

No Vivado/xsim logs or `.wdb` waveform files were found for:

- `adc_current_scaler_q15`
- `sincos_lut_q15`
- `clarke_park_transform`
- `pi_controller_q15`
- `inverse_park_transform`
- `alpha_beta_to_duty`
- `foc_current_loop_top`

The repo does contain testbench source files for these modules, and the testbench source includes PASS messages, but preserved Vivado/xsim output logs for those runs were not found.

## MATLAB / Simulink comparison evidence

MATLAB files found:

- `matlab/board_interface_check.m`
- `matlab/board_interface_check_LAST_RUN.txt`
- `matlab/board_interface_config.m`
- `matlab/foc_fixed_point_starter.m`
- `matlab/stage1_3pwm_foc_sim.m`
- `matlab/README.md`

No `.slx`, `.mdl`, or `.mat` files were found.

No evidence was found for an RTL-vs-MATLAB or RTL-vs-Simulink comparison run with:

- max absolute error
- max LSB error
- average error
- number of test vectors

The only numeric MATLAB last-run item found was a board-interface/current-balance check:

```text
max ideal Ia + Ib + Ic error = 0.000000 A
```

That is not an RTL comparison metric.

## Source-derived timing and latency only

These are not measured from Vivado waveform logs. They are derived from the current RTL source.

Clocked testbenches use:

- `always #5 clk = ~clk`
- 10 ns period
- 100 MHz simulated clock

Source-derived module valid latencies:

- `adc_current_scaler_q15.sv`: about 2 cycles from `sample_valid` to `current_valid`
- `sincos_lut_q15.sv`: one registered output stage from `angle_valid` to `sincos_valid`
- `clarke_park_transform.sv`: about 3 cycles from `sample_valid` to `transform_valid`
- `pi_controller_q15.sv`: about 3 cycles from `sample_valid && enable` to `control_valid` after the output clamp pipeline stage
- `inverse_park_transform.sv`: about 1 cycle from `sample_valid` to `inverse_valid`
- `alpha_beta_to_duty.sv`: about 2 cycles from `sample_valid` to `duty_valid`

Source-derived full top estimate:

- Roughly 13 cycles from `sample_valid` to `duty_valid` after angle readiness has been established
- Actual PWM output update depends on where the new duty lands relative to the PWM cycle boundary
- This has not been verified in Vivado/xsim logs

PWM source-derived timing:

- With `period = 100` and a 100 MHz testbench clock, the center-aligned PWM counter target is about 2 us per full up/down cycle
- Exact strobe-to-strobe timing should be measured from waveform or a preserved text check before claiming it as measured

Hall decoder source-derived timing:

- The module uses a two-register Hall input synchronizer
- The testbench waits four clock edges after each Hall change before checking outputs
- The preserved measured simulation end time is 180 ns

## Synthesis / implementation / bitstream evidence

The `.xpr` defines `synth_1` and `impl_1` runs, and `impl_1` is configured with `GenFullBitstream="true"`.

No executed-run evidence was found:

- no `.runs` directory
- no `.rpt` reports
- no `.dcp` checkpoints
- no `.bit` bitstream
- no `.xdc` constraints
- no `vivado.jou`
- no `vivado.log`

Therefore, no LUT, FF, DSP, BRAM, WNS, TNS, max frequency, routed timing, or bitstream claim is currently supported by repo evidence.

## Update after non-project synthesis/place/route run on 2026-08-22

A repo-specific non-project synthesis flow was added:

- `fpga/foc_synth_clock.xdc`
- `fpga/synth_foc_nonproject.tcl`
- `fpga/synth/foc_synth_wrapper.sv`
- `fpga/synth_foc_wrapper_nonproject.tcl`

Raw `foc_current_loop_top` synthesis:

- `synth_design` completed successfully for `xc7z010clg400-1`
- Post-synthesis reports were generated in `fpga/synth_foc_out`
- Placement failed because the raw top has 449 I/O ports and `xc7z010clg400-1` has 230 usable user I/O pins
- This is an integration/top-level pinout issue, not a synthesis failure

Raw-top placement error:

```text
ERROR: [Place 30-415] IO Placement failed due to overutilization. This design contains 449 I/O ports
while the target device: 7z010 package: clg400, contains only 230 available user I/O.
```

Wrapper implementation flow:

- Top: `foc_synth_wrapper`
- Wrapped block: `foc_current_loop_top`
- Target part: `xc7z010clg400-1`
- Constraint: `create_clock -name clk -period 10.000 [get_ports clk]`
- Output directory: `fpga/synth_foc_wrapper_out`

Generated wrapper implementation files:

- `fpga/synth_foc_wrapper_out/post_synth.dcp`
- `fpga/synth_foc_wrapper_out/post_synth_utilization.rpt`
- `fpga/synth_foc_wrapper_out/post_synth_timing_summary.rpt`
- `fpga/synth_foc_wrapper_out/post_route.dcp`
- `fpga/synth_foc_wrapper_out/post_route_utilization.rpt`
- `fpga/synth_foc_wrapper_out/post_route_timing_summary.rpt`
- `fpga/synth_foc_wrapper_out/synth_foc_wrapper.log`

Wrapper post-route utilization:

```text
Slice LUTs      = 1312 / 17600 = 7.45%
Slice Registers = 702 / 35200  = 1.99%
DSPs            = 20 / 80      = 25.00%
Block RAM Tile  = 0 / 60       = 0.00%
```

Wrapper post-route timing at 100 MHz target:

```text
Clock period = 10.000 ns
Clock target = 100.000 MHz
WNS = -0.335 ns
TNS = -9.057 ns
Setup failing endpoints = 80
WHS = 0.140 ns
THS = 0.000 ns
```

Implied frequency estimate from WNS:

```text
Required period ~= 10.000 ns + 0.335 ns = 10.335 ns
Implied Fmax ~= 96.8 MHz
```

Do not claim this design closes timing at 100 MHz. The accurate claim is that it routes successfully but misses a 100 MHz target by 0.335 ns WNS in the wrapper implementation flow.

Notable timing path:

```text
Source: dut/q_axis_pi/integrator_q_reg[9]/C
Destination: dut/d_axis_pi/alpha_sum_i_16_psdsp_1/D
Data Path Delay: 10.216 ns
Logic Levels: 18
```

A top-10 critical path report was generated from the routed checkpoint:

- `fpga/report_foc_wrapper_critical_paths.tcl`
- `fpga/synth_foc_wrapper_out/critical_paths.rpt`
- `fpga/synth_foc_wrapper_out/post_route_utilization_hierarchical.rpt`

The top setup paths are all small 100 MHz misses in PI/integrator-related generated logic:

```text
Worst path slack = -0.335 ns
Requirement = 10.000 ns
Data Path Delay = 10.216 ns
Logic Levels = 18
```

Hierarchical post-route utilization confirms that the wrapped FOC block was not optimized away:

```text
foc_synth_wrapper top = 1312 LUTs, 702 FFs, 20 DSPs
wrapper-only logic    =   39 LUTs,  40 FFs,  0 DSPs
foc_current_loop_top  = 1273 LUTs, 662 FFs, 20 DSPs
```

## Update after PI/output and protection-gating pipeline work on 2026-08-22

Changes made:

- `fpga/rtl/pi_controller_q15.sv`
  - Added one registered stage between the PI multiply/integrator update and final output clamp
  - Changed PI latency from about 2 cycles to about 3 cycles
  - Fixed signed saturation in `sat_error`
- `fpga/tb/tb_pi_controller_q15.v`
  - Updated the testbench sample task to wait for `control_valid` instead of assuming the older latency
- `fpga/rtl/foc_current_loop_top.sv`
  - Registered current-limit and phase-balance protection outputs before feeding disable/PWM gating
  - This removed the long combinational path from current-sense math into global PWM enable/control gating
- `fpga/synth_foc_wrapper_pipelined_nonproject.tcl`
  - Added a separate implementation script/output directory for the pipelined run

Behavioral simulation after the changes:

```text
PI:
PASS: PI controller testbench completed
$finish called at time : 216 ns : File "C:/Users/HP/Documents/SURG/fpga/tb/tb_pi_controller_q15.v" Line 110

Full FOC top:
PASS: FOC current loop top testbench completed
$finish called at time : 516 ns : File "C:/Users/HP/Documents/SURG/fpga/tb/tb_foc_current_loop_top.v" Line 165
```

Generated implementation files:

- `fpga/synth_foc_wrapper_pipelined_out/post_synth.dcp`
- `fpga/synth_foc_wrapper_pipelined_out/post_synth_utilization.rpt`
- `fpga/synth_foc_wrapper_pipelined_out/post_synth_timing_summary.rpt`
- `fpga/synth_foc_wrapper_pipelined_out/post_route.dcp`
- `fpga/synth_foc_wrapper_pipelined_out/post_route_utilization.rpt`
- `fpga/synth_foc_wrapper_pipelined_out/post_route_utilization_hierarchical.rpt`
- `fpga/synth_foc_wrapper_pipelined_out/post_route_timing_summary.rpt`
- `fpga/synth_foc_wrapper_pipelined_out/critical_paths.rpt`
- `fpga/synth_foc_wrapper_pipelined_out/synth_foc_wrapper_pipelined.log`

Post-route timing for the pipelined wrapper run:

```text
Clock period = 10.000 ns
Clock target = 100.000 MHz
WNS = 0.557 ns
TNS = 0.000 ns
Setup failing endpoints = 0
WHS = 0.034 ns
THS = 0.000 ns
```

This supports the claim that the wrapped FOC current-loop RTL closed timing at a 100 MHz post-route target on `xc7z010clg400-1`.

Post-route utilization for the pipelined wrapper run:

```text
Slice LUTs      = 1292 / 17600 = 7.34%
Slice Registers = 668 / 35200  = 1.90%
DSPs            = 20 / 80      = 25.00%
Block RAM Tile  = 0 / 60       = 0.00%
```

Hierarchical post-route utilization:

```text
foc_synth_wrapper top = 1292 LUTs, 668 FFs, 20 DSPs
wrapper-only logic    =   39 LUTs,  40 FFs,  0 DSPs
foc_current_loop_top  = 1253 LUTs, 628 FFs, 20 DSPs
```

The DSP count remained at 20, so the fixed-point datapath was not optimized away by the wrapper.

Worst post-route setup path after the changes:

```text
Slack = 0.557 ns
Source = dut/duty_generator/phase_to_duty4__1/CLK
Destination = dut/duty_generator/duty_c_reg[12]/D
Requirement = 10.000 ns
Data Path Delay = 9.283 ns
Logic Levels = 11
```

DSP breakdown inside the FOC block:

```text
adc_current_scaler_q15 = 3 DSPs
clarke_park_transform  = 5 DSPs
d_axis_pi              = 2 DSPs
q_axis_pi              = 2 DSPs
inverse_park_transform = 4 DSPs
alpha_beta_to_duty     = 4 DSPs
total                  = 20 DSPs
```

Notable synthesis warning:

```text
Port angle_q[7:0] in module sincos_lut_q15 is either unconnected or has no load
```

This warning is consistent with the current sin/cos LUT using only upper angle bits for quadrant/index selection.

## Resume-safe bullets using verified evidence

- Verified a Vivado/xsim Hall decoder simulation for a Zynq-7000 motor-control FPGA project, compiling `hall_decoder.v` with `tb_hall_decoder.v` and passing sector decode, forward-transition, and illegal-state checks at 180 ns on a 10 ns testbench clock.

- Built a Vivado simulation project targeting `xc7z010clg400-1` with xsim waveform runs for Hall decoding, center-aligned PWM, PCB disable, phase-current limit, phase-current balance, and voltage-monitor support blocks, preserving `.wdb` artifacts and xsim kernel completion logs for six individual module testbenches.
