/* tslint:disable */
/* eslint-disable */

export class ImageProcessor {
    free(): void;
    [Symbol.dispose](): void;
    canvas_to_image_x(canvas_x: number, canvas_w: number): number;
    canvas_to_image_y(canvas_y: number, canvas_h: number): number;
    clear_mask_selection(mask: Uint8Array): void;
    clear_selection(x: number, y: number, width: number, height: number): void;
    crop(x: number, y: number, width: number, height: number): void;
    encode(format: string): Uint8Array;
    flip_horizontal(): void;
    flip_vertical(): void;
    get_rgba_pixels(): Uint8Array;
    height(): number;
    constructor(data: Uint8Array);
    pan(dx: number, dy: number): void;
    render_viewport(viewport_w: number, viewport_h: number): Uint8Array;
    reset_to_original(): void;
    reset_transform(): void;
    rotate_90(): void;
    select_color_range(target_x: number, target_y: number, tolerance: number): Uint8Array;
    select_flood_fill(start_x: number, start_y: number, tolerance: number): Uint8Array;
    set_zoom(delta: number): void;
    width(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_imageprocessor_free: (a: number, b: number) => void;
    readonly imageprocessor_canvas_to_image_x: (a: number, b: number, c: number) => number;
    readonly imageprocessor_canvas_to_image_y: (a: number, b: number, c: number) => number;
    readonly imageprocessor_clear_mask_selection: (a: number, b: number, c: number) => void;
    readonly imageprocessor_clear_selection: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly imageprocessor_crop: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly imageprocessor_encode: (a: number, b: number, c: number) => [number, number, number, number];
    readonly imageprocessor_flip_horizontal: (a: number) => void;
    readonly imageprocessor_flip_vertical: (a: number) => void;
    readonly imageprocessor_get_rgba_pixels: (a: number) => [number, number];
    readonly imageprocessor_height: (a: number) => number;
    readonly imageprocessor_new: (a: number, b: number) => [number, number, number];
    readonly imageprocessor_pan: (a: number, b: number, c: number) => void;
    readonly imageprocessor_render_viewport: (a: number, b: number, c: number) => [number, number];
    readonly imageprocessor_reset_to_original: (a: number) => void;
    readonly imageprocessor_reset_transform: (a: number) => void;
    readonly imageprocessor_rotate_90: (a: number) => void;
    readonly imageprocessor_select_color_range: (a: number, b: number, c: number, d: number) => [number, number];
    readonly imageprocessor_select_flood_fill: (a: number, b: number, c: number, d: number) => [number, number];
    readonly imageprocessor_set_zoom: (a: number, b: number) => void;
    readonly imageprocessor_width: (a: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
