typedef unsigned char uint8_t;
typedef unsigned int uint32_t;

#define WIDTH 1000
#define HEIGHT 400
#define ARRAY_SIZE (250)

// Framebuffer and shared data structures
uint32_t pixel_buffer[WIDTH * HEIGHT];
int array[ARRAY_SIZE];

// Global control flags
int is_sorting = 0;
int sort_type = 0; // 0:Bubble, 1:Selection, 2:Insertion, 3:Heap, 4:Quick, 5:Merge, 6:Timsort

// Iteration cursor positions
int current_i = 0;
int current_j = 0;
int min_idx = 0;

// Heap Sort tracker registers
int heap_phase = 0; // 0 = Build Heap, 1 = Extract Root

// Non-recursive Quicksort manual memory tracking stack
int q_stack_low[ARRAY_SIZE];
int q_stack_high[ARRAY_SIZE];
int q_top = -1;
int q_p_pivot = 0;
int q_p_i = 0;
int q_p_j = 0;
int q_phase = 0; // 0 = Pop Segment, 1 = Partitioning Loop, 2 = Push Sub-segments

// Merge Sort working buffers and tracking registers
int merge_width = 1;
int merge_left = 0;
int temp_array[ARRAY_SIZE];
int m_i = 0, m_j = 0, m_k = 0;
int m_mid = 0, m_end = 0;
int merge_phase = 0; // 0 = Determine chunk sizes, 1 = Active execution element copy

// Timsort sub-state configuration flags
#define TIM_RUN 32
int tim_phase = 0; // 0 = Insertion Pass, 1 = Merge Phase Init, 2 = Merge Loop Exec
int tim_i = 0;
int tim_ins_i = 0;
int tim_ins_j = 0;
int tim_width = TIM_RUN;
int tim_left = 0;

// Deterministic random layout engine
static uint32_t seed = 133737;
uint32_t rand_num() {
    seed = seed * 1664525 + 1013904223;
    return seed;
}

// Provide a basic memcpy implementation for the Clang optimizer
void* memcpy(void* dest, const void* src, unsigned long n) {
    char* d = (char*)dest;
    const char* s = (const char*)src;
    while (n--) {
        *d++ = *s++;
    }
    return dest;
}


#define WASM_EXPORT __attribute__((visibility("default")))

WASM_EXPORT void* get_buffer_pointer() { return pixel_buffer; }
int maxH = -1, minH = 20*1000;
WASM_EXPORT void init_array() {
    for (int i = 0; i < ARRAY_SIZE; i++) {
        array[i] = (rand_num() % (HEIGHT - 40)) + 5;
        if(array[i] >= maxH) maxH = array[i];
        if(array[i] <= minH) minH = array[i];
    }
    is_sorting = 0;
}

WASM_EXPORT void reverse_array() {
    for (int i = 0; i < ARRAY_SIZE; i++) {
        // Linearly scale from (HEIGHT - 20) down to 20 across the array size
        float progress = (float)(ARRAY_SIZE - 1 - i) / (ARRAY_SIZE - 1);
        int base_height = 20 + (int)(progress * (HEIGHT - 40));

        array[i] = base_height;
    }
    is_sorting = 0;
}

void clear_buffer(uint32_t color) {
    for (int i = 0; i < WIDTH * HEIGHT; i++) pixel_buffer[i] = color;
}

void draw_rect(int x, int y, int w, int h, uint32_t color) {
    for (int row = y; row < y + h; row++) {
        if (row < 0 || row >= HEIGHT) continue;
        for (int col = x; col < x + w; col++) {
            if (col < 0 || col >= WIDTH) continue;
            pixel_buffer[row * WIDTH + col] = color;
        }
    }
}

/* =========================================================================
   SORT ENGINE CORE SUBROUTINES
   ========================================================================= */

void step_bubble_sort() {
    if (current_i < ARRAY_SIZE - 1) {
        if (current_j < ARRAY_SIZE - current_i - 1) {
            if (array[current_j] > array[current_j + 1]) {
                int temp = array[current_j];
                array[current_j] = array[current_j + 1];
                array[current_j + 1] = temp;
            }
            current_j++;
        } else {
            current_j = 0;
            current_i++;
        }
    } else { is_sorting = 0; }
}

void step_selection_sort() {
    if (current_i < ARRAY_SIZE - 1) {
        if (current_j < ARRAY_SIZE) {
            if (array[current_j] < array[min_idx]) min_idx = current_j;
            current_j++;
        } else {
            int temp = array[min_idx];
            array[min_idx] = array[current_i];
            array[current_i] = temp;
            current_i++;
            min_idx = current_i;
            current_j = current_i + 1;
        }
    } else { is_sorting = 0; }
}

