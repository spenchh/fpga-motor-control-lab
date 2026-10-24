# FOC simulation and implementation evidence

## Historical Vivado/xsim

The integrated `tb_foc_current_loop_top` run passed at 516 ns. The PI test passed at 216 ns after the extra output stage. The earlier separate Hall decoder test passed at 180 ns. These are testbench finish times, not control-loop latency measurements.

## Wrapper timing

Target: `xc7z010clg400-1`. Constraint: `create_clock -name clk -period 10.000 [get_ports clk]`.

| Metric | Original wrapper | Pipelined wrapper |
| --- | --- | --- |
| WNS | -0.335 ns | +0.557 ns |
| TNS | -9.057 ns | 0 ns |
| Failing setup endpoints | 80 | 0 |
| WHS | +0.140 ns | +0.034 ns |
| THS | 0 ns | 0 ns |

Changes: one additional PI register stage before final output clamping; registered current-limit and balance results before global disable/PWM gating. Both changes preceded the successful implementation.

Final complete wrapper utilization: 1,292 LUTs, 668 FFs, 20 DSP48E1, zero BRAM. The wrapper-only logic uses 39 LUTs, 40 FFs, and no DSPs.

[Before timing](assets/evidence/before-timing.rpt), [after timing](assets/evidence/after-timing.rpt), [hierarchical utilization](assets/evidence/utilization.rpt), [implementation Tcl](assets/evidence/implementation.tcl), and [clock constraint](assets/evidence/clock.xdc) are preserved as report artifacts. Local machine paths were redacted without changing numeric results.

## Current regression

The October 23 Icarus rerun at source revision `403730d5a780dc507cf42e4a531a077aca57214a` passed all 13 directed SystemVerilog testbenches. [Regression summary](assets/evidence/regression.txt).

The current Hall test finishes at 136 ns after testbench cleanup; this does not replace or reinterpret the historical 180 ns xsim artifact. MATLAB/RTL error metrics, physical I/O timing, a deployed bitstream, and motor operation are not established by these results.
