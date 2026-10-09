# SURG 2026 — FPGA Motor Controller Documentation Site

Interactive technical documentation for the SURG 2026 FPGA-based field-oriented
motor controller. Built so that someone with no background in the project can
read the site start to finish and be caught up on the PCB, the RTL, the MATLAB /
FOC math, the Vivado path, and everything that is still unresolved.

Static site. No build step, no dependencies, no network access at runtime.

---

## Running it locally

The site must be served over HTTP rather than opened as a `file://` URL, because
browsers block some behaviour on local files. Any static server works.

**Python** (installed on this machine):

```bash
python -m http.server 8080
```

**Node** (also installed):

```bash
npx serve -l 8080
```

Run either from the repo root, then open <http://localhost:8080>.

---

## Deploying to GitHub Pages

`index.html` and `assets/` live at the repo root, which is exactly what Pages'
branch source expects. No build step and no Actions workflow are involved.

To switch it on:

1. The repo must be **public**, unless the account has GitHub Pro/Team — Pages
   does not publish from private repos on the free plan.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch.**
3. Set the branch to **`main`** and the folder to **`/ (root)`**, then Save.

It goes live at `https://<user>.github.io/<repo>/` a minute or so later.

Nothing in the site needs to change for this. Every asset path is relative and
routing is hash-based (`#/overview`), so the site works unmodified whether it is
served from a domain root or from a project subpath, and Pages needs no rewrite
rules for deep links.

---

## What's in it

| Section | Covers |
|---|---|
| **1 · Project Overview** | What the project is, why an FPGA, my role, current state, what's unknown |
| **2 · System Architecture** | Battery → power board → driver board → Arty Z7 → motor, the PS/PL split, tool flow |
| **3 · PCB Interface** | Headers and board interface, chip roles, four signal paths, six netlist red flags |
| **4 · Signal Map** | All 17 nets crossing the connector, filterable by direction and type, plus the divider calculator |
| **5 · FPGA / RTL** | Every module and testbench, port tables, interactive PWM / Hall / DISABLE / current models |
| **6 · MATLAB / FOC Math** | Fixed point and Q-format, Clarke / Park / inverse Park, PI loop, duty generation |
| **7 · FOC Strategy** | Six-step vs Hall-assisted vs encoder vs sensorless, and why Hall-assisted is the near-term path |
| **8 · Vivado Starter Guide** | Interactive flow checklist, project setup, XDC explanation, what's missing before a bitstream |
| **9 · Software & Tools** | MATLAB, Simulink, HDL Coder, Vivado, Verilog, Zynq, Arty Z7, Altium, Git, SimpleFOC, TI parts |
| **10 · Open Questions** | 16 tracked items with owner, severity, what each blocks, and a ready-to-send question |
| **11 · Timeline** | What happened in order, including the three assumptions that turned out wrong |
| **12 · Resource Library** | 129 categorised links, official docs preferred, videos marked |
| **13 · Glossary** | 25 terms, also available as hover popovers throughout the site |

Plus a **project assistant** (bottom-right button) that retrieves from the project
files, quotes them with file and line, and says plainly when it does not know.

---

## File structure

The site sits at the repo root, alongside the project files it documents:

```
index.html                      page shell, nav, search, chat panel
SITE_README.md                  this file
.nojekyll                       stops Pages running the files through Jekyll
assets/
├── css/
│   └── main.css                dark/light themes and all components
├── js/
│   ├── data.js                 structured project data — EDIT THIS FIRST
│   ├── kb.js                   GENERATED retrieval corpus — do not hand-edit
│   ├── content.js              page prose, SVG diagrams, code samples
│   ├── interactive.js          the thirteen canvas/DOM widgets
│   ├── retrieval.js            BM25 search, intent detection, ranking
│   ├── facts.js                curated direct answers + accuracy guards
│   ├── chatbot.js              answer composition and the chat panel
│   └── app.js                  router, search, TOC, glossary, rendering
└── *.svg                       standalone project diagrams (pre-existing)
tools/
├── build-kb.mjs                regenerates assets/js/kb.js from project files
└── test-assistant.mjs          regression suite for the assistant
```