void step_insertion_sort() {
    if (current_i < ARRAY_SIZE) {
        if (current_j > 0 && array[current_j - 1] > array[current_j]) {
            int temp = array[current_j];
            array[current_j] = array[current_j - 1];
            array[current_j - 1] = temp;
            current_j--;
        } else {
            current_i++;
            current_j = current_i;
        }
    } else { is_sorting = 0; }
}

void heapify_step(int n, int i) {
    int largest = i;
    int l = 2 * i + 1;
    int r = 2 * i + 2;
    if (l < n && array[l] > array[largest]) largest = l;
    if (r < n && array[r] > array[largest]) largest = r;
    if (largest != i) {
        int swap = array[i];
        array[i] = array[largest];
        array[largest] = swap;
        heapify_step(n, largest);
    }
}

void step_heap_sort() {
    if (heap_phase == 0) { // Constructing Max Heap
        if (current_i >= 0) {
            heapify_step(ARRAY_SIZE, current_i);
            current_i--;
        } else {
            heap_phase = 1;
            current_i = ARRAY_SIZE - 1;
        }
    } else { // Shifting element indices down
        if (current_i > 0) {
            int temp = array[0];
            array[0] = array[current_i];
            array[current_i] = temp;
            heapify_step(current_i, 0);
            current_i--;
        } else { is_sorting = 0; }
    }
}

void step_quicksort() {
    if (q_phase == 0) {
        if (q_top < 0) { is_sorting = 0; return; }
        int h = q_stack_high[q_top];
        int l = q_stack_low[q_top--];

        if (l < h) {
            q_p_pivot = array[h];
            q_p_i = l - 1;
            q_p_j = l;
            current_i = l;
            current_j = h;
            q_phase = 1;
        }
    }
    else if (q_phase == 1) {
        if (q_p_j <= current_j - 1) {
            if (array[q_p_j] <= q_p_pivot) {
                q_p_i++;
                int temp = array[q_p_i];
                array[q_p_i] = array[q_p_j];
                array[q_p_j] = temp;
            }
            q_p_j++;
        } else {
            q_phase = 2;
        }
    }
    else if (q_phase == 2) {
        int temp = array[q_p_i + 1];
        array[q_p_i + 1] = array[current_j];
        array[current_j] = temp;
        int p = q_p_i + 1;

        if (p - 1 > current_i) {
            q_stack_low[++q_top] = current_i;
            q_stack_high[q_top] = p - 1;
        }
        if (p + 1 < current_j) {
            q_stack_low[++q_top] = p + 1;
            q_stack_high[q_top] = current_j;
        }
        q_phase = 0;
    }
}

void step_merge_sort() {
    if (merge_phase == 0) {
        if (merge_width < ARRAY_SIZE) {
            if (merge_left < ARRAY_SIZE) {
                m_mid = merge_left + merge_width - 1;
                int end_calc = merge_left + 2 * merge_width - 1;
                m_end = (end_calc < ARRAY_SIZE - 1) ? end_calc : (ARRAY_SIZE - 1);

                m_i = merge_left;
                m_j = m_mid + 1;
                m_k = merge_left;
                merge_phase = 1;
            } else {
                merge_left = 0;
                merge_width *= 2;
            }
        } else { is_sorting = 0; }
    }
    else if (merge_phase == 1) {
        if (m_i <= m_mid && m_j <= m_end) {
            if (array[m_i] <= array[m_j]) temp_array[m_k++] = array[m_i++];
            else temp_array[m_k++] = array[m_j++];
        } else if (m_i <= m_mid) {
            temp_array[m_k++] = array[m_i++];
        } else if (m_j <= m_end) {
            temp_array[m_k++] = array[m_j++];
        } else {
            for (int x = merge_left; x <= m_end; x++) {
                array[x] = temp_array[x];
            }
            merge_left += 2 * merge_width;
            merge_phase = 0;
        }
    }
}

