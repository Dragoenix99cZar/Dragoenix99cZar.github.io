const SIZE = 800;
const WIDTH = 1 * SIZE;
const HEIGHT = 1 * SIZE;

// const ctxCube = cube.getContext("2d");
// cube.width = WIDTH;
// cube.height = HEIGHT;

const ctxAK = ak.getContext("2d");
ak.width = WIDTH;
ak.height = HEIGHT;

const ctxTree = tree.getContext("2d");
tree.width = WIDTH;
tree.height = HEIGHT;

const ctxMonkey = monkey.getContext("2d");
monkey.width = WIDTH;
monkey.height = HEIGHT;


// console.log("canvas: ", game);

const BG_COLOR = "#181818";
const FG_COLOR = '#50FF50';

const P_SIZE = 1

// console.log("Context 2d: ", ctx);

function clear(context){
    context.fillStyle = BG_COLOR;
    context.fillRect(0, 0, WIDTH, HEIGHT);
}

function point(context, {x, y}){
    context.fillStyle = '#FF5022';
    context.fillRect(x - P_SIZE*0.5, y - P_SIZE*0.5, P_SIZE, P_SIZE);
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

function DrawLine(context, p1, p2){
    context.lineWidth = 3;
    context.strokeStyle = FG_COLOR;
    context.beginPath();
    context.moveTo(p1.x, p1.y);
    context.lineTo(p2.x, p2.y);
    context.stroke();
}


const FPS = 60;
const DELTA_TIME = 1 / FPS;

// let dz = ZOOM_LEVEl;
// let updateRate = DRAW_RATE;
let angle = 0;

let sub_ak = 1;
let sub_tree = 1;
let sub_monkey = 1;
let framecount_ak = 0
let framecount_tree = 0
let framecount_monkey = 0

function draw(context, _vertices, _faces, _offset, updateRate, _framecount, _sub){
  // dz += 1 * DELTA_TIME;
  angle += 0.001 * Math.PI;// * DELTA_TIME;

  const linesToDraw = _faces.slice(0, _sub);

  clear(context);
  // for(const p of _vertices){
  //     point(
  //         context,
  //         viewport(
  //             project(
  //                 translate_offset(
  //                     rotate_xz(p, angle),
  //                     _offset
  //                 )
  //             )
  //         )
  //     );
  // }
  for(const face of linesToDraw) {
      for (let j = 0; j < face.length; j++) {
          const a = _vertices[face[j]];
          const b = _vertices[face[(j+1)%face.length]];
          // console.log("a: " + a.x + ", b: " + b.x);
          // DrawLine(
          //     viewport(project(translate_z(rotate_xz(a, angle), dz))),
          //     viewport(project(translate_z(rotate_xz(b, angle), dz)))
          // );
          DrawLine(
              context,
              viewport(project(translate_offset(rotate_xz(a, angle), _offset))),
              viewport(project(translate_offset(rotate_xz(b, angle), _offset)))
          );
      }
  }
  // _framecount++;
  // if((_framecount % updateRate) === 0){
  //     sub = (sub < _vertices.length)? sub + 1 : _faces.length;
  //     _framecount = 0;
  // }

  _framecount++;
  if (_framecount % updateRate === 0) { _sub = _sub < _faces.length ? _sub + 1 : _faces.length; _framecount = 0; }
  return {
    framecount: _framecount,
    sub: _sub
  };

    // point(viewport(project({x:  0.0, y: 0.9, z:  1})));
}


function frame() {
  // draw(ctxCube, cube_vertices, cube_faces, cube_OFFSET, cube_DRAW_RATE);
  let ak = draw(
    ctxAK,
    ak_vertices,
    ak_faces,
    ak_OFFSET,
    ak_DRAW_RATE,
    framecount_ak,
    sub_ak
  );
  framecount_ak = ak.framecount;
  sub_ak = ak.sub;

  let tree = draw(
    ctxTree,
    tree_vertices,
    tree_faces,
    tree_OFFSET,
    tree_DRAW_RATE,
    framecount_tree,
    sub_tree
  );
  framecount_tree = tree.framecount;
  sub_tree = tree.sub;

  let monkey = draw(
    ctxMonkey,
    monkey_vertices,
    monkey_faces,
    monkey_OFFSET,
    monkey_DRAW_RATE,
    framecount_monkey,
    sub_monkey
  );
  framecount_monkey = monkey.framecount;
  sub_monkey = monkey.sub;

  // setTimeout(frame, 1000 / FPS);
  requestAnimationFrame(frame);
}

// setTimeout(frame, 1000 / FPS);
requestAnimationFrame(frame);




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
