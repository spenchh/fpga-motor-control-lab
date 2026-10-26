# Site structure

The public site is a sequential engineering walkthrough. The overview describes the controller, its control path, research scope, and recorded results. Detailed math, code, and tool results live in their corresponding chapters.

| File | Responsibility |
| --- | --- |
| `index.html` | Responsive documentation shell |
| `assets/css/lab.css` | Light/dark design and responsive layout |
| `assets/js/handbook.js` | Chapters, equations, module explanations, citations |
| `assets/js/learning-guide.js` | Beginner path, reproduction steps, worked example, decisions, history and study checks |
| `assets/js/models.js` | Canvas figures and interactive controls |
| `assets/js/source-data.js` | Generated, pinned source snapshots and digests |
| `assets/js/lab.js` | Routes, search, source explorer, local answers, optional streaming API |
| `assets/evidence/` | Implementation reports and regression output |
| `assets/images/` | Team schematic images with provenance in the chapters |
| `tools/check-docs.mjs` | Content, provenance, math, and source coverage checks |
| `tools/browser-check.cjs` | Desktop/mobile visual and interaction checks |

The figures calculate documented equations. They are labeled explanatory models and do not substitute for HDL traces. Each physical or timing claim identifies its board/revision and evidence. Pinned source links keep code explanations reproducible as the design repository changes. The 22 chapters are searchable, and native disclosure controls reveal self-check answers. Study checkboxes persist only in the reader's browser.

The source review date is 26 October 2026. A fresh Icarus run passed all 13 existing tests. The walkthrough's settled duty counts (500, 527, 472) were checked from an integrated-test VCD. The source synchronization helper no longer depends on a machine-specific Windows folder. A normal refresh preserves the historical Vivado reports.

Old URL hashes map to the relevant current chapters. The previous prose corpus and planning material were removed from the public site. Local research originals remain in the SURG workspace and Git history preserves prior website versions.
