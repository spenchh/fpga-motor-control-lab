clear; close all; clc;

cfg = board_interface_config();

fprintf("SURG board interface check\n");
fprintf("source schematic: %s\n", cfg.meta.source_schematic);
fprintf("source pcb: %s\n", cfg.meta.source_pcb);
fprintf("source bom: %s\n", cfg.meta.source_bom);
fprintf("fpga board: %s\n", cfg.fpga.board);
fprintf("target control mode: %s\n\n", cfg.pwm.mode_target);

%% PWM timing from FPGA clock
period_counts = round(cfg.fpga.fabric_clock_Hz / (2 * cfg.pwm.f_pwm_Hz));
actual_f_pwm_Hz = cfg.fpga.fabric_clock_Hz / (2 * period_counts);

fprintf("PWM timing\n");
fprintf("fabric clock = %.1f MHz\n", cfg.fpga.fabric_clock_Hz / 1e6);
fprintf("requested f_pwm = %.0f Hz\n", cfg.pwm.f_pwm_Hz);
fprintf("center-aligned period_counts = %d\n", period_counts);
fprintf("actual f_pwm = %.2f Hz\n", actual_f_pwm_Hz);
fprintf("placeholder nonoverlap ticks = %d\n", cfg.pwm.nonoverlap_ticks_placeholder);
fprintf("note: %s\n\n", cfg.pwm.note);

%% IO budget
digital_inputs_confirmed = numel(cfg.signals.digital_to_fpga_confirmed);
digital_outputs = numel(cfg.signals.digital_from_fpga);
analog_inputs = numel(cfg.signals.analog_to_fpga);

fprintf("IO budget from updated board labels\n");
fprintf("confirmed digital inputs to FPGA = %d\n", digital_inputs_confirmed);
fprintf("digital outputs from FPGA = %d\n", digital_outputs);
fprintf("analog inputs listed = %d\n", analog_inputs);
fprintf("disable polarity = %s\n\n", cfg.signals.disable_polarity);

fprintf("Digital outputs\n");
fprintf("%s\n\n", strjoin(cfg.signals.digital_from_fpga, ", "));

fprintf("Confirmed digital inputs\n");
fprintf("%s\n\n", strjoin(cfg.signals.digital_to_fpga_confirmed, ", "));

fprintf("Analog inputs\n");
fprintf("%s\n\n", strjoin(cfg.signals.analog_to_fpga, ", "));

%% Current-sense path
fprintf("Current-sense path from updated board\n");
fprintf("chain = %s\n", cfg.current.sensor_chain);
fprintf("measured phases = %s\n", strjoin(cfg.current.measured_phases, ", "));
fprintf("differential nets = %s\n", strjoin(cfg.current.differential_nets, ", "));
fprintf("controller nets = %s\n", strjoin(cfg.current.controller_nets, ", "));
fprintf("AMC1300 gain = %.2f\n", cfg.current.amc1300_gain);
fprintf("OPA4388 diff-stage gain = %.2f\n", cfg.current.opa4388_diff_gain);

if isnan(cfg.current.ref_V) || isnan(cfg.current.sensitivity_V_per_A)
    fprintf("WARNING: final current-sense A-to-V scaling is not known yet\n");
    fprintf("need shunt value and bidirectional-current offset plan before final HDL scaling\n\n");
else
    i_test_A = linspace(-cfg.current.overcurrent_A, cfg.current.overcurrent_A, 1000);
    v_sense = cfg.current.ref_V + i_test_A * cfg.current.sensitivity_V_per_A;

    fprintf("Vref = %.3f V\n", cfg.current.ref_V);
    fprintf("sensitivity = %.6f V/A\n", cfg.current.sensitivity_V_per_A);
    fprintf("at +/- %.1f A, output range = %.3f V to %.3f V\n\n", ...
        cfg.current.overcurrent_A, min(v_sense), max(v_sense));
end

%% Voltage-sense path
fprintf("Voltage-sense path from updated board\n");
fprintf("differential nets = %s\n", strjoin(cfg.voltage_sense.differential_nets, ", "));
fprintf("controller nets = %s\n", strjoin(cfg.voltage_sense.controller_nets, ", "));
fprintf("divider ratio = %.6f\n", cfg.voltage_sense.divider_ratio);
fprintf("96 V input into divider gives %.3f V before isolation amp\n", ...
    96 * cfg.voltage_sense.divider_ratio);
fprintf("WARNING: final ADC-side voltage scaling still needs the Arty/ADC pin path\n\n");

%% Three-current balance check
t = linspace(0, 2 / 60, 2000);
theta = 2*pi*60*t;
amp_A = 35;

ia = amp_A * cos(theta);
ib = amp_A * cos(theta - 2*pi/3);
ic = amp_A * cos(theta + 2*pi/3);
current_balance = ia + ib + ic;

fprintf("Three-current balance check\n");
fprintf("max ideal Ia + Ib + Ic error = %.6f A\n", max(abs(current_balance)));
fprintf("note: measured A/B/C is the active current assumption\n\n");

figure("Name", "Three-current balance check");
plot(t, ia, "r", t, ib, "g", t, ic, "b", t, current_balance, "k--");
grid on;
xlabel("time (s)");
ylabel("phase current (A)");
legend("ia", "ib", "ic", "ia+ib+ic", "Location", "best");
title("Measured three-phase current balance check");

%% Hall status
fprintf("Hall input status\n");
fprintf("MCU HALL A/B/C are confirmed digital labels into the controller header\n");
fprintf("hardware question: Hall pullups are to 5 V, so Zynq input-level protection must be checked\n\n");

fprintf("TODO list from board config\n");
for k = 1:numel(cfg.todo.need_from_pcb)
    fprintf("- %s\n", cfg.todo.need_from_pcb(k));
end
