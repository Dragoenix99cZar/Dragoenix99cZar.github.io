## generate_wip.py

```How about "generate_wip.py" with two capabilities; scan and generate. Scan cmd scan the wip folder parse the metadata info and generate wip/project.json. I can then analyze the project.json file and modify it if needed. Generate command take this wip/project.json and create wip/index.html. Separate style.css and app.js like components for reusing purpose.```

### Implemented Architecture

We have modularized the WIP Lab and created [generate_wip.py](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/generate_wip.py) with the exact `scan` and `generate` workflow you requested.

---

### Component Overview

```
wip/
├── project.json      <-- Central data source for all 10 experiments (editable)
├── style.css         <-- Separated Neo-Brutalist design system & card layout
├── app.js            <-- Separated client-side search, filtering, and live counter controller
├── index.html        <-- Clean, generated HTML entry point (reduced from 1,360 to ~620 lines)
└── [project_dirs]/   <-- ad2bs, cg, photo_processor, soft_renderer, etc.

generate_wip.py       <-- CLI generator script with 'scan' and 'generate' commands
```

---

### How the Workflow Works

#### 1. Add a New Project
Create your new project folder inside `wip/` (e.g., `wip/new_ray_tracer/` with an `index.html` and any `.c`, `.wasm`, `.rs` files).

#### 2. Run the `scan` Command
```bash
python generate_wip.py scan
```
- **Discovers new folders**: Detects any unlisted subfolder in [`wip/`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/).
- **Heuristic metadata parsing**:
  - Extracts `<title>` and `<meta name="description">` from `index.html`.
  - Auto-detects tech stack and badges (`.wasm` $\rightarrow$ WebAssembly, `.c`/`.h` $\rightarrow$ C, `.rs`/`Cargo.toml` $\rightarrow$ Rust, `<canvas>`/`.obj`/`.svg` $\rightarrow$ Graphics).
  - Finds all `.html` pages to generate direct launch buttons.
  - Automatically assigns the next sequential ID (`EXP_11`, `EXP_12`, etc.).
- **Safe merging**: Preserves all manual modifications to existing projects in [`wip/project.json`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/project.json).

#### 3. Review / Modify Metadata
Open [`wip/project.json`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/project.json) to tweak the description, architecture notes, vision, or badges as desired.

#### 4. Run the `generate` Command
```bash
python generate_wip.py generate
```
- Reads [`wip/project.json`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/project.json).
- Computes real-time metrics (Total Research Modules, WASM Cores, category filter counts).
- Builds and overwrites [wip/index.html](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/index.html) with clean Neo-Brutalist cards referencing [`wip/style.css`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/style.css) and [`wip/app.js`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/app.js).

---

### Command Quick Reference

| Command | Action |
| :--- | :--- |
| `python generate_wip.py scan` | Scans `wip/`, detects new projects, and updates `wip/project.json`. |
| `python generate_wip.py generate` | Reads `wip/project.json` and renders `wip/index.html`. |
| `python generate_wip.py all` *(or `python generate_wip.py`)* | Runs `scan` first to catch new folders, then immediately runs `generate`. |

---

### Modular Assets Separated

1. **[`wip/style.css`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/style.css)**:
   Contains all Neo-Brutalist CSS variables, typography, hard shadow utilities, header, badges, filter pills, card grids, and responsive layouts.
2. **[`wip/app.js`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/app.js)**:
   Handles real-time search input, category filter buttons, dynamic badge counters, empty search states, and the `/` keyboard shortcut for focusing the search box.
3. **[`wip/project.json`](file:///d:/Work/Repos/my_repo/Dragoenix99cZar.github.io/wip/project.json)**:
   Central JSON schema containing all 10 curated experiments with their descriptions, tech stacks, architecture callouts, vision roadmaps, and launch links.