# surg pcb / fpga / foc notes

7/27
meeting tmr

formula guy / wisconsin inverter stuff

- talked to someone from formula, they also make their own motor controllers
- resource he recommended: https://www.wisconsinracing.org/wp-content/uploads/2025/01/WR_Quad_Inverter.pdf
- said this is prob a really good resource for understanding how to finish the project
- he agreed with the 2 board system to start
- wisconsin formula racing has a 120 kW inverter
- vesc is open source hardware + software, should look at this
- vesc duet = two motors, one inverter

wr quad inverter pdf stuff i pulled

- this report is way bigger than our project, 120 kW quad inverter, 4 motors, around 300 V stuff, so we should not copy the exact parts blindly
- the useful part is how they broke the inverter into requirements, protection, sensing, layout, controls, cooling, and testing
- they defined the full interface list before the pcb layout, which we should prob do before anyone sends the board out
- their system used 20 kHz switching, FOC, space vector modulation, CAN, hardware overcurrent / overvoltage protection, temp sensing, and fast fault shutdown
- they cared a lot about protection reacting in under 10 us
- this matters for us bc nOC / disable / fault kill should be a real fast path, not just software later

requirements checklist from the report

- dc bus voltage range
- max phase current
- switching frequency
- motor max rpm
- electrical frequency
- motor pole count
- motor inductance / saliency
- current sensor bandwidth
- voltage sensing range
- fault response time
- what signals go between control and power pcb
- what signals go to the arty z7-10
- what happens when pwm resets
- what happens when current sensor trips
- what happens when gate driver faults

board split from the report

- they used a parent board, gate driver board, and control card
- parent board had power supplies, LV protection, voltage sensing, current sensing, temp sensing, and interfaces
- gate driver board took pwm and made gate drive with isolation and protection
- control card handled DSP, CAN, overcurrent logic, faults, status stuff
- our 2 board setup is still fine rn
- but we need to be really clear what lives on power board vs control board
- if we are skipping the middle board, then isolation / gate driver / op amp stuff needs an actual home

dc link cap stuff from the report

- they did not just pick caps from capacitance and voltage
- they checked ripple current, ESR, ESL, voltage rating, size, and thermal stuff
- they overspecced the dc link caps bc flux weakening / regen / bus transients can push voltage higher than expected
- for us this means dc link caps should be chosen from actual ripple current and switching current paths
- caps need to be physically close to the MOSFET half bridges
- current loop area from cap to MOSFETs matters a lot
- we should ask if our dc link caps are sized for ripple current or if they are just kind of picked

current sensing stuff from the report

- they wanted current sensor bandwidth higher than the control loop needs
- they compared hall, shunt, and fluxgate
- they picked hall mostly bc it was simple and isolated around the phase cable
- for us, TMCS1126 is basically the thing to validate hard
- exact suffix matters bc output scaling changes
- xadc range matters bc arty cannot just take any analog voltage
- current offset / reference pin needs to be clear
- only 2 current sensors means we are prob doing Ic = -Ia - Ib
- need to confirm this is intentional and okay for protection too

gate driver stuff from the report

- their gate driver section is prob one of the most useful pcb parts
- they cared about isolation, CMTI, UVLO, disable behavior, fault pins, and safe turnoff
- they calculated gate resistor values instead of guessing
- they sized driver power from gate charge, switching frequency, and gate voltage swing
- they had a hard shutdown path so faults could disable gates fast
- they talked a lot about Miller turn-on and ringing
- for us, UCC21222D needs the same kind of review
- source / sink current
- deadtime setup
- disable pin behavior
- default off state
- bootstrap / isolated supply behavior
- gate resistor values
- gate loop area
- whether pwm inputs are clean enough
- whether 3PWM becomes the right HI / LO gate signals safely

pcb layout stuff from the report

