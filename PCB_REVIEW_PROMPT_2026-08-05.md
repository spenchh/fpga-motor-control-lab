# PCB Review Prompt

I need you to deeply review my SURG 2026 motor-controller project and cross-check the updated PCB against the FPGA RTL and MATLAB work

Project context:

- GitHub repo: https://github.com/spenchh/fpga-motors
- local Altium schematic: `DriverBoard.SchDoc`
- local Altium PCB: `ActualDriverBoard.PcbDoc`
- local BOM: `HV Motor Driver.BomDoc`
- local cross-check note: `PCB_CROSSCHECK_2026-08-05.md`
- target controller board is Zynq SoC / Arty Z7 style
- the project control approach has already been three phase duty commands
- do not treat that as a new update
- the software/math side is MATLAB first, then HDL Coder / Vivado
- the FPGA/PL side should handle deterministic PWM timing, sample strobes, fast inhibit behavior, and low-level sensor interface logic
- the Zynq PS side should probably handle higher-level commands, parameter setup, logging/comms, and slower decisions

Important background from the latest board cross-check:

- updated PCB exposes physical controller labels `MCU HI A`, `MCU LO A`, `MCU HI B`, `MCU LO B`, `MCU HI C`, and `MCU LO C`
- those six physical controller lines feed three UCC21222 gate drivers
- keep the control model as three duty commands, but check whether RTL correctly expands those three duty commands to the physical HI/LO driver-input pins
- `DISABLE` is routed to the UCC21222 disable pins
- treat `DISABLE` as active-high disable, drive low to run
- Hall A/B/C appear as digital labels into the controller header
- Hall pullups appear to be 5 V, so check whether the Zynq/Arty IO path is safe or needs level shifting/clamping
- current sense appears to be measured A/B/C through shunts -> AMC1300 -> OPA4388 -> `MCU CSENSE A/B/C`
- voltage sense appears as `MCU VSENSE A` and `MCU VSENSE Vm`
- `MCU MOTOR THERM` is also present
- the updated board did not show `nOC` or `FAULT` nets
- do not assume dedicated fault-manager RTL unless you can prove a real routed status/protection signal exists
- phase-C reconstruction should not be the main design if all three current channels are actually measured

Please review:

- `fpga/rtl`
- `fpga/tb`
- `matlab`
- root `README.md`
- `fpga/README.md`
- `FPGA_TODO.md`
- `PCB_CROSSCHECK_2026-08-05.md`
- the GitHub repo state at https://github.com/spenchh/fpga-motors

What I need from you:

1. List what is confirmed from the Altium files
2. List what is likely but still needs confirmation
3. List anything stale or wrong in the GitHub repo, README, MATLAB, or RTL
4. Check whether the current RTL files match the updated PCB interface
5. Check whether MATLAB config/check scripts match the updated PCB interface
6. Check whether the docs accidentally repeat old assumptions from older PCB versions
7. Identify any PCB red flags before ordering/fabrication
8. Identify questions I should send the PCB team
9. Recommend exact file edits, but separate required edits from optional cleanup
10. Give me a short professor-meeting update in natural first person

Do not overclaim physical testing or successful Vivado validation unless the files/logs prove it

Do not suggest pushing to GitHub unless I explicitly ask
