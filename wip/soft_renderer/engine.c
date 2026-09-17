// Import math functions from JavaScript host environment
// extern float sinf(float rad);
// extern float cosf(float rad);


float sinf(float rad);
float cosf(float rad);

// Data structures
typedef struct {
    float x;
    float y;
    float z;
} Vec3;

typedef struct {
    float x;
    float y;
    int visible; // 1 if within near/far plane, 0 otherwise
} Point2D;

typedef struct {
    float x, y, z;
    float rotX, rotY, rotZ;
} Camera;

// Global state
static Camera camera = { 0.0f, 0.0f, -4.0f, 0.0f, 0.0f, 0.0f };
static const float NEAR_PLANE = 0.5f;
static const float FAR_PLANE = 25.0f;
static const float FOV = 800.0f;
static const float FLOOR_Y = 1.0f;
static const Vec3 LIGHT_POS = { 4.0f, -5.0f, -4.0f };

// Shared memory arrays for JS-C interop
static Vec3 in_vertices[256];
static Point2D out_points[256];

// Exported getters for WASM memory access in JS
Vec3* get_in_vertices_ptr() { return in_vertices; }
Point2D* get_out_points_ptr() { return out_points; }

void set_camera(float x, float y, float z, float rotX, float rotY, float rotZ) {
    camera.x = x;
    camera.y = y;
    camera.z = z;
    camera.rotX = rotX;
    camera.rotY = rotY;
    camera.rotZ = rotZ;
}

// Local Y-axis rotation
Vec3 rotate_y(Vec3 v, float angle) {
    float c = cosf(angle);
    float s = sinf(angle);
    Vec3 result = {
        v.x * c - v.z * s,
        v.y,
        v.x * s + v.z * c
    };
    return result;
}

// Convert World Space to Camera View Space
Vec3 world_to_camera_space(Vec3 v) {
    // 1. Relative translation
    float x = v.x - camera.x;
    float y = v.y - camera.y;
    float z = v.z - camera.z;

    // 2. Yaw (rotY)
    if (camera.rotY != 0.0f) {
        float cosfY = cosf(-camera.rotY);
        float sinfY = sinf(-camera.rotY);
        float x1 = x * cosfY - z * sinfY;
        float z1 = x * sinfY + z * cosfY;
        x = x1; z = z1;
    }

    // 3. Pitch (rotX)
    if (camera.rotX != 0.0f) {
        float cosfX = cosf(-camera.rotX);
        float sinfX = sinf(-camera.rotX);
        float y1 = y * cosfX - z * sinfX;
        float z1 = y * sinfX + z * cosfX;
        y = y1; z = z1;
    }

    // 4. Roll (rotZ)
    if (camera.rotZ != 0.0f) {
        float cosfZ = cosf(-camera.rotZ);
        float sinfZ = sinf(-camera.rotZ);
        float x1 = x * cosfZ - y * sinfZ;
        float y1 = x * sinfZ + y * cosfZ;
        x = x1; y = y1;
    }

    Vec3 res = { x, y, z };
    return res;
}

// Project Camera Space point to Screen Coordinates
Point2D project_camera_space(Vec3 cam_point, float screen_width, float screen_height) {
    Point2D p;
    if (cam_point.z < NEAR_PLANE || cam_point.z > FAR_PLANE) {
        p.visible = 0;
        return p;
    }

    p.x = (cam_point.x * FOV) / cam_point.z + (screen_width / 2.0f);
    p.y = (cam_point.y * FOV) / cam_point.z + (screen_height / 2.0f);
    p.visible = 1;
    return p;
}

// Shadow ray plane projection onto floor
Vec3 project_shadow_vertex(Vec3 v) {
    float dx = v.x - LIGHT_POS.x;
    float dy = v.y - LIGHT_POS.y;
    float dz = v.z - LIGHT_POS.z;

    float t = (FLOOR_Y - LIGHT_POS.y) / dy;

    Vec3 shadow = {
        LIGHT_POS.x + dx * t,
        FLOOR_Y,
        LIGHT_POS.z + dz * t
    };
    return shadow;
}

// Process array of vertices (Transform & Project)
void transform_and_project_batch(int count, float width, float height) {
    for (int i = 0; i < count; i++) {
        Vec3 cam_space = world_to_camera_space(in_vertices[i]);
        out_points[i] = project_camera_space(cam_space, width, height);
    }
}

// Process shadow batch
void project_shadow_batch(int count, float width, float height) {
    for (int i = 0; i < count; i++) {
        Vec3 shadow_world = project_shadow_vertex(in_vertices[i]);
        Vec3 cam_space = world_to_camera_space(shadow_world);
        out_points[i] = project_camera_space(cam_space, width, height);
    }
}

// Rotate array of vertices on Y-axis
void rotate_y_batch(int count, float angle) {
    for (int i = 0; i < count; i++) {
        in_vertices[i] = rotate_y(in_vertices[i], angle);
    }
}



/*
 * clang --target=wasm32 --no-standard-libraries "-Wl,--no-entry" "-Wl,--export-all" "-Wl,--allow-undefined" -o engine.wasm engine.c
 */