- they used HV and LV net classes instead of relying on default rules
- their clearance table was way bigger than default pcb rules
- 50 to 150 V dc was around 6.4 mm creepage over surface and 3.2 mm clearance through air
- 150 to 300 V dc was around 9.5 mm creepage over surface and 6.4 mm clearance through air
- conformal coating let them use smaller creepage numbers, but that has to be an actual decision
- our current 8 mil default clearance is not a real answer for VM / phase / switch nodes / isolation
- need real net classes for logic, gate drive, dc bus, phase output, switch node, and isolated grounds
- gate driver traces should be short, wide when possible, and close together
- gate return path matters
- do not route sensitive analog current sense near switch nodes
- decoupling caps need to sit right at IC power pins
- CAN should have filtering / choke / proper termination if it goes off board

control / fpga stuff from the report

- their control card had 3 phase currents, 3 phase voltages, dc bus voltage, temp, gate fault, gate ready, CAN, reset, and status
- they used 6 PWM at the DSP output bc their gate stage wanted it that way
- our FPGA side is still 3PWM
- our pcb side has to turn PWM_A PWM_B PWM_C into high / low gate drive for 6 MOSFETs
- so the wording in our schematic matters a lot
- arty-facing names should not look like PWM HI / PWM LO unless arty is actually outputting 6 signals
- for HDL, keep the first version simple and bit-true
- FOC math should leave room for bus voltage compensation, current limits, field weakening, and fault bits later
- do basic 3PWM + fault kill before trying to make the whole motor control stack fancy

testing stuff from the report

- they validated firmware on a dev kit before full inverter testing
- they did board-level tests before system tests
- they started low voltage before high voltage
- they used dyno / load testing after basic electrical checks
- current limiting saved hardware when things went wrong
- for us, bring-up should be boring on purpose
- logic only first
- pwm disabled state
- safe reset state
- low voltage current limited bus
- scope pwm / deadtime / gate outputs
- check current sensor offset
- trigger nOC on purpose
- only then think about real bus voltage

questions from the pdf for the meeting

- do we have a real requirements table yet or just a schematic
- what is our exact dc bus range
- what is our max phase current and short-term peak current
- what is the exact motor pole count and max rpm
- what electrical frequency does that become
- what switching frequency are we committing to
- are dc link caps sized for ripple current
- are the caps close enough to the MOSFETs
- where exactly are inversion and deadtime happening
- does UCC21222D handle the high / low logic the way we think it does
- what is the guaranteed default-off state
- what happens if arty resets
- what happens if nOC trips
- are HV / LV / GND1 / GND2 clearances actually enforced in Altium
- do we have test points for pwm, gate outputs, current sense, refs, 12 V, 5 V, 3V3, disable, nOC
- do we have enough CAN filtering / EMI stuff if CAN is leaving the board
- do we have any temp sensing plan or are we ignoring thermal rn

new chat stuff from teams

- 7/28 schematic got more serious
- added isolated voltage regulators
- added voltage sensing with divider
- added voltage clamping
- added HV indicators
- still needs datasheet verification
- dc link cap is still a pain
- connectors need more looking into
- before real layout, need LV / HV tolerances and real clearance rules
- formula guy left comments and they want to ask follow up questions
- hall pullups got debated
- one side says halls are open drain and need pullups or they do not work
- other side says datasheet maybe does not look open drain
- this needs actual motor Hall datasheet / scope check
- 1.65 V source is current sensor ref
- Arty differential IO came up for differential ADC-ish signals
- problem is we want to ADC more than 6 things
- Arty Z7-10 does not have the extra inner Arduino row
- Arty Z7-20 does but we are not using that rn
- for more GPIO on Z7-10, PMOD is probably the clean path
- question asked: why have voltage sensor be 5 V and then clamp to 3V3
- question asked: how were dc link cap values determined
- question asked: diode delay vs turn-on / turn-off voltage stuff
- formula power board stackup first sounded like top / gnd / power / bottom
- then correction was maybe it is a two layer power board
- actual stackup values still needed
- 7/7 new gate driver got brought up and seemed necessary
- schematic was basically done but i/o and component values still needed work
- for resistors / capacitors, if we are using parts we already have then package / footprint may matter more than exact vendor part rn
- still need actual values calculated tho, especially gate resistors, deadtime stuff, filters, dc link stuff
- 7/8 dc link capacitor started looking actually serious
- need ask Shannon or someone who knows power electronics real questions about dc link sizing
- FPGA FOC repo got sent: https://github.com/WangXuan95/FPGA-FOC
- TI motor control sdk got sent: https://github.com/TexasInstruments/motor-control-sdk
- 7/10 gate driver docs got sent
- https://www.ti.com/lit/an/slva959b/slva959b.pdf
- https://www.ti.com/lit/ug/sluubs2b/sluubs2b.pdf
- need look through these for UCC21220 / UCC21222 type gate driver setup
- 7/11 Orion BMS CAN docs got sent
- https://www.orionbms.com/downloads/misc/editing_canbus_messages.pdf
- https://www.orionbms.com/manuals/utility_o2/page_parameters.html
- https://www.orionbms.com/manuals/utility_o2/
- this might explain keep alive messages / receive IDs / CAN config
- ask for documentation on the exact CAN ID we care about
- 7/17 ASC scrutineering sheets got sent
- https://www.americansolarchallenge.org/wp-content/uploads/2026/07/Scrutineering-Sheets-ASC-2026.pdf
- NU formula VESC firmware link got sent
- https://github.com/NU-Formula-Racing/nfr-bldc
- UT solar vehicle wiki link got sent
- https://cloud.wikis.utexas.edu/wiki/spaces/LHRSOLAR/pages/836894793/2026+-+2028+Vehicle

