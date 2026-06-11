#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "raylib.h"

#define SCREEN_WIDTH 1400
#define SCREEN_HEIGHT 960
#define MAX_BALLS 2000 // Safely handles massive amounts of balls now!

// --- Force Dedicated GPU Usage ---
#if defined(_WIN32) || defined(_WIN64)
    __declspec(dllexport) unsigned long NvOptimusEnablement = 0x00000001;
    __declspec(dllexport) int AmdPowerXpressRequestHighPerformance = 1;
#endif

typedef struct Ball {
    Vector2 position;
    Vector2 speed;
    float radius;
    Color color;
    bool active;
} Ball;

unsigned int GetHexFromString(const char* colorStr) {
    // dest needs exactly 9 bytes: 6 (RGB) + 2 (AA) + 1 ('\0')
    char dest[9];

    // 1. Copy exactly 6 characters skipping the '#' symbol (colorStr + 1)
    strncpy(dest, colorStr + 1, 8);
    
    // 2. Manually append 'ff' for full opacity Alpha channel
    // dest[6] = '3'; 
    // dest[7] = '3'; 
    dest[8] = '\0'; // Safe null termination

    printf("===========================\n");
    printf("src: %s\n", colorStr);
    printf("dst: 0x%s\n", dest);

    // 3. Convert hexadecimal string to unsigned integer using Base 16
    // NULL means we don't care about tracking the end pointer, 16 enforces Hex math.
    return (unsigned int)strtoul(dest, NULL, 16);
}

