set script_dir [file dirname [file normalize [info script]]]
set rtl_dir [file join $script_dir "rtl"]
set synth_dir [file join $script_dir "synth"]
set out_dir [file join $script_dir "synth_foc_wrapper_pipelined_out"]
set part_name "xc7z010clg400-1"

file mkdir $out_dir

read_verilog -sv [list \
    [file join $rtl_dir "adc_current_scaler_q15.sv"] \
    [file join $rtl_dir "sincos_lut_q15.sv"] \
    [file join $rtl_dir "clarke_park_transform.sv"] \
    [file join $rtl_dir "pi_controller_q15.sv"] \
    [file join $rtl_dir "inverse_park_transform.sv"] \
    [file join $rtl_dir "alpha_beta_to_duty.sv"] \
    [file join $rtl_dir "foc_current_loop_top.sv"] \
    [file join $synth_dir "foc_synth_wrapper.sv"] \
]

read_verilog [list \
    [file join $rtl_dir "phase_current_limit_monitor.v"] \
    [file join $rtl_dir "phase_current_balance_monitor.v"] \
    [file join $rtl_dir "pcb_disable_control.v"] \
    [file join $rtl_dir "pwm_3phase_center_aligned.v"] \
]

read_xdc [file join $script_dir "foc_synth_clock.xdc"]

synth_design -top foc_synth_wrapper -part $part_name
write_checkpoint -force [file join $out_dir "post_synth.dcp"]
report_utilization -file [file join $out_dir "post_synth_utilization.rpt"]
report_timing_summary -file [file join $out_dir "post_synth_timing_summary.rpt"]

opt_design
place_design
phys_opt_design
route_design

write_checkpoint -force [file join $out_dir "post_route.dcp"]
report_utilization -file [file join $out_dir "post_route_utilization.rpt"]
report_timing_summary -file [file join $out_dir "post_route_timing_summary.rpt"]
report_utilization -hierarchical -file [file join $out_dir "post_route_utilization_hierarchical.rpt"]
report_timing -max_paths 10 -sort_by slack -file [file join $out_dir "critical_paths.rpt"]

puts "FOC_WRAPPER_PIPELINED_IMPL_DONE"
puts "Output directory: $out_dir"
