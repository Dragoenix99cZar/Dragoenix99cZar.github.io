const SIZE = 800;
const WIDTH = 1 * SIZE;
const HEIGHT = 1 * SIZE;

// console.log("canvas: ", game);
game.width = WIDTH;
game.height = HEIGHT;

const BG_COLOR = "#181818";
const FG_COLOR = '#50FF50';

const P_SIZE = 8


const ctx = game.getContext("2d");
// console.log("Context 2d: ", ctx);

function clear(){
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function point({x, y}){
    ctx.fillStyle = '#FF5022';
    ctx.fillRect(x - P_SIZE*0.5, y - P_SIZE*0.5, P_SIZE, P_SIZE);
}

function viewport(p){
    // -1..1 => 0..2 => 0..1 => 0..W Normalize
    return {
        x: (p.x + 1)/2 * WIDTH,
        y: (1 - (p.y + 1)/2) * HEIGHT
    };
}

function project({x, y, z}){
    return {
        x: x/z,
        y: y/z
    };
}

function translate_z(p, dz){
    return {
        x: p.x,
        y: p.y,
        z: p.z + dz
    };
}
function translate_offset(p, offset){
    return {
        x: p.x + offset.x,
        y: p.y + offset.y,
        z: p.z + offset.z
    };
}

function rotate_xz(p, angle){
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: p.x * cos - p.z * sin,
        y: p.y,
        z: p.x * sin + p.z * cos
    };
}

function DrawLine(p1, p2){
    ctx.lineWidth = 3;
    ctx.strokeStyle = FG_COLOR;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}


const FPS = 60;
const DELTA_TIME = 1 / FPS;    

// let dz = ZOOM_LEVEL;
let updateRate = DRAW_RATE;
let angle = 0;

let sub = 1;
let framecount = 0;

function draw(){
    // dz += 1 * DELTA_TIME;
    angle += 0.5 * Math.PI * DELTA_TIME;

    const linesToDraw = faces.slice(0, sub);
    
    clear();        
    // for(const p of pointsToDraw){
    //     point(viewport(project(translate_z(rotate_xz(p, angle), dz))));
    // }
    for(const face of linesToDraw) {
        for (let j = 0; j < face.length; j++) {
            const a = vertices[face[j]];
            const b = vertices[face[(j+1)%face.length]];
            // console.log("a: " + a.x + ", b: " + b.x);
            // DrawLine(
            //     viewport(project(translate_z(rotate_xz(a, angle), dz))),
            //     viewport(project(translate_z(rotate_xz(b, angle), dz)))
            // );
            DrawLine(
                viewport(project(translate_offset(rotate_xz(a, angle), OFFSET))),
                viewport(project(translate_offset(rotate_xz(b, angle), OFFSET)))
            );
        }
    }
    framecount++;
    if(framecount === updateRate){
        sub = (sub < vertices.length)? sub + 1 : faces.length;
        framecount = 0;
    }

    // point(viewport(project({x:  0.0, y: 0.9, z:  1})));
}


function frame() {
    draw();
    setTimeout(frame, 1000 / FPS);
}

setTimeout(frame, 1000 / FPS);



// import bpy

// # Get the active object
// obj = bpy.context.active_object

// # Check if an object is selected and if it's a mesh
// if obj and obj.type == 'MESH':
//     mesh = obj.data
    
//     # 1. Format the Vertices
//     print("const vertices = [")
//     for vertex in mesh.vertices:
//         # co represents local coordinates (x, y, z)
//         # Rounding to 4 decimal places for clean output
//         x = round(vertex.co.x, 4)
//         y = round(vertex.co.y, 4)
//         z = round(vertex.co.z, 4)
//         print(f"    {{x: {x:5}, y: {y:5}, z: {z:5}}},")
//     print("];\n")
    
//     # 2. Format the Faces
//     print("const faces = [")
//     for poly in mesh.polygons:
//         # poly.vertices gives a list of vertex indices for that face
//         indices = list(poly.vertices)
//         print(f"    {indices},")
//     print("]")

// else:
//     print("Please select a valid Mesh object in the 3D viewport.")