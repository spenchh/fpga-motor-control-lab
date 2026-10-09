# PCB / FPGA / MATLAB cross-check — updated driver board

Date: August 5, 2026
Files parsed: `ActualDriverBoard.PcbDoc` (binary netlist: 93 nets, 175 components, 556 pads extracted), `DriverBoard.SchDoc` (183 schematic parts, 78 net labels), `HV Motor Driver.BomDoc` (LiveBOM part choices)

How this was done: the Altium files are binary, but the PcbDoc net list, component list, and pad-to-net assignments parse cleanly, so the connectivity below is read from the actual PCB netlist, not from label guessing. The parser was validated against known-good pinouts (UCC21222, AMC1300, AMC1311 all land on their datasheet supply/ground pins exactly). Anything that depends on symbol graphics or copper-level visual checks is flagged as such. Chip behavior (DIS polarity, dead-time) comes from TI datasheets, not from the board files.

---

## Confirmed from files

**Controller interface is an Arduino-Uno-style shield header set** (J2 power, J3 analog 6-pin, J4 digital 10-pin, J5 digital 8-pin). Spare nets `pin12`/`pin13` sit on J4; the SCL/SDA/AREF positions (J4.1–3) and two J5 positions (J5.7/8, the D0/D1 spots) are unrouted.

**The board needs six PWM lines from the controller, not three.**
- `MCU HI A` = J4.7, `MCU LO A` = J4.8, `MCU HI B` = J4.9, `MCU LO B` = J5.2, `MCU HI C` = J5.3, `MCU LO C` = J5.5
- Each goes through a 49.9 Ω / 33 pF RC ("LOW PASSES FOR MCU PWM") into UCC21222 INA (HI) and INB (LO) on U5/U9/U13.
- There is no on-board inverter or complementary-generation logic: INB is an independent input. The UCC21222 only adds programmable dead time / input interlock via its DT pin (R28/R36/R61 to GND — schematic comment on all three is literally "Configurable", i.e. value not final).
- 3PWM as the control architecture (three duty commands) still stands; but the FPGA must physically drive HI and LO per phase.

**DISABLE** = J4.10 → DIS pin (5) of all three UCC21222 + test point TP5. No pull resistor anywhere on the net. Per the UCC21222 datasheet: active-HIGH disable ("Disable both driver outputs if asserted high, enable both outputs if set low… internally pulled high if left floating"). So: drive LOW to run, HIGH to kill, and a floating pin (FPGA unconfigured) = gates disabled = safe default. The `DISABLE_ACTIVE_LEVEL = 1'b1` default in `pcb_disable_control.v` is correct.

**Hall IS digital into the controller.** CC1 (Molex Microfit 2×3): 1=HALL C, 2=HALL B, 3=HALL A, 4=GND, 5=5V, 6=MCU MOTOR THERM. Each HALL x has a 10 kΩ pull-up to **5V**, then 100 Ω series + 100 nF to GND ("LOW PASSES FOR MCU HALL") → `MCU HALL A/B/C` → J5.1 / J5.4 / J5.6. Hall-decoder RTL is now justified. Caution: the pull-ups are to 5V and Zynq shield IO is 3.3 V — see questions.

**Current sense, all three phases, shunts NOT on this board.** H1/H2/H3 (6-pin headers to the power board): 1=GATE HI x, 2=PHASE x+, 3=PHASE x−, 4/6=PGND, 5=GATE LO x. The AMC1300 (U2/U4/U6) input measures PHASE x+ vs PHASE x− through series R + 10 nF — i.e. the shunt lives on the power board between PHASE x+ and PHASE x−. AMC1300 outputs (`CSENSE x±`) go through a 3.3 kΩ four-resistor unity-gain differential stage (OPA4388, U10) to `MCU CSENSE A/B/C` → J3.1/2/3. Measured A/B/C is the right active assumption; phase-C reconstruction is correctly demoted to a cross-check.

