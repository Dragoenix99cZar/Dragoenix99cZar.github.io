# 2D Line Drawing Algorithms

Extracted from *Computer Graphics – Chapter 3: Two Dimensional Algorithms*
(Direct/Incremental method, DDA, Bresenham).

---

## 1. Direct (Incremental) Line Drawing Algorithm

Uses the straight-line equation directly.

**Given:** endpoints `(x1, y1)` and `(x2, y2)`

```
m = (y2 - y1) / (x2 - x1)        # slope
b = y1 - m * x1                  # y-intercept
```

Since a line is a sequence of pixels, stepping `x` by `Δx` implies a step in `y`:

```
Δy = m * Δx
y(k+1) = y(k) + m * Δx
```

Conversely, stepping `y` by `Δy` implies a step in `x`:

```
Δx = Δy / m
x(k+1) = x(k) + (1/m) * Δy
```

### Mathematical interpretation

| Condition        | Effect                                      |
|-------------------|----------------------------------------------|
| `\|m\| < 1`        | small vertical, large horizontal deflection  |
| `\|m\| > 1`        | small horizontal, large vertical deflection  |
| `\|m\| = 1`        | equal horizontal & vertical deflection       |
| `\|m\| = 0`        | horizontal line                              |
| `\|m\| = ∞`        | vertical line                                |

### Drawbacks
- Needs floating-point add/multiply at every step.
- Each computed coordinate must be rounded → staircase effect.
- Recomputes `m` implicitly every step (via the line equation).

---

## 2. Digital Differential Analyzer (DDA)

Approximates each pixel to the nearest whole number by repeated addition of the
slope, computing `m` **once** instead of every step.

Number of steps = `max(|Δx|, |Δy|)`.

**Slope `|m| < 1`, moving left→right (positive slope):**
```
x(k+1) = x(k) + 1
y(k+1) = y(k) + m
```

**Slope `|m| > 1`, moving left→right (positive slope):**
```
x(k+1) = x(k) + 1/m
y(k+1) = y(k) + 1
```

(Right→left and negative-slope cases mirror these with `-1` / `-1/m`.)

### Advantages over the direct method
- Faster: avoids the raw `y = mx + c` evaluation every step.
- No repeated floating-point multiply for the line equation.

### Limitations
- `m` is stored as floating point → rounding error accumulates.
- Long lines drift from the true path.

**Worked example** — endpoints `(2,1)` → `(8,3)`, `m = 1/3 ≈ 0.333 (<1)`:

| k | x | y (accum.) | rounded |
|---|---|-----------|---------|
| 0 | 2 | 1.000     | (2,1)   |
| 1 | 3 | 1.333     | (3,1)   |
| 2 | 4 | 1.667     | (4,2)   |
| 3 | 5 | 2.000     | (5,2)   |
| 4 | 6 | 2.333     | (6,2)   |
| 5 | 7 | 2.667     | (7,3)   |
| 6 | 8 | 3.000     | (8,3)   |

---

## 3. Bresenham's Line Algorithm (BLA)

Uses **only integer** arithmetic via a decision parameter `P(k)`, avoiding
rounding error entirely. Works for any octant and can be extended to circles/ellipses
(unlike DDA).

### Case `|m| ≤ 1` (sampling along x)

```
Δx = x2 - x1
Δy = y2 - y1
P0 = 2*Δy - Δx                       # initial decision parameter

at each step k, x(k+1) = x(k) + 1:
  if P(k) > 0:
      y(k+1) = y(k) + 1
      P(k+1) = P(k) + 2*Δy - 2*Δx
  else:
      y(k+1) = y(k)
      P(k+1) = P(k) + 2*Δy
```

### Case `|m| > 1` (sampling along y)

```
Δx = x2 - x1
Δy = y2 - y1
P0 = 2*Δx - Δy                       # initial decision parameter

at each step k, y(k+1) = y(k) + 1:
  if P(k) > 0:
      x(k+1) = x(k) + 1
      P(k+1) = P(k) + 2*Δx - 2*Δy
  else:
      x(k+1) = x(k)
      P(k+1) = P(k) + 2*Δx
```

### Why Bresenham beats DDA
- Every successive point is computed in **integer** arithmetic → less time, less memory.
- No end-of-calculation rounding → no accumulated rounding error → an accurate line.
- The same decision-parameter technique generalizes to circles, ellipses, and other curves;
  DDA does not.

**Worked example** — endpoints `(20,10)` → `(30,18)`, `Δx=10, Δy=8`, `|m|=0.8 ≤ 1`:

`P0 = 2*8 - 10 = 6`

| k | P(k) | x(k+1) | y(k+1) |
|---|------|--------|--------|
| 0 | 6    | 21     | 11     |
| 1 | 2    | 22     | 12     |
| 2 | -2   | 23     | 12     |
| 3 | 14   | 24     | 13     |
| 4 | 10   | 25     | 14     |
| 5 | 6    | 26     | 15     |
| 6 | 2    | 27     | 16     |
| 7 | -2   | 28     | 16     |
| 8 | 14   | 29     | 17     |
| 9 | 10   | 30     | 18     |

### All-octant generalization (used in the C implementation)

A single loop that handles every slope and direction without branching on `|m|`:

```
dx  = |x2 - x1|
dy  = -|y2 - y1|
sx  = (x1 < x2) ? 1 : -1
sy  = (y1 < y2) ? 1 : -1
err = dx + dy

loop:
  plot(x1, y1)
  if x1 == x2 and y1 == y2: stop
  e2 = 2 * err
  if e2 >= dy: err += dy; x1 += sx
  if e2 <= dx: err += dx; y1 += sy
```

This is algebraically equivalent to the two cased forms above but merges the
`|m| ≤ 1` and `|m| > 1` branches into one integer-only loop — this is the version
implemented in `line_draw.c`.



### Run Cmd

```
clang --target=wasm32 -O2 -nostdlib -Wl,--no-entry -Wl,--export-all -Wl,--allow-undefined -o line_draw.wasm line_draw.c
```
or emscripten
```
emcc line_draw.c -O2 -s STANDALONE_WASM=1 --no-entry -s EXPORTED_FUNCTIONS=_get_width,_get_height,_get_buffer,_clear,_draw_line_direct,_draw_line_dda,_draw_line_bresenham -o line_draw.wasm
```