Scripts load in dependency order in `index.html`: `data` → `kb` → `content` →
`interactive` → `retrieval` → `facts` → `chatbot` → `app`. They share one global
scope, so **a top-level name declared twice breaks every script after it**. If the
page goes blank, check the browser console for `already been declared` first.

---

## How the assistant works

The assistant runs in two modes and picks automatically.

**With a model (Vercel):** retrieval runs in the browser, the top passages are posted
to `/api/chat`, and a real model writes the answer over them. Because the model is only
ever handed passages the retriever chose, it cannot cite a source it was not given —
the citations stay deterministic even though the prose is generated.

**Without a model (GitHub Pages, or the API down):** the same retrieval runs, and the
answer is composed from curated sentences and direct quotations. No prose is generated,
so it cannot invent a test result — but it is noticeably more rigid, and an unusual
phrasing will land on the nearest canned answer.

The client tries the model first and falls back silently, so both deployments work.

### Turning the model on

1. Deploy to Vercel (`vercel link`, then `vercel --prod`). The `api/` directory is
   detected automatically; there is no build step.
2. Create an **AI Gateway API key** in the Vercel dashboard.
3. Add it as an environment variable: `vercel env add AI_GATEWAY_API_KEY`
   (or set it under Project → Settings → Environment Variables).
4. Redeploy. On Vercel you can skip the key entirely if OIDC is enabled.

The model is set by `MODEL` at the top of `api/chat.js` (currently
`anthropic/claude-sonnet-5`). Fetch the current list with
`curl -s https://ai-gateway.vercel.sh/v1/models` before changing it — do not guess IDs.

The GitHub Pages copy can also use the Vercel API: its origin is already in the CORS
allow-list in `api/chat.js`. Set `ALLOWED_ORIGINS` to change that, and point
`AI.endpoint` in `chatbot.js` at the full Vercel URL.

**All the accuracy rules live in the `RULES` string in `api/chat.js`** — that nothing
has been simulated or tested, that the PCB is not signed off, that Hall-assisted is the
near-term path and sensorless is not, that 3PWM is not a new decision, that Halls give
60-degree resolution rather than a precise angle. Edit them there.

### Running locally with the model

```bash
AI_GATEWAY_API_KEY=... node tools/serve.mjs 8080
```

`tools/serve.mjs` runs `api/chat.js` at `/api/chat` using the same handler Vercel uses,
so both paths are testable locally. Without a key it returns 503, which is exactly the
signal the client uses to fall back — so the offline path is testable too.

**Three layers:**

1. **`kb.js`** — 372 chunks generated from the real project files. Markdown is cut
   at heading boundaries, Verilog at module/port/`always`-block boundaries, MATLAB
   at `%%` cells or `cfg.<group>` runs. Every chunk carries its source file, heading,
   line range, topics, confirmed/inferred/open status, source tier and last-updated date.
2. **`retrieval.js`** — BM25 with heading terms weighted 3×, plus phrase matching on
   multi-word project terms. Ranking is tiered exactly as the project requires:
   project files, then datasheets, then official docs, then application notes, with
   video last and treated as a learning aid. Superseded notes are pushed far down.
   It also extracts the individual *sentences* that answer the question.
3. **`facts.js`** — curated direct answers. Each has a `short` (the one-line answer,
   always shown first) and a longer `a` (collapsed under "Full detail"). Entries with
   a `must` pattern win outright — that is how the accuracy rules are enforced, so
   "has anything been simulated" can never be answered by a passage that merely
   discusses simulation.

**Every answer has the same shape:** direct answer → Confirmed/Inferred/Open counts
→ quoted evidence with file and line → full detail (collapsed) → sources used
(collapsed, split into project files vs general background) → follow-up questions.

### Rebuilding the knowledge base

`kb.js` is generated. After editing any project note, RTL file or MATLAB script:

```bash
node tools/build-kb.mjs      # regenerate assets/js/kb.js
node tools/test-assistant.mjs # 23 answer cases + corpus sanity checks
```

Add a new source file to the `MD_FILES`, `RTL_FILES`, `TB_FILES` or `M_FILES` lists
at the top of `build-kb.mjs`, and give it a site page in `PAGE_FOR`. Notes describing
an older board revision belong in `SUPERSEDED` so they stay searchable for "what
changed" without polluting "what is".

### Changing what the assistant says

