### Raylib link

```https://github.com/raysan5/raylib/releases/tag/6.0```
[Download Page](https://github.com/raysan5/raylib/releases/tag/6.0)

### Option 1: Static Linking
This bakes raylib directly into your executable so you don't need to carry the .dll file around.

Bash

```gcc main.c -o game.exe -I./raylib/include -L./raylib/lib -lraylib -lopengl32 -lgdi32 -lwinmm```


### Option 2: Dynamic Linking
This keeps the executable smaller, but you must copy raylib.dll into the same folder as your game.exe for it to run.

Bash

```gcc main.c -o game.exe -I./raylib/include -L./raylib/lib -lraylibdll```
Breakdown of the flags used:
 - -I./raylib/include: Tells the compiler where to find raylib.h.

 - -L./raylib/lib: Tells the compiler where to find the library files (.a).

 - -lraylib / -lraylibdll: Specifies which raylib library to link against.

 - -lopengl32 -lgdi32 -lwinmm: These are standard Windows system libraries that raylib relies on to open windows and handle graphics/audio.

### Folder Structure

```
D:.
│   app.exe
│   main.c
│   main2.c
│
└───raylib
    ├───include
    │       raylib.h
    │       raymath.h
    │       rlgl.h
    │
    └───lib
            libraylib.a
            libraylibdll.a
            raylib.dll
```