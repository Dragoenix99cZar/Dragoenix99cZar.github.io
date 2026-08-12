/* @ts-self-types="./maze_bot_wasm.d.ts" */

/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5}
 */
export const CellType = Object.freeze({
    Empty: 0, "0": "Empty",
    Wall: 1, "1": "Wall",
    Start: 2, "2": "Start",
    Goal: 3, "3": "Goal",
    Path: 4, "4": "Path",
    Visited: 5, "5": "Visited",
});

export class MazeEngine {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MazeEngineFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mazeengine_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    closed_set_count() {
        const ret = wasm.mazeengine_closed_set_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * A* Pathfinding implementation using binary heap priority queue
     * @param {boolean} use_dijkstra
     * @param {boolean} enable_turn_penalty
     * @returns {boolean}
     */
    compute_path(use_dijkstra, enable_turn_penalty) {
        const ret = wasm.mazeengine_compute_path(this.__wbg_ptr, use_dijkstra, enable_turn_penalty);
        return ret !== 0;
    }
    /**
     * Computes the path instantly without animation state sequence
     * @param {boolean} use_dijkstra
     * @param {boolean} enable_turn_penalty
     * @returns {boolean}
     */
    compute_path_instant(use_dijkstra, enable_turn_penalty) {
        const ret = wasm.mazeengine_compute_path_instant(this.__wbg_ptr, use_dijkstra, enable_turn_penalty);
        return ret !== 0;
    }
    /**
     * Generates a random world grid based on obstacle density
     * @param {number} obstacle_density
     */
    generate_world(obstacle_density) {
        wasm.mazeengine_generate_world(this.__wbg_ptr, obstacle_density);
    }
    /**
     * @returns {number}
     */
    goal_x() {
        const ret = wasm.mazeengine_goal_x(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    goal_y() {
        const ret = wasm.mazeengine_goal_y(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {boolean}
     */
    is_animating() {
        const ret = wasm.mazeengine_is_animating(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Creates and initializes a new MazeEngine instance
     * @param {number} width
     * @param {number} height
     */
    constructor(width, height) {
        const ret = wasm.mazeengine_new(width, height);
        this.__wbg_ptr = ret;
        MazeEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    path_length() {
        const ret = wasm.mazeengine_path_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Pointer to the render grid raw slice in Wasm memory
     * @returns {number}
     */
    render_grid_ptr() {
        const ret = wasm.mazeengine_render_grid_ptr(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Sets target goal manually (e.g. via canvas click event)
     * @param {number} goal_x
     * @param {number} goal_y
     * @returns {boolean}
     */
    set_goal(goal_x, goal_y) {
        const ret = wasm.mazeengine_set_goal(this.__wbg_ptr, goal_x, goal_y);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    start_x() {
        const ret = wasm.mazeengine_start_x(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    start_y() {
        const ret = wasm.mazeengine_start_y(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Advances internal step state machine for requestAnimationFrame loop
     * @returns {boolean}
     */
    update_animation_step() {
        const ret = wasm.mazeengine_update_animation_step(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) MazeEngine.prototype[Symbol.dispose] = MazeEngine.prototype.free;
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_throw_bb96b2010945f0bc: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_random_b0d98802be10ff20: function() {
            const ret = Math.random();
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./maze_bot_wasm_bg.js": import0,
    };
}

const MazeEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mazeengine_free(ptr, 1));

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('maze_bot_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