void step_timsort() {
    if (tim_phase == 0) { // Phase 0: Step-by-step Insertion run sorting
        if (tim_i < ARRAY_SIZE) {
            int run_end = (tim_i + TIM_RUN - 1 < ARRAY_SIZE - 1) ? tim_i + TIM_RUN - 1 : ARRAY_SIZE - 1;
            if (tim_ins_i <= run_end) {
                if (tim_ins_j > tim_i && array[tim_ins_j - 1] > array[tim_ins_j]) {
                    int t = array[tim_ins_j];
                    array[tim_ins_j] = array[tim_ins_j - 1];
                    array[tim_ins_j - 1] = t;
                    tim_ins_j--;
                } else {
                    tim_ins_i++;
                    tim_ins_j = tim_ins_i;
                }
            } else {
                tim_i += TIM_RUN;
                tim_ins_i = tim_i + 1;
                tim_ins_j = tim_ins_i;
            }
        } else {
            tim_width = TIM_RUN;
            tim_left = 0;
            tim_phase = 1; // Advance to setup merge loops
        }
    }
    else if (tim_phase == 1) { // Phase 1: Set boundaries for the next merge step
        if (tim_width < ARRAY_SIZE) {
            if (tim_left < ARRAY_SIZE) {
                m_mid = tim_left + tim_width - 1;
                int e_calc = tim_left + 2 * tim_width - 1;
                m_end = (e_calc < ARRAY_SIZE - 1) ? e_calc : (ARRAY_SIZE - 1);

                if (m_mid < m_end) {
                    m_i = tim_left;
                    m_j = m_mid + 1;
                    m_k = tim_left;
                    tim_phase = 2; // Split into active sorting iteration comparison
                } else {
                    tim_left += 2 * tim_width; // No second half run, step forward
                }
            } else {
                tim_width *= 2;
                tim_left = 0;
            }
        } else {
            is_sorting = 0; // Timsort optimization complete
        }
    }
    else if (tim_phase == 2) { // Phase 2: Compare elements across runs cleanly (1 step per tick)
        if (m_i <= m_mid && m_j <= m_end) {
            if (array[m_i] <= array[m_j]) {
                temp_array[m_k++] = array[m_i++];
            } else {
                temp_array[m_k++] = array[m_j++];
            }
        } else {
            tim_phase = 3; // Shift to draining left sub-run
        }
    }
    else if (tim_phase == 3) { // Phase 3: Drain remaining items in the left section
        if (m_i <= m_mid) {
            temp_array[m_k++] = array[m_i++];
        } else {
            tim_phase = 4; // Shift to draining right sub-run
        }
    }
    else if (tim_phase == 4) { // Phase 4: Drain remaining items in the right section
        if (m_j <= m_end) {
            temp_array[m_k++] = array[m_j++];
        } else {
            m_i = tim_left; // Reset indices to copy variables back to array
            tim_phase = 5;
        }
    }
    else if (tim_phase == 5) { // Phase 5: Stream modifications back into memory visually
        if (m_i <= m_end) {
            array[m_i] = temp_array[m_i];
            m_i++;
        } else {
            tim_left += 2 * tim_width;
            tim_phase = 1; // Cycle back to check for remaining sub-chunks
        }
    }
}

/* =========================================================================
   LIFECYCLE MANAGEMENT BINDINGS
   ========================================================================= */

WASM_EXPORT void start_sort(int type) {
    sort_type = type;
    is_sorting = 1;
    current_i = 0; current_j = 0; min_idx = 0;

    switch(sort_type) {
        case 2: current_i = 1; current_j = 1; break;
        case 3: heap_phase = 0; current_i = (ARRAY_SIZE / 2) - 1; break;
        case 4: q_top = -1; q_phase = 0; q_stack_low[++q_top] = 0; q_stack_high[q_top] = ARRAY_SIZE - 1; break;
        case 5: merge_width = 1; merge_left = 0; merge_phase = 0; break;
        case 6: tim_phase = 0; tim_i = 0; tim_ins_i = 1; tim_ins_j = 1; tim_width = TIM_RUN; break;
    }
}

WASM_EXPORT void update_and_render() {
    if (is_sorting) {
        switch(sort_type) {
            case 0: step_bubble_sort(); break;
            case 1: step_selection_sort(); break;
            case 2: step_insertion_sort(); break;
            case 3: step_heap_sort(); break;
            case 4: step_quicksort(); break;
            case 5: step_merge_sort(); break;
            case 6: step_timsort(); break;
        }
    }
    clear_buffer(0xFF241E1E); // Background hex matching canvas styles

    int bar_width = WIDTH / ARRAY_SIZE;
    for (int i = 0; i < ARRAY_SIZE; i++) {
        int bar_height = array[i];
        int x = i * bar_width;
        int y = HEIGHT - bar_height;
        uint32_t color = 0xFFDB9A3B;

        if (is_sorting) {
            if (sort_type == 0 && (i == current_j))                                 color = 0xFF4F4FFF;
            else if (sort_type == 1 && (i == current_j || i == min_idx))            color = 0xFF4F4FFF;
            else if (sort_type == 2 && i == current_j)                              color = 0xFF4F4FFF;
            else if (sort_type == 3 && i == current_i)                              color = 0xFF4F4FFF;
            else if (sort_type == 4 && q_phase == 1 && (i == q_p_j || i == q_p_i))  color = 0xFF4F4FFF;
            else if (sort_type == 5 && merge_phase == 1 && (i == m_i || i == m_j))  color = 0xFF4F4FFF;
            else if (sort_type == 6 && (i == tim_ins_j || i == m_i))                color = 0xFF4F4FFF;
        } else {
            color = 0xFF66BB6A; // Success State color output
        }
        draw_rect(x, y, bar_width - 1, bar_height, color);
    }
}


// clang --target=wasm32 `
//     -O3 `
//     -nostdlib `
//     "-Wl,--no-entry" `
//     "-Wl,--export-all" `
//     "-Wl,--allow-undefined" `
//     -o renderer.wasm main.c