**Voltage sense is built exactly like current sense, two channels.**
- `VSENSE A`: PHASE A− → 750 kΩ + 750 kΩ (ERA-6AEB754V) with 20 kΩ (ERA-6AEB203V) to PGND → AMC1311 (U11) → OPA4388 (U12) diff stage → `MCU VSENSE A` → J3.4. Divider ratio 20/1520 ≈ 1:76 (96 V → ~1.26 V at the AMC1311, inside its 0–2 V range).
- `VSENSE Vm`: Vm (3-pin power-board connector, pin1=Vm, pin3=PGND) → identical 750k/750k/20k divider → AMC1311 (U14) → U12 → `MCU VSENSE Vm` → J3.5.

**New signal not in any FPGA/MATLAB doc: `MCU MOTOR THERM`** — motor thermistor from CC1.6, 499 Ω pull-up to 3V3, → J3.6. Sixth analog channel.

**`nOC` and `FAULT` do not exist on the updated board.** Zero nets, zero pads, zero schematic labels. The board's protection story is: UCC21222 internal interlock/dead-time + DIS, plus whatever the controller decides from CSENSE/VSENSE. No fault-manager RTL needed — matches the current plan.

**Power:** J1 (Molex 39-30-1021, 2-pos) = 12 V in; U1 buck → 3V3; U3 buck → 5V; on the isolated side 12V ISO → U7 buck → 5V ISO; GND (logic) and PGND (motor) are separate domains bridged only by the isolators. Gate-driver output stages run on 12V ISO with bootstrap-style diode feeds (ER2D + 1.5 Ω) for the high-side VDDA. The shield header's 5V/3V3/IOREF/RESET pins are unconnected; the board self-powers from J1 and puts 12 V on the shield VIN position (J2.8).

**BOM part choices present:** AMC1300BDWV, OPA4388IDR, LTST-C190KRKT, Molex 39-30-1021, plus catalog descriptions matching UCC21222 ("dual-channel isolated gate driver with disable pin"), AMC1311 ("2-V input precision voltage sensing"), a 3–36 V 2 A buck module, and a 15 W isolated DC-DC module.

**RTL/file-name check:** `pwm_3phase_center_aligned.v`, `phase_current_monitor.v` (Ia+Ib+Ic balance — matches board), `voltage_sense_monitor.v` (phase + bus — matches the two VSENSE channels), `pcb_disable_control.v` (no fault assumption — matches board) are all the right modules with the right names. The removed `fault_manager.v` / `phase_current_reconstruct.v` were the right things to remove.

---

## Likely but needs confirmation

- **Shield-position mapping**: with `pin13`/`pin12` on J4.5/J4.6 and GND on J4.4, the standard Uno layout implies DISABLE=D8, MCU HI B=D9, MCU LO A=D10, MCU HI A=D11, and on J5: MCU HALL C=D2, MCU LO C=D3, MCU HALL B=D4, MCU HI C=D5, MCU LO B=D6, MCU HALL A=D7; J3 = A0..A5 in the order CSENSE A/B/C, VSENSE A, VSENSE Vm, MOTOR THERM. All six PWM nets land on classic Uno PWM pins, which supports this reading — but confirm against the schematic sheet / Arty Z7 XDC before writing constraints.
- **ADC path**: the five sense signals + thermistor terminate on the analog header. On an Arty Z7 those pins go to the XADC (single-ended, divided down on the Arty to the 0–1 V aux inputs). That is platform knowledge, not something in these files — verify in the Arty Z7 reference manual when the pin map is made.
- **PS/PL split**: all board signals land on shield pins that are PL-connected on Arty Z7, so PWM/hall/DISABLE in fabric and XADC in PL, with PS doing mode/startup/telemetry/CAN over AXI registers, is coherent. The plan in FPGA_TODO §8 is fine; nothing in the PCB contradicts it. Worth writing one explicit table "net → header pin → PL/PS" once pins are confirmed.
- **Current-sense scaling**: AMC1300 fixed gain is 8.2 with ±250 mV input (datasheet), OPA diff stage is unity (all 3.3 kΩ) — so MCU CSENSE ≈ 8.2 × V_shunt. Shunt value is on the power board and unknown here, so end-to-end A→V scaling stays unconfirmed (correctly marked NaN in `board_interface_config.m`).

---

## Wrong or stale assumptions

1. **"PCB / gate-driver side handles the actual high-side and low-side switching" — stale.** Stated in `fpga/README.md`, FPGA_TODO §4, `board_interface_config.m` (`cfg.pwm.note`), and `stage1_3pwm_foc_sim.m` lines 9/158 ("Gate driver handles complementary high/low outputs and deadtime internally"). The UCC21222 does not generate the complementary signal; it inserts dead time between two signals you provide. The FPGA interface is 6 PWM outputs (3 complementary pairs) + DISABLE = 7 digital outputs, not 4.
2. **Hall "not confirmed" — now resolved.** `MCU HALL A/B/C` are real digital inputs (5V-pulled, RC-filtered) on J5. Hall decoder RTL moves from "not required" to "required" (pending the 5V-level question).
3. **`nOC` in the unconfirmed-digital list** (`board_interface_config.m`, stage2 output) — it is not on the updated board at all. Remove.
4. **`DISABLE` polarity "not confirmed"** — resolvable now: active-high disable, floating = disabled (safe). RTL default already matches.
5. **Analog input count = 5** — it is 6 with `MCU MOTOR THERM`.
6. **Voltage-sense divider "unknown"** — the on-board part is now readable: 750k + 750k with 20k to PGND (≈1:76) into a unity-gain AMC1311 path. (Final end-to-end scaling still needs the ADC-side confirmation.)
7. **File paths in README/config point at `C:\Users\HP\Downloads\...`** — the working copies now live in `Documents\SURG`.
8. The July 29 note (`FPGA_BOARD_INTERFACE_2026-07-29.md`) describes the OLD board (TMCS1126, nOC A/B, current on A/B only) — fine as history, but it contradicts the new extraction; mark it superseded.

---

## Red flags found in the netlist (PCB-team items, need visual Altium confirmation)

These come from the parsed netlist; they need someone to open the schematic and look before anyone treats them as final. They are the highest-value findings in the files.

1. **OPA4388 supply pins appear reversed.** On both U10 and U12 the netlist puts GND on pin 4 and 3V3 on pin 11. The TI datasheet for the SOIC-14 OPA4388 says pin 4 = V+ and pin 11 = V−. The feedback networks also land on the datasheet's *non-inverting* pins (R31 output→pin3, R41→pin5, etc.). Everything is consistent with the custom schematic symbol having a mirrored pin-number map (2↔3, 4↔11, 5↔6, 9↔10). If the symbol is wrong, the fabricated board would have both op-amps powered backwards and no working current/voltage sense. If the symbol is intentionally remapped somewhere, fine — but it must be checked against the datasheet before fab.
2. **Nothing sources 12V ISO.** The 15 W isolated DC-DC module (the component with designator `?`, THL15-style footprint) has all six pads unrouted, and no other component drives the `12V ISO` net. As parsed, the entire isolated gate-drive side has no power source. Also pin 2 of the 3-pin Vm connector (`H??`) is unrouted, and designators `?`, `H??`, `U?` are unassigned.
3. **Current-sense outputs are ground-referenced with unity gain.** The OPA4388 diff stage references to GND (R38/R45/R60 to GND), so negative phase current maps below 0 V and would clip. FOC needs bidirectional current. Ask how negative current is supposed to be represented (mid-rail offset network, ADC differential mode, or something not visible in the netlist).
4. **5V hall levels into 3.3V shield pins.** Hall pull-ups go to 5V; Zynq banks are not 5V tolerant. 100 Ω series is not enough protection by itself.
5. **Six resistors carry a capacitor part number.** R6/R11/R23/R24/R26/R27 (the AMC input series resistors) have comment `CL21B103KBANNNC` (a 10 nF cap MPN). The schematic itself says "SPEC THESE RESISTORS RIGHT" — this is presumably what that note is about.
6. **Buck-module part numbers are inconsistent across positions**: U1=TPSM33610S3QRDNRQ1, U3=TPSM33620S5QRDNRQ1, U7=PSM33620S5QRDNRQ1, plus an unplaced `U?`=PSM33620S3QRDNRQ1. Earlier notes said "PSM33610S3" as if singular.

