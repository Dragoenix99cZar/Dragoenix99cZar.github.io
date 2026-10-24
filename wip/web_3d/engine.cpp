extern "C" {
    extern unsigned char __heap_base;
}

typedef unsigned long size_t;

#define WASM_EXPORT extern "C" __attribute__((visibility("default")))

struct Vec3 {
    float x, y, z;
};

static float viewport_width = 800.0f;
static float viewport_height = 800.0f;

static float mat_model_cube[16];
static float mat_view[16];
static float mat_projection[16];
static float mat_light_space[16];
static Vec3 light_pos = { 3.0f, 8.0f, 3.0f };

static unsigned char* heap_top = &__heap_base;

void* custom_malloc(size_t size) {
    size = (size + 7) & ~7;
    void* allocated_block = heap_top;
    heap_top += size;
    return allocated_block;
}

struct Vector {
    void* data = nullptr;
    size_t count = 0;
    size_t capacity = 0;
    size_t stride = sizeof(float);

    void init(size_t initial_capacity, size_t element_stride) {
        stride = element_stride;
        capacity = initial_capacity;
        count = 0;
        data = custom_malloc(capacity * stride);
    }

    void push(const void* element_ptr) {
        if (count >= capacity) {
            size_t old_byte_size = capacity * stride;
            capacity = (capacity == 0) ? 4 : capacity * 2;
            void* new_data = custom_malloc(capacity * stride);
            char* dest = (char*)new_data;
            char* src = (char*)data;
            for (size_t i = 0; i < old_byte_size; i++) dest[i] = src[i];
            data = new_data;
        }
        char* target_address = (char*)data + (count * stride);
        char* source_address = (char*)element_ptr;
        for (size_t b = 0; b < stride; b++) target_address[b] = source_address[b];
        count++;
    }
};

static Vector cube_vertices;
static Vector cube_normals;
static Vector floor_vertices;
static Vector floor_normals;

float compute_sqrt(float x) {
    if (x <= 0.0f) return 0.0f;
    float val = x;
    for(int i = 0; i < 10; i++) val = 0.5f * (val + x / val);
    return val;
}

float compute_sin(float x) {
    while (x > 3.14159265f) x -= 6.2831853f;
    while (x < -3.14159265f) x += 6.2831853f;
    float x2 = x * x;
    return x * (1.0f - x2 / 6.0f * (1.0f - x2 / 20.0f * (1.0f - x2 / 42.0f)));
}

float compute_cos(float x) {
    return compute_sin(x + 1.57079632f);
}

void int_matrix_identity(float* m) {
    for (int i = 0; i < 16; i++) m[i] = 0.0f;
    m[0] = 1.0f; m[5] = 1.0f; m[10] = 1.0f; m[15] = 1.0f;
}

void matrix_multiply(float* out, const float* a, const float* b) {
    float res[16];
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            res[i * 4 + j] =
                a[i * 4 + 0] * b[0 * 4 + j] +
                a[i * 4 + 1] * b[1 * 4 + j] +
                a[i * 4 + 2] * b[2 * 4 + j] +
                a[i * 4 + 3] * b[3 * 4 + j];
        }
    }
    for (int i = 0; i < 16; i++) out[i] = res[i];
}

void make_lookat(float* m, Vec3 eye, Vec3 center, Vec3 up) {
    Vec3 f = { center.x - eye.x, center.y - eye.y, center.z - eye.z };
    float len = compute_sqrt(f.x * f.x + f.y * f.y + f.z * f.z);
    if (len != 0.0f) { f.x /= len; f.y /= len; f.z /= len; }

    Vec3 s = { f.y * up.z - f.z * up.y, f.z * up.x - f.x * up.z, f.x * up.y - f.y * up.x };
    len = compute_sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
    if (len != 0.0f) { s.x /= len; s.y /= len; s.z /= len; }

    Vec3 u = { s.y * f.z - s.z * f.y, s.z * f.x - s.x * f.z, s.x * f.y - s.y * f.x };

    m[0] = s.x;  m[4] = s.y;  m[8] = s.z;   m[12] = -(s.x * eye.x + s.y * eye.y + s.z * eye.z);
    m[1] = u.x;  m[5] = u.y;  m[9] = u.z;   m[13] = -(u.x * eye.x + u.y * eye.y + u.z * eye.z);
    m[2] = -f.x; m[6] = -f.y; m[10] = -f.z; m[14] =  (f.x * eye.x + f.y * eye.y + f.z * eye.z);
    m[3] = 0.0f; m[7] = 0.0f; m[11] = 0.0f;   m[15] = 1.0f;
}

void make_perspective(float* m, float fov, float aspect, float near, float far) {
    float tanHalfFov = compute_sin(fov * 0.5f) / compute_cos(fov * 0.5f);
    for (int i = 0; i < 16; i++) m[i] = 0.0f;
    m[0] = 1.0f / (aspect * tanHalfFov);
    m[5] = -1.0f / tanHalfFov;
    m[10] = -(far + near) / (far - near);
    m[11] = -1.0f;
    m[14] = -(2.0f * far * near) / (far - near);
}

void make_ortho(float* m, float left, float right, float bottom, float top, float near, float far) {
    for (int i = 0; i < 16; i++) m[i] = 0.0f;
    m[0] = 2.0f / (right - left);
    m[5] = 2.0f / (top - bottom);
    m[10] = -2.0f / (far - near);
    m[12] = -(right + left) / (right - left);
    m[13] = -(top + bottom) / (top - bottom);
    m[14] = -(far + near) / (far - near);
    m[15] = 1.0f;
}

