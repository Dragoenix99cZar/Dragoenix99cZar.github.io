// async function run() {
//   // 1. Fetch and instantiate the compiled C Wasm binary
//   const response = await fetch('./math.wasm');
//   const bytes = await response.arrayBuffer();
//   const { instance } = await WebAssembly.instantiate(bytes);

//   console.log("Wasm instance: ", instance);

//   // 2. Call C functions directly from the exports object
//   const sum = instance.exports.add(15, 27);
//   console.log("15 + 27 =", sum);

//   const primeCheck = instance.exports.is_prime(1234569);
//   console.log("Is 1234569 prime?", primeCheck === 1);
// }

// run();

console.log("Hello, World!");
let w = null;

const btn = document.getElementById('sum-btn');
const inputA = document.getElementById('input-a');
const inputB = document.getElementById('input-b');
const resultDiv = document.getElementById('result');


function init(wasmMod) {
  // console.log("Wasm module: " + wasmMod);
  // Enable button once Wasm is ready
  btn.textContent = 'Calculate Sum';
  btn.disabled = false;

  // Handle button click event
  btn.addEventListener('click', () => {
      const a = parseInt(inputA.value, 10) || 0;
      const b = parseInt(inputB.value, 10) || 0;

      // Call the Rust function
      const sum = wasmMod.exports.add(a, b);

      resultDiv.textContent = `Result from C: ${a} + ${b} = ${sum}`;
  });

  const fbtn = document.getElementById('factr-btn');
  const inputN = document.getElementById('number-input');
  const factorDiv = document.getElementById('factor');

  fbtn.textContent = 'Check Prime';
  fbtn.disabled = false;

  fbtn.addEventListener('click', () => {
      // Parse standard JS Number
      const n = parseInt(inputN.value, 10);

      if (isNaN(n)) {
          resultDiv.textContent = 'Please enter a valid integer.';
          return;
      }

    const primeCheck = wasmMod.exports.is_prime(n);

      // Output formatted result
      factorDiv.textContent = `Is ${n} prime? ${(primeCheck === 1)}`;
  });
}

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

WebAssembly.instantiateStreaming(fetch('./math.wasm'), {
  "env": make_environment()
}).then(w0 => {
  w = w0;
  // console.log(w);
  if (w) init(w0.instance);
})
