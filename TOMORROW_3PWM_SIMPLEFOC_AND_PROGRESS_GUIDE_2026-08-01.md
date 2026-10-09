# Tomorrow guide: 3PWM SimpleFOC bench test + SURG progress review

Date for meeting: August 1, 2026

Goal for tomorrow:

- use Angelina's Arduino Uno + motor + driver setup as a quick bench test path
- keep the test focused on 3PWM because that is the project goal
- use SimpleFOC to understand motor behavior before the custom PCB is ready
- do not pretend this replaces the FPGA work
- use it to learn phase order, Hall order, PWM behavior, and basic motor bring-up

## Main thing to say

I am treating tomorrow as a bench bring-up test, not the final control path

The goal is 3PWM

If the driver board supports 3PWM, then SimpleFOC should be a fast way to spin the motor and check the basic control flow

For the final SURG board, the FPGA still matters because the custom board has different gate drivers, current sensors, fault pins, and timing requirements

## SimpleFOC vs our real board

SimpleFOC is useful because it already has motor-control code for Arduino-style setups

The useful part is the SimpleFOC Arduino library

The folders already in the SURG repo are mostly SimpleFOC hardware reference folders:

- Arduino-SimpleFOCShield-3.2
- SimpleFOC-DriveShield-main

Those folders have schematics, BOMs, Gerbers, PDFs, and board reference files

They are not the actual Arduino library code for our custom PCB

So tomorrow's test is:

- use the Uno
- use Angelina's motor
- use her driver board / driver IC setup
- install or use the SimpleFOC library
- run a minimal 3PWM open-loop test first

## What has to be true for this to be minimal work

This is minimal only if the driver setup is a complete BLDC driver board or working BLDC driver circuit

It needs:

- motor power input
- 3 motor phase outputs
- 3PWM logic inputs
- enable pin or sleep pin if required
- shared logic ground with the Uno
- onboard gate drive / MOSFET power stage already handled

If she only has a bare gate-driver IC, it is not minimal

A bare gate-driver IC still needs MOSFETs, bootstrap parts, protection, layout, power routing, and safety work

## Ask Angelina first

Before connecting anything, ask:

1. what exact driver IC or driver board is this
2. does it support 3PWM input
3. what are the PWM input pins called
4. what is the enable / sleep pin
5. what voltage should the driver logic use
6. what motor voltage are we using
7. what current limit should we set on the supply
8. does the motor have Hall sensors
9. what are the motor phase wires
10. does the driver board already have protection

Take a picture of:

- front of driver board
- back of driver board
- pin labels
- motor label
- power supply settings

## Do not do these

- do not connect the motor directly to the Arduino Uno
- do not use high voltage for the first test
- do not run without a current limit
- do not connect random Hall wires without checking voltage first
- do not connect the Uno to a driver if the logic voltage is unclear
- do not assume phase order is correct
- do not keep power on if the motor buzzes hard, stalls, heats, or the driver heats fast

## Basic connection map for 3PWM

This is the expected connection if the driver supports normal 3PWM

| Arduino Uno | Driver board | Purpose |
| --- | --- | --- |
| D9 | PWM_A / IN_A / UH depending on board | phase A PWM command |
| D10 | PWM_B / IN_B / VH depending on board | phase B PWM command |
| D11 | PWM_C / IN_C / WH depending on board | phase C PWM command |
| D8 | ENABLE / EN / nSLEEP if needed | turn driver on |
| GND | logic GND | shared reference |
| 5V or 3.3V | only if the driver specifically needs logic supply | do not guess |

Motor side:

| Driver board | Motor |
| --- | --- |
| U / A phase output | motor phase 1 |
| V / B phase output | motor phase 2 |
| W / C phase output | motor phase 3 |

Power side:

| Supply | Driver board |
| --- | --- |
| positive output | VM / VBUS / motor power input |
| negative output | power GND |

Start with low voltage and current limit

Use something like 6 V to 12 V if the driver and motor allow it

Set a low current limit first

## First test order

### Step 1: identify the driver

Do not write code first

First identify:

- board name
- driver IC part number
- whether it is 3PWM or 6PWM
- PWM pins
- enable pin
- fault pin if present
- logic voltage
- motor voltage range

### Step 2: power only the logic side

Keep motor power off at first

Connect:

- Uno to computer
- Uno GND to driver logic GND
- enable pin only if needed

Check that nothing gets hot

### Step 3: upload a basic SimpleFOC 3PWM open-loop sketch

Use SimpleFOC's BLDCDriver3PWM path

Do not use current sensing first

Do not use Hall sensors first

Start with open-loop voltage mode because it has the fewest dependencies

### Step 4: connect motor power with current limit

Set bench supply low

Use a current limit

Keep one hand near power switch

If it buzzes hard or gets hot, stop

### Step 5: try open-loop spin

