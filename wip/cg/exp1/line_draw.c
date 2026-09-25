/*
 * line_draw.c
 *
 * Pure, freestanding C — no libc, no libstdc++, no emscripten runtime glue.
 * Compiles straight to a standalone .wasm module with clang's wasm32 target
 * (or emcc in STANDALONE_WASM mode — see build commands at the bottom).
 *
 * Implements the three line-drawing algorithms from line_algorithms.md:
 *   1. draw_line_direct       - y = mx + b, evaluated every step (floating point)
 *   2. draw_line_dda          - Digital Differential Analyzer
 *   3. draw_line_bresenham    - Bresenham's integer decision-parameter algorithm
 *
 * A single RGBA framebuffer is exposed to JavaScript so the host page can
 * blit it straight into a <canvas> via ImageData, with zero libc calls.
 */

/* ---- minimal fixed-width types, no <stdint.h>/<stddef.h> dependency ---- */
typedef unsigned char      u8;
typedef int                i32;
typedef unsigned int       u32;
typedef __SIZE_TYPE__      usize;

/*
 * The algorithms run over a coarse logical grid (not raw screen pixels) so
 * every algorithmic "pixel" is big enough on screen to actually see the
 * staircase/blocky behaviour the notes describe. Each grid cell is CELL x
 * CELL real pixels, drawn with a 1px gap so adjacent cells stay visually
 * distinct instead of blurring into a solid diagonal.
 */
#define GRID_W   96
#define GRID_H   72
#define CELL     10                 /* 64*10 = 640, 48*10 = 480 */
#define CANVAS_W (GRID_W * CELL)
#define CANVAS_H (GRID_H * CELL)

/* RGBA8 framebuffer, laid out row-major, exported to JS by pointer. */
static u8 framebuffer[CANVAS_W * CANVAS_H * 4];

/* -------------------------- tiny helpers -------------------------- */

static i32 iabs(i32 v) {
    return v < 0 ? -v : v;
}

/* Writes one real framebuffer pixel (raw screen coordinates). */
static void set_raw_pixel(i32 x, i32 y, u8 r, u8 g, u8 b, u8 a) {
    if (x < 0 || x >= CANVAS_W || y < 0 || y >= CANVAS_H) return;
    usize idx = ((usize)y * CANVAS_W + (usize)x) * 4;
    framebuffer[idx + 0] = r;
    framebuffer[idx + 1] = g;
    framebuffer[idx + 2] = b;
    framebuffer[idx + 3] = a;
}

/*
 * Writes one *grid cell* (gx, gy) — this is the coordinate space the line
 * algorithms actually think in. Renders as a CELL x CELL block with a 1px
 * gap on the top/left edge, so a run of "pixels" reads as a bar of tiles
 * with visible seams instead of a smooth line.
 */
static void put_pixel(i32 gx, i32 gy, u8 r, u8 g, u8 b, u8 a) {
    if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return;
    i32 px0 = gx * CELL;
    i32 py0 = gy * CELL;
    for (i32 dy = 1; dy < CELL; dy++)
        for (i32 dx = 1; dx < CELL; dx++)
            set_raw_pixel(px0 + dx, py0 + dy, r, g, b, a);
}

/* -------------------------- exported API -------------------------- */

__attribute__((export_name("get_width")))
i32 get_width(void) { return CANVAS_W; }

__attribute__((export_name("get_height")))
i32 get_height(void) { return CANVAS_H; }

/* Logical grid size — JS uses this to clamp the x1/y1/x2/y2 inputs. */
__attribute__((export_name("get_grid_width")))
i32 get_grid_width(void) { return GRID_W; }

__attribute__((export_name("get_grid_height")))
i32 get_grid_height(void) { return GRID_H; }

/* Returns a linear-memory offset JS can read as a Uint8ClampedArray view. */
__attribute__((export_name("get_buffer")))
u8 *get_buffer(void) { return framebuffer; }

/* Full solid-color reset, raw pixels (not grid cells) — no gaps. */
__attribute__((export_name("clear")))
void clear(u8 r, u8 g, u8 b, u8 a) {
    for (i32 y = 0; y < CANVAS_H; y++)
        for (i32 x = 0; x < CANVAS_W; x++)
            set_raw_pixel(x, y, r, g, b, a);
}

/* Draws faint 1px lines at every grid boundary, over whatever is already
 * in the framebuffer, so empty cells still show the grid the algorithms
 * are stepping through. Call right after clear(). */
__attribute__((export_name("draw_grid_lines")))
void draw_grid_lines(u8 r, u8 g, u8 b, u8 a) {
    for (i32 gx = 0; gx <= GRID_W; gx++) {
        i32 x = gx * CELL;
        for (i32 y = 0; y < CANVAS_H; y++) set_raw_pixel(x, y, r, g, b, a);
    }
    for (i32 gy = 0; gy <= GRID_H; gy++) {
        i32 y = gy * CELL;
        for (i32 x = 0; x < CANVAS_W; x++) set_raw_pixel(x, y, r, g, b, a);
    }
}

