# SURG FPGA Known Info

Date: August 5, 2026

This file is the current local reference for my FPGA side of the SURG motor-controller project

Use this before Vivado work, MATLAB updates, meeting updates, or asking PCB-side questions

## Source Files

Current local board files:

- `C:\Users\HP\Documents\SURG\DriverBoard.SchDoc`
- `C:\Users\HP\Documents\SURG\ActualDriverBoard.PcbDoc`
- `C:\Users\HP\Documents\SURG\HV Motor Driver.BomDoc`
- `C:\Users\HP\Documents\SURG\PCB_CROSSCHECK_2026-08-05.md`

Current local FPGA files:

- `C:\Users\HP\Documents\SURG\fpga\rtl\pwm_3phase_center_aligned.v`
- `C:\Users\HP\Documents\SURG\fpga\rtl\hall_decoder.v`
- `C:\Users\HP\Documents\SURG\fpga\rtl\phase_current_balance_monitor.v`
- `C:\Users\HP\Documents\SURG\fpga\rtl\phase_current_limit_monitor.v`
- `C:\Users\HP\Documents\SURG\fpga\rtl\voltage_sense_monitor.v`
- `C:\Users\HP\Documents\SURG\fpga\rtl\pcb_disable_control.v`

Current local MATLAB files:

- `C:\Users\HP\Documents\SURG\matlab\foc_fixed_point_starter.m`
- `C:\Users\HP\Documents\SURG\matlab\stage1_3pwm_foc_sim.m`
- `C:\Users\HP\Documents\SURG\matlab\board_interface_config.m`
- `C:\Users\HP\Documents\SURG\matlab\board_interface_check.m`
- `C:\Users\HP\Documents\SURG\matlab\board_interface_check_LAST_RUN.txt`

## Control Direction

- Project is FOC
- Near-term path is Hall-assisted FOC / board bring-up, not fully sensorless FOC yet
- Hall sensors exist on the updated PCB and can be used for startup, rough rotor sector, and early testing
- Sensorless FOC can be researched later, but it is not the immediate bring-up path
- Software/math produces three phase duty commands: `duty_a`, `duty_b`, `duty_c`
- FPGA/PL expands those duty commands into physical HI/LO driver-input pins for the PCB

## PS / PL Split

Likely Zynq split:

- PS handles startup mode, commands, thresholds, logging, communications, recovery policy, and higher-level state
- PL handles deterministic PWM timing, HI/LO output generation, Hall capture, measurement checks, fast inhibit behavior, and eventually fixed-point FOC blocks

Nothing here is a final AXI register map yet

## Confirmed From Updated PCB Cross-Check

- Controller interface is Arduino-Uno-style shield headers
- PCB exposes `MCU HI A`, `MCU LO A`, `MCU HI B`, `MCU LO B`, `MCU HI C`, `MCU LO C`
- These are independent physical input lines into three UCC21222 gate drivers
- The board does not generate LO automatically from HI
- UCC21222 can provide driver-side interlock/dead-time behavior, but the FPGA still has to provide the physical HI/LO input signals
- `DISABLE` goes to all UCC21222 disable pins
- `DISABLE` is active-high disable
- `DISABLE = 0` means run allowed
- `DISABLE = 1` means driver outputs disabled
- floating `DISABLE` defaults disabled because the driver pulls it high internally
- Hall A/B/C route digitally to the controller header
- Hall pullups appear to be 5 V, which is not safe to assume for Zynq/Arty 3.3 V IO
- Current sense has measured A/B/C channels
- Current path is power-board shunt -> AMC1300 -> OPA4388 -> `MCU CSENSE A/B/C`
- Phase-C reconstruction is not the main current path anymore
- `Ia + Ib + Ic` is still useful as a current-balance check
- Voltage sense has `MCU VSENSE A` and `MCU VSENSE Vm`
- Voltage divider visible on board is about 1.5 Mohm over 20 kohm, about 1:76
- `MCU MOTOR THERM` is present as the sixth analog/controller input
- Updated board extraction did not show `nOC` or `FAULT` nets

## Current Signal List

Digital outputs from FPGA / controller side:

- `PWM_HI_A`
- `PWM_LO_A`
- `PWM_HI_B`
- `PWM_LO_B`
- `PWM_HI_C`
- `PWM_LO_C`
- `DISABLE`

Digital inputs to FPGA / controller side:

- `MCU HALL A`
- `MCU HALL B`
- `MCU HALL C`

Analog inputs to FPGA/ADC side:

- `MCU CSENSE A`
- `MCU CSENSE B`
- `MCU CSENSE C`
- `MCU VSENSE A`
- `MCU VSENSE Vm`
- `MCU MOTOR THERM`

## Likely Header Mapping

This is inferred from the Uno-style header layout and must be confirmed from Altium before writing final XDC constraints

```text
D2  = MCU HALL C
D3  = MCU LO C
D4  = MCU HALL B
D5  = MCU HI C
D6  = MCU LO B
D7  = MCU HALL A
D8  = DISABLE
D9  = MCU HI B
D10 = MCU LO A
D11 = MCU HI A

A0 = MCU CSENSE A
A1 = MCU CSENSE B
A2 = MCU CSENSE C
A3 = MCU VSENSE A
A4 = MCU VSENSE Vm
A5 = MCU MOTOR THERM
```

