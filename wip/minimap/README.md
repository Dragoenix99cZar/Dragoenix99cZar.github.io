# Logarithmic & Compressed Minimaps in HTML5 Canvas

A collection of interactive JavaScript/HTML5 Canvas simulations demonstrating **Proximity-Biased (Fish-Eye) Minimaps** compared alongside standard linear coordinate planes. 

These projects showcase how non-linear coordinate compression can prevent distant objects or fast-moving particles from clipping off a game's UI boundaries, ensuring constant situational awareness.

---

## Project 1: Fish-Eye vs Normal Linear Minimap

A lightweight, real-time visualization demonstrating how points of interest (POIs) close to a player retain high-precision spacing, while distant elements exponentially compress onto the outer rim of the screen.

### Features
- **Fish-Eye Radial Map:** Compresses distant coordinates log-exponentially based on the radius from the origin ($r' = R_{max} \cdot \frac{\ln(1 + \alpha \cdot r)}{\ln(1 + \alpha \cdot D_{max})}$). 
- **Standard Linear Map:** A uniform equidistant layout mapping objects directly to visual pixel scales.
- **Dynamic Blip Sizing:** Automatically shrinks distant map icons so they do not cluster or overlap aggressively near the outer horizon.

---

## Project 2: N-Body Simulation - Fish-Eye vs Linear Minimap

An advanced, physics-driven implementation that applies the fish-eye coordinate layout to an **N-Body Gravity Simulation**. It perfectly demonstrates how chaotic orbital mechanics and slingshotted particles can be monitored seamlessly without losing them past screen edges.

### Features
- **True O(N²) Gravitational Physics:** Every floating body exerts and experiences dynamic gravitational acceleration based on Newton's Law of Universal Gravitation ($F = G \frac{m_1 m_2}{r^2}$).
- **Event Horizon Monitoring:** High-velocity particles slingshotted into deep space never clip off the screen on the Fish-Eye plane; they smoothly glide along the outer rim.
- **Pre-configured Orbit System:** Starts with a supermassive central anchor star holding a cluster of planets and rogue particles in complex, swirling paths.
- **Interactive Controls:** Toggle the existence of the central sun or reset the universe to generate entirely new celestial bodies.

### Mathematical Concept
Standard logarithmic coordinates grow infinitely *larger* as you expand outward. To achieve **outward compression** where grid cells get *smaller* toward the boundary, the map employs a reversed radial logarithmic scaling factor:

$$\text{UI Scale Factor} = \frac{\ln(1 + \alpha \cdot r)}{\ln(1 + \alpha \cdot D_{max})}$$

---

## Customization Parameters

You can open the `.js` files and easily modify the following variables to change the simulation mechanics:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `MAX_TRACKING_DIST` | Number | `1000` | The real-world tracking horizon limit (meters). |
| `COMPRESSION_ALPHA` | Number | `0.02` | Adjusts how aggressively distant objects pack together near the edge. |
| `G` | Number | `0.2` | Gravitational constant controlling system acceleration. |

## 📝 License
This project is open-source and free to use for game development, academic study, or visual experimentation.
