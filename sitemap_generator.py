import os
import fnmatch

# --- CONFIGURATION ---
OUTPUT_FILENAME = "sitemap.html"
EXCLUDE_DIRS = {'.git', '__pycache__', 'venv', '.idea', '.vscode', 'images', 'pkg', 'Build', 'TemplateData', 'StreamingAssets', 'css', 'icons'}
EXCLUDE_FILES = {OUTPUT_FILENAME, "generate_index.py", "*.obj", "*.mtl", "*.js", "*.wasm", ".gitattributes", "*.json", "*.css", "*.py", "*.txt", "*.zip", "*.otf"}

def is_excluded_file(filename):
    """Checks if a filename matches any exact name or wildcard pattern in EXCLUDE_FILES."""
    for pattern in EXCLUDE_FILES:
        if fnmatch.fnmatch(filename, pattern):
            return True
    return False

def get_icon_class(filename, is_dir):
    """Returns the FontAwesome icon class based on file type or directory."""
    if is_dir:
        return "fa-solid fa-folder"
    
    ext = os.path.splitext(filename)[1].lower()
    if ext == '.html':
        return "fa-brands fa-html5"
    elif ext == '.js':
        return "fa-brands fa-js"
    elif ext in ['.c', '.h', '.cpp', '.hpp', '.cc']:
        return "fa-solid fa-c"
    elif ext in ['.wasm', '.bin', '.exe']:
        return "fa-solid fa-file-code"
    elif ext in ['.obj', '.mtl', '.stl', '.fbx']:
        return "fa-solid fa-file"
    elif ext in ['.jpg', '.webp', '.png', '.gif']:
        return "fa-solid fa-image"
    else:
        return "fa-solid fa-file"

def scan_directory(base_path):
    """Recursively scans the directory and returns a nested tree structure."""
    def _scan(current_path):
        items = []
        excludedDirs = []
        try:
            entries = sorted(os.listdir(current_path))
        except PermissionError:
            return []

        for entry in entries:
            full_path = os.path.join(current_path, entry)
            rel_path = os.path.relpath(full_path, base_path).replace('\\', '/')
            
            if os.path.isdir(full_path):
                if entry in EXCLUDE_DIRS:
                    excludedDirs.append(entry)
                    continue
                children = _scan(full_path)
                items.append({
                    'name': entry,
                    'path': rel_path + '/',
                    'is_dir': True,
                    'children': children
                })
            else:
                if is_excluded_file(entry):
                    continue
                items.append({
                    'name': entry,
                    'path': rel_path,
                    'is_dir': False,
                    'children': []
                })
        print(f"Excluded dirs({base_path}): {excludedDirs}")
        return items

    return _scan(base_path)

def render_tree_html(items):
    """Renders the scanned tree items into recursive HTML list elements."""
    html = "<ul>\n"
    for item in items:
        icon = get_icon_class(item['name'], item['is_dir'])
        html += f'    <li>\n'
        html += f'        <a href="{item["path"]}" class="item">\n'
        html += f'            <i class="{icon}"></i>\n'
        html += f'            <span class="name">{item["name"]}</span>\n'
        html += f'        </a>\n'
        
        if item['is_dir'] and item['children']:
            html += render_tree_html(item['children'])
            
        html += f'    </li>\n'
    html += "</ul>\n"
    return html

def generate_html_file():
    current_dir = os.getcwd()
    print(f"Scanning directory: {current_dir} ...")
    tree_data = scan_directory(current_dir)
    
    tree_html_content = render_tree_html(tree_data)
    
    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Directory Layout - {os.path.basename(current_dir)}</title>
    <!-- Include FontAwesome for icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #1e1e1e;
            color: #d4d4d4;
            margin: 0;
            padding: 2rem;
        }}
        .container {{
            max-width: 650px;
            margin: auto;
            background: #252526;
            padding: 1.5rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            border: 1px solid #333;
        }}
        h2 {{
            margin-top: 0;
            color: #4ec9b0;
            font-size: 1.2rem;
            border-bottom: 1px solid #333;
            padding-bottom: 0.5rem;
        }}
        ul {{
            list-style-type: none;
            padding-left: 20px;
            margin: 5px 0;
            position: relative;
        }}
        ul ul::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 6px;
            bottom: 10px;
            width: 1px;
            background: #444;
        }}
        li {{
            margin: 6px 0;
            position: relative;
            line-height: 1.5;
        }}
        .item {{
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 3px 6px;
            border-radius: 4px;
            text-decoration: none;
            color: inherit;
            transition: background 0.2s, color 0.2s;
        }}
        .item:hover {{
            background: #2a2d2e;
            color: #ffffff;
        }}
        .fa-folder {{ color: #dcb67a; }}
        .fa-brands.fa-html5 {{ color: #e34f26; }}
        .fa-brands.fa-js {{ color: #f7df1e; }}
        .fa-solid.fa-c {{ color: #00599c; }}
        .fa-file-code {{ color: #519aba; }}
        .fa-file {{ color: #9cdcfe; }}
        .name {{
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.95rem;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h2><i class="fa-solid fa-folder-tree"></i> Project Directory: {os.path.basename(current_dir)}</h2>
        {tree_html_content}
    </div>
</body>
</html>
"""

    with open(OUTPUT_FILENAME, "w", encoding="utf-8") as f:
        f.write(html_template)
        
    print(f"Successfully generated {OUTPUT_FILENAME} (filtered out *.obj files)!")

if __name__ == "__main__":
    generate_html_file()