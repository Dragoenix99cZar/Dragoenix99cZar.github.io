#!/usr/bin/env python3
"""
generate_wip.py - WIP Lab Registry Generator

Provides two core capabilities:
  1. scan:     Inspects the 'wip/' directory, auto-discovers subprojects, parses
               their metadata, and updates 'wip/project.json'.
  2. generate: Reads 'wip/project.json' and creates/refreshes 'wip/index.html'
               using modular components ('style.css' and 'app.js').

Usage:
  python generate_wip.py scan
  python generate_wip.py generate
  python generate_wip.py all       (or simply: python generate_wip.py)
"""

import os
import sys
import json
import re
import argparse
import subprocess
from datetime import datetime
from pathlib import Path

# Paths configuration
SCRIPT_DIR = Path(__file__).resolve().parent
WIP_DIR = SCRIPT_DIR / "wip"
PROJECT_JSON_PATH = WIP_DIR / "project.json"
INDEX_HTML_PATH = WIP_DIR / "index.html"

# Directories inside wip/ to ignore from scanning
IGNORE_DIRS = {
    ".git", "__pycache__", "venv", ".idea", ".vscode", "node_modules", "pkg"
}


def get_folder_intro_date(folder_path: Path) -> str:
    """Gets the date when the folder was introduced, via git log if available, else filesystem creation/mtime."""
    try:
        rel_path = folder_path.relative_to(SCRIPT_DIR).as_posix()
        res = subprocess.run(
            ["git", "log", "--reverse", "--format=%as", "--", rel_path],
            cwd=SCRIPT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5
        )
        if res.returncode == 0 and res.stdout.strip():
            first_date = res.stdout.strip().splitlines()[0].strip()
            if re.match(r"^\d{4}-\d{2}-\d{2}$", first_date):
                return first_date
    except Exception:
        pass

    # Fallback to filesystem creation/modification timestamp
    try:
        stat = folder_path.stat()
        # On Windows, st_ctime is the file creation timestamp
        ts = min(stat.st_birthtime, stat.st_mtime)
        return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
    except Exception:
        return datetime.now().strftime("%Y-%m-%d")


