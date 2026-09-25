#ifndef WASM_GRAPHICS_H
#define WASM_GRAPHICS_H

#define WIDTH 160
#define HEIGHT 120

// Standard Turbo C Color Constants mapped to simple 8-bit values
#define BLACK        0
#define BLUE         1
#define GREEN        2
#define CYAN         3
#define RED          4
#define MAGENTA      5
#define BROWN        6
#define LIGHTGRAY    7
#define DARKGRAY     8
#define LIGHTBLUE    9
#define LIGHTGREEN   10
#define LIGHTCYAN    11
#define LIGHTRED     12
#define LIGHTMAGENTA 13
#define YELLOW       14
#define WHITE        15

// Types required for our standalone environment
typedef int int32_t;
typedef unsigned char uint8_t;
typedef int32_t i32;
typedef uint8_t u8;

// Forward declarations of internal engines defined in engine.c
extern u8 pixel_buffer[WIDTH * HEIGHT * 4];
static i32 iabs(i32 v) { return v < 0 ? -v : v; }

// --- TURBO C COMPATIBILITY FUNCTIONS ---

// 1. Replicates classic putpixel(x, y, color)
static void putpixel(int x, int y, int color) {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        int index = (y * WIDTH + x) * 4;
        
        // Decode the 16 classic colors into RGB profiles
        u8 r = 0, g = 0, b = 0;
        if (color & 4) r = (color & 8) ? 255 : 170;
        if (color & 2) g = (color & 8) ? 255 : 170;
        if (color & 1) b = (color & 8) ? 255 : 170;
        if (color == BROWN) { r = 170; g = 85; b = 0; }
        if (color == DARKGRAY) { r = 85; g = 85; b = 85; }
        if (color == BLACK) { r = 0; g = 0; b = 0; }
        if (color == WHITE) { r = 255; g = 255; b = 255; }

        pixel_buffer[index]     = r;
        pixel_buffer[index + 1] = g;
        pixel_buffer[index + 2] = b;
        pixel_buffer[index + 3] = 255; // Fully opaque
    }
}

// 2. Replicates classic line(x1, y1, x2, y2) using Bresenham's Integer algorithm
static void line(int x1, int y1, int x2, int y2, int color) {
    i32 dx = iabs(x2 - x1);
    i32 dy = -iabs(y2 - y1);
    i32 sx = (x1 < x2) ? 1 : -1;
    i32 sy = (y1 < y2) ? 1 : -1;
    i32 err = dx + dy;

    i32 x = x1, y = y1;
    for (;;) {
        putpixel(x, y, color);
        if (x == x2 && y == y2) break;
        i32 e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
    }
}

// 3. Replicates classic circle(x, y, radius) using Midpoint algorithm
static void circle(int xc, int yc, int r_radius, int color) {
    i32 x = 0;
    i32 y = r_radius;
    i32 d = 3 - 2 * r_radius;

    while (y >= x) {
        putpixel(xc + x, yc + y, color); putpixel(xc - x, yc + y, color);
        putpixel(xc + x, yc - y, color); putpixel(xc - x, yc - y, color);
        putpixel(xc + y, yc + x, color); putpixel(xc - y, yc + x, color);
        putpixel(xc + y, yc - x, color); putpixel(xc - y, yc - x, color);
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 4 * x + 6;
        }
    }
}

#endif