- **A wrong or missing direct answer** → edit the `short` field in `facts.js`.
- **An answer that must never drift** → give the entry a `must` pattern.
- **A fact the assistant cannot find** → it is a gap in the project files, not in the
  code. Write it in the source note and rebuild.

### Where to make changes

**Adding a fact, a signal, a question, a link, or a glossary term** → `data.js`.
It holds `SIGNALS`, `RTL_MODULES`, `TESTBENCHES`, `QUESTIONS`, `TIMELINE`,
`GLOSSARY`, `LINKS` and `LEARNING_ORDER` as plain arrays. The tables, cards,
timeline, glossary and search index all build themselves from these, so adding an
entry is a one-line change that shows up everywhere.

**Adding or rewriting a page** → `content.js`. Pages live in the `PAGES` object,
keyed by their URL id. Add the id to `NAV` in `data.js` and it appears in the
sidebar, breadcrumbs, pager and search automatically.

**Adding an interactive model** → `interactive.js`. Register it as
`WIDGETS.myname = function (host) { ... }`, then place it in a page with
`widget('myname', 'Title', 'note')`.

**Teaching the assistant something** → `chatbot.js`. Add an entry to `KB` with
`k` (trigger keywords), `a` (answer HTML), `c` (citations) and `p` (page link).

---

## Content conventions

These are deliberate and worth preserving if you edit the site.

### Status badges

Every technical claim carries one:

- **Confirmed** — read directly from a project file or a vendor datasheet
- **Assumption** — a reasoned inference, not yet verified against the source
- **Open** — an unanswered question
- **Blocker** — an open item that stops downstream work

### Citations

Facts cite their source. Local project files appear as `code` spans; vendor
documentation links out. The `cite()` helper in `content.js` handles both from
the `SRC` registry in `data.js`.

### Accuracy rules the site follows

These were requirements, not preferences:

1. **No invented testing.** Nothing on the site claims the RTL compiled, that a
   simulator ran, or that hardware was tested — because none of that has
   happened. `vivado`, `xvlog`, `xelab`, `iverilog` and `verilator` were all
   absent from PATH when this was checked.
2. **Interactive models are labelled as models.** Every widget re-implements
   documented behaviour in JavaScript. Each is marked "Interactive model" and
   none is presented as simulator output.
3. **Netlist extraction is not visual DRC.** The PCB findings are stated as
   things to check in Altium, not as proven defects.
4. **Generated diagrams are labelled.** Every SVG carries "Generated explanatory
   diagram" in its caption.
5. **Three duty commands stays the control model** while the six physical HI/LO
   outputs are explained as the pin-level mapping. 3PWM is not framed as a new
   decision.
6. **Hall-assisted FOC is the near-term direction**; sensorless FOC is presented
   as future research with its prerequisites listed.

---

## Source material

Built from these local project files:

| File | Used for |
|---|---|
| `PCB_CROSSCHECK_2026-08-05.md` | The primary source. Netlist extraction, signal map, red flags. |
| `FPGA_KNOWN_INFO_2026-08-05.md` | RTL status, PS/PL split, open questions, Vivado status |
| `FPGA_TODO.md` | Work plan and PCB-team questions |
| `README.md` | Board interface summary |
| `SURG_FPGA_FOC.md` | Datasheet research log, platform comparison |
| `UPDATED_DRIVER_BOARD_REVIEW_2026-08-03.md` | History — marked superseded |
| `FPGA_BOARD_INTERFACE_2026-07-29.md` | History — describes the old board, superseded |
| `fpga/rtl/*.v` · `fpga/tb/*.v` | Port tables, behaviour descriptions, code samples |
| `matlab/*.m` · `board_interface_check_LAST_RUN.txt` | FOC math, Q-format, recorded run output |
| `DriverBoard.SchDoc` · `ActualDriverBoard.PcbDoc` · `HV Motor Driver.BomDoc` | Source of the parsed netlist |

Vendor documentation cited throughout: TI (UCC21222, AMC1300, AMC1311,
OPA4388), Digilent (Arty Z7), AMD/Xilinx (Zynq TRM, XADC UG480, Vivado guides),
MathWorks (FOC, Clarke/Park, HDL Coder, fixed point), SimpleFOC, Tektronix,
Keysight and Altium.

