// Define canvas dimensions
#define WIDTH 800
#define HEIGHT 450

float sinf(float x);
float cosf(float x);
float sqrtf(float x);
float atan2f(float y, float x);

// A static buffer to hold 800x450 pixels. Each pixel needs 4 bytes (R, G, B, A).
// 800 * 450 * 4 = 1,440,000 bytes (~1.44 MB)
unsigned char PIXEL_BUFFER[WIDTH * HEIGHT * 4];


// The entire body content stored as a C string literal
// const char HTML_CONTENT[] = 
//     "<div style='font-family: sans-serif; text-align: center; padding: 20px;'>"
//     "  <h1 style='color: #333;'>Hello from C + Wasm!</h1>"
//     "  <p>This entire UI is stored inside a WebAssembly binary.</p>"
//     "  <button id='actionBtn' style='padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;'>"
//     "    Click Me"
//     "  </button>"
//     "  <script>"
//     "    document.getElementById('actionBtn').addEventListener('click', () => {"
//     "      alert('Button clicked! Triggered by JS embedded inside C.');"
//     "    });"
//     "  </script>"
//     "</div>";


// const char HTML_CONTENT[] = 
//     "<div>"
//         "<canvas id='canvas' width='800' height='450'></canvas>"
//         ""
//         "<script>"
//         "    const canvas = document.getElementById('canvas');"
//         "    const ctx = canvas.getContext('2d');"
//         "    const width = 800;"
//         "    const height = 450;"
//         ""
//         "    const exports = result.instance.exports;"
//         ""
//         "    // Initialize Alpha channel values inside C memory"
//         "    exports.init_buffer();"
//         ""
//         "    // Get the starting memory address of our pixel array"
//         "    const bufferPtr = exports.get_buffer();"
//         ""
//         "    // Create a direct Uint8ClampedArray view over the Wasm linear memory block"
//         "    // Width * Height * 4 channels (RGBA)"
//         "    const byteLength = width * height * 4;"
//         "    const pixelArray = new Uint8ClampedArray(exports.memory.buffer, bufferPtr, byteLength);"
//         ""
//         "    // Wrap the pixel array inside native canvas ImageData"
//         "    const imageData = new ImageData(pixelArray, width, height);"
//         ""
//         "    let startTime = performance.now();"
//         ""
//         "    function loop() {"
//         "        // Calculate elapsed time in seconds"
//         "        let elapsed = (performance.now() - startTime) / 1000;"
//         ""
//         "        // Tell C to calculate pixel color arrays for the new frame"
//         "        exports.update_wave(elapsed);"
//         ""
//         "        // Push the modified Wasm memory onto the screen canvas"
//         "        ctx.putImageData(imageData, 0, 0);"
//         ""
//         "        requestAnimationFrame(loop);"
//         "    }"
//         ""
//         "    // Start the animation loop"
//         "    requestAnimationFrame(loop);"
//         "</script>"
//     "</div>";


const char HTML_CONTENT[] = 
    "<style>"
    "  body { margin: 0; overflow: hidden; background: #000; }"
    "  canvas { display: block; width: 100vw; height: 100vh; }"
    "</style>"
    "<div>"
        "<canvas id='canvas' width='800' height='450'></canvas>"
        "<script>"
        "    const canvas = document.getElementById('canvas');"
        "    const ctx = canvas.getContext('2d');"
        "    const width = 800;"
        "    const height = 450;"
        ""
        "    const exports = window.wasmExports;"
        ""
        "    const bufferPtr = exports.get_buffer();"
        "    const byteLength = width * height * 4;"
        "    const pixelArray = new Uint8ClampedArray(exports.memory.buffer, bufferPtr, byteLength);"
        "    const imageData = new ImageData(pixelArray, width, height);"
        ""
        "    let frame = 0;"
        "    function loop() {"
        "        exports.compute_plasma(frame++);"
        "        ctx.putImageData(imageData, 0, 0);"
        "        requestAnimationFrame(loop);"
        "    }"
        "    requestAnimationFrame(loop);"
        "</script>"
    "</div>";


// Export the function so JavaScript can read the memory location
__attribute__((visibility("default")))
const char* get_html_content() {
    return HTML_CONTENT;
}

// Returns the pointer to our pixel buffer so JS can read it
__attribute__((visibility("default")))
unsigned char* get_buffer() {
    return PIXEL_BUFFER;
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

            PIXEL_BUFFER[idx + 0] = (unsigned char)(factor * 255);         // Red
            PIXEL_BUFFER[idx + 1] = (unsigned char)((1.0f - factor) * 255); // Green
            PIXEL_BUFFER[idx + 2] = (unsigned char)(sinf(time) * 127 + 128); // Shifting Blue
            PIXEL_BUFFER[idx + 3] = 200;
        }
    }
}


// clang --target=wasm32 -O3 -nostdlib "-Wl,--no-entry" "-Wl,--export-all" "-Wl,--allow-undefined" -o app.wasm main.c

// Compile with: clang --target=wasm32 -O3 -nostdlib -Wl,--no-entry -Wl,--export=get_buffer -Wl,--export=init_buffer -Wl,--export=update_wave -o wave.wasm wave.c