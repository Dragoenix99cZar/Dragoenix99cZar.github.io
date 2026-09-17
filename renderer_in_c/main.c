#define WIDTH 1024
#define HEIGHT 1024

#define ALPHA_VALUE 30

float sinf(float x);
float cosf(float x);
float sqrtf(float x);
float atan2f(float y, float x);

typedef struct {
    float x, y, z;
} Star;

#define MAX_STARS 150
Star stars[MAX_STARS];
int initialized = 0;

// Allocate the buffer statically in Wasm memory
// Size = Width * Height * 4 bytes (RGBA)
unsigned char pixel_buffer[WIDTH * HEIGHT * 4];

// Attribute tells Clang to export these functions to Wasm
__attribute__((visibility("default")))
unsigned char* get_buffer_pointer() {
    return pixel_buffer;
}

__attribute__((visibility("default")))
void compute_waves(int frame_count) {
    float time = frame_count * 0.05f;
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            int idx = (y * WIDTH + x) * 4;

            float factor = (sinf(x * 0.05f + time) + 1.0f) * 0.5f;

            pixel_buffer[idx + 0] = (unsigned char)(factor * 255); // Red
            pixel_buffer[idx + 1] = y;                    // Green
            pixel_buffer[idx + 2] = 128;                    // Blue
            pixel_buffer[idx + 3] = ALPHA_VALUE;                    // Alpha (Opaque)
        }
    }
}

__attribute__((visibility("default")))
void compute_plasma(int frame_count) {
    float time = frame_count * 0.03f;
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            int idx = (y * WIDTH + x) * 4;

            // Normalized coordinates (-1.0 to 1.0)
            float nx = (x / (float)WIDTH) * 2.0f - 1.0f;
            float ny = (y / (float)HEIGHT) * 2.0f - 1.0f;

            // Intersecting waves
            float wave1 = sinf(nx * 4.0f + time);
            float wave2 = cosf(ny * 4.0f - time);
            float wave3 = sinf((nx + ny) * 2.0f + time * 1.5f);

            // Combine and normalize to 0.0 - 1.0
            float total = (wave1 + wave2 + wave3) / 3.0f;
            float factor = (total + 1.0f) * 0.5f;

            pixel_buffer[idx + 0] = (unsigned char)(factor * 255);         // Red
            pixel_buffer[idx + 1] = (unsigned char)((1.0f - factor) * 255); // Green
            pixel_buffer[idx + 2] = (unsigned char)(sinf(time) * 127 + 128); // Shifting Blue
            pixel_buffer[idx + 3] = ALPHA_VALUE;
        }
    }
}

__attribute__((visibility("default")))
void compute_julia(int frame_count) {
    float time = frame_count * 0.01f;

    // Constant parameters that change over time to mutate the fractal shape
    float cx = -0.7f + sinf(time * 0.3f) * 0.1f;
    float cy = 0.27015f + cosf(time * 0.2f) * 0.05f;

    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            int idx = (y * WIDTH + x) * 4;

            // Map pixel coordinates to complex plane (-1.5 to 1.5)
            float zx = 1.5f * (x - WIDTH / 2.0f) / (WIDTH / 2.0f);
            float zy = 1.5f * (y - HEIGHT / 2.0f) / (HEIGHT / 2.0f);

            int i = 0;
            int max_iterations = 32;

            // Iterate the complex function Z = Z^2 + C
            while (zx * zx + zy * zy < 4.0f && i < max_iterations) {
                float xtemp = zx * zx - zy * zy + cx;
                zy = 2.0f * zx * zy + cy;
                zx = xtemp;
                i++;
            }

            // Color map based on escape velocity (iterations reached)
            float ns = (float)i / (float)max_iterations;

            pixel_buffer[idx + 0] = (unsigned char)(ns * 255);                     // Red
            pixel_buffer[idx + 1] = (unsigned char)(sinf(ns * 3.14f) * 255);       // Green
            pixel_buffer[idx + 2] = (unsigned char)(sqrtf(ns) * 255);              // Blue
            pixel_buffer[idx + 3] = ALPHA_VALUE;
        }
    }
}

__attribute__((visibility("default")))
void compute_matrix(int frame_count) {
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            int idx = (y * WIDTH + x) * 4;

            // Group pixels into vertical tracks (columns)
            int column = x / 1;

            // Generate pseudo-random speed and offsets based on the column ID
            // int speed = 1 + (column % 5);
            int speed = 1 + (column % 2);
            int offset = (column * 37) % HEIGHT;

            // Calculate head position of the falling stream
            int head_y = (frame_count * speed + offset) % (HEIGHT + 200) - 100;

            int brightness = 0;
            if (y <= head_y && y > head_y - 150) {
                // Fade out as it moves up from the head pointer
                brightness = 255 - ((head_y - y) * 255 / 150);
            }

            // Create a glitchy, textured vertical matrix strip
            if (brightness > 0 && ((y ^ x) % 7 != 0)) {
                pixel_buffer[idx + 0] = (brightness > 230) ? brightness : 0; // Flash white at head tip
                pixel_buffer[idx + 1] = brightness;                          // Rich Green trail
                pixel_buffer[idx + 2] = (brightness > 200) ? 150 : 0;        // Cyan cores
            } else {
                // Decay old frames smoothly instead of jarring snap to black
                pixel_buffer[idx + 0] = 0;
                pixel_buffer[idx + 1] = (unsigned char)(pixel_buffer[idx + 1] * 0.9f);
                pixel_buffer[idx + 2] = 0;
            }
            pixel_buffer[idx + 3] = ALPHA_VALUE;
        }
    }
}

