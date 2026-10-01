/* tslint:disable */
/* eslint-disable */

export class WorldGame {
    free(): void;
    [Symbol.dispose](): void;
    get_current_target_display(): string;
    get_current_target_token(): string;
    get_score(): number;
    get_total_turns(): number;
    handle_click(clicked_token: string): number;
    constructor(obfuscated_json_data: any, whitelist_codes: any);
    static process_svg_asset(raw_svg: string): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_worldgame_free: (a: number, b: number) => void;
    readonly worldgame_get_current_target_display: (a: number) => [number, number];
    readonly worldgame_get_current_target_token: (a: number) => [number, number];
    readonly worldgame_get_score: (a: number) => number;
    readonly worldgame_get_total_turns: (a: number) => number;
    readonly worldgame_handle_click: (a: number, b: number, c: number) => number;
    readonly worldgame_new: (a: any, b: any) => number;
    readonly worldgame_process_svg_asset: (a: number, b: number) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
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
