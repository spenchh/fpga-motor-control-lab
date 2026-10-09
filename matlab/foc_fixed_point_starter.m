clear; close all; clc;

% FOC fixed-point starter script.
% Goal: compare simple floating-point math against explicit Q-format math.

%% Base values and Q format
base_current_A = 100;
base_voltage_V = 96;
f_pwm_Hz = 20000;
dt = 1 / f_pwm_Hz;
sim_time_s = 0.04;
t = 0:dt:sim_time_s;

Q_FRAC = 15;
Q_SCALE = 2^Q_FRAC;
Q_MAX = int32(2^15 - 1);
Q_MIN = int32(-2^15);

fprintf("Q1.%d scale = %d\n", Q_FRAC, Q_SCALE);
fprintf("0.5 pu encoded = %d\n", q_encode(0.5, Q_SCALE, Q_MIN, Q_MAX));
fprintf("0.25 pu encoded = %d\n\n", q_encode(0.25, Q_SCALE, Q_MIN, Q_MAX));

%% Floating-point and fixed-point PI current loop demo
iq_ref_pu = zeros(size(t));
iq_ref_pu(t >= 0.004) = 0.55;
iq_ref_pu(t >= 0.025) = -0.25;

kp_pu = 0.32;
ki_pu_per_sample = 0.018;

plant_tau_s = 0.0028;
plant_alpha = dt / plant_tau_s;

iq_float = zeros(size(t));
vq_float = zeros(size(t));
integ_float = 0;

iq_fixed = zeros(size(t));
vq_fixed = zeros(size(t));
integ_q15 = int32(0);

kp_q15 = q_encode(kp_pu, Q_SCALE, Q_MIN, Q_MAX);
ki_q15 = q_encode(ki_pu_per_sample, Q_SCALE, Q_MIN, Q_MAX);

for k = 2:numel(t)
    % Floating-point PI.
    err_float = iq_ref_pu(k) - iq_float(k - 1);
    [vq_float(k), integ_float] = pi_float_step(err_float, kp_pu, ki_pu_per_sample, integ_float);
    iq_float(k) = iq_float(k - 1) + plant_alpha * (vq_float(k) - iq_float(k - 1));

    % Fixed-point PI. Inputs are quantized to Q1.15.
    ref_q15 = q_encode(iq_ref_pu(k), Q_SCALE, Q_MIN, Q_MAX);
    meas_q15 = q_encode(iq_fixed(k - 1), Q_SCALE, Q_MIN, Q_MAX);
    err_q15 = sat16(int32(ref_q15) - int32(meas_q15), Q_MIN, Q_MAX);

    [vq_q15, integ_q15] = pi_fixed_step(err_q15, kp_q15, ki_q15, integ_q15, Q_FRAC, Q_MIN, Q_MAX);
    vq_fixed(k) = q_decode(vq_q15, Q_SCALE);

    % Plant remains floating point here, but the controller output is fixed point.
    iq_fixed(k) = iq_fixed(k - 1) + plant_alpha * (vq_fixed(k) - iq_fixed(k - 1));
end

iq_error_pu = iq_float - iq_fixed;
fprintf("Max float-vs-fixed current error = %.6f pu = %.3f A\n\n", ...
    max(abs(iq_error_pu)), max(abs(iq_error_pu)) * base_current_A);

figure("Name", "Fixed-point PI current loop");
subplot(3, 1, 1);
plot(t, iq_ref_pu, "k--", t, iq_float, "b", t, iq_fixed, "r:");
grid on;
ylabel("i_q (pu)");
legend("ref", "float", "fixed", "Location", "best");
title("Current-loop PI: floating point vs Q1.15 fixed point");

subplot(3, 1, 2);
plot(t, vq_float, "b", t, vq_fixed, "r:");
grid on;
ylabel("v_q cmd (pu)");
legend("float", "fixed", "Location", "best");

subplot(3, 1, 3);
plot(t, iq_error_pu * base_current_A);
grid on;
xlabel("time (s)");
ylabel("error (A)");

%% Clarke/Park transform check
theta = linspace(0, 2*pi, 800);
phase_amp_pu = 0.45;

ia = phase_amp_pu * cos(theta);
ib = phase_amp_pu * cos(theta - 2*pi/3);
ic = phase_amp_pu * cos(theta + 2*pi/3);

[i_alpha, i_beta] = clarke_float(ia, ib);
[id_float, iq_float_tr] = park_float(i_alpha, i_beta, theta);

[id_fixed, iq_fixed_tr] = park_q15_demo(ia, ib, theta, Q_SCALE, Q_FRAC, Q_MIN, Q_MAX);

figure("Name", "Clarke/Park transform check");
subplot(2, 1, 1);
plot(theta, id_float, "b", theta, id_fixed, "r:");
grid on;
ylabel("i_d (pu)");
legend("float", "fixed", "Location", "best");
title("Park transform output for balanced 3-phase current");

