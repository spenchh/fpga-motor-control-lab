# FPGA board interface based on current MATLAB + Altium

## What I checked

- current MATLAB file: `C:\Users\HP\Documents\MATLAB\SURG\Fixed_Point_Algorithm.m`
- latest schematic: `C:\Users\HP\Downloads\Sheet1.SchDoc`
- latest PCB: `C:\Users\HP\Downloads\PCB1.PcbDoc`

The MATLAB file is basically the same fixed-point starter already in `matlab/foc_fixed_point_starter.m`

So the next software step is not another random FOC script

The next useful step is making the FPGA work match the current board interface

## Current board signals that matter to FPGA

Digital / control:

- PWM HI A
- PWM HI B
- PWM HI C
- PWM LO A
- PWM LO B
- PWM LO C
- DISABLE
- HALL A
- HALL B
- HALL C
- nOC A
- nOC B

Analog / current:

- CURR SENSE A
- CURR REF A
- CURR SENSE B
- CURR REF B

Power / domains:

- 12V
- 5V
- 3V3
- Vm
- GND1
- GND2

Motor / power stage:

- PHASE A+
- PHASE A-
- PHASE B+
- PHASE B-
- PHASE C
- GATE HI A/B/C
- GATE LO A/B/C

## Parts that matter to software

- gate drivers are UCC21222D
- current sensors are TMCS1126A1AQDVGRQ1
- MOSFETs are BSC110N15NS5
- fast diodes are NRVUA140VT3G
- current sensors are only on A and B
- phase C current has to be reconstructed in software / FPGA as Ic = -Ia - Ib

## Big mismatch rn

We keep saying FPGA-side should be 3PWM

But the schematic still has PWM HI A/B/C and PWM LO A/B/C labels

That means one of these has to become true:

1. FPGA outputs only PWM_A / PWM_B / PWM_C and PCB/gate logic creates HI/LO + deadtime
2. FPGA outputs 6PWM and owns high/low timing + deadtime

Right now software should support both paths until PCB confirms it

That is why I added:

- 3PWM RTL
- 6PWM/deadtime comparison RTL
- fault manager RTL
- phase-current reconstruction RTL

## MATLAB updates added

- `matlab/board_interface_config.m`
- `matlab/stage2_board_interface_sanity.m`
- `matlab/stage2_board_interface_sanity_LAST_RUN.txt`

The new MATLAB script checks:

- PWM period counts for 20 kHz
- deadtime ticks if FPGA owns 6PWM
- rough IO budget
- current sensor voltage range using placeholder TMCS sensitivity
- whether current sensor output might exceed Arty XADC range
- phase C reconstruction from two current sensors
- Hall sector decode assumption

## MATLAB run result

The board-interface script ran successfully in MATLAB R2026a

Important output:

- 20 kHz center-aligned PWM at 100 MHz fabric clock gives period_counts = 2500
- if FPGA owns 200 ns deadtime for 6PWM, that is 20 clock ticks at 100 MHz
- schematic labels imply 5 digital inputs to FPGA and 4 digital outputs for 3PWM
- if the board needs 6PWM instead, digital outputs go up to 7 including DISABLE
- analog inputs listed from current sense are 4: CURR SENSE A/B and CURR REF A/B
- placeholder TMCS sensitivity of 20 mV/A gives -0.350 V to 3.650 V at +/-100 A
- that would exceed a 0 to 3.3 V XADC range
- exact TMCS suffix / gain / clamp / ADC path is a real blocker before final HDL scaling
- ideal phase C reconstruction from A/B currents worked with zero error in the balanced test case

## FPGA RTL updates added

- `fpga/rtl/fault_manager.v`
- `fpga/rtl/phase_current_reconstruct.v`

These are more directly tied to the current schematic than full FOC is

Fault manager:

- takes nOC A
- takes nOC B
- takes gate_fault_n placeholder
- latches faults
- only enables PWM when everything is clear

Current reconstruction:

- takes measured Ia and Ib
- calculates Ic = -Ia - Ib
- saturates if the signed fixed-point value overflows

## What I should do next

1. Run `stage2_board_interface_sanity.m`
2. Fill in real TMCS1126 sensitivity from the exact suffix
3. Confirm current sensor voltage range into Arty XADC
4. Confirm if CURR REF A/B also need ADC channels or just local reference
5. Make a final Arty Z7-10 pin budget
6. Decide 3PWM or 6PWM with PCB team
7. Wire `fault_manager.v` into the PWM block
8. Simulate current reconstruction with fixed-point test vectors
9. Build a Vivado Arty Z7-10 project
10. Put PWM_A/B/C and fault kill on safe pins first

## What I can tell professor

I reviewed the current MATLAB and Altium files and shifted the software work toward the actual board interface

The current MATLAB is a fixed-point FOC starter, so I added a board-interface sanity script that checks PWM timing, IO budget, current-sense scaling, Hall decoding, and phase-C reconstruction from the two current sensors on the schematic

On the FPGA side I added RTL for fault handling and current reconstruction, because those are required by the current PCB before full FOC can be trusted

The main open blocker is the PCB/FPGA interface decision: whether the FPGA outputs true 3PWM or whether it has to output 6PWM because the schematic still shows PWM HI/LO inputs
