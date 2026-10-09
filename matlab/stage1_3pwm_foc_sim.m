clear; close all; clc;

% Stage 1 3PWM FOC simulation.
% This is not a full motor model. It is a control-chain sandbox:
% id/iq references -> PI loops -> inverse Park -> 3 duty cycles -> 3PWM.
%
% Project assumption:
% FPGA logic starts from three duty commands.
% The updated PCB exposes HI/LO control pins per phase, so RTL expands each
% duty command into a physical HI/LO pair for the driver inputs.

%% System assumptions
base_current_A = 20;      % Stage 1 current scale for per-unit conversion.
base_bus_V = 12;          % Low-voltage bench bus assumption.
f_pwm_Hz = 20000;         % PWM/control update rate.
dt = 1 / f_pwm_Hz;
sim_time_s = 0.06;
t = 0:dt:sim_time_s;

electrical_speed_hz = 35; % Synthetic rotor electrical speed.
theta_e = wrapTo2PiLocal(2*pi*electrical_speed_hz*t);

% Q1.15 parameters for fixed-point-style controller constants.
Q_FRAC = 15;
Q_SCALE = 2^Q_FRAC;
Q_MAX = int32(2^15 - 1);
Q_MIN = int32(-2^15);

%% Current references
id_ref = zeros(size(t));       % FOC usually commands id = 0 for surface PMSM/BLDC.
iq_ref = zeros(size(t));       % iq produces torque.
iq_ref(t >= 0.006) = 0.35;
iq_ref(t >= 0.032) = 0.60;
iq_ref(t >= 0.048) = -0.25;

%% Controller gains
kp_d = 0.22;
ki_d = 0.012;
kp_q = 0.30;
ki_q = 0.016;
v_limit = 0.46;               % Keep voltage vector inside duty-cycle range.

kp_d_q15 = q_encode(kp_d, Q_SCALE, Q_MIN, Q_MAX);
ki_d_q15 = q_encode(ki_d, Q_SCALE, Q_MIN, Q_MAX);
kp_q_q15 = q_encode(kp_q, Q_SCALE, Q_MIN, Q_MAX);
ki_q_q15 = q_encode(ki_q, Q_SCALE, Q_MIN, Q_MAX);

%% State arrays
id_meas = zeros(size(t));
iq_meas = zeros(size(t));
vd_cmd = zeros(size(t));
vq_cmd = zeros(size(t));

duty_a = 0.5 * ones(size(t));
duty_b = 0.5 * ones(size(t));
duty_c = 0.5 * ones(size(t));

id_integrator_q15 = int32(0);
iq_integrator_q15 = int32(0);

% Simple first-order current response. This is just enough to test the controller.
current_tau_s = 0.0025;
plant_alpha = dt / current_tau_s;

%% Main control loop
for k = 2:numel(t)
    id_ref_q15 = q_encode(id_ref(k), Q_SCALE, Q_MIN, Q_MAX);
    iq_ref_q15 = q_encode(iq_ref(k), Q_SCALE, Q_MIN, Q_MAX);
    id_meas_q15 = q_encode(id_meas(k - 1), Q_SCALE, Q_MIN, Q_MAX);
    iq_meas_q15 = q_encode(iq_meas(k - 1), Q_SCALE, Q_MIN, Q_MAX);

    id_error_q15 = sat16(int32(id_ref_q15) - int32(id_meas_q15), Q_MIN, Q_MAX);
    iq_error_q15 = sat16(int32(iq_ref_q15) - int32(iq_meas_q15), Q_MIN, Q_MAX);

    [vd_q15, id_integrator_q15] = pi_fixed_step( ...
        id_error_q15, kp_d_q15, ki_d_q15, id_integrator_q15, ...
        v_limit, Q_FRAC, Q_MIN, Q_MAX);

    [vq_q15, iq_integrator_q15] = pi_fixed_step( ...
        iq_error_q15, kp_q_q15, ki_q_q15, iq_integrator_q15, ...
        v_limit, Q_FRAC, Q_MIN, Q_MAX);

    vd_cmd(k) = q_decode(vd_q15, Q_SCALE);
    vq_cmd(k) = q_decode(vq_q15, Q_SCALE);

    [v_alpha, v_beta] = inverse_park(vd_cmd(k), vq_cmd(k), theta_e(k));
    [duty_a(k), duty_b(k), duty_c(k)] = svpwm_3pwm_duties(v_alpha, v_beta);

    % Fake dq current plant: current moves toward voltage command.
    id_meas(k) = id_meas(k - 1) + plant_alpha * (vd_cmd(k) - id_meas(k - 1));
    iq_meas(k) = iq_meas(k - 1) + plant_alpha * (vq_cmd(k) - iq_meas(k - 1));
end

fprintf("Stage 1 3PWM FOC sim\n");
fprintf("base_current_A = %.1f A\n", base_current_A);
fprintf("base_bus_V = %.1f V\n", base_bus_V);
fprintf("f_pwm_Hz = %.0f Hz\n", f_pwm_Hz);
fprintf("Q1.%d scale = %d\n", Q_FRAC, Q_SCALE);
fprintf("duty_a range = %.3f to %.3f\n", min(duty_a), max(duty_a));
fprintf("duty_b range = %.3f to %.3f\n", min(duty_b), max(duty_b));
fprintf("duty_c range = %.3f to %.3f\n\n", min(duty_c), max(duty_c));

%% Plot control behavior
figure("Name", "Stage 1 3PWM FOC control behavior");

subplot(4, 1, 1);
plot(t, iq_ref * base_current_A, "k--", t, iq_meas * base_current_A, "b");
grid on;
ylabel("i_q (A)");
legend("iq ref", "iq measured", "Location", "best");
title("Torque-current command tracking");

