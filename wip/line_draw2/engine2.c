// Define a lower internal simulation resolution to make pixels big and blocky
#define WIDTH 160
#define HEIGHT 120

typedef int int32_t;
typedef unsigned char uint8_t;
typedef int32_t i32;
typedef uint8_t u8;

u8 pixel_buffer[WIDTH * HEIGHT * 4];

// Simply expose a custom implementation matching the standard signature.
// Clang will automatically use this code block to resolve its optimization dependencies!
void* memset(void* dest, int value, unsigned int count) {
    unsigned char* p = (unsigned char*)dest;
    while (count--) {
        *p++ = (unsigned char)value;
    }
    return dest;
}


static i32 iabs(i32 v) { return v < 0 ? -v : v; }

__attribute__((export_name("get_buffer_ptr")))
u8* get_buffer_ptr(void) {
    return pixel_buffer;
}

__attribute__((export_name("clear_screen")))
void clear_screen(void) {
    for (i32 i = 0; i < WIDTH * HEIGHT * 4; i += 4) {
        pixel_buffer[i]     = 0;   // R
        pixel_buffer[i + 1] = 0;   // G
        pixel_buffer[i + 2] = 0;   // B
        pixel_buffer[i + 3] = 255; // A
    }
}
// void clear_screen(void) {
//     // Casting the pointer to volatile tells Clang not to replace this with an unlinked memset
//     volatile u8* memory = (volatile u8*)pixel_buffer;
    
//     for (i32 i = 0; i < WIDTH * HEIGHT * 4; i += 4) {
//         memory[i]     = 0;   // R
//         memory[i + 1] = 0;   // G
//         memory[i + 2] = 0;   // B
//         memory[i + 3] = 0;   // A (Transparent for your CSS grid background layout)
//     }
// }

static void put_pixel(i32 x, i32 y, u8 r, u8 g, u8 b, u8 a) {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        i32 index = (y * WIDTH + x) * 4;
        pixel_buffer[index]     = r;
        pixel_buffer[index + 1] = g;
        pixel_buffer[index + 2] = b;
        pixel_buffer[index + 3] = a;
    }
}

static void put_thick_pixel(i32 x, i32 y, i32 thickness, u8 r, u8 g, u8 b, u8 a) {
    if (thickness <= 1) {
        put_pixel(x, y, r, g, b, a);
        return;
    }
    i32 half = thickness / 2;
    for (i32 dy = -half; dy <= half; dy++) {
        for (i32 dx = -half; dx <= half; dx++) {
            put_pixel(x + dx, y + dy, r, g, b, a);
        }
    }
}

/* 1) Direct Method */
__attribute__((export_name("draw_line_direct")))
void draw_line_direct(
    i32 x1, i32 y1, 
    i32 x2, i32 y2, 
    i32 thickness, 
    u8 r, u8 g, u8 b, u8 a
) {
    i32 dx = x2 - x1;
    i32 dy = y2 - y1;

    if (dx == 0) {
        i32 step = (y2 >= y1) ? 1 : -1;
        for (i32 y = y1; ; y += step) {
            put_thick_pixel(x1, y, thickness, r, g, b, a);
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
            put_thick_pixel(x, (i32)(yf + (yf >= 0 ? 0.5f : -0.5f)), thickness, r, g, b, a);
            if (x == x2) break;
        }
    } else {
        i32 step = (y2 >= y1) ? 1 : -1;
        for (i32 y = y1; ; y += step) {
            float xf = ((float)y - bIntercept) / m;
            put_thick_pixel((i32)(xf + (xf >= 0 ? 0.5f : -0.5f)), y, thickness, r, g, b, a);
            if (y == y2) break;
        }
    }
}

/* 2) DDA Method */
__attribute__((export_name("draw_line_dda")))
void draw_line_dda(
    i32 x1, i32 y1, 
    i32 x2, i32 y2, 
    i32 thickness, 
    u8 r, u8 g, u8 b, u8 a
) {
    i32 dx = x2 - x1;
    i32 dy = y2 - y1;
    i32 steps = (iabs(dx) > iabs(dy)) ? iabs(dx) : iabs(dy);

    if (steps == 0) {
        put_thick_pixel(x1, y1, thickness, r, g, b, a);
        return;
    }

    float xInc = (float)dx / (float)steps;
    float yInc = (float)dy / (float)steps;

    float x = (float)x1;
    float y = (float)y1;

    for (i32 k = 0; k <= steps; k++) {
        put_thick_pixel((i32)(x + 0.5f), (i32)(y + 0.5f), thickness, r, g, b, a);
        x += xInc;
        y += yInc;
    }
}

/* 3) Bresenham Method */
__attribute__((export_name("draw_line_bresenham")))
void draw_line_bresenham(
    i32 x1, i32 y1, 
    i32 x2, i32 y2, 
    i32 thickness, 
    u8 r, u8 g, u8 b, u8 a
) {
    i32 dx = iabs(x2 - x1);
    i32 dy = -iabs(y2 - y1);
    i32 sx = (x1 < x2) ? 1 : -1;
    i32 sy = (y1 < y2) ? 1 : -1;
    i32 err = dx + dy;

    i32 x = x1, y = y1;

    for (;;) {
        put_thick_pixel(x, y, thickness, r, g, b, a);
        if (x == x2 && y == y2) break;
        i32 e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
    }
}
