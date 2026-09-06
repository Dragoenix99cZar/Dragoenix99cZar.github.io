const width = 1024;
const height = 1024;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


// async function initWasm() {
//     // 1. Fetch and compile the standalone Wasm file
//     const response = await fetch('renderer.wasm');
//     const { instance } = await WebAssembly.instantiateStreaming(response);
//     const exports = instance.exports;

//     // 2. Get the memory address where the C buffer starts
//     const bufferPtr = exports.get_buffer_pointer();

//     // 3. Create a view directly inside the Wasm linear memory
//     const byteLength = width * height * 4;
//     const pixelArray = new Uint8ClampedArray(
//         exports.memory.buffer, // Raw Wasm linear memory
//         bufferPtr,             // Memory offset/pointer
//         byteLength             // Data size
//     );

//     // 4. Wrap the shared array into Canvas ImageData
//     const imageData = new ImageData(pixelArray, width, height);

//     let frame = 0;
//     function loop() {
//         // 5. Call C to update the data at the shared pointer
//         exports.compute_frame(frame++);

//         // 6. Push the updated memory chunk directly to the canvas
//         ctx.putImageData(imageData, 0, 0);

//         requestAnimationFrame(loop);
//     }

//     loop();
// }

// initWasm();


function make_environment(...envs) {
  return new Proxy(envs, {
    get(target, prop, receiver) {
      for (let env of envs) {
        if (env.hasOwnProperty(prop)) {
          return env[prop];
        }
      }
      return (...args) => { console.error("NOT IMPLEMENTED: " + prop, args); }
    }
  });
}

async function init(wasmInstance) {

  const exports = wasmInstance.exports;

  // 1. Gather all your rendering variations into an array
    const effects = [
        exports.compute_waves,
        exports.compute_plasma,
        exports.compute_julia,
        exports.compute_matrix,
        exports.compute_warped,
        exports.compute_starfield,
        exports.compute_tunnel,
    ];

    // 2. Select one at random to run for this page session
    const activeRenderEffect = effects[Math.floor(Math.random() * effects.length)];
  console.log("Effect: ", activeRenderEffect);

    // 2. Get the memory address where the C buffer starts
    const bufferPtr = exports.get_buffer_pointer();

    // 3. Create a view directly inside the Wasm linear memory
    const byteLength = width * height * 4;
    const pixelArray = new Uint8ClampedArray(
        exports.memory.buffer, // Raw Wasm linear memory
        bufferPtr,             // Memory offset/pointer
        byteLength             // Data size
    );

    // 4. Wrap the shared array into Canvas ImageData
    const imageData = new ImageData(pixelArray, width, height);

    let frame = 0;
    function loop() {
        // 5. Call C to update the data at the shared pointer
        // exports.compute_frame(frame++);
        activeRenderEffect(frame++);

        // 6. Push the updated memory chunk directly to the canvas
        ctx.putImageData(imageData, 0, 0);

        requestAnimationFrame(loop);
    }

    loop();
}

const libm = {
    "atan2f": Math.atan2,
    "cosf": Math.cos,
    "sinf": Math.sin,
    "sqrtf": Math.sqrt,
};

function make_environment(...envs) {
  return new Proxy(envs, {
    get(target, prop, receiver) {
      for (let env of envs) {
        if (env.hasOwnProperty(prop)) {
          return env[prop];
        }
      }
      return (...args) => { console.error("NOT IMPLEMENTED: " + prop, args); }
    }
  });
}

let w = null;
WebAssembly.instantiateStreaming(fetch('./renderer.wasm'), {
  "env": make_environment(libm)
}).then(w0 => {
  w = w0;
  // console.log(w);
  if (w) init(w0.instance);
})