Expected result:

- motor slowly spins
- direction may be wrong, that is fine
- phase order may need swapping
- it may buzz if phase order or motor parameters are off

If it spins backwards:

- either change target sign in code
- or swap two phase wires later if needed

If it does not spin:

- lower target speed
- increase voltage limit slightly
- check enable pin
- check PWM pins
- check shared ground
- check phase wiring

### Step 6: add Hall sensors after open-loop works

Only add Hall feedback after the motor can spin open-loop

Hall connection usually needs:

- Hall power
- Hall ground
- Hall A
- Hall B
- Hall C

Do not assume Hall voltage

Check whether the Hall sensors need 5 V, 3.3 V, or pullups

## Starter SimpleFOC sketch shape

This is not final code

It is the shape of the first test

Update the pins after looking at Angelina's driver board

```cpp
#include <SimpleFOC.h>

// Update this after checking the motor
// pole_pairs is required by SimpleFOC
BLDCMotor motor = BLDCMotor(7);

// 3PWM driver pins
// Replace 9, 10, 11 with the actual PWM pins used on the Uno
// Replace 8 with the actual enable pin if the board has one
BLDCDriver3PWM driver = BLDCDriver3PWM(9, 10, 11, 8);

void setup() {
  Serial.begin(115200);

  // Low values for first test
  driver.voltage_power_supply = 12;
  driver.voltage_limit = 2;
  driver.pwm_frequency = 20000;

  driver.init();
  motor.linkDriver(&driver);

  // Open loop first
  motor.controller = MotionControlType::velocity_openloop;
  motor.voltage_limit = 2;
  motor.velocity_limit = 5;

  motor.init();

  Serial.println("SimpleFOC 3PWM open-loop test ready");
}

void loop() {
  // Small target velocity in rad/s
  motor.move(1.0);
}
```

Things that may need changing:

- pole pairs
- PWM pins
- enable pin
- voltage_power_supply
- voltage_limit
- velocity target
- pwm_frequency

## What to write down during test

Use this table:

| Item | Value |
| --- | --- |
| driver board / IC | |
| motor model | |
| motor pole pairs | |
| motor voltage used | |
| supply current limit | |
| 3PWM pins | |
| enable pin | |
| Hall pins | |
| Hall voltage | |
| motor phase order | |
| open-loop spin worked | yes / no |
| direction | forward / reverse |
| weird heat or noise | |
| notes | |

## What this tells us for SURG

If open-loop works:

- motor phases are usable
- driver can accept 3PWM
- SimpleFOC can help us understand basic motor bring-up
- we can learn phase order and startup behavior

If Hall works:

- we can record Hall sequence
- we can compare it to the FPGA Hall decoder
- we can use this to sanity-check rotor sector assumptions

If current sense exists:

- we can compare measured current behavior to our MATLAB assumptions
- but current sensing is not first priority tomorrow

## How this connects back to the FPGA

The Arduino test is not replacing the FPGA

It helps because it gives us a known-working motor/control reference before the custom board is ready

The FPGA still needs to handle:

- deterministic 3PWM generation
- center-aligned PWM timing
- Hall input capture
- nOC / fault shutdown
- current sensor scaling
- fixed-point FOC math
- eventually HDL Coder / Vivado integration

The bench test helps answer practical questions:

- what direction does the motor spin for phase order A/B/C
- what Hall sequence appears during forward rotation
- what PWM frequency seems reasonable
- what voltage/current starts the motor moving
- what signals matter most for first bring-up

## Review of what I did over the past couple days

### PCB / schematic review

I reviewed the current Altium files and pulled out the signals that matter to the FPGA/software side

The important control signals are:

- PWM HI A/B/C
- PWM LO A/B/C
- DISABLE
- HALL A/B/C
- nOC A/B
- CURR SENSE A/B
- CURR REF A/B

The important parts found in the schematic are:

- UCC21222D gate drivers
- TMCS1126A1AQDVGRQ1 current sensors
- BSC110N15NS5 MOSFETs
- NRVUA140VT3G fast diodes
- Arty Z7-10 as the FPGA board assumption

I also noticed the main interface issue:

- our intended control direction is 3PWM
- but the schematic labels still show PWM HI and PWM LO signals
- so the board has to clearly decide where complementary high/low timing and deadtime are created

If the FPGA outputs only 3PWM, then the PCB/gate-driver side must generate the high-side and low-side gate timing

That is the direction we want

### MATLAB work

I connected the MATLAB work to the actual board assumptions instead of leaving it as generic FOC math

MATLAB files now include:

- foc_fixed_point_starter.m
- stage1_3pwm_foc_sim.m
- board_interface_config.m
- stage2_board_interface_sanity.m
- stage2_board_interface_sanity_LAST_RUN.txt

The MATLAB side covers:

