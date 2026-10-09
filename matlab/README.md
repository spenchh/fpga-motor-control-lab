# MATLAB Starter Notes

This folder is for MATLAB checks before moving into Simulink or HDL Coder

## First Script

Run:

```matlab
foc_fixed_point_starter
```

What it shows:

- per-unit scaling
- Q1.15 encode/decode behavior
- fixed-point multiply and saturation
- floating-point PI versus fixed-point PI
- basic first-order current-loop response
- Clarke/Park transform check
- PWM-center sample timing marker

## 3PWM Stage 1 Script

Run:

```matlab
stage1_3pwm_foc_sim
```

What it shows:

- fixed-point-style `id/iq` PI control
- inverse Park conversion from `vd/vq` to `v_alpha/v_beta`
- SVPWM-style conversion into `duty_a`, `duty_b`, and `duty_c`
- center-aligned phase duty timing
- PWM-center current-sample timing marker

The math/control side stays at three phase duty commands. The updated PCB exposes physical HI/LO driver-input pins, so RTL handles that board-facing expansion

## Board Interface Check

Run:

```matlab
board_interface_check
```

What it checks:

- PWM period counts for the 20 kHz assumption
- physical driver-output labels for `MCU HI/LO A/B/C`
- `DISABLE` active-high behavior
- updated current-sense path based on AMC1300 + OPA4388
- three-current channel naming: `MCU CSENSE A/B/C`
- voltage-sense net naming for `MCU VSENSE A` and `MCU VSENSE Vm`
- motor therm input as another analog/controller signal
- open scaling items before final HDL
- Hall labels as digital inputs, with the 5 V pullup issue still needing hardware confirmation

This script is tied to the current Altium files and should be updated when the PCB interface changes