power / battery / fuse stuff from chat

- motor current = current going to motors
- battery current = current going from battery to controller
- these are not always the same bc controller can step voltage down and make higher motor phase current
- this is important for current limits bc battery current limit and motor current limit are different
- fuse options got brought up
- 100A Littelfuse JLLN100, 300 VAC / 125 VDC, class T fast acting
- 25A SCHURTER 0090.0025, 1 kVDC cartridge fuse, needs holder
- need decide what fuse is for actual inverter bus vs aux / low voltage testing
- aux battery idea was 12 V 18 Ah AGM lead acid
- under 12 V on a 12 V lead acid might mean overdischarged / damaged
- one battery maybe measured under 10 V so prob bad
- might just buy a new aux battery
- dc-dc board was described as black box on same thing as mppt
- someone floated only HV input and doing power conversion on motor controller
- then that got walked back
- still worth asking if final board should have separate LV/control input or HV-derived LV rails
- for first board, separate LV/control power is still prob easier to test safely

formula board stuff from chat

- a teammate has access to formula motor controller boards / screenshots
- power board screenshots and driver board screenshots were shared in Teams
- screenshots were not included as files here, only placeholders
- note from later chat was that formula did a really comprehensive inverter
- lots we can learn from and lots we can change
- one-board vs two-board came up
- thought was formula used two boards mostly for space constraints
- our first version maybe can be one board / simpler if layout and safety still make sense
- all-in-one board was called good for us
- not using IGBTs saves us from the +15 V / -9 V gate drive stuff
- but MOSFETs still have Miller capacitance / false turn-on issues
- flybacks + gate resistors were added but unsure if sufficient
- need simulate / verify gate ringing and fault behavior
- Wisconsin used LTspice and TINA simulations
- we should do similar simulations for solar and show faults
- formula voltage / current mentioned as around 600 V and maybe 150 to 200 A
- that is way above us but useful for seeing serious layout / protection decisions

dual drive idea

- dual drive = one controller drives two motors
- basically saves a whole motor controller
- agreed it makes practical sense later
- not for first board
- first board should be cheap and get results
- dual drive means two inverters or two full sets of phase outputs, not two motors blindly in parallel on one inverter for FOC
- each motor needs its own rotor angle for FOC
- FPGA can do two sets of calculations in parallel if we give it enough inputs
- needs two rotor angle inputs
- needs more current sensing
- needs more PWM outputs
- needs more fault inputs
- biggest first issue is probably i/o availability on Arty without PMODs / extra connectors
- keep dual drive as second iteration idea

frequency / ganfet thoughts