def extract_html_metadata(html_path: Path):
    """Extracts title and meta description from an HTML file."""
    if not html_path.exists():
        return "", ""
    try:
        content = html_path.read_text(encoding="utf-8", errors="ignore")
        title_match = re.search(r"<title[^>]*>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else ""

        desc_match = re.search(
            r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']',
            content,
            re.IGNORECASE | re.DOTALL
        )
        desc = desc_match.group(1).strip() if desc_match else ""
        return title, desc
    except Exception:
        return "", ""


def auto_detect_project_metadata(folder_name: str, folder_path: Path, exp_id: str):
    """Heuristically infers project metadata from directory contents for newly added folders."""
    index_html = folder_path / "index.html"
    page_title, meta_desc = extract_html_metadata(index_html)

    # Title cleanup
    title = page_title or folder_name.replace("_", " ").title()
    subtitle = "Experimental Research Prototype"
    if " - " in title:
        parts = title.split(" - ", 1)
        title = parts[0].strip()
        subtitle = parts[1].strip()
    elif " | " in title:
        parts = title.split(" | ", 1)
        title = parts[0].strip()

    description = meta_desc or f"Interactive low-level experimentation and graphics module: {title}."

    # Scan files in directory tree
    files = list(folder_path.glob("**/*"))
    has_wasm = any(f.suffix.lower() == ".wasm" for f in files)
    has_c = any(f.suffix.lower() in [".c", ".h", ".cpp"] for f in files)
    has_rust = any(f.name == "Cargo.toml" or f.suffix.lower() == ".rs" or f.name == "pkg" for f in files)
    has_svg = any(f.suffix.lower() == ".svg" for f in files)
    has_canvas = False

    # Check for canvas in HTML files
    for h in folder_path.glob("*.html"):
        try:
            if "<canvas" in h.read_text(encoding="utf-8", errors="ignore").lower():
                has_canvas = True
                break
        except Exception:
            pass

    # Build badge, tags, and technologies
    technologies = []
    tags = [folder_name.lower().replace("_", "-")]
    categories = []

    badge = "Interactive Prototype"
    badge_class = "badge-primary"

    if has_rust and has_wasm:
        badge = "Rust + WebAssembly"
        badge_class = "badge-rust"
        categories.append("wasm")
        tags.extend(["rust", "wasm"])
        technologies.append({"name": "Rust", "tag_class": "tag-rust"})
        technologies.append({"name": "WebAssembly", "tag_class": "tag-wasm"})
    elif has_c and has_wasm:
        badge = "C + WebAssembly"
        badge_class = "badge-cyan"
        categories.append("wasm")
        tags.extend(["c", "wasm"])
        technologies.append({"name": "C", "tag_class": "tag-c"})
        technologies.append({"name": "WebAssembly", "tag_class": "tag-wasm"})
    elif has_wasm:
        badge = "WebAssembly Core"
        badge_class = "badge-cyan"
        categories.append("wasm")
        tags.append("wasm")
        technologies.append({"name": "WebAssembly", "tag_class": "tag-wasm"})
    elif has_c:
        badge = "C Engine"
        badge_class = "badge-amber"
        tags.append("c")
        technologies.append({"name": "C", "tag_class": "tag-c"})

    if has_canvas or has_svg:
        categories.append("graphics")
        tags.append("graphics")
        if has_canvas:
            technologies.append({"name": "HTML5 Canvas"})
        if has_svg:
            technologies.append({"name": "SVG Vector"})

    if not categories:
        categories.append("algorithms")
        tags.append("algorithms")

    # Links
    links = []
    if index_html.exists():
        links.append({
            "label": f"Launch {title[:18]} →",
            "url": f"{folder_name}/index.html",
            "is_primary": True
        })

    # Search for additional HTML files
    for extra_html in sorted(folder_path.glob("*.html")):
        if extra_html.name != "index.html":
            label = extra_html.stem.replace("_", " ").title() + " ↗"
            links.append({
                "label": label,
                "url": f"{folder_name}/{extra_html.name}",
                "is_primary": False
            })

    return {
        "id": exp_id,
        "folder": folder_name,
        "title": title,
        "subtitle": subtitle,
        "date": get_folder_intro_date(folder_path),
        "badge": badge,
        "badge_class": badge_class,
        "categories": list(dict.fromkeys(categories)),
        "tags": list(dict.fromkeys(tags)),
        "description": description,
        "technologies": technologies,
        "architecture": f"Engineered around modular {folder_name} components, executing direct transformations and client-side processing.",
        "vision": "Provide an accessible first-principles reference and interactive benchmark for web-native systems engineering.",
        "links": links
    }


def scan_wip():
    """Scans wip/ folder, merges with existing project.json, and writes back."""
    if not WIP_DIR.exists():
        print(f"[ERROR] Directory '{WIP_DIR}' not found!")
        return False

    # Load existing projects
    existing_projects = []
    existing_by_folder = {}
    if PROJECT_JSON_PATH.exists():
        try:
            with open(PROJECT_JSON_PATH, "r", encoding="utf-8") as f:
                existing_projects = json.load(f)
            for p in existing_projects:
                if "folder" in p:
                    existing_by_folder[p["folder"]] = p
        except Exception as e:
            print(f"[WARN] Failed to parse existing project.json ({e}). Will re-create.")

    # Discover folders in wip/
    found_subdirs = sorted([
        d.name for d in WIP_DIR.iterdir()
        if d.is_dir() and d.name not in IGNORE_DIRS
    ])

    dir_paths = [
        d for d in WIP_DIR.iterdir()
        if d.is_dir() and d.name not in IGNORE_DIRS
    ]

    sorted_path_names = sorted(dir_paths, key=lambda d: d.stat().st_birthtime)

    final_projects = []
    added_count = 0
    retained_count = 0

    # Determine highest existing EXP_XX number
    max_id = 0
    for p in existing_projects:
        match = re.search(r"EXP_(\d+)", p.get("id", ""))
        if match:
            max_id = max(max_id, int(match.group(1)))

    for folder_name in sorted_path_names:
        folder_path = WIP_DIR / folder_name
        if folder_name in existing_by_folder:
            proj = existing_by_folder[folder_name]
            # Automatically populate date if missing
            if not proj.get("date"):
                proj["date"] = get_folder_intro_date(folder_path)
            final_projects.append(proj)
            retained_count += 1
        else:
            max_id += 1
            new_id = f"EXP_{max_id:02d}"
            new_proj = auto_detect_project_metadata(folder_name.name, folder_path, new_id)
            final_projects.append(new_proj)
            added_count += 1
            print(f"  [+] Discovered new project folder: '{folder_name}' -> Assigned {new_id} ({new_proj.get('date', '')})")

    # Sort projects numerically by EXP ID (EXP_01, EXP_02, etc.)
    def get_sort_key(p):
        match = re.search(r"EXP_(\d+)", p.get("id", ""))
        return int(match.group(1)) if match else 999

    final_projects.sort(key=get_sort_key)

    # Write merged project.json
    with open(PROJECT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(final_projects, f, indent=2, ensure_ascii=False)

    print(f"\n[SCAN COMPLETE]")
    print(f"  • Retained existing project configurations: {retained_count}")
    print(f"  • Newly discovered and registered:        {added_count}")
    print(f"  • Total registered projects:              {len(final_projects)}")
    print(f"  • File saved: {PROJECT_JSON_PATH}")
    print("  TIP: You can inspect and edit 'wip/project.json' directly before running 'generate'.\n")
    return True


def render_project_card(project: dict) -> str:
    """Renders a single project card in Neo-Brutalist HTML."""
    p_id = project.get("id", "EXP_XX")
    date_str = project.get("date", "")
    categories = " ".join(project.get("categories", []))
    tags = " ".join(project.get("tags", []))
    badge = project.get("badge", "Module")
    badge_class = project.get("badge_class", "badge-primary")
    title = project.get("title", "Untitled Project")
    subtitle = project.get("subtitle", "")
    description = project.get("description", "")
    arch = project.get("architecture", "")
    vision = project.get("vision", "")

    date_html = f'<span class="card-date mono" title="Introduced to WIP Lab">📅 {date_str}</span>' if date_str else ""

    # Tech stack items
    tech_html_parts = []
    for t in project.get("technologies", []):
        t_name = t.get("name", "")
        t_class = t.get("tag_class", "")
        cls_attr = f' class="tech-tag {t_class}"' if t_class else ' class="tech-tag"'
        tech_html_parts.append(f'<span{cls_attr}>{t_name}</span>')
    tech_stack_html = "\n              ".join(tech_html_parts)

    # Action buttons
    links_html_parts = []
    for link in project.get("links", []):
        lbl = link.get("label", "Open →")
        url = link.get("url", "#")
        is_primary = link.get("is_primary", False)
        btn_class = "btn btn-launch" if is_primary else "btn btn-sub"
        links_html_parts.append(f'<a href="{url}" class="{btn_class}" target="_blank">{lbl}</a>')
    footer_html = "\n          ".join(links_html_parts)

    return f"""      <!-- {p_id}: {project.get('folder', title)} -->
      <article class="project-card" data-category="{categories}"
        data-tags="{tags}" data-date="{date_str}">
        <header class="card-header">
          <div class="card-top-meta">
            <span class="badge {badge_class}">{badge}</span>
            <div class="card-meta-right">
              {date_html}
              <span class="card-id">{p_id}</span>
            </div>
          </div>
          <h2 class="card-title">{title}</h2>
          <div class="card-subtitle">{subtitle}</div>
        </header>
        <div class="card-body">
          <div class="section-block">
            <div class="section-title">Description</div>
            <p class="section-desc">
              {description}
            </p>
          </div>

          <div class="section-block">
            <div class="section-title">Technologies Used</div>
            <div class="tech-stack">
              {tech_stack_html}
            </div>
          </div>

          <div class="section-block">
            <div class="section-title title-arch">Architecture Overview</div>
            <div class="arch-box">
              {arch}
            </div>
          </div>

          <div class="section-block">
            <div class="section-title title-vision">Vision & Roadmap</div>
            <div class="vision-box">
              {vision}
            </div>
          </div>
        </div>
        <footer class="card-footer">
          {footer_html}
        </footer>
      </article>"""


def generate_index_html():
    """Generates wip/index.html using wip/project.json and modular style.css / app.js."""
    if not PROJECT_JSON_PATH.exists():
        print(f"[ERROR] '{PROJECT_JSON_PATH}' not found. Run 'python generate_wip.py scan' first.")
        return False

    with open(PROJECT_JSON_PATH, "r", encoding="utf-8") as f:
        projects = json.load(f)

    total_modules = len(projects)

    # Compute category & tech metrics
    wasm_count = sum(1 for p in projects if "wasm" in p.get("categories", []) or "wasm" in p.get("tags", []))
    graphics_count = sum(1 for p in projects if "graphics" in p.get("categories", []) or "3d" in p.get("categories", []))
    compilers_count = sum(1 for p in projects if "compilers" in p.get("categories", []))
    algorithms_count = sum(1 for p in projects if "algorithms" in p.get("categories", []))

    sorted_by_date = sorted(projects, key=lambda x: x['date'])

    # Render card blocks
    cards_html_list = [render_project_card(p) for p in reversed(sorted_by_date)]
    cards_html = "\n\n".join(cards_html_list)

    html_template = f"""<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="../images/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description"
    content="Experimental research laboratory showcasing work-in-progress WebAssembly engines, biometric image processing, 3D software rasterizers, compiler pipelines, procedural algorithms, and graphics tools by Aman Karn.">
  <title>WIP Lab & Experimental Systems | Aman Karn</title>

  <!-- Modern Neo-Brutalist Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Space+Grotesk:wght@400;600;700;800&display=swap"
    rel="stylesheet">

  <!-- Modular Stylesheet Component -->
  <link rel="stylesheet" href="style.css">
</head>

<body>

  <!-- Top Navigation Bar -->
  <nav class="top-nav" aria-label="Main Navigation">
    <div class="breadcrumb">
      <a href="../index.html">Portfolio</a>
      <span class="separator">//</span>
      <a href="../sitemap.html">Sitemap</a>
      <span class="separator">//</span>
      <span class="current">WIP Systems Lab</span>
    </div>
    <div class="nav-actions">
      <a href="../index.html" class="btn btn-sub">← Return to Portfolio</a>
    </div>
  </nav>

  <main class="container">

    <!-- Hero Banner -->
    <header class="hero-banner">
      <div class="hero-badge-strip">
        <span class="badge badge-primary">Active Experimental Lab</span>
        <span class="badge badge-cyan">WebAssembly & Low-Level</span>
        <span class="badge badge-amber">Interactive Graphics</span>
        <span class="badge badge-pink">Zero Dependencies</span>
      </div>
      <h1>Work In Progress Systems Registry</h1>
      <p class="lead">
        A curated showcase of experimental prototypes, algorithmic research, 3D software rendering pipelines, compiler
        virtual machines, and WebAssembly implementations engineered from first principles.
      </p>

      <div class="metrics-bar">
        <div class="metric-card">
          <div class="metric-val" id="totalCount">{total_modules}</div>
          <div class="metric-label">Research Modules</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">{wasm_count}</div>
          <div class="metric-label">WebAssembly Cores</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">C / Rust</div>
          <div class="metric-label">Low-Level Backends</div>
        </div>
        <div class="metric-card">
          <div class="metric-val">0</div>
          <div class="metric-label">External Frameworks</div>
        </div>
      </div>
    </header>

    <!-- Filter & Search Toolbar -->
    <section class="toolbar-container" aria-label="Project Controls">
      <div class="search-row">
        <div class="search-input-wrapper">
          <input type="text" id="searchInput" class="search-input"
            placeholder="Search projects by title, keyword, language, or algorithm (e.g., 'WASM', 'Lanczos3', 'Bresenham', 'AST')..."
            aria-label="Search projects">
        </div>
      </div>

      <div class="filter-pills" id="filterPills" role="radiogroup" aria-label="Filter Projects by Category">
        <span class="filter-label">Filter:</span>
        <button class="pill-btn active" data-filter="all">All ({total_modules})</button>
        <button class="pill-btn" data-filter="wasm">WebAssembly ({wasm_count})</button>
        <button class="pill-btn" data-filter="graphics">Graphics & Vision ({graphics_count})</button>
        <button class="pill-btn" data-filter="compilers">Compilers & DSLs ({compilers_count})</button>
        <button class="pill-btn" data-filter="algorithms">Math & Algorithms ({algorithms_count})</button>
      </div>
    </section>

    <!-- Projects Grid -->
    <section class="projects-grid" id="projectsGrid" aria-label="Experimental Projects Showcase">

{cards_html}

      <!-- Empty state when no cards match search -->
      <div class="empty-state" id="emptyState">
        <h3>No Matching Experiments Found</h3>
        <p style="color: var(--text-muted); margin-top: 6px;">Try adjusting your search query or switching to the "All"
          filter.</p>
      </div>

    </section>

  </main>

  <footer>
    <p>Aman Karn | Senior Game & Software Engineer</p>
    <p>
      <a href="../index.html">Main Portfolio</a> •
      <a href="../sitemap.html">Sitemap</a> •
      <a href="https://github.com/Dragoenix99cZar" target="_blank">GitHub</a> •
      <a href="https://linkedin.com/in/aman-karn-c99zar" target="_blank">LinkedIn</a>
    </p>
    <p style="font-size: 0.75rem; margin-top: 10px; color: #505c6e;">
      WIP Systems Registry • Built with pure HTML5, CSS Grid, and WebAssembly.
    </p>
  </footer>

  <!-- Modular Client Controller Component -->
  <script src="app.js"></script>

</body>

</html>
"""

    with open(INDEX_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(html_template)

    print(f"[GENERATE COMPLETE]")
    print(f"  • Successfully rendered {total_modules} project cards into '{INDEX_HTML_PATH}'.")
    print(f"  • Linked modular assets: 'wip/style.css' and 'wip/app.js'.\n")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="WIP Lab Registry Generator (Scan metadata & generate wip/index.html)"
    )
    parser.add_argument(
        "action",
        nargs="?",
        default="all",
        choices=["scan", "generate", "all"],
        help="Command to run: 'scan' (scans wip/ -> updates project.json), 'generate' (reads project.json -> builds index.html), or 'all' (scans then generates, default)"
    )

    args = parser.parse_args()

    if args.action == "scan":
        scan_wip()
    elif args.action == "generate":
        generate_index_html()
    elif args.action == "all":
        print("=== Step 1: Scanning WIP Folders ===")
        if scan_wip():
            print("=== Step 2: Generating WIP Index HTML ===")
            generate_index_html()


if __name__ == "__main__":
    main()