__attribute__((visibility("default")))
void compute_warped(int frame_count) {
    float time = frame_count * 0.02f;

    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            int idx = (y * WIDTH + x) * 4;

            float u = x / (float)WIDTH;
            float v = y / (float)HEIGHT;

            // First layer of warping distortion (First domain)
            float qx = sinf(u * 5.0f + time * 0.5f) + cosf(v * 3.0f);
            float qy = cosf(v * 5.0f - time * 0.3f) + sinf(u * 2.0f);

            // Second layer feeding from the first (Warped Domain)
            float rx = sinf((u + qx) * 4.0f + time);
            float ry = cosf((v + qy) * 4.0f - time * 0.7f);

            // Final scalar field value
            float factor = (sinf(rx * ry * 3.0f) + 1.0f) * 0.5f;

            // Dynamic RGB assignment for trippy fluid gradients
            pixel_buffer[idx + 0] = (unsigned char)(factor * 255);
            pixel_buffer[idx + 1] = (unsigned char)(sinf(factor * 3.14f) * 255);
            pixel_buffer[idx + 2] = (unsigned char)(cosf(time) * 127 + 128);
            pixel_buffer[idx + 3] = ALPHA_VALUE;
        }
    }
}

__attribute__((visibility("default")))
void compute_starfield(int frame_count) {
    // 1. Clear the canvas to a dark fading trail space look
    for (int i = 0; i < WIDTH * HEIGHT * 4; i += 4) {
        pixel_buffer[i + 0] = (unsigned char)(pixel_buffer[i + 0] * 0.7f); // Fade Red
        pixel_buffer[i + 1] = (unsigned char)(pixel_buffer[i + 1] * 0.75f); // Fade Green
        pixel_buffer[i + 2] = (unsigned char)(pixel_buffer[i + 2] * 0.7f);// Fade Blue slower
        pixel_buffer[i + 3] = 255;
    }

    // 2. Initialize star coordinate layout on first launch
    if (!initialized) {
        int seed = 12345;
        for (int i = 0; i < MAX_STARS; i++) {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            stars[i].x = (float)(seed % WIDTH) - (WIDTH / 2.0f);
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            stars[i].y = (float)(seed % HEIGHT) - (HEIGHT / 2.0f);
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            stars[i].z = (float)(seed % WIDTH); // Depth parameter
        }
        initialized = 1;
    }

    // 3. Project and draw star particles
    for (int i = 0; i < MAX_STARS; i++) {
        stars[i].z -= 4.5f; // Accelerate speed forward

        // Respawn distant back stars once they fly past the viewport borders
        if (stars[i].z <= 0) {
            stars[i].z = WIDTH;
        }

        // Perspective division mapping 3D planes down to 2D
        int sx = (int)((stars[i].x / stars[i].z) * WIDTH + (WIDTH / 2.0f));
        int sy = (int)((stars[i].y / stars[i].z) * HEIGHT + (HEIGHT / 2.0f));

        if (sx >= 0 && sx < WIDTH && sy >= 0 && sy < HEIGHT) {
            int p_idx = (sy * WIDTH + sx) * 4;

            // Stars glow brighter as they get closer to the camera lens
            unsigned char bright = (unsigned char)((1.0f - (stars[i].z / WIDTH)) * 255);
            pixel_buffer[p_idx + 0] = bright;
            pixel_buffer[p_idx + 1] = bright;
            pixel_buffer[p_idx + 2] = 255; // White/Blue tints
        }
    }
}

// EFFECT 2: Concentric Tunnel Rings
__attribute__((visibility("default")))
void compute_tunnel(int frame_count) {
    float time = frame_count * 0.1f;
    float cx = WIDTH / 2.0f;
    float cy = HEIGHT / 2.0f;
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            int idx = (y * WIDTH + x) * 4;
            float dx = x - cx;
            float dy = y - cy;
            float distance = sqrtf(dx * dx + dy * dy);
            float factor = (sinf(distance * 0.1f - time) + 1.0f) * 0.5f;

            pixel_buffer[idx + 0] = (unsigned char)(factor * 255);
            pixel_buffer[idx + 1] = (unsigned char)(factor * 50);
            pixel_buffer[idx + 2] = (unsigned char)(factor * 180);
            pixel_buffer[idx + 3] = ALPHA_VALUE;
        }
    }
}


/*
 clang --target=wasm32 -O3 -nostdlib -Wl,--no-entry -Wl,--export-all -o renderer.wasm main.c

 cmd: clang --target=wasm32 -O3 -nostdlib -Wl,--no-entry -Wl,--export-all -Wl,--allow-undefined -o renderer.wasm main.c
 powershell:  comma issue, use quots
    clang --target=wasm32 -O3 -nostdlib "-Wl,--no-entry" "-Wl,--export-all" "-Wl,--allow-undefined" -o renderer.wasm main.c

 clang -Wall -Wextra --target=wasm32 -o wasm.o main.c
 wasm-ld -m wasm32 --no-entry --export-all --allow-undefined -o renderer.wasm wasm.o
 */