- Wisconsin topping out at 20 kHz was interesting
- we are also around 20 kHz rn
- speed is not just proportional to current, need separate motor speed / torque / voltage limit thinking
- inverter may not be the main bottleneck we are trying to improve, but we can still optimize more than one thing later
- GaN FETs may matter in another iteration because FPGA can handle faster control / timing
- we are not using GaN FETs on this board
- GaN later would mean much harder layout, EMI, gate drive, deadtime, and measurement problems

mechanical / connector stuff from chat

- there was confusion about mounting the Arduino / Arty style board over the power board
- stackable / extended headers were suggested
- desoldering existing headers and soldering longer ones got mentioned
- this sounds annoying and should not be assumed without checking mechanical fit
- need confirm actual Arty Z7 mounting / header orientation / clearance before layout is frozen
- ring terminal link got sent for 12 to 10 AWG heat shrink terminals
- need match terminal/lug size to actual current and stud size, not just Amazon convenience

board stack idea from formula guy

- bottom board = HV, FETs, dc link caps, shunts, voltage dividers
- middle board = isolation, gate drivers, other isolators, op amps
- top board = control, stm or fpga board, diff op amps, can comms, usb
- we are doing 2 boards rn but this is helpful for thinking about what should be separated

motor control things he mentioned

- motor winding ratio matters
- switching / electrical frequency matters
- motor rpm matters
- saliency = different inductances across different planes
- non-salient motor = easier to control
- predictive FOC is useful for salient motors

layout / emi things he mentioned

- ensure proper filtering
- isolation between phases
- dc-dc converters across phases and frequency control, need to understand this better
- y caps for GLV power system
- emi protection
- onboard protection circuitry
- CAN filtering
- chokes for CAN / emi filtering
- overspec dc link caps
- make sure dc link caps are not barely enough

pcb / fpga things i need to bring up

- schematic still says PWM HI A/B/C and PWM LO A/B/C even tho we are doing 3PWM
- lowkey this is confusing bc it makes it look like the arty is outputting 6 pwm signals
- should prob rename this so arty side is just PWM_A PWM_B PWM_C
- pcb / gate driver side has to make the high/low gate drive + deadtime happen
- need to know where exactly inversion + deadtime happen
- nOC should prob go straight to fpga for fast shutdown? need to check
- current sensor outputs need to fit arty z7-10 xadc range
- only 2 current sensors rn
- so are we reconstructing phase C?
- phase C would be Ic = -Ia - Ib
- confirm this is actually what we want and not accidental

current schematic stuff

- U1 U2 = TMCS1126A1AQDVGRQ1 current sensors
- U3 U4 U5 = UCC21222D isolated dual gate drivers
- Q1-Q6 = BSC110N15NS5 150 V nmos
- D1-D6 = NRVUA140VT3G fast rectifier diodes
- diodes are prob bootstrap / gate driver related

connectors / terminals

- J0 = 5 pin samtec connector near hall stuff
- J0 labels = HALL A HALL B HALL C 12V GND1
- J1 + J4 = 8 pin samtec headers
- J2 = 6 pin samtec header, pinA0-pinA5
- J3 = 10 pin header
- MP1-MP7 = M6 high current pcb power terminals

labels i saw

- Vm
- 12V
- 5V
- 3V3
- GND1
- GND2
- GND1 for Logic, GND2 for HV
- CURR REF A
- CURR SENSE A
- nOC A
- CURR REF B
- CURR SENSE B
- nOC B
- PHASE A+
- PHASE A-
- PHASE B+
- PHASE B-
- PHASE C
- GATE HI A/B/C
- GATE LO A/B/C
- PWM HI A/B/C
- PWM LO A/B/C
- DISABLE

random notes already written in schematic

- Overcurrent = 100A, VOC = 0.8
- Current Sensing x2
- Gate Drivers + MOSFETS x3
- LOW PASSES FOR PWM OUTPUT FROM MCU
- Configurable around deadtime resistors
- CHANGE FOOTPRINTS HERE, RECALCULATE VALUES
- ADD LEDs, TEST POINTS?
- RIGHT FOOTPRINT BUT SHOULD ALL BE NORMAL HEADERS?
- GET RID OF PWM LO INPUTS AND USE INVERTER + MOVE AROUND INPUTS AFTER
- CHANGE NON NUMBER DESIGNATORS

