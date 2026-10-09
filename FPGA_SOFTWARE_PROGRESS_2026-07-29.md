# FPGA / software progress update

## Short message I can send

I have been focusing on the FPGA-side control path for the motor controller, mainly around the 3PWM interface, fixed-point FOC math, Hall sensor handling, current-sense timing, and safety/fault behavior

So far I made MATLAB starter simulations for Q-format fixed-point math, PI current-loop behavior, Clarke/Park sanity checks, inverse Park, SVPWM-style 3PWM duty generation, and PWM-center current sample timing

I also started an FPGA RTL scaffold for the first bring-up layer: center-aligned 3PWM generation, enable / reset behavior, a fault latch, PWM-center sample strobe, Hall sector decoding, and a comparison 6PWM/deadtime path in case the gate-driver circuit ends up needing the FPGA to output separate high-side and low-side PWM signals

After reviewing the current Altium files, I added board-aware work for the exact schematic interface: phase-C current reconstruction from the two current sensors, an nOC/fault manager, and a MATLAB sanity script that checks PWM timing, IO count, current-sense scaling, Hall decoding, and Arty XADC risk

The main open software/hardware interface questions are whether the PCB truly accepts only PWM_A/PWM_B/PWM_C, how nOC and DISABLE are routed, how many analog signals need to reach the Arty Z7-10, whether current sensing uses XADC or an external ADC, and whether the Arty Z7-10 has enough IO without PMOD expansion

Next I am planning to verify the RTL in simulation, map the FPGA interface signals into an IO table, make a basic Vivado Arty Z7-10 project, and then connect the MATLAB fixed-point blocks to HDL Coder / RTL modules

## What is done

- MATLAB fixed-point starter exists
- Q1.15 encode / decode is working in MATLAB
- fixed-point multiply / saturation logic is written in MATLAB
- floating-point vs fixed-point PI current loop comparison exists
- Clarke / Park sanity check exists
- PWM-center sample timing plot exists
- 3PWM FOC signal-path sandbox exists
- id / iq PI loop sandbox exists
- inverse Park to alpha / beta exists
- SVPWM-style duty generation exists
- center-aligned PWM_A / PWM_B / PWM_C visualization exists
- first FPGA RTL folder exists
- 3PWM RTL module exists
- fault latch / fault clear behavior exists in RTL
- sample_strobe and cycle_strobe exist in RTL
- Hall sector decoder RTL exists
- optional 6PWM/deadtime RTL path exists for comparison
- starter 3PWM testbench exists
- board-interface MATLAB sanity script exists
- current reconstruction RTL exists
- nOC/fault manager RTL exists

## What this means

- I am not trying to finish full FOC in HDL immediately
- I am building the bottom FPGA layer first
- PWM safety and interface timing come before fancy motor control
- the first real FPGA deliverable is safe 3PWM output + Hall input + fault response
- after that, fixed-point PI / transforms / SVPWM can move from MATLAB into HDL

## Current software-side decisions

- first target board is Arty Z7-10
- first target motor-control output is 3PWM
- FPGA outputs PWM_A, PWM_B, PWM_C
- gate-driver / PCB side should create HI / LO MOSFET gate signals if we stay 3PWM
- if the selected gate driver needs separate high-side and low-side inputs, FPGA needs 6PWM with deadtime
- current sensing has to land somewhere deterministic enough for FOC
- Hall signals need pullup / electrical behavior confirmed from the actual motor datasheet
- Arty Z7-10 IO count is tight, so PMOD / external ADC / signal reduction may matter

## Main questions for the group

- are we definitely using Arty Z7-10 and not Z7-20
- what exact pins from the PCB go to Arty
- how many analog channels are we asking Arty to read
- are current sensors routed to XADC, external ADC, or something else
- is current sensor output within Arty analog input range
- does nOC go directly to FPGA fabric
- does DISABLE come from FPGA, hardware logic, or both
- does the PCB expect 3PWM or 6PWM
- where exactly does deadtime happen
- what should outputs do when FPGA resets or is unprogrammed
- do Hall sensors need pullups or are they push-pull

## Next concrete tasks

1. Run RTL simulation once a Verilog simulator is available
2. Make a Vivado project for Arty Z7-10
3. Blink LED from FPGA fabric
4. Put PWM_A / PWM_B / PWM_C on safe header pins
5. Scope PWM frequency and sample strobe
6. Add Hall input pins and verify sector decode
7. Decide XADC vs external ADC for current sensing
8. Build an IO budget table for all PCB to FPGA signals
9. Convert the MATLAB PI block into an HDL-friendly module
10. Then build up Clarke / Park / inverse Park / SVPWM

## Files to point at

- `matlab/foc_fixed_point_starter.m`
- `matlab/stage1_3pwm_foc_sim.m`
- `fpga/rtl/pwm_3phase_center_aligned.v`
- `fpga/rtl/hall_sector_decoder.v`
- `fpga/rtl/pwm_6phase_deadtime.v`
- `fpga/rtl/fault_manager.v`
- `fpga/rtl/phase_current_reconstruct.v`
- `fpga/tb/tb_pwm_3phase_center_aligned.v`
- `matlab/board_interface_config.m`
- `matlab/stage2_board_interface_sanity.m`
