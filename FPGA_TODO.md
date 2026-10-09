# FPGA TODO List

## 1. Learn Arty Z7 / Zynq Basics

- understand PS versus PL split
- PS: setup, commands, logging, communication, slower control decisions
- PL: deterministic PWM timing, sample strobes, fast inhibit, sensor interface checks
- learn Vivado project setup
- install Digilent board files
- learn how Arduino-header pins map to FPGA pins

## 2. Build First Vivado Test Project

- blink an LED from FPGA fabric
- confirm constraints/XDC workflow
- confirm clock source and PL fabric clock
- confirm the Arduino-header IO bank voltage
- create a Vivado simulation project with the current `fpga/rtl` and `fpga/tb` files
- do not make final PCB XDC constraints until the board-side net-to-header mapping is confirmed

## 3. PWM Bring-Up

- keep software/math at three phase duty commands
- generate center-aligned timing from `duty_a`, `duty_b`, and `duty_c`
- expand those duty commands into physical `MCU HI/LO A/B/C` driver-input pins
- include `enable`, `pwm_inhibit`, and reset-off behavior
- include a configurable `nonoverlap_ticks` value for the physical HI/LO outputs
- load all three duties together at the PWM cycle boundary
- flag invalid PWM config before enabling outputs
- confirm expected PWM frequency with the team

## 4. Updated PCB Interface

- use `C:\Users\HP\Documents\SURG\PCB_CROSSCHECK_2026-08-05.md` as the latest local cross-check
- board files are `DriverBoard.SchDoc`, `ActualDriverBoard.PcbDoc`, and `HV Motor Driver.BomDoc`
- confirmed physical driver-input labels are `MCU HI A`, `MCU LO A`, `MCU HI B`, `MCU LO B`, `MCU HI C`, and `MCU LO C`
- `DISABLE` should be treated as active-high disable, drive low to run
- updated board did not show `nOC` or `FAULT` nets
- do not keep dedicated protection/status RTL unless a real routed status signal is confirmed

## 5. Current Sensing Into FPGA

- updated board points to measured A/B/C current sense
- current path is shunt -> AMC1300 -> OPA4388 -> `MCU CSENSE A/B/C`
- keep phase-C reconstruction only as a cross-check/fallback idea
- separate current-balance checking from per-phase overcurrent checking
- confirm shunt values
- confirm current-sense gain
- confirm whether bidirectional current has a mid-rail offset
- confirm ADC input range and clamp/protection
- confirm whether this goes through Arty XADC, external ADC, or PS-side ADC path

## 6. Voltage Sensing Into FPGA

- updated board exposes `MCU VSENSE A` and `MCU VSENSE Vm`
- handle voltage sense like current sense: scaling, offset, filtering, ADC limits, and fixed-point range
- divider looks like 1.5 Mohm top and 20 kohm bottom before the isolation amp
- confirm final ADC-side scaling
- confirm ADC route

## 7. Hall / Position Feedback

- updated board shows digital Hall A/B/C into the controller header
- keep Hall decoder RTL in the local required set
- confirm Hall pullups are not feeding unsafe 5 V into Zynq IO
- confirm actual pin map before writing XDC constraints
- near-term direction is Hall-assisted FOC / bring-up, not fully sensorless FOC yet
- sensorless FOC can stay as later research once measured current/voltage behavior is understood

## 8. AXI / Shared Register Interface

- PS writes duty command, enable, mode, thresholds, and reset/clear bits
- PL reports PWM status, current data, voltage data, Hall status, inhibit state, and counters
- define register map after the pin map and ADC route are known

## 9. MATLAB / Fixed-Point Work

- run `matlab/foc_fixed_point_starter.m`
- run `matlab/stage1_3pwm_foc_sim.m`
- run `matlab/board_interface_check.m`
- fill in current-sense scale once shunt/gain/offset are known
- fill in voltage-sense scale once ADC-side path is known
- later move PI / Clarke / Park / inverse Park into Simulink and HDL Coder

## 10. Board Questions For PCB Team

- confirm board-side net-to-header mapping so I can write Arty/Zynq XDC
- confirm analog input path: Arty XADC, external ADC, or other
- confirm current-sense zero-current voltage and positive/negative-current mapping
- confirm dead-time policy: FPGA non-overlap, UCC21222 dead-time, or both intentionally
- is the OPA4388 symbol pin mapping correct versus the datasheet
- what actually sources `12V ISO`
- are the resistor BOM entries with capacitor-looking MPNs mistakes
- how is bidirectional current represented at `MCU CSENSE A/B/C`
- are Hall lines level-shifted or clamped before the Zynq/Arty input pins
- where do current, voltage, and motor therm enter the Zynq system
- does the board intentionally put 12 V on shield VIN
- what PWM frequency should the driver board be designed around