WASM_EXPORT void init_engine() {
    cube_vertices.init(36, sizeof(Vec3));
    cube_normals.init(36, sizeof(Vec3));
    floor_vertices.init(6, sizeof(Vec3));
    floor_normals.init(6, sizeof(Vec3));

    Vec3 box[8] = {
        {-1.0f, -1.0f,  1.0f}, { 1.0f, -1.0f,  1.0f},
        { 1.0f,  1.0f,  1.0f}, {-1.0f,  1.0f,  1.0f},
        {-1.0f, -1.0f, -1.0f}, { 1.0f, -1.0f, -1.0f},
        { 1.0f,  1.0f, -1.0f}, {-1.0f,  1.0f, -1.0f}
    };
    int indices[36] = {
        0,1,2, 2,3,0, 1,5,6, 6,2,1, 5,4,7, 7,6,5,
        4,0,3, 3,7,4, 3,2,6, 6,7,3, 4,5,1, 1,0,4
    };
    Vec3 norm_up = {0.0f, 1.0f, 0.0f};
    for (int i = 0; i < 36; i++) {
        cube_vertices.push(&box[indices[i]]);
        cube_normals.push(&norm_up);
    }

    Vec3 f1 = {-12.0f, 1.0f, -12.0f};
    Vec3 f2 = { 12.0f, 1.0f, -12.0f};
    Vec3 f3 = { 12.0f, 1.0f,  12.0f};
    Vec3 f4 = {-12.0f, 1.0f,  12.0f};

    floor_vertices.push(&f1); floor_vertices.push(&f2); floor_vertices.push(&f3);
    floor_vertices.push(&f3); floor_vertices.push(&f4); floor_vertices.push(&f1);

    for(int i = 0; i < 6; i++) floor_normals.push(&norm_up);

    int_matrix_identity(mat_model_cube);
    int_matrix_identity(mat_view);
    int_matrix_identity(mat_projection);
    int_matrix_identity(mat_light_space);
}

WASM_EXPORT void update_viewport(float w, float h) {
    viewport_width = w;
    viewport_height = h;
}

static float cam_yaw = 0.0f;
static float cam_pitch = 0.0f;
static Vec3 cam_pos = {0.0f, 0.0f, -5.0f};
static Vec3 cam_forward = {0.0f, 0.0f, 1.0f};

WASM_EXPORT void update_controls(float moveX, float moveY, float moveZ, float mouseX, float mouseY) {
    cam_yaw = mouseX;
    cam_pitch = mouseY;

    if (cam_pitch > 1.4f) cam_pitch = 1.4f;
    if (cam_pitch < -1.4f) cam_pitch = -1.4f;

    cam_forward.x = compute_cos(cam_yaw) * compute_cos(cam_pitch);
    cam_forward.y = compute_sin(cam_pitch);
    cam_forward.z = compute_sin(cam_yaw) * compute_cos(cam_pitch);

    float speed = 0.05f;

    // W/S: Moves along the camera's look direction
    cam_pos.x += cam_forward.x * moveZ * speed;
    cam_pos.z += cam_forward.z * moveZ * speed;

    // A/D: World-Aligned Strafing strictly along the world X-axis (1, 0, 0)
    cam_pos.x += moveX * speed;

    // Q/E: Vertical elevation
    cam_pos.y += moveY * speed;
}

WASM_EXPORT void step_simulation() {
    static float time = 0.0f;
    time += 0.015f;

    int_matrix_identity(mat_model_cube);
    float s = compute_sin(time);
    float c = compute_cos(time);

    mat_model_cube[0] = c;  mat_model_cube[2] = s;
    mat_model_cube[8] = -s; mat_model_cube[10] = c;

    Vec3 target = {
        cam_pos.x + cam_forward.x,
        cam_pos.y + cam_forward.y,
        cam_pos.z + cam_forward.z
    };
    Vec3 up = { 0.0f, 1.0f, 0.0f };
    make_lookat(mat_view, cam_pos, target, up);
    make_perspective(mat_projection, 1.047f, viewport_width / viewport_height, 0.1f, 100.0f);

    float mat_light_view[16];
    float mat_light_proj[16];
    Vec3 target_zero = {0.0f, 0.0f, 0.0f};
    make_lookat(mat_light_view, light_pos, target_zero, up);
    make_ortho(mat_light_proj, -7.0f, 7.0f, -7.0f, 7.0f, 1.0f, 20.0f);
    matrix_multiply(mat_light_space, mat_light_proj, mat_light_view);
}

WASM_EXPORT float* get_camera_position() { return (float*)&cam_pos; }
WASM_EXPORT float* get_camera_forward()  { return (float*)&cam_forward; }

WASM_EXPORT float* get_cube_vertices()      { return (float*)cube_vertices.data; }
WASM_EXPORT float* get_cube_normals()       { return (float*)cube_normals.data; }
WASM_EXPORT float* get_floor_vertices()     { return (float*)floor_vertices.data; }
WASM_EXPORT float* get_floor_normals()      { return (float*)floor_normals.data; }
WASM_EXPORT float* get_cube_model_matrix()  { return mat_model_cube; }
WASM_EXPORT float* get_view_matrix()        { return mat_view; }
WASM_EXPORT float* get_projection_matrix()  { return mat_projection; }
WASM_EXPORT float* get_light_space_matrix() { return mat_light_space; }
WASM_EXPORT float* get_light_position()     { return (float*)&light_pos; }

// clang++ --target=wasm32 -nostdlib "-Wl,--no-entry" "-Wl,--export-all" "-Wl,--allow-undefined" -O3 -o engine.wasm engine.cpp
