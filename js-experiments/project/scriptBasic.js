let canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEIGHT = 640;
const WIDTH = 640;

canvas.height = HEIGHT;
canvas.width = WIDTH;

let mousePos = {
    mouseX : null,
    mouxeY : null,
}

// var mapArray = [
// 		[0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0],
// 		[0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0],
// 		[0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0],
// 		[0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0],
// 		[0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0],
// 		[0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0],
// 		[0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0],
// 		[0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0],
// 		[0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0],
// 		[0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0],
// 		[0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0],
// 		[0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0],
// 		[0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0],
// 		[0,0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0],
// 		[0,0,0,0,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0],
// 		[0,0,0,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0],
// 		[0,0,0,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0],
// 		[0,0,0,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0],
// 		[0,0,0,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0],
// 		[0,0,0,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,0,0]
// ];

let mapArray = [[]];

let obstacleDensity = 0.45;

let mapHeight = 20;	//no. of tiles
let mapWidth = 20;	//no. of tiles

let grass = new Image();
let cactus = new Image();
let path = new Image();

path.src = 'path.png';
grass.src = 'grass.png';
cactus.src = 'cactus.png';

const spriteWidth = 32;
const spriteHeight = 32;

let posX = 0;
let posY = 0;



function update() {
	for (let i = 0; i < mapArray.length; i++) {
		for (var j = 0; j < mapArray[i].length; j++) {
			if ( mapArray[i][j] === 0) {
				// console.log(posX, posY);
				ctx.drawImage(cactus, posX, posY, spriteWidth, spriteHeight);
			}
			if ( mapArray[i][j] === 1) {
				ctx.drawImage(grass, posX, posY, spriteWidth, spriteHeight);
			}
			if ( mapArray[i][j] === 2) {
				ctx.drawImage(path, posX, posY, spriteWidth, spriteHeight);
			}
			posX += spriteWidth;
		}
		posX = 0;
		posY += spriteHeight;
	}
	posY = 0;
    // console.log('Done!!!');


}

function start(){
    ctx.fillStyle = 'gray';
    ctx.fillRect(0,0,HEIGHT,WIDTH);

    for (let i=0; i < mapWidth; i++){
		mapArray[i] = [];
		for (let j=0; j < mapHeight; j++){
			mapArray[i][j] = 0;
		}
	}
	// console.log(mapArray);
    for (let i=0; i < mapWidth; i++){
		for (let j=0; j < mapHeight; j++){
			if (Math.random() > obstacleDensity)
			mapArray[i][j] = 1;
		}
	}
	// console.log(mapArray);
}

function animate(){
    update();
    window.requestAnimationFrame(animate);
}

start();
animate();








canvas.addEventListener('click', function(e){
    mousePos = {
        mouseX : e.clientX,
        mouxeY : e.clientY,
    }
    // console.log(mousePos);
    let coordY = Math.floor(mousePos.mouseX/spriteWidth);
    let coordX = Math.floor(mousePos.mouxeY/spriteHeight);
    console.log("X: "+coordY, "Y: "+coordX);
	// console.log(mapArray[coordX][coordY]);

    (mapArray[coordX][coordY] === 1) ? console.log("1 -> 0"): console.log("0 -> 1");
    mapArray[coordX][coordY] = (mapArray[coordX][coordY] === 1) ? 0: 1;
    // (mapArray[coordX][coordY] === 1) ? console.log("-> 1"): console.log("-> 0");
    // if(mapArray[coordX][coordY] === 1){
    // 	mapArray[coordY][coordX] = 0;
    // } else {
    // 	mapArray[coordY][coordX] = 1;
    // }
});


canvas.addEventListener('contextmenu', function(ev){
    mousePos = {
        mouseX : ev.clientX,
        mouxeY : ev.clientY,
    }
    console.log(mousePos);
    let coordY = Math.floor(mousePos.mouseX/spriteWidth);
    let coordX = Math.floor(mousePos.mouxeY/spriteHeight);
    console.log("X: "+coordY, "Y: "+coordX);
	// console.log(mapArray[coordX][coordY]);

    
    mapArray[coordX][coordY] = 2
});

// class point{
//     constructor(data){
//         this.x = data.mouseX;
//         this.y = data.mouxeY;
//         this.radius = 1.5;
//     }
// }



// // function minMaxNormalization( oldValue, oldMin, oldMax, newMin, newMax){    
// //     return (newMin + (newMax - newMin) * ( oldValue - oldMin)/( oldMax - oldMin)); 
// // }