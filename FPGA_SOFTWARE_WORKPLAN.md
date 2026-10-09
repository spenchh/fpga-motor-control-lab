# what i actually need to do on fpga/software

## right now

- stop thinking of this as whole FOC all at once
- first job is making the FPGA interface safe and real
- PWM first
- fault kill first
- Hall reading first
- current-sense path first
- then fixed-point FOC math

## my actual lane

- Arty Z7-10 setup
- Vivado project
- FPGA fabric vs ARM side split
- PWM generation
- 3PWM vs 6PWM decision
- Hall sensor decoding
- current sample timing
- current sensor data path
- fixed-point math
- HDL Coder / generated HDL
- fault handling in hardware
- AXI registers later for commands / status

## minimum thing to show professor

- I made MATLAB fixed-point FOC starter scripts
- I made a 3PWM FOC signal path sim
- I started RTL for center-aligned 3PWM
- I added fault latch behavior
- I added PWM-center sample strobe
- I added Hall sector decoder
- I made a 6PWM/deadtime comparison path in case PCB needs it
- I know the open questions now instead of just vaguely saying FPGA stuff

## order i should do things

1. install / open Vivado
2. install Digilent board files
3. create Arty Z7-10 project
4. blink LED
5. simulate 3PWM module if simulator exists
6. put PWM_A / PWM_B / PWM_C on safe pins
7. scope PWM at 20 kHz
8. add enable and fault kill
9. add Hall inputs
10. make IO table with PCB people
11. figure out analog current sensing path
12. only then move MATLAB FOC blocks into HDL

## do not let people corner me with

- full FOC in HDL immediately
- dual drive right now
- GaN FETs right now
- final car inverter architecture right now
- pretending Arty Z7-10 has infinite pins
- pretending XADC can read every analog thing
- pretending 3PWM works unless PCB/gate-driver logic actually supports it

## questions i should ask the team

- are we actually 3PWM at the Arty connector
- does the UCC21222D setup create complementary gate drive or not
- where does deadtime happen
- where does nOC go
- where does DISABLE go
- how many analog channels are trying to go into Arty
- what is the exact current sensor output range
- are Hall sensors open drain or push pull
- are we using PMODs for extra IO
- what should happen if FPGA loses power
- what should happen if FPGA is still programming

## thing i should say if someone asks what software is doing

- software side is split into MATLAB model first, FPGA RTL bring-up second, HDL Coder/Vivado integration third
- MATLAB is for proving fixed-point scaling and FOC math
- RTL is for deterministic PWM, Hall capture, current-sample timing, and fast shutdown
- Vivado is for putting it onto Arty Z7-10
- the processor side can later handle commands, CAN, status, calibration, and logging