subplot(2, 1, 2);
plot(theta, iq_float_tr, "b", theta, iq_fixed_tr, "r:");
grid on;
xlabel("electrical angle (rad)");
ylabel("i_q (pu)");
legend("float", "fixed", "Location", "best");

%% PWM-center sample strobe timing
pwm_period_counts = 5000;
counter = 0:(2*pwm_period_counts - 1);
updown_counter = [0:(pwm_period_counts - 1), pwm_period_counts:-1:1];
sample_strobe = updown_counter == pwm_period_counts;
duty_a = 0.62;
compare_a = round(duty_a * pwm_period_counts);
pwm_a = updown_counter < compare_a;

figure("Name", "PWM-center sample timing");
stairs(counter, updown_counter, "Color", [0.2 0.2 0.2]);
hold on;
stairs(counter, pwm_a * pwm_period_counts, "b");
stem(counter(sample_strobe), updown_counter(sample_strobe), "r", "filled");
grid on;
xlabel("clock count");
ylabel("counter / PWM");
legend("center-aligned counter", "PWM A", "sample strobe", "Location", "best");
title("Current sample strobe at PWM center");

%% Local helper functions
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

function [out, integ_next] = pi_float_step(err, kp, ki, integ)
    integ_candidate = integ + ki * err;
    unsat = kp * err + integ_candidate;
    out = min(max(unsat, -0.95), 0.95);

    pushing_high = (out >= 0.95) && (err > 0);
    pushing_low = (out <= -0.95) && (err < 0);
    if pushing_high || pushing_low
        integ_next = integ;
    else
        integ_next = integ_candidate;
    end
end

function [out_q15, integ_next_q15] = pi_fixed_step(err_q15, kp_q15, ki_q15, integ_q15, q_frac, q_min, q_max)
    p_q15 = q_mul_q15(err_q15, kp_q15, q_frac, q_min, q_max);
    i_step_q15 = q_mul_q15(err_q15, ki_q15, q_frac, q_min, q_max);

    integ_candidate = sat16(int32(integ_q15) + int32(i_step_q15), q_min, q_max);
    unsat = sat16(int32(p_q15) + int32(integ_candidate), q_min, q_max);

    out_limit = int32(round(0.95 * 2^q_frac));
    out_q15 = int32(min(max(unsat, -out_limit), out_limit));

    pushing_high = (out_q15 >= out_limit) && (err_q15 > 0);
    pushing_low = (out_q15 <= -out_limit) && (err_q15 < 0);
    if pushing_high || pushing_low
        integ_next_q15 = integ_q15;
    else
        integ_next_q15 = integ_candidate;
    end
end

function [alpha, beta] = clarke_float(ia, ib)
    alpha = ia;
    beta = (ia + 2 .* ib) ./ sqrt(3);
end

function [id, iq] = park_float(alpha, beta, theta)
    id = alpha .* cos(theta) + beta .* sin(theta);
    iq = -alpha .* sin(theta) + beta .* cos(theta);
end

function [id, iq] = park_q15_demo(ia, ib, theta, scale, q_frac, q_min, q_max)
    one_over_sqrt3_q15 = q_encode(1 / sqrt(3), scale, q_min, q_max);
    n = numel(theta);
    id = zeros(1, n);
    iq = zeros(1, n);

    for idx = 1:n
        ia_q15 = q_encode(ia(idx), scale, q_min, q_max);
        ib_q15 = q_encode(ib(idx), scale, q_min, q_max);

        alpha_q15 = ia_q15;
        beta_sum_q15 = sat16(int32(ia_q15) + 2 * int32(ib_q15), q_min, q_max);
        beta_q15 = q_mul_q15(beta_sum_q15, one_over_sqrt3_q15, q_frac, q_min, q_max);

        cos_q15 = q_encode(cos(theta(idx)), scale, q_min, q_max);
        sin_q15 = q_encode(sin(theta(idx)), scale, q_min, q_max);

        alpha_cos = q_mul_q15(alpha_q15, cos_q15, q_frac, q_min, q_max);
        beta_sin = q_mul_q15(beta_q15, sin_q15, q_frac, q_min, q_max);
        alpha_sin = q_mul_q15(alpha_q15, sin_q15, q_frac, q_min, q_max);
        beta_cos = q_mul_q15(beta_q15, cos_q15, q_frac, q_min, q_max);

        id_q15 = sat16(int32(alpha_cos) + int32(beta_sin), q_min, q_max);
        iq_q15 = sat16(-int32(alpha_sin) + int32(beta_cos), q_min, q_max);

        id(idx) = q_decode(id_q15, scale);
        iq(idx) = q_decode(iq_q15, scale);
    end
end
