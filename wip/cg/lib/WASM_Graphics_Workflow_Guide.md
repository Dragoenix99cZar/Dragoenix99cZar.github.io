# Standalone WebAssembly Graphics Sandbox Workflow Guide

This document details how this modern **Clang + WebAssembly (WASM) + HTML5 Canvas** workflow replaces outdated environments like **Turbo C (`graphics.h`)** for practicing core computer graphics algorithms.

---

## 1. The Legacy Problem: Turbo C and `graphics.h`

For decades, academic courses have relied on **Turbo C/C++** (a 1989 IDE) running inside emulators like DOSBox to teach foundational computer graphics using the `<graphics.h>` library. This introduces several friction points:

* **16-bit Architecture Realities:** Turbo C operates in a 16-bit real-mode environment. You have to handle segmented memory pointer boundaries (`near` vs `far`) and strict RAM limits that have nothing to do with modern software engineering.
* **Obsolete Driver Setup:** Initializing execution graphics pipelines requires manual configurations like `int gd = DETECT, gm; initgraph(&gd, &gm, "C:\\TURBOC3\\BGI");`. If the pathing configuration breaks, compilation fails completely.
* **Flaky Emulation Layers:** Running DOSBox introduces input lag, slow compile-and-run cycles, and complex host-to-guest file sharing.

---

## 2. The Modern Solution: Standalone WebAssembly Workflow

This architecture replaces 16-bit emulation with a **shared-memory rendering pipeline** using standard build systems directly inside modern web browsers.

```
       +-------------------------------------------------------------+
       |                  WebAssembly Linear Memory                  |
       |  [ R, G, B, A, R, G, B, A, R, G, B, A, ... 76,800 bytes ]   |
       +-------------------------------------------------------------+
              ^                                              |
      Direct Pointers                                Zero-Copy Read
              |                                              v
+---------------------------+                 +------------------------------+
|     Pure C Algorithms     |                 |  JavaScript / HTML5 Canvas   |
|   (Bresenham, DDA, etc.)  |                 |     (putImageData Layer)     |
+---------------------------+                 +------------------------------+
```

### Direct Parity Comparison

| Concept | Old Way (`graphics.h` / Turbo C) | Modern Sandbox Way (WASM + Canvas) |
| :--- | :--- | :--- |
| **Pixel Target** | Monolithic hardware frame buffers | Flattened standard RGBA 1D array (`u8 pixel_buffer[]`) |
| **Drawing Node** | System call routine `putpixel(x, y, color)` | Inlined custom memory assignment: `buffer[idx] = val` |
| **Compilation** | Obsolete Borland 16-bit compiler | Industry-standard **Clang** targeting `wasm32` |
| **Runtime Target** | 16-bit DOS Simulator (DOSBox) | Native WebAssembly engine inside any modern web browser |

---

## 3. How This Enhances Algorithm Practice

This configuration removes system abstraction layers, leaving you with just **math, logic, and a raw pixel matrix**.

### A. Deep Understanding of Frame Buffers
In `<graphics.h>`, `putpixel()` is a black box. In this workflow, you learn how software actually talks to modern screens: by calculating 1D array indexes from 2D coordinates:
$$	ext{Index} = (y 	imes 	ext{WIDTH} + x) * 4$$
You gain a practical understanding of color channel layouts (Red, Green, Blue, Alpha bytes sequential in memory), which is the base configuration for textures in OpenGL, Vulkan, and DirectX.

### B. Hardware-Accurate Grid Simulation
By compiling code at a low resolution (like $160 	imes 120$) and scaling it crisp via CSS (`image-rendering: pixelated`), you get a microscopic view of algorithm steps. You can easily spot:
* The precision differences between **DDA floating-point accumulation** and **Bresenham's pure integer error bounds**.
* Visual stair-casing (aliasing) patterns in real-time.
* Structural coordinate reflections in **8-way circle symmetry loops**.

### C. Immediate Feedback Loops
* **No Emulators:** Edit code in modern editors (VS Code, Vim), hit compile, and refresh your web tab.
* **Dynamic Parameter Testing:** Tweak values like line thickness or switch algorithms instantly using native HTML UI controls without restarting your program application.

---

## 4. Quick Compilation Cheat-Sheet

To practice, write raw algorithms using standard types (`i32`, `u8`) in your C file, and export them directly via your build string:

```bash
clang --target=wasm32 \
      -O3 \
      -nostdlib \
      -fno-builtin \
      -Wl,--no-entry \
      -Wl,--export=get_buffer_ptr \
      -Wl,--export=clear_screen \
      -Wl,--export=draw_line_bresenham \
      -Wl,--export=draw_circle_bresenham \
      -o engine.wasm engine.c
```
