# Superseded Driver Board Review

This Aug 3 review is superseded by:

- `C:\Users\HP\Documents\SURG\PCB_CROSSCHECK_2026-08-05.md`

Use the Aug 5 cross-check for current FPGA/MATLAB/PCB decisions

Important corrections from the newer files:

- updated board did not show `nOC` or `FAULT` nets
- do not keep a required dedicated protection/status RTL block unless the PCB team confirms a real routed signal
- Hall A/B/C do route into the controller header as digital labels
- Hall pullups appear to be 5 V, so Zynq input-level safety still needs hardware confirmation
- measured current assumption is A/B/C current sense, not phase-C reconstruction as the main path
- `DISABLE` is active-high disable, drive low to run
- software/math still starts from three phase duty commands
- RTL now has to map those duty commands to the updated PCB's physical `MCU HI/LO A/B/C` driver-input pins