layout things

- pcb file time 7/27 1:43 am
- 4 copper layers looks like
- top copper about 2 oz
- bottom copper about 2 oz
- inner layers about 1 oz
- core FR-4
- rules still look kind of default

rules i saw

- clearance 8 mil
- board outline clearance 7.874 mil
- default routing width 8 mil preferred
- via width 23.622 mil
- via hole 11.811 mil
- component clearance 5 mil
- supply nets include 3V3 5V GND1 GND2 12V Vm
- supply-rule voltages were 0.000 lol so prob not set

before sending out pcb

- set HV / high current net classes
- real clearances
- real trace widths
- check copper pours
- check thermal assumptions
- run DRC after rules are actually set
- do not trust 8 mil default rules for 96 V / phase current / switch nodes / isolation

parts to double check

- current sensor = TMCS1126A1AQDVGRQ1
- older notes say TMCS1126BDx-Q1 and 20 mV/A sensitivity
- so exact suffix + scaling needs checking
- gate driver = UCC21222D
- mosfet = BSC110N15NS5
- confirm suffixes / packages / footprints
- replace placeholder resistor + capacitor values
- repeated 1k resistors cannot just stay unless values were actually calculated
- recalc deadtime resistors
- check bootstrap parts
- check low-pass filters

fpga / matlab

- matlab is aligned with 3PWM
- schematic names are not aligned rn bc PWM HI / PWM LO makes it look 6PWM
- fpga module should stay 3PWM
- connector pinout should stay 3PWM
- safe reset behavior should stay 3PWM
- hdl coder model should stay 3PWM unless we actually decide to redesign

matlab files

- matlab/foc_fixed_point_starter.m
- Q1.15 fixed point style math
- per-unit scaling
- Q encode / decode
- Q1.15 multiply
- saturation
- anti-windup PI
- Clarke / Park sanity checks
- PWM-center sample timing
- base_current_A = 100
- base_voltage_V = 96
- f_pwm_Hz = 20000

- matlab/stage1_3pwm_foc_sim.m
- stage 1 3PWM FOC signal path
- id / iq PI loops
- inverse Park
- SVPWM-ish duties
- center-aligned PWM
- sample strobe timing
- low voltage bench assumptions first
- base_bus_V = 12
- base_current_A = 20
- f_pwm_Hz = 20000
- assumes fpga outputs PWM_A PWM_B PWM_C only
- gate driver / pcb side handles complementary outputs and deadtime

meeting questions

- final parts? UCC21222D / TMCS1126A1AQDVGRQ1 / BSC110N15NS5
- where exactly are inversion + deadtime made
- should schematic labels change from PWM HI/LO to PWM A/B/C + internal gate-driver names
- are PWM A/B/C, DISABLE, nOC A/B, hall A/B/C, current sense A/B, current refs, bus voltage, temp all going to arty-compatible pins
- are current sensor outputs safe for xadc
- are we reconstructing phase C from 2 sensors
- does nOC go straight to fpga fabric for fast shutdown
- final HV clearances / trace widths / pours / net classes for Vm, phase outputs, switch nodes, isolation
- are GND1 and GND2 rules actually explicit
- where are DC-link caps relative to MOSFET half bridges
- thermal plan for mosfets + current sensors
- what test points / LEDs before sending out
- are placeholder values recalculated
- low voltage bring-up plan before 96 V

pcb next

- rename pwm labels so arty-facing side is clearly 3PWM
- confirm part suffixes / packages / footprints
- replace placeholder R/C values
- add useful test points
- add LEDs if useful
- define net classes for logic / gate drive / high current phase / dc bus / switch node / isolation
- creepage / clearance check
- slots / cutouts maybe?
- gate loop layout review
- current sensor placement + routing review
- DRC after custom rules

fpga / matlab next

- keep fixed point chain in per-unit
- write down Q formats
- overflow checks
- matlab test vectors
- build 3PWM HDL module
- include enable + safe reset + fault kill + sample strobe
- vivado arty z7-10 LED blink
- then pwm output on safe header pins
- AXI lite register map
- decide current data path: xadc / external adc / something else
- hall decoder
- speed estimator
- HDL coder after fixed point stuff makes sense