My job is to turn confirmed board-side mapping into Arty/Zynq XDC constraints

The PCB team still needs to confirm the board-side net-to-header mapping and connector orientation

## RTL Status

Current active RTL:

- `pwm_3phase_center_aligned.v`
  - accepts `duty_a`, `duty_b`, `duty_c`
  - outputs physical HI/LO pairs for A/B/C
  - has `nonoverlap_ticks`
  - loads duty updates together at PWM cycle boundary
  - has `configuration_error`
  - uses `pwm_peak_strobe` as a provisional timing marker

- `hall_decoder.v`
  - decodes three digital Hall inputs
  - flags invalid Hall states
  - current Hall sequence is placeholder until real motor commissioning

- `phase_current_balance_monitor.v`
  - checks `Ia + Ib + Ic`
  - this is a consistency check, not per-phase overcurrent protection

- `phase_current_limit_monitor.v`
  - checks each phase current against an absolute limit
  - catches large per-phase current even if the three currents sum close to zero

- `voltage_sense_monitor.v`
  - checks phase-related voltage and bus-voltage values against limits
  - exact engineering-unit scaling is still unresolved

- `pcb_disable_control.v`
  - active-high `DISABLE`
  - PWM cannot enable during reset
  - PWM cannot enable until `sensor_data_valid`
  - latches current, voltage, and external inhibit conditions

Not in the active required path:

- old dedicated `fault_manager.v` based on `nOC` / `FAULT`
- old phase-current reconstruction as the main current source
- old physical three-output PWM-only module

## MATLAB Status

`board_interface_check.m` ran successfully

Current MATLAB assumptions from last run:

- fabric clock = 100 MHz placeholder
- requested PWM frequency = 20 kHz
- center-aligned `period_counts = 2500`
- actual PWM frequency = 20000.00 Hz
- digital outputs from FPGA = 7
- confirmed digital inputs = 3
- analog inputs = 6
- `DISABLE` polarity = active-high disable, drive low to run
- current scaling is not final
- voltage scaling is not final
- current/voltage scaling values should stay `NaN` until shunt, gain, offset, filter, and ADC path are confirmed

## Vivado Status

Enough files exist to start Vivado behavioral simulation

Not enough information exists for a final PCB bitstream

Can start now:

- create Vivado project
- add RTL files as design sources
- add `tb_*.v` files as simulation sources
- run behavioral simulation
- start learning XDC workflow with a simple Arty Z7 LED test project

Still missing before final FPGA build:

- confirmed Arty Z7 board part / exact Zynq part
- confirmed board-side net-to-header mapping
- Arty/Zynq XDC package pins
- IO voltage constraints
- safe Hall voltage level
- ADC route
- current/voltage scaling
- top-level wrapper tying modules together
- AXI/register interface

No local HDL compile was verified from this shell because `vivado`, `xvlog`, `xelab`, `iverilog`, and `verilator` were not available on PATH

## FPGA-Relevant Questions Still Needed

Ask only these for FPGA work:

1. Can the PCB team confirm the board-side net-to-header mapping so I can write the Arty/Zynq XDC?
2. Are `MCU HALL A/B/C` 3.3 V safe at the Arty input, or still pulled to 5 V?
3. Are `MCU CSENSE A/B/C`, `MCU VSENSE A`, `MCU VSENSE Vm`, and `MCU MOTOR THERM` going to Arty XADC, external ADC, or something else?
4. What min/max voltage reaches the ADC for each analog signal?
5. What voltage equals zero current on `MCU CSENSE A/B/C`?
6. How are positive and negative phase currents represented?
7. Should FPGA generate non-overlap between HI/LO, or should UCC21222 dead-time resistors handle the full timing?
8. Can `DISABLE` be treated as active-high, low-to-run, and held high until FPGA logic and sensor data are ready?
9. Is 20 kHz the target PWM frequency?
10. Is the first control goal Hall-assisted FOC bring-up, with sensorless FOC as later research?

## PCB Notes That Affect FPGA

- OPA4388 pin mapping issue is known by the team and Angelina said she will fix it
- Hall 5 V pullup issue still matters for Arty/Zynq IO safety
- `12V ISO` may be in the isolated voltage conversion block, but should still be visually confirmed before relying on it in power-up notes
- bidirectional current sense is still the main unresolved analog question for FOC
- if current sense is ground-referenced with no offset, negative current may clip before ADC
- if XADC is multiplexed, simultaneous current sampling may become a control-loop concern

## What I Can Say In A Short Update

I cross-checked the updated PCB interface against my FPGA/MATLAB work. The control math still gives three phase duty commands, but the FPGA output layer maps those into the board's physical HI/LO inputs. I updated the local RTL assumptions around disable behavior, Hall input, measured A/B/C current, voltage sense, and separate current-balance versus current-limit checks. Next I need confirmed pin mapping, ADC path, Hall voltage safety, current-sense offset, and dead-time policy before final XDC and full Vivado integration.