- Q-format fixed-point scaling
- fixed-point multiply and saturation
- floating-point vs fixed-point PI behavior
- Clarke/Park sanity checks
- inverse Park
- SVPWM-style duty generation
- 3PWM duty commands
- center-aligned PWM timing
- PWM-center sample timing
- phase C reconstruction from A and B currents

The board-interface sanity script ran successfully in MATLAB R2026a

Important result:

- 20 kHz center-aligned PWM at a 100 MHz FPGA fabric clock gives period_counts = 2500
- if 200 ns deadtime ever had to be done in FPGA, that would be 20 clock ticks
- digital FPGA outputs for 3PWM are much lower than 6PWM
- placeholder TMCS current-sense scaling could exceed the Arty analog input range
- phase C reconstruction worked in the ideal balanced test case

The current-sense part is still not final because the exact sensor scaling and ADC path need to be confirmed

### FPGA RTL work

I started the first FPGA bring-up layer

This is not full FOC HDL yet

It is the lower-level stuff that has to work before full FOC is useful

RTL files added:

- pwm_3phase_center_aligned.v
- pwm_6phase_deadtime.v
- deadtime_half_bridge.v
- hall_sector_decoder.v
- fault_manager.v
- phase_current_reconstruct.v

Testbench files added:

- tb_pwm_3phase_center_aligned.v
- tb_fault_manager.v
- tb_phase_current_reconstruct.v

What the RTL covers:

- 3PWM center-aligned PWM generation
- PWM enable behavior
- fault latch behavior
- PWM center sample strobe
- optional 6PWM/deadtime comparison path
- Hall sector decoding
- current reconstruction using Ic = -Ia - Ib

The 6PWM file is not the main plan

It is there as a comparison path in case the board interface forces separate high-side and low-side commands

Since the goal is 3PWM, the main file is pwm_3phase_center_aligned.v

### Documentation work

I made and updated project notes so there is something concrete to point to

Important docs:

- FPGA_SOFTWARE_PROGRESS_2026-07-29.md
- FPGA_BOARD_INTERFACE_2026-07-29.md
- FPGA_SOFTWARE_WORKPLAN.md
- FPGA_TODO.md
- PROJECT_NOTE_2026-07-27_PCB_FPGA_FOC.md
- README.md

I also cleaned up the SURG README and added visuals back in

The README now shows:

- project status badges
- system-level diagram
- hardware/control signal flow
- FOC software pipeline
- repository layout
- MATLAB scripts
- open engineering decisions
- bring-up plan

### SimpleFOC review

I checked the local SimpleFOC folders

They are inside the SURG repo and their Git remote points to the SURG project repo

They are not standalone clones of the SimpleFOC upstream repos

They are useful because they show how SimpleFOC-compatible boards are structured

But the actual Arduino SimpleFOC library still needs to be used through Arduino Library Manager or pulled separately

For tomorrow, the SimpleFOC goal is smaller:

- identify the driver
- map 3PWM pins
- run open-loop motor spin
- add Hall feedback later

### Arty ordering check

I checked Arty Z7-10 availability

As of July 31, 2026:

- DigiKey showed Arty Z7-10 in stock
- Mouser also showed stock
- if stock runs out, lead time can become weeks

Practical point:

- if the team needs Arty for bring-up, order soon

### What is still not done

- no full FOC HDL is finished
- no Vivado Arty project is built yet
- RTL has not been fully simulated because simulator tooling was not available on PATH
- current sensor exact scaling is not confirmed
- Arty pin mapping is not finished
- final PCB to FPGA connector mapping is not locked
- SimpleFOC Arduino bench code has not been run yet
- nothing has been pushed to GitHub

## What to say if someone asks what I have been doing

I have been working on the software/control side from two angles

First I reviewed the actual PCB signals and made the FPGA work match the board instead of keeping it generic

Second I started the bring-up path: MATLAB fixed-point checks, 3PWM timing, Hall decoding, current reconstruction, and fault handling

For tomorrow, I want to use the Arduino/SimpleFOC setup as a quick 3PWM bench test so we can understand the motor and driver behavior before the custom PCB is ready

That should help the FPGA side too because it gives us real phase order, Hall order, and motor startup behavior to compare against later

## Tomorrow checklist

Before meeting:

- open this guide
- open SimpleFOC docs if needed
- bring laptop charger
- install Arduino IDE if not installed
- install SimpleFOC library if not installed
- bring USB cable for Uno

During meeting:

- identify driver board / IC
- confirm 3PWM input pins
- confirm enable pin
- confirm power supply voltage and current limit
- run open-loop first
- only add Hall feedback after open-loop works
- write down driver, motor, pins, voltage, current, phase order, Hall order

After meeting:

- make a pin map doc
- make a working Arduino sketch if the test succeeds
- connect what was learned back to the FPGA 3PWM/Hall/fault plan
