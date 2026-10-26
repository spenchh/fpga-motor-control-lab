# FPGA Motor Control Lab

Illustrated engineering documentation for Spencer Kogoma's SURG fixed-point FOC current loop. The chapters cover motor physics, coordinate transforms, Q1.15 arithmetic, PI control, the PS/PL partition, annotated RTL, PWM, protection, verification, and routed timing.

Start with [Start from zero](https://spenchh.github.io/fpga-motor-control-lab/#/start). The 22-chapter handbook includes a beginner reading order, reproducible commands, a complete numerical walkthrough, design tradeoffs, project history, and self-check questions. You can run the digital experiments without an FPGA board.

- [Website](https://spenchh.github.io/fpga-motor-control-lab/)
- [Design and verification](https://github.com/spenchh/FPGA-foc-motor-control)
- [Team hardware and models](https://github.com/pmadaan1/SURG-2026)

## Recorded results

The XC7Z010 reduced-I/O implementation wrapper met a 100 MHz clock constraint with +0.557 ns setup slack, zero TNS, and +0.034 ns worst hold slack. The current design revision passes 13 directed Icarus testbenches. Physical motor operation is not established by these results. Team Cora constraints and Simulink artifacts are documented separately from the earlier wrapper run.

The 26 October 2026 review reconciled the Drive proposal, FPGA notes, component sheets, meeting notes and August options review with the current RTL. The latest portable regression was rerun successfully. Earlier motor, sensor, board and modulation choices are identified in the [source history](https://spenchh.github.io/fpga-motor-control-lab/#/history). Team repository links retain their archived provenance; that repository could not be reopened during this review.

## Run and check

```text
node tools/serve.mjs 8080
node tools/check-docs.mjs
```

Open http://localhost:8080. The site uses relative assets and hash routes, including on GitHub Pages. Navigation, search, source explanations, figures, and documentation answers work without a server API.

## Sources

`assets/js/source-data.js` embeds 27 unmodified design/test/wrapper sources pinned to the design repository commit, with SHA-256 digests and permanent GitHub links. `assets/evidence/` preserves timing/utilization reports and a regression summary. The code explorer annotates those sources without changing the design files.

```text
node tools/sync-sources.mjs /path/to/FPGA-foc-motor-control
```

The synchronization tool refreshes source snapshots and runs the RTL regression before writing. It requires Icarus, Python, and the source checkout. Existing historical timing reports stay unchanged. To import an already prepared report set explicitly, add `--evidence-dir /path/to/normalized-reports`; that directory must contain `before-timing.rpt`, `after-timing.rpt`, `utilization.rpt`, `implementation.tcl`, and `clock.xdc`. Review imported reports for private machine paths first. Documentation changes alone do not require refreshing the source snapshot.

The design repository now has a README, `docs/REPRODUCING.md`, `docs/KNOWN_LIMITATIONS.md`, an optional VCD trace helper, and a portable wrapper implementation script. The HDL snapshots remain pinned to the unchanged design revision. A new wrapper route requires Vivado and is distinct from the archived result.

The optional existing `/api/chat` endpoint uses the Vercel AI SDK when credentials are configured; otherwise the assistant returns concise local project facts with source links. `AI_MODEL` can override the configured model. No credentials or resume contact details are published.
