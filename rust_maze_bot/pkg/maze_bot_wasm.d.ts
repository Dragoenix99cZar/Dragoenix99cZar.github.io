/* tslint:disable */
/* eslint-disable */

export enum CellType {
    Empty = 0,
    Wall = 1,
    Start = 2,
    Goal = 3,
    Path = 4,
    Visited = 5,
}

export class MazeEngine {
    free(): void;
    [Symbol.dispose](): void;
    closed_set_count(): number;
    /**
     * A* Pathfinding implementation using binary heap priority queue
     */
    compute_path(use_dijkstra: boolean, enable_turn_penalty: boolean): boolean;
    /**
     * Computes the path instantly without animation state sequence
     */
    compute_path_instant(use_dijkstra: boolean, enable_turn_penalty: boolean): boolean;
    /**
     * Generates a random world grid based on obstacle density
     */
    generate_world(obstacle_density: number): void;
    goal_x(): number;
    goal_y(): number;
    is_animating(): boolean;
    /**
     * Creates and initializes a new MazeEngine instance
     */
    constructor(width: number, height: number);
    path_length(): number;
    /**
     * Pointer to the render grid raw slice in Wasm memory
     */
    render_grid_ptr(): number;
    /**
     * Sets target goal manually (e.g. via canvas click event)
     */
    set_goal(goal_x: number, goal_y: number): boolean;
    start_x(): number;
    start_y(): number;
    /**
     * Advances internal step state machine for requestAnimationFrame loop
     */
    update_animation_step(): boolean;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_mazeengine_free: (a: number, b: number) => void;
    readonly mazeengine_closed_set_count: (a: number) => number;
    readonly mazeengine_compute_path: (a: number, b: number, c: number) => number;
    readonly mazeengine_compute_path_instant: (a: number, b: number, c: number) => number;
    readonly mazeengine_generate_world: (a: number, b: number) => void;
    readonly mazeengine_goal_x: (a: number) => number;
    readonly mazeengine_goal_y: (a: number) => number;
    readonly mazeengine_is_animating: (a: number) => number;
    readonly mazeengine_new: (a: number, b: number) => number;
    readonly mazeengine_path_length: (a: number) => number;
    readonly mazeengine_render_grid_ptr: (a: number) => number;
    readonly mazeengine_set_goal: (a: number, b: number, c: number) => number;
    readonly mazeengine_start_x: (a: number) => number;
    readonly mazeengine_start_y: (a: number) => number;
    readonly mazeengine_update_animation_step: (a: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
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
