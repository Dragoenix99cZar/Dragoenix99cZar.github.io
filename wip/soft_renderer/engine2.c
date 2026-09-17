float sinf(float rad);
float cosf(float rad);
float hypotf(float x, float y, float z);

typedef struct { float x, y, z; } Vec3;
typedef struct { float x, y, isVisible; } Point2D;
typedef struct { int vIdx; int vnIdx; } FaceVertex;
typedef struct { FaceVertex vertices[4]; int vertCount; } Face;
typedef struct { float x, y, z; float rotX, rotY, rotZ; } Camera;

#define MAX_VERTICES (1024*4)
#define MAX_FACES (4000*5)
#define MAX_OBJ_SIZE (200*1000)

// Buffers matching your architecture
Vec3 in_vertices[MAX_VERTICES];
Point2D out_points[MAX_VERTICES];

char obj_text_buffer[MAX_OBJ_SIZE];
Vec3 parsed_vertices[(4000*5)];
Vec3 parsed_normals[(4000*5)];
Face parsed_faces[MAX_FACES];

int vertex_count = 0;
int normal_count = 0;
int face_count = 0;

float face_depths[MAX_FACES];
float face_lighting[MAX_FACES];

static Camera camera = { 0.0f, 3.0f, -8.0f, 0.2f, 0.0f, 0.0f };
static const float FOV = 800.0f;
static const float NEAR_PLANE = 0.1f;
static const Vec3 LIGHT_POS = { 5.0f, 10.0f, -5.0f };
static const Vec3 LIGHT_DIR = { 0.309f, -0.618f, -0.494f };

// Pointers exposed to JavaScript
Vec3* get_in_vertices_ptr() { return in_vertices; }
Point2D* get_out_points_ptr() { return out_points; }
char* get_obj_buffer_ptr() { return obj_text_buffer; }
float* get_face_depths_ptr() { return face_depths; }
float* get_face_lighting_ptr() { return face_lighting; }
Face* get_parsed_faces_ptr() { return parsed_faces; }

void set_camera(float x, float y, float z, float rotX, float rotY, float rotZ) {
    camera.x = x; camera.y = y; camera.z = z;
    camera.rotX = rotX; camera.rotY = rotY; camera.rotZ = rotZ;
}

// Math & Transformations
Vec3 world_to_camera_space(Vec3 v) {
    float x = v.x - camera.x;
    float y = v.y - camera.y;
    float z = v.z - camera.z;

    if (camera.rotY != 0.0f) {
        float cosY = cosf(-camera.rotY), sinY = sinf(-camera.rotY);
        float x1 = x * cosY - z * sinY;
        float z1 = x * sinY + z * cosY;
        x = x1; z = z1;
    }

    if (camera.rotX != 0.0f) {
        float cosX = cosf(-camera.rotX), sinX = sinf(-camera.rotX);
        float y1 = y * cosX - z * sinX;
        float z1 = y * sinX + z * cosX;
        y = y1; z = z1;
    }

    Vec3 res = { x, y, z };
    return res;
}

Point2D project_camera_space(Vec3 cam, float width, float height) {
    Point2D pt;
    if (cam.z < NEAR_PLANE) {
        pt.x = 0; pt.y = 0; pt.isVisible = 0.0f;
    } else {
        pt.x = (cam.x * FOV) / cam.z + (width / 2.0f);
        pt.y = -(cam.y * FOV) / cam.z + (height / 2.0f);
        pt.isVisible = 1.0f;
    }
    return pt;
}

Vec3 project_shadow_vertex(Vec3 v) {
    float t = (0.0f - v.y) / (v.y - LIGHT_POS.y);
    Vec3 shadow_world;
    shadow_world.x = v.x + t * (v.x - LIGHT_POS.x);
    shadow_world.y = 0.001f; // Avoid Z-fighting on ground plane
    shadow_world.z = v.z + t * (v.z - LIGHT_POS.z);
    return shadow_world;
}

// WASM Batch Processing API Functions
void transform_and_project_batch(int count, float width, float height) {
    for (int i = 0; i < count; i++) {
        Vec3 cam_space = world_to_camera_space(in_vertices[i]);
        out_points[i] = project_camera_space(cam_space, width, height);
    }
}

void project_shadow_batch(int count, float width, float height) {
    for (int i = 0; i < count; i++) {
        Vec3 shadow_world = project_shadow_vertex(in_vertices[i]);
        Vec3 cam_space = world_to_camera_space(shadow_world);
        out_points[i] = project_camera_space(cam_space, width, height);
    }
}

// OBJ Text Parsing Engine
static int is_space(char c) { return c == ' ' || c == '\t' || c == '\r'; }