---

## GitHub cleanup needed

Caveat first: at the time this note was written the remote itself could not be inspected, so everything below is proven from the local `.git` metadata in `Documents\SURG` (last confirmed sync ≈ Jun 30, remote main at `629522e`; local main `f932e5e` was 2 commits ahead at that time). The repo now lives at `https://github.com/spenchh/fpga-motors`.

**Tracked in git now** (i.e., what GitHub has, at most): `README.md`, `FPGA_TODO.md`, `SURG_FPGA_FOC.md`, `assets/*.svg`, `matlab/README.md`, `matlab/foc_fixed_point_starter.m`, and full vendor dumps of `Arduino-SimpleFOCShield-3.2/` and `SimpleFOC-DriveShield-main/` (Gerbers, images, an 8 MB .obj).

**Missing from git entirely — should be added:**
- all of `fpga/` — `rtl/pwm_3phase_center_aligned.v`, `rtl/phase_current_monitor.v`, `rtl/voltage_sense_monitor.v`, `rtl/pcb_disable_control.v`, all four `tb/` testbenches, `fpga/README.md`
- `matlab/board_interface_config.m`, `matlab/stage1_3pwm_foc_sim.m`, `matlab/board_interface_check.m` (and optionally the `_LAST_RUN.txt` as evidence)
- the dated notes you want public (e.g. `UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md`) — after fixing the stale items above

**Stale / should not be in the repo:**
- The two SimpleFOC vendor archives: they're other projects' full fab outputs (~15 MB). Either delete from the repo or shrink to a short "references" note with links.
- `README_SURG_2026.md` does not exist locally or in git — nothing to check there.

**Should NOT be pushed** (keep local): Altium binaries (`ActualDriverBoard.PcbDoc`, `DriverBoard.SchDoc`, `HV Motor Driver.BomDoc`) unless the team wants hardware versioned here, `altium_conflict_backup_*/`, `SURG/` (zip, 14 MB PDF, duplicate PcbDoc), `project_archive/`, `tmp/`, `__Previews/`, meeting-notes `.docx` and planning `.xlsx` files (private/team-internal). Add a `.gitignore` covering `*.PcbDoc`, `*.SchDoc`, `*.BomDoc`, `*.zip`, `__Previews/`, `tmp/`, `*.docx`, `*.xlsx` as appropriate. Note: something (likely a coding-tool checkpoint) hashed the large binaries into `.git/objects` today — worth a `git status` look before the next commit so none of them ride along.

---

## Recommended file edits

1. `fpga/rtl/pwm_3phase_center_aligned.v`: extend to complementary outputs — `pwm_hi_a/b/c`, `pwm_lo_a/b/c` (with a `DEADTIME_TICKS` parameter, or document explicitly that LO = ~HI and dead time is delegated to the UCC21222 DT resistor — the interlock makes that legitimate, but the DT value is "Configurable"/TBD, so FPGA-side dead time is the safer default). Keep the three duty inputs — the 3PWM control architecture is unchanged.
2. `fpga/tb/tb_pwm_3phase_center_aligned.v`: add checks that HI and LO are never simultaneously high and that dead time ≥ configured ticks.
3. New `fpga/rtl/hall_decoder.v` (+ tb): 3 digital inputs (J5), debounce/synchronize, 6-step sector out, illegal-state (000/111) flag. Justified now.
4. `fpga/rtl/pcb_disable_control.v`: no logic change needed — add a comment that DISABLE is confirmed active-high into UCC21222 DIS, floating = disabled, no external pull on the net.
5. `matlab/board_interface_config.m`:
   - `cfg.pwm.fpga_target_labels` → six labels; fix `cfg.pwm.note`
   - `cfg.signals.digital_from_fpga` → `["PWM_HI_A".."PWM_LO_C","DISABLE"]` (7)
   - `cfg.signals.digital_to_fpga_confirmed` → `["MCU HALL A","MCU HALL B","MCU HALL C"]`; drop `nOC` everywhere
   - add `"MCU MOTOR THERM"` to `cfg.signals.analog_to_fpga` (6 channels)
   - `cfg.voltage_sense`: divider = 750k+750k top / 20k bottom (≈1:76), AMC1311 gain 1; keep ADC-side numbers NaN until the pin map is confirmed
   - `cfg.current`: add AMC1300 gain 8.2 (datasheet), diff stage gain 1, ref currently GND (flag pending the offset question); shunt stays NaN
   - add `cfg.signals.disable_polarity = "active-high (drive low to run)"`
   - update the three `cfg.meta.source_*` paths to `Documents\SURG`
