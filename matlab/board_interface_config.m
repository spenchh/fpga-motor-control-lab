function cfg = board_interface_config()
%BOARD_INTERFACE_CONFIG Current board/software assumptions for SURG FPGA work.
%
% This is intentionally a config file, not a final model. Keep the TODO
% values close to the board so MATLAB, HDL Coder, and Vivado do not drift
% away from what the schematic actually exposes.

cfg.meta.source_schematic = "C:\Users\HP\Documents\SURG\DriverBoard.SchDoc";
cfg.meta.source_pcb = "C:\Users\HP\Documents\SURG\ActualDriverBoard.PcbDoc";
cfg.meta.source_bom = "C:\Users\HP\Documents\SURG\HV Motor Driver.BomDoc";
cfg.meta.updated = "2026-08-05";

cfg.fpga.board = "Arty Z7-10";
cfg.fpga.fabric_clock_Hz = 100e6;          % TODO verify actual PL clock in Vivado
cfg.fpga.logic_io_V = 3.3;
cfg.fpga.xadc_single_ended_max_V = 3.3;    % TODO verify exact pin mode
cfg.fpga.xadc_diff_full_scale_V = 1.0;     % TODO verify exact pin mode

cfg.inverter.phase_count = 3;
cfg.inverter.mosfet_count = 6;
cfg.inverter.gate_driver_count = 3;
cfg.inverter.current_sensor_count = 3;
cfg.inverter.nominal_bus_V = 96;
cfg.inverter.low_voltage_bench_bus_V = 12;

cfg.pwm.f_pwm_Hz = 20000;
cfg.pwm.mode_target = "3PWM";
cfg.pwm.schematic_labels = ["MCU HI A", "MCU HI B", "MCU HI C", ...
    "MCU LO A", "MCU LO B", "MCU LO C"];
cfg.pwm.fpga_target_labels = ["PWM_HI_A", "PWM_LO_A", "PWM_HI_B", ...
    "PWM_LO_B", "PWM_HI_C", "PWM_LO_C"];
cfg.pwm.nonoverlap_ticks_placeholder = 20; % TODO set from Vivado clock + driver/PCB timing decision
cfg.pwm.note = "three duty commands are expanded in RTL to the updated PCB HI/LO driver-input pins";

cfg.current.sensor_chain = "shunt -> AMC1300BDWV/AMC1300BDWVR -> OPA4388IDR -> MCU CSENSE";
cfg.current.measured_phases = ["A", "B", "C"];
cfg.current.reconstruct_phase_c = false;
cfg.current.reconstruct_phase_c_fallback = true;
cfg.current.base_current_A = 100;
cfg.current.ref_V = NaN;                   % TODO confirm OPA4388 output offset
cfg.current.sensitivity_V_per_A = NaN;     % TODO derive from shunt, AMC1300, OPA4388 gain
cfg.current.amc1300_gain = 8.2;            % datasheet nominal, shunt value still needed
cfg.current.opa4388_diff_gain = 1.0;       % updated cross-check found 3.3k unity diff stage
cfg.current.overcurrent_A = 100;           % schematic note said overcurrent around 100 A
cfg.current.differential_nets = ["CSENSE A+", "CSENSE A-", ...
    "CSENSE B+", "CSENSE B-", "CSENSE C+", "CSENSE C-"];
cfg.current.controller_nets = ["MCU CSENSE A", "MCU CSENSE B", "MCU CSENSE C"];

cfg.voltage_sense.differential_nets = ["VSENSE A+", "VSENSE A-", ...
    "VSENSE Vm+", "VSENSE Vm-"];
cfg.voltage_sense.controller_nets = ["MCU VSENSE A", "MCU VSENSE Vm"];
cfg.voltage_sense.ref_V = NaN;             % TODO confirm voltage-sense output offset
cfg.voltage_sense.scale_V_per_V = NaN;     % TODO derive from divider, AMC1311, OPA/output path
cfg.voltage_sense.max_adc_V = NaN;         % TODO confirm ADC input limit for this path
cfg.voltage_sense.divider_top_ohm = 750e3 + 750e3;
cfg.voltage_sense.divider_bottom_ohm = 20e3;
cfg.voltage_sense.divider_ratio = cfg.voltage_sense.divider_bottom_ohm / ...
    (cfg.voltage_sense.divider_top_ohm + cfg.voltage_sense.divider_bottom_ohm);
cfg.voltage_sense.amc1311_gain = 1.0;

cfg.signals.digital_to_fpga_confirmed = ["MCU HALL A", "MCU HALL B", "MCU HALL C"];
cfg.signals.digital_to_fpga_unconfirmed = strings(1, 0);
cfg.signals.digital_from_fpga = ["PWM_HI_A", "PWM_LO_A", "PWM_HI_B", ...
    "PWM_LO_B", "PWM_HI_C", "PWM_LO_C", "DISABLE"];
cfg.signals.board_pwm_inputs_seen = cfg.pwm.schematic_labels;
cfg.signals.analog_to_fpga = ["MCU CSENSE A", "MCU CSENSE B", "MCU CSENSE C", ...
    "MCU VSENSE A", "MCU VSENSE Vm", "MCU MOTOR THERM"];
cfg.signals.disable_polarity = "active-high disable, drive low to run";
cfg.signals.power_seen_on_schematic = ["12V", "12V ISO", "5V", "5V ISO", ...
    "3V3", "Vm", "GND", "PGND"];

cfg.todo.need_from_pcb = [
    "confirm exact Arty pin map"
    "confirm HI/LO shield pin mapping against Arty constraints"
    "confirm whether any protection/status signal is routed to FPGA; updated board shows no nOC/FAULT net"
    "confirm phase shunt values"
    "confirm AMC1300 + OPA4388 offset/filter values and whether bidirectional current has a mid-rail offset"
    "confirm current sense voltage range into ADC"
    "confirm whether current sense goes to Arty XADC or another ADC"
    "confirm 5V Hall pullups are safe for the Zynq/Arty input path"
    "confirm voltage-sense output scaling and ADC clamp values"
    "confirm motor thermistor scaling"
    "confirm isolated 12V source and OPA4388 symbol pin mapping before fab"
];
end