/*
 * 1) Direct / Incremental method: y = mx + b evaluated every step.
 *    Kept close to the source notes (floating point slope + rounding),
 *    including the staircase-prone rounding the notes describe.
 */
__attribute__((export_name("draw_line_direct")))
void draw_line_direct(i32 x1, i32 y1, i32 x2, i32 y2, u8 r, u8 g, u8 b, u8 a) {
    i32 dx = x2 - x1;
    i32 dy = y2 - y1;

    if (dx == 0) { /* vertical line, |m| = infinity */
        i32 step = (y2 >= y1) ? 1 : -1;
        for (i32 y = y1; ; y += step) {
            put_pixel(x1, y, r, g, b, a);
            if (y == y2) break;
        }
        return;
    }

    float m = (float)dy / (float)dx;
    float bIntercept = (float)y1 - m * (float)x1;

    if (iabs(dx) >= iabs(dy)) {
        i32 step = (x2 >= x1) ? 1 : -1;
        for (i32 x = x1; ; x += step) {
            float yf = m * (float)x + bIntercept;
            put_pixel(x, (i32)(yf + (yf >= 0 ? 0.5f : -0.5f)), r, g, b, a);
            if (x == x2) break;
        }
    } else {
        i32 step = (y2 >= y1) ? 1 : -1;
        for (i32 y = y1; ; y += step) {
            float xf = ((float)y - bIntercept) / m;
            put_pixel((i32)(xf + (xf >= 0 ? 0.5f : -0.5f)), y, r, g, b, a);
            if (y == y2) break;
        }
    }
}

/*
 * 2) DDA: step by 1 in the dominant axis, accumulate the slope in the other.
 *    m (or 1/m) is computed once, then only added — matches the notes.
 */
__attribute__((export_name("draw_line_dda")))
void draw_line_dda(i32 x1, i32 y1, i32 x2, i32 y2, u8 r, u8 g, u8 b, u8 a) {
    i32 dx = x2 - x1;
    i32 dy = y2 - y1;
    i32 steps = (iabs(dx) > iabs(dy)) ? iabs(dx) : iabs(dy);

    if (steps == 0) {
        put_pixel(x1, y1, r, g, b, a);
        return;
    }

    float xInc = (float)dx / (float)steps;
    float yInc = (float)dy / (float)steps;

    float x = (float)x1;
    float y = (float)y1;

    for (i32 k = 0; k <= steps; k++) {
        put_pixel((i32)(x + 0.5f), (i32)(y + 0.5f), r, g, b, a);
        x += xInc;
        y += yInc;
    }
}

/*
 * 3) Bresenham's algorithm: pure integer decision parameter, all octants.
 *    Equivalent to running the |m|<=1 and |m|>1 cased forms from the
 *    notes, merged into one branchless-on-slope loop.
 */
__attribute__((export_name("draw_line_bresenham")))
void draw_line_bresenham(i32 x1, i32 y1, i32 x2, i32 y2, u8 r, u8 g, u8 b, u8 a) {
    i32 dx = iabs(x2 - x1);
    i32 dy = -iabs(y2 - y1);
    i32 sx = (x1 < x2) ? 1 : -1;
    i32 sy = (y1 < y2) ? 1 : -1;
    i32 err = dx + dy;

    i32 x = x1, y = y1;

    for (;;) {
        put_pixel(x, y, r, g, b, a);
        if (x == x2 && y == y2) break;
        i32 e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
    }
}

/*
 * ---------------------------------------------------------------------
 * BUILD (choose one — both produce a freestanding .wasm, no libc/JS glue)
 * ---------------------------------------------------------------------
 *
 * A) clang directly against the wasm32 target (truest "clang-wasm"):
 *
 *    clang --target=wasm32 -O2 -nostdlib \
 *          -Wl,--no-entry -Wl,--export-all -Wl,--allow-undefined \
 *          -o line_draw.wasm line_draw.c
 *
 * B) emscripten in standalone mode (no emscripten JS runtime emitted):
 *
 *    emcc line_draw.c -O2 \
 *         -s STANDALONE_WASM=1 --no-entry \
 *         -s EXPORTED_FUNCTIONS=_get_width,_get_height,_get_grid_width,_get_grid_height,_get_buffer,_clear,_draw_grid_lines,_draw_line_direct,_draw_line_dda,_draw_line_bresenham \
 *         -o line_draw.wasm
 *
 * Either command yields line_draw.wasm, which index.html loads directly
 * with WebAssembly.instantiateStreaming — no libc, no malloc, no printf.
 */