int main(void) {
    SetConfigFlags(FLAG_WINDOW_RESIZABLE);
    InitWindow(SCREEN_WIDTH, SCREEN_HEIGHT, "Raylib - Bulletproof Ball Splitter!");
    
    Color myCustomMidnightBlue = { 20, 30, 48, 255 };
    unsigned int bgCol = GetHexFromString("#172e51");
    printf("dst: %d\n", bgCol); // Output: World
    myCustomMidnightBlue = GetColor(bgCol);

#ifdef AMAN
    printf("---------------------AMAN-----------------\n");
#endif


    Ball balls[MAX_BALLS] = { 0 };
    int ballCount = 0;

    // Initialize the first ball
    balls[0].position = (Vector2){ 400.0f, 300.0f };
    balls[0].speed = (Vector2){ 500.0f, 200.0f }; 
    balls[0].radius = 20.0f;
    balls[0].color = MAROON;
    balls[0].active = true;
    ballCount = 1;

    // Generate color pool
    Color colorPool[MAX_BALLS] = { 0 };
    for (int i = 0; i < MAX_BALLS; i++) {
        colorPool[i] = (Color){ GetRandomValue(50, 230), GetRandomValue(50, 230), GetRandomValue(50, 230), 255 };
    }

    float sizeGrowRate = 0.95f;

    while (!WindowShouldClose()) {
        float dt = GetFrameTime(); 
        int screenWidth = GetScreenWidth();
        int screenHeight = GetScreenHeight();

        // Take a snapshot before entering the loop to avoid mid-frame counter issues
        int currentPoolSize = ballCount; 

        for (int i = 0; i < MAX_BALLS; i++) {
            if (!balls[i].active) continue;

            // 1. Move the ball
            balls[i].position.x += balls[i].speed.x * dt;
            balls[i].position.y += balls[i].speed.y * dt;

            // Flags to determine if a safe split should occur
            bool hitVerticalWall = false;
            bool hitHorizontalWall = false;

            // --- 2. ALWAYS GUARANTEE A PERFECT NATURAL BOUNCE FIRST ---
            
            // Hit LEFT or RIGHT wall (Vertical Limit)
            if ((balls[i].position.x <= balls[i].radius && balls[i].speed.x < 0) || 
                (balls[i].position.x >= (screenWidth - balls[i].radius) && balls[i].speed.x > 0)) {
                
                balls[i].speed.x *= -1.0f; // Invert direction safely
                hitVerticalWall = true;
            }
            
            // Hit TOP or BOTTOM wall (Horizontal Limit)
            if ((balls[i].position.y <= balls[i].radius && balls[i].speed.y < 0) || 
                (balls[i].position.y >= (screenHeight - balls[i].radius) && balls[i].speed.y > 0)) {
                
                balls[i].speed.y *= -1.0f; // Invert direction safely
                hitHorizontalWall = true;
            }

            // --- 3. HANDLE THE SPLITTING AS AN OPTIONAL EXTRA STEP ---
            if (currentPoolSize < MAX_BALLS) {
                
                if (hitVerticalWall) {
                    // Force parent ball UP with variation
                    balls[i].speed.y = -(float)GetRandomValue(300, 500);

                    if (balls[i].radius > 2.0f) {
                        balls[i].radius *= sizeGrowRate;
                    }

                    // Spawn child ball going DOWN
                    balls[ballCount].position = balls[i].position;
                    // Inherit the parent's newly inverted X speed!
                    balls[ballCount].speed = (Vector2){ balls[i].speed.x, (float)GetRandomValue(300, 500) }; 
                    balls[ballCount].radius = balls[i].radius;
                    balls[ballCount].color = colorPool[ballCount];
                    balls[ballCount].active = true;
                    ballCount++;
                }
                else if (hitHorizontalWall) {
                    // Retain the sign of the current speed direction, just add variance magnitude
                    float directionX = (balls[i].speed.x > 0) ? 1.0f : -1.0f;
                    balls[i].speed.x = directionX * (float)GetRandomValue(400, 600);

                    if (balls[i].radius > 2.0f) {
                        balls[i].radius *= sizeGrowRate;
                    }
                    
                    // Spawn child ball going in the opposite X direction
                    balls[ballCount].position = balls[i].position;
                    balls[ballCount].speed = (Vector2){ -balls[i].speed.x, balls[i].speed.y };
                    balls[ballCount].radius = balls[i].radius;
                    balls[ballCount].color = colorPool[ballCount];
                    balls[ballCount].active = true;
                    ballCount++;
                }
            }

            // --- 4. ANTI-STUCK CLAMPING ---
            if (balls[i].position.x < balls[i].radius) balls[i].position.x = balls[i].radius;
            if (balls[i].position.x > screenWidth - balls[i].radius) balls[i].position.x = screenWidth - balls[i].radius;
            if (balls[i].position.y < balls[i].radius) balls[i].position.y = balls[i].radius;
            if (balls[i].position.y > screenHeight - balls[i].radius) balls[i].position.y = screenHeight - balls[i].radius;
        }

        // --- UI Setup ---
        float baseWidth = 800.0f;
        float scale = (float)screenWidth / baseWidth;
        int fontSize = (int)(20 * scale);
        if (fontSize < 10) fontSize = 10;

        const char* countText = TextFormat("Balls: %d / %d", ballCount, MAX_BALLS);
        int textWidth = MeasureText(countText, fontSize);

        const char* ballPosXText = TextFormat("Last ball[%d] posX: %.2f", ballCount-1, balls[ballCount-1].position.x);

        // --- Render ---
        BeginDrawing();
            ClearBackground(myCustomMidnightBlue);
            // ClearBackground(BLACK);
            
            for (int i = 0; i < MAX_BALLS; i++) {
                if (balls[i].active) {
                    DrawCircleV(balls[i].position, balls[i].radius, balls[i].color);
                }
            }
            
            DrawText(countText, (screenWidth - textWidth) / 2, 40, fontSize, LIGHTGRAY);
            DrawText(ballPosXText, (screenWidth - textWidth) / 2 - 100, screenHeight - 60, fontSize, LIGHTGRAY);
            
            DrawFPS(10, 10);
        EndDrawing();
    }

    CloseWindow();
    return 0;
}
/*
Run:
gcc main2.c -o app.exe -lraylib -lopengl32 -lgdi32 -lwinmm & app.exe

cc main2.c -o app.exe -lraylib -lopengl32 -lgdi32 -lwinmm -DAMAN & app.exe
*/