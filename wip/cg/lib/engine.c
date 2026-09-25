#include "wasm_graphics.h"

#define WASM_EXPORT __attribute__((visibility("default")))

// Allocate the master frame buffer declared in the header file
u8 pixel_buffer[WIDTH * HEIGHT * 4];

WASM_EXPORT u8* get_buffer_ptr(void) {
    return pixel_buffer;
}

WASM_EXPORT void clear_screen(void) {
    for (i32 i = 0; i < WIDTH * HEIGHT * 4; i += 4) {
        pixel_buffer[i]     = 10;  // Default background color
        pixel_buffer[i + 1] = 10;
        pixel_buffer[i + 2] = 20;
        pixel_buffer[i + 3] = 255;
    }
}

// Textbook practice assignment: Draw a simple house frame using graphics.h wrappers
WASM_EXPORT void draw_textbook_scene(int mouseX, int mouseY) {
    clear_screen();

    // Draw house base using standard textbook syntax
    line(30, 80, 130, 80, WHITE);
    line(30, 80, 30, 115, LIGHTBLUE);
    line(130, 80, 130, 115, LIGHTBLUE);
    line(30, 115, 130, 115, WHITE);

    // Draw roof triangulation
    line(30, 80, 80, 40, RED);
    line(130, 80, 80, 40, RED);

    // Draw a decorative round window in the center of the roof
    circle(80, 60, 8, YELLOW);

    // Dynamic element: Connect a line tracking where the mouse moves
    line(80, 40, mouseX, mouseY, LIGHTGREEN);
}


// clang --target=wasm32 `
//       -O3 `
//       -nostdlib `
//       -fno-builtin `
//       "-Wl,--no-entry" `
//       "-Wl,--export=get_buffer_ptr" `
//       "-Wl,--export=clear_screen" `
//       "-Wl,--export=draw_textbook_scene" `
//       -o engine.wasm engine.c
