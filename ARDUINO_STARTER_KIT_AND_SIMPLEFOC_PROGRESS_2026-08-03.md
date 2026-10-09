# Arduino Starter Kit + SimpleFOC progress notes

Date: August 3, 2026

## What I checked

The equipment available right now is the Arduino Starter Kit setup:

- Arduino Uno R3
- small DC motor
- small servo motor
- L293D H-bridge motor driver
- breadboard, jumpers, resistors, potentiometers, diodes, MOSFETs, and basic components

This is useful for basic Arduino motor-control practice, but it is not the same as a BLDC 3PWM inverter setup

## Main conclusion

The Starter Kit can be used to prove:

- Uno upload path
- PWM output
- direction control through an H-bridge
- enable-pin behavior
- basic Serial debugging
- servo control
- safe low-power bench testing habits

The Starter Kit cannot directly prove:

- SimpleFOC BLDC control
- 3-phase inverter control
- Hall-sensor FOC behavior
- current-sense FOC
- final SURG PCB behavior

For SimpleFOC 3PWM testing, we still need a BLDC motor and a compatible 3-phase driver board

## Files added

- `arduino/starter_kit_dc_motor_pwm_test/starter_kit_dc_motor_pwm_test.ino`
- `arduino/starter_kit_servo_sweep_test/starter_kit_servo_sweep_test.ino`
- `arduino/simplefoc_3pwm_reference/simplefoc_3pwm_reference.ino`
- `arduino/README.md`

## What I can say honestly

I started separating what the Arduino Starter Kit can test from what SimpleFOC actually needs

The starter kit is enough for basic PWM motor testing and getting the Uno workflow running, so I made starter sketches for DC motor PWM control and servo testing

For the SimpleFOC side, I set up a 3PWM reference sketch, but that still needs a real BLDC driver board because the starter kit DC motor and L293D are not a SimpleFOC BLDC setup

This helps because we can still make progress on Arduino bring-up habits now, while keeping the actual 3PWM BLDC/SURG board path technically correct

## Next steps

1. Open Arduino IDE
2. Install the SimpleFOC library through Library Manager if BLDC hardware is available
3. Upload the DC motor PWM sketch to confirm Uno upload and basic motor drive
4. Upload the servo sketch to confirm basic actuator control
5. Identify the actual BLDC driver board if Angelina has one
6. Map its 3PWM pins
7. Only then try the SimpleFOC 3PWM reference sketch
8. Record pin map, voltage, current limit, motor response, and any wiring changes