subplot(4, 1, 2);
plot(t, id_ref * base_current_A, "k--", t, id_meas * base_current_A, "b");
grid on;
ylabel("i_d (A)");
legend("id ref", "id measured", "Location", "best");

subplot(4, 1, 3);
plot(t, vd_cmd, "b", t, vq_cmd, "r");
grid on;
ylabel("v_d / v_q (pu)");
legend("vd", "vq", "Location", "best");

subplot(4, 1, 4);
plot(t, duty_a, "r", t, duty_b, "g", t, duty_c, "b");
grid on;
xlabel("time (s)");
ylabel("3PWM duty");
legend("A", "B", "C", "Location", "best");

%% Show center-aligned 3PWM timing for one control update
pwm_period_counts = 5000;
counter = [0:(pwm_period_counts - 1), pwm_period_counts:-1:1];
time_counts = 0:(numel(counter) - 1);
sample_strobe = counter == pwm_period_counts;

demo_idx = find(t >= 0.036, 1, "first");
cmp_a = round(duty_a(demo_idx) * pwm_period_counts);
cmp_b = round(duty_b(demo_idx) * pwm_period_counts);
cmp_c = round(duty_c(demo_idx) * pwm_period_counts);

pwm_a = counter < cmp_a;
pwm_b = counter < cmp_b;
pwm_c = counter < cmp_c;

figure("Name", "Center-aligned 3PWM timing");
stairs(time_counts, counter / pwm_period_counts, "Color", [0.25 0.25 0.25]);
hold on;
stairs(time_counts, pwm_a * 0.9, "r");
stairs(time_counts, pwm_b * 0.75, "g");
stairs(time_counts, pwm_c * 0.60, "b");
stem(time_counts(sample_strobe), 1.05, "k", "filled");
grid on;
ylim([-0.05 1.15]);
xlabel("FPGA clock count inside one PWM period");
ylabel("normalized counter / PWM");
legend("up-down counter", "PWM_A", "PWM_B", "PWM_C", "sample strobe", "Location", "best");
title("Three duty commands feeding physical HI/LO driver inputs");

%% Print a copy-paste summary
fprintf("Copy-paste summary:\n");
fprintf("This simulation models the FPGA-side 3PWM FOC signal path. ");
fprintf("The controller regulates id and iq in fixed-point-style Q1.15 math, ");
fprintf("uses inverse Park to generate stationary-frame voltage commands, ");
fprintf("converts them into duty_a/duty_b/duty_c, and visualizes center-aligned ");
fprintf("three phase duty commands plus a PWM-center current-sample strobe. ");
fprintf("The RTL then maps those duty commands to the updated PCB HI/LO driver-input pins.\n");

%% Local functions
function y = q_encode(x, scale, q_min, q_max)
    y = int32(round(x .* scale));
    y = min(max(y, q_min), q_max);
end

function x = q_decode(y, scale)
    x = double(y) ./ scale;
end

function y = sat16(x, q_min, q_max)
    y = int32(min(max(int32(x), q_min), q_max));
end

function y = q_mul_q15(a_q15, b_q15, q_frac, q_min, q_max)
    raw = int64(a_q15) * int64(b_q15);
    if raw >= 0
        raw = raw + int64(2^(q_frac - 1));
    else
        raw = raw - int64(2^(q_frac - 1));
    end
    shifted = int64(floor(double(raw) / 2^q_frac));
    y = sat16(shifted, q_min, q_max);
end

function [out_q15, integ_next_q15] = pi_fixed_step(err_q15, kp_q15, ki_q15, integ_q15, out_limit_real, q_frac, q_min, q_max)
    p_q15 = q_mul_q15(err_q15, kp_q15, q_frac, q_min, q_max);
    i_step_q15 = q_mul_q15(err_q15, ki_q15, q_frac, q_min, q_max);

    integ_candidate = sat16(int32(integ_q15) + int32(i_step_q15), q_min, q_max);
    unsat = sat16(int32(p_q15) + int32(integ_candidate), q_min, q_max);

    out_limit_q15 = int32(round(out_limit_real * 2^q_frac));
    out_q15 = int32(min(max(unsat, -out_limit_q15), out_limit_q15));

    pushing_high = (out_q15 >= out_limit_q15) && (err_q15 > 0);
    pushing_low = (out_q15 <= -out_limit_q15) && (err_q15 < 0);
    if pushing_high || pushing_low
        integ_next_q15 = integ_q15;
    else
        integ_next_q15 = integ_candidate;
    end
end

function [alpha, beta] = inverse_park(d, q, theta)
    alpha = d * cos(theta) - q * sin(theta);
    beta = d * sin(theta) + q * cos(theta);
end

function [duty_a, duty_b, duty_c] = svpwm_3pwm_duties(v_alpha, v_beta)
    va = v_alpha;
    vb = -0.5 * v_alpha + (sqrt(3) / 2) * v_beta;
    vc = -0.5 * v_alpha - (sqrt(3) / 2) * v_beta;

    v_max = max([va, vb, vc]);
    v_min = min([va, vb, vc]);
    v_zero = -0.5 * (v_max + v_min);

    va = va + v_zero;
    vb = vb + v_zero;
    vc = vc + v_zero;

    duty_a = clamp(0.5 + va, 0.02, 0.98);
    duty_b = clamp(0.5 + vb, 0.02, 0.98);
    duty_c = clamp(0.5 + vc, 0.02, 0.98);
end

function y = clamp(x, lo, hi)
    y = min(max(x, lo), hi);
end

function theta = wrapTo2PiLocal(theta)
    theta = mod(theta, 2*pi);
end