static float parse_float(const char** p) {
    while (is_space(**p)) (*p)++;
    float sign = 1.0f;
    if (**p == '-') { sign = -1.0f; (*p)++; }
    else if (**p == '+') { (*p)++; }

    float val = 0.0f;
    while (**p >= '0' && **p <= '9') { val = val * 10.0f + (**p - '0'); (*p)++; }
    if (**p == '.') {
        (*p)++;
        float frac = 0.1f;
        while (**p >= '0' && **p <= '9') { val += (**p - '0') * frac; frac *= 0.1f; (*p)++; }
    }
    return val * sign;
}

static int parse_int(const char** p) {
    while (is_space(**p)) (*p)++;
    int val = 0;
    while (**p >= '0' && **p <= '9') { val = val * 10 + (**p - '0'); (*p)++; }
    return val;
}

void parse_obj_data(int length) {
    vertex_count = 0; normal_count = 0; face_count = 0;
    const char* p = obj_text_buffer;
    const char* end = obj_text_buffer + length;

    while (p < end) {
        while (p < end && is_space(*p)) p++;
        if (p >= end) break;
        if (*p == '#') { while (p < end && *p != '\n') p++; p++; continue; }

        if (*p == 'v' && *(p + 1) == ' ') {
            p += 2;
            if (vertex_count < 4000) {
                parsed_vertices[vertex_count].x = parse_float(&p);
                parsed_vertices[vertex_count].y = parse_float(&p);
                parsed_vertices[vertex_count].z = parse_float(&p);
                vertex_count++;
            }
        } else if (*p == 'v' && *(p + 1) == 'n' && *(p + 2) == ' ') {
            p += 3;
            if (normal_count < 4000) {
                parsed_normals[normal_count].x = parse_float(&p);
                parsed_normals[normal_count].y = parse_float(&p);
                parsed_normals[normal_count].z = parse_float(&p);
                normal_count++;
            }
        } else if (*p == 'f' && *(p + 1) == ' ') {
            p += 2;
            if (face_count < MAX_FACES) {
                Face f; f.vertCount = 0;
                while (*p != '\n' && *p != '\r' && p < end && f.vertCount < 4) {
                    while (is_space(*p)) p++;
                    if (*p == '\n' || *p == '\r' || p >= end) break;

                    int v = parse_int(&p) - 1;
                    int vn = -1;
                    if (*p == '/') {
                        p++;
                        if (*p != '/') parse_int(&p);
                        if (*p == '/') { p++; vn = parse_int(&p) - 1; }
                    }
                    f.vertices[f.vertCount].vIdx = v;
                    f.vertices[f.vertCount].vnIdx = vn;
                    f.vertCount++;
                }
                parsed_faces[face_count++] = f;
            }
        }
        while (p < end && *p != '\n') p++;
        if (p < end && *p == '\n') p++;
    }
}

int prepare_model_faces() {
    for (int i = 0; i < face_count; i++) {
        Face f = parsed_faces[i];
        float sum_z = 0.0f;

        for (int j = 0; j < f.vertCount; j++) {
            Vec3 cam = world_to_camera_space(parsed_vertices[f.vertices[j].vIdx]);
            sum_z += cam.z;
        }
        face_depths[i] = sum_z / (float)f.vertCount;

        Vec3 normal = { 0.0f, 0.0f, 0.0f };
        if (f.vertices[0].vnIdx >= 0 && f.vertices[0].vnIdx < normal_count) {
            normal = parsed_normals[f.vertices[0].vnIdx];
        } else {
            Vec3 v0 = parsed_vertices[f.vertices[0].vIdx];
            Vec3 v1 = parsed_vertices[f.vertices[1].vIdx];
            Vec3 v2 = parsed_vertices[f.vertices[2].vIdx];

            float ax = v1.x - v0.x, ay = v1.y - v0.y, az = v1.z - v0.z;
            float bx = v2.x - v0.x, by = v2.y - v0.y, bz = v2.z - v0.z;

            normal.x = ay * bz - az * by;
            normal.y = az * bx - ax * bz;
            normal.z = ax * by - ay * bx;

            float len = hypotf(normal.x, normal.y, normal.z);
            if (len > 0.0f) {
                normal.x /= len; normal.y /= len; normal.z /= len;
            }
        }

        float dot = -(normal.x * LIGHT_DIR.x + normal.y * LIGHT_DIR.y + normal.z * LIGHT_DIR.z);
        if (dot < 0.15f) dot = 0.15f;
        if (dot > 1.0f) dot = 1.0f;
        face_lighting[i] = dot;
    }
    return face_count;
}

int get_vertex_count() { return vertex_count; }
Vec3* get_parsed_vertices_ptr() { return parsed_vertices; }