6. `matlab/stage1_3pwm_foc_sim.m` lines 9 and 158: reword — the gate driver inserts dead time/interlock but does not generate the complementary signal.
7. `matlab/board_interface_check.m`: update the IO-budget and hall/nOC sections to the confirmed picture; re-run to regenerate `_LAST_RUN.txt`.
8. `README.md` and `fpga/README.md`: move Hall + DISABLE polarity + 6-line PWM + MOTOR THERM from "unconfirmed" to confirmed; fix the Downloads paths; mark the 2026-07-29 note superseded.
9. `UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md`: correct the two label claims — `nOC`/`FAULT` do NOT appear in the updated extraction (they were from the old board), and Hall is confirmed digital.

---

## Questions to ask PCB team

1. The netlist shows GND on OPA4388 pin 4 and 3V3 on pin 11 (datasheet says 4=V+, 11=V−), on both U10 and U12 — can you open the OPA4388 symbol and check its pin numbering against the datasheet? If the symbol is mirrored, current/voltage sense won't function on the fabricated board.
2. The 15 W isolated module (designator `?`) is fully unrouted and nothing else sources `12V ISO` — what powers the gate-drive side, and can the module get a real designator and connections?
3. The current-sense diff amps reference to GND with gain 1 — how is negative phase current supposed to be read? (Mid-rail offset? ADC differential? Something else?)
4. Hall pull-ups go to 5V but the Zynq shield pins are 3.3 V, not 5 V tolerant — can the pull-ups move to 3V3 (hall connector 5V supply can stay)?
5. What are the intended values for the "Configurable" dead-time resistors R28/R36/R61 — and do you want the FPGA to insert dead time as well, or rely on the driver DT?
6. R6/R11/R23/R24/R26/R27 carry a capacitor MPN (CL21B103KBANNNC) — what are the real AMC input resistor values? (The "SPEC THESE RESISTORS RIGHT" note.)
7. Confirm the shield pin map (my reading: DISABLE=D8, HI B=D9, LO A=D10, HI A=D11, LO C=D3, HI C=D5, LO B=D6, HALL on D2/D4/D7, analog A0–A5 = CSENSE A/B/C, VSENSE A, VSENSE Vm, THERM).
8. What is the shunt value on the power board (for end-to-end current scaling)?
9. Vm divider gives ~1:76 — what is the maximum Vm the design should survive (the "96V to 1V65" schematic note doesn't quite match 96 V × 1/76 ≈ 1.26 V)?
10. Is 12 V on the shield VIN pin (J2.8) intentional when the Arty is also USB-powered?

---

## 20-second professor update

I cross-checked our FPGA and MATLAB work against the updated driver board by parsing the actual Altium netlist. Most of our assumptions held up: all three phase currents are measured, voltage sense mirrors current sense, and there's no dedicated fault line — protection is the driver chip plus our disable logic, and I confirmed disable is active-high and fails safe. Two corrections: hall sensors do come in digitally, so we're adding a small hall decoder, and the board takes six PWM inputs, so our three-phase generator will drive complementary pairs. I also flagged a few board-level issues to the PCB team, including op-amp pin mapping and the isolated supply, before this goes to fab.
