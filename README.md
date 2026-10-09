# FPGA Motor Control Lab

Interactive documentation, signal maps, PWM/Hall demos, fixed-point explanations,
and a searchable project assistant for Spencer Kogoma's FPGA motor-control project.

Website: https://spenchh.github.io/fpga-motor-control-lab/

Current RTL: https://github.com/spenchh/FPGA-foc-motor-control

## Documentation version

This restores the July/August 2026 website and its reference notes. The older Arty Z7
pin mappings and progress statements describe that snapshot, not the current Cora Z7
board. The current RTL repository has 13 passing directed testbenches. The site's
JavaScript demos illustrate behavior; they are not FPGA simulator output.

The bundled knowledge base preserves the original documentation snapshot. Markdown
and MATLAB reference files support its citations. PCB binaries and meeting documents
are not included. Design RTL remains in the separate hardware repository.

## Run locally

```text
python -m http.server 8080
```

Open http://localhost:8080. GitHub Pages uses the built-in offline assistant.

## Check the assistant

```text
node tools/test-assistant.mjs
```

## Optional server assistant

`npm ci` then `npm run dev` starts the original Node server. Its optional `/api/chat`
endpoint requires an AI Gateway key; without one, the browser uses the local assistant.
No credentials are included in this repository.