---

## Browser support

Modern evergreen browsers. Uses `color-mix()`, `:has()`, CSS custom properties,
`IntersectionObserver` and Canvas 2D. Respects
`prefers-color-scheme` on first load and `prefers-reduced-motion` for scrolling.
Theme choice and checklist progress persist in `localStorage`.

## Accessibility

Skip link, keyboard-navigable search (`/` to focus, arrows to move, Enter to
open), ARIA labelling on controls, visible focus rings, and `role="img"` with
descriptive labels on every diagram. Glossary popovers open on focus as well as
hover.

---

## What changed in this revision

**The assistant was rebuilt.** It previously stored 33 hand-written topic essays
and printed whichever one matched best, in full. There was no unit of information
smaller than a topic, so "Is DISABLE active high?" and "Explain the DISABLE line"
returned the identical block of text. That is what made it feel generic. It now
retrieves from the project files and leads with the specific answer.

- Added `tools/build-kb.mjs`, `assets/js/kb.js` (372 chunks), `assets/js/retrieval.js`,
  `assets/js/facts.js`, and `tools/test-assistant.mjs`
- Answers now cite the exact file and line, and split Confirmed / Inferred / Open
- Six answer modes: Quick, Explain like I'm new, FPGA implementation, PCB cross-check,
  MATLAB/FOC math, Meeting update
- Per-answer confidence, a "Sources used" disclosure separating project files from
  general background, copy-answer, and page-aware follow-up questions
- An honest fallback when nothing relevant is found

**New page:** Signal Map (`#/signals`) — all 17 nets, filterable by direction and type.

**New interactive models:** voltage-divider calculator, clickable PS/PL partition,
and a Vivado flow checklist that separates unblocked steps from blocked ones.

**UI:** quick-navigator cards on the overview, `Needs PCB team` / `Ready for simulation`
/ `Inferred` badges, and `updated <date>` tags on dated claims.

### Bugs found and fixed while building this

- `"simulated"` stemmed to `simulat` but `"simulation"` did not, so the note recording
  that nothing has ever been run was unreachable by the obvious question
- Confidence reported 100% on a score of 4.2 with one term matched; it now weights how
  much of the question the winning chunk actually covers
- An off-topic question ("airspeed velocity of an unladen swallow") returned a MathWorks
  note about velocity control instead of declining
- `content.js` already declared `esc`; `chatbot.js` declaring it as a function was a
  `SyntaxError` that silently broke every script loaded after it
- The old `site/README.md` said to point GitHub Pages at the `/site` folder. Pages only
  serves from `/` or `/docs`, so that instruction could never have worked

---

## Limitations — read before trusting this

**On GitHub Pages the assistant does not generate text.** Static hosting has no
backend, so that copy retrieves and quotes only. It is honest but rigid: an unusual
phrasing lands on the nearest canned answer. The Vercel deployment runs a real model
over the same retrieved passages and does not have this limitation.

**A model can still be wrong.** It is constrained by the passages it is handed and by
the rules in `api/chat.js`, and it is told to say when something is unsettled — but it
is not incapable of error. The citations under each answer are the reliable part: those
come from the retriever, not the model. Check them for anything that matters.

**Retrieval is lexical, not semantic.** BM25 plus phrase matching and a synonym table.
A question phrased with vocabulary that appears nowhere in the project files may miss
even when the answer is present. Adding a term to `ALIAS` in `retrieval.js` is the fix.

**Chunk status is inferred, not authored.** Confirmed / Inferred / Open is derived from
heading wording and inline markers such as `TODO` and `NaN`. It is usually right and
occasionally coarse. The badges on the written pages are hand-authored and more reliable.

**Altium files are not parsed by this site.** The board facts come from
`PCB_CROSSCHECK_2026-08-05.md`, which records an earlier netlist extraction. Treat that
as a text extraction, never as visual DRC, layout or symbol verification — the suspected
OPA4388 pin-mapping problem is exactly the kind of defect a netlist read cannot settle.

**Nothing has been simulated or tested.** Six RTL modules and six testbenches exist and
no simulator has executed them. The PCB has not been fabricated. Every interactive model
on the site is a JavaScript reimplementation of described behaviour, written to explain
the intent — not simulator output, and not evidence that the RTL does this.