testing order

- logic only first
- no motor bus first
- reset defaults
- pwm disabled state
- low voltage bench test, prob 12-24 V current limited
- scope pwm freq / deadtime / sample strobe
- check current sensor offset + reference
- check nOC with controlled current
- then closed loop current control on small motor
- no HV until layout / protection / precharge / fusing / e-stop reviewed

links

fpga / zynq / vivado / xadc

- Digilent Arty Z7: https://digilent.com/shop/arty-z7-zynq-7000-soc-development-board/
- Digilent Vivado board files: https://github.com/Digilent/vivado-boards
- Zynq-7000 TRM UG585: https://docs.amd.com/r/en-US/ug585-zynq-7000-SoC-TRM
- XADC UG480: https://docs.amd.com/r/en-US/ug480_7Series_XADC
- AXI GPIO PG144: https://docs.amd.com/r/en-US/pg144-axi-gpio
- AXI Interconnect PG059: https://docs.amd.com/r/en-US/pg059-axi-interconnect
- Vivado programming/debugging UG908: https://docs.amd.com/r/2025.1-English/ug908-vivado-programming-debugging

matlab / hdl coder

- HDL Coder FOC PMSM example: https://www.mathworks.com/help/hdlcoder/ug/field-oriented-control-of-a-permanent-magnet-synchronous-machine.html
- Motor Control Blockset FPGA FOC example: https://www.mathworks.com/help/mcb/gs/foc-pmsm-using-mcb-blocks-fpga-hardware.html
- Motor Control Blockset: https://www.mathworks.com/products/motor-control.html
- Fixed-Point Code Generation in Simulink: https://www.mathworks.com/help/fixedpoint/fixed-point-code-generation-in-simulink.html
- Fixed-Point Code Generation Support: https://www.mathworks.com/help/fixedpoint/ug/code-generation-support.html

pcb parts / layout

- UCC21222: https://www.ti.com/product/UCC21222
- TMCS1126: https://www.ti.com/product/TMCS1126
- TMCS1126-Q1: https://www.ti.com/product/TMCS1126-Q1
- BSC110N15NS5: https://www.infineon.com/cms/en/product/power/mosfet/n-channel/bsc110n15ns5/
- TI TIDM-02017 5 kW traction inverter: https://www.ti.com/tool/TIDM-02017
- TI TIDA-010956 48 V 85 Arms inverter: https://www.ti.com/tool/TIDA-010956
- TI TIDA-00909 high frequency inverter: https://www.ti.com/tool/TIDA-00909

simplefoc

- boards: https://docs.simplefoc.com/boards
- code flow: https://docs.simplefoc.com/code
- current sense testing: https://docs.simplefoc.com/test_current
- foc current control: https://docs.simplefoc.com/foc_current

commercial refs

- WaveSculptor22 manual: https://docs.prohelion.com/Motor_Controllers/WaveSculptor22/User_Manual/index.html
- motor sense connections: https://docs.prohelion.com/Motor_Controllers/WaveSculptor22/User_Manual/Motor_Sense_Connections.html
- CAN + LV interface: https://docs.prohelion.com/Motor_Controllers/WaveSculptor22/User_Manual/CAN_Bus_And_Low_Voltage.html
- bring-up checklist: https://docs.prohelion.com/Motor_Controllers/WaveSculptor22/User_Manual/Getting_Started.html

my fpga focus

- fixed point / bit true math
- Id / Iq PI + transforms in matlab until scaling is predictable
- Q formats + saturation points
- test vectors
- 3PWM module
- fault kill before fancy motor control
- enough AXI lite for setpoints + status
- current sampling is pcb + fpga, not just matlab
- HDL coder / vivado after matlab is solid

watch out

- schematic names still look 6PWM
- arty z7-10 I/O limits
- 3.3 V only
- current sensor output range vs xadc
- only 2 current sensors
- phase C reconstruction
- pcb rules still generic
- thermal plan not proven
- safe default-off behavior
- placeholder values
- HV testing needs fusing / precharge / e-stop / low voltage validation
