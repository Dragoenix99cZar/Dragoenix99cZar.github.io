var canvas = document.getElementsByTagName('canvas')[0];
var c = canvas.getContext('2d');
const WIDTH = 1200;
const HEIGHT = 600;
var container = {x:5,y:5,width:WIDTH,height:HEIGHT};

var mouse = {
    xPos : null,
    yPos : null
}

var score = 0;

// var ants = [{x:400,y:400,r:50,color:25,vx:6,vy:10},
//             {x:500,y:300,r:100,color:125,vx:2,vy:-8},
//             {x:800,y:350,r:25,color:285,vx:20,vy:-20},
//             {x:800,y:300,r:75,color:325,vx:13,vy:-8},
//             {x:400,y:200,r:20,color:175,vx:-24,vy:-6}   
// ];
xPalette = [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800];
yPalette = [200, 250, 300, 350, 400, 450];
// radiusPalette = [6, 8, 10, 12, 14, 16];
radiusPalette = [20, 24, 28];
colorPalette = [25, 50, 75, 100, 125, 150, 175, 200, 175, 285, 325, 220, 300, 320, 340];
// xVelocityPalette = [-20, -16, -12, -8, -4, 4, 8, 12, 16, 20];
// yVelocityPalette = [-20, -16, -12, -8, -4, 4, 8, 12, 16, 20];
velocityPalette = [-3, -2, 2, 3];

function distance(a, b){
    var x1 = a.x;
    var y1 = a.y;
    var x2 = b.x;
    var y2 = b.y;

    var dist = Math.sqrt( Math.pow( x2-x1, 2) + Math.pow( y2-y1, 2));

    return dist;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

canvas.addEventListener('click', function(e){
    const pos = {
        x: e.clientX,
        y: e.clientY
    };
    mouse = pos;
    // console.log(mouse);
    for (var i = 0 ; i < ants.length; i++ ){
        if ( mouse.x && mouse.y && ants[i].x && ants[i].y){
            var mouseDistance = distance(ants[i],mouse);
            if (mouseDistance < ants[i].r){
                destroyAnts(i);
            }
        }
    }        // console.log(circleArray);
});

function destroyAnts(index){
    ants.splice(index,1);
    // console.log('Destroyed');
    scoreChanger();
}

function scoreChanger()
{
    score++;
    document.getElementById('score').innerText = 'Score: '  + score;
}

function ant(){
    // this.x = xPalette[Math.floor(Math.random()*xPalette.length)];
    // this.y = yPalette[Math.floor(Math.random()*yPalette.length)];
    this.x = getRandomInt(20, WIDTH);
    this.y = getRandomInt(10, HEIGHT);
    this.r = radiusPalette[Math.floor(Math.random()*radiusPalette.length)];
    this.color = colorPalette[Math.floor(Math.random()*colorPalette.length)];
    this.vx = velocityPalette[Math.floor(Math.random()*velocityPalette.length)];
    this.vy = velocityPalette[Math.floor(Math.random()*velocityPalette.length)];

    this.circleInit = function(){
        c.fillStyle = 'hsl(' + this.color + ',100%,50%)';
        c.beginPath();
        c.arc(this.x,this.y,this.r,0,2*Math.PI,false);
        c.fill();
    }

    this.collide = function(){

        for(var j = 0; j < ants.length; j++ ){
            if(this == ants[j]) continue;
            // console.log((distance(this, ants[j]) - (this.r + ants[j].r)));
            if( (distance(this, ants[j]) - ((this.r + ants[j].r) + 3)) <= 0 ){

                this.x += 2; 
                this.y += 2;

                this.vx = -this.vx;
                this.vy = -this.vy;
                
                // console.log(this, ants[j]);
            }
        }
    }

}

var noOfAnts = 15;
var ants = [];
for(var i=0; i<noOfAnts; i++){
    ants.push(new ant());
}
// console.log(ants);

function draw(){
    c.fillStyle = 'black';
    c.strokeStyle = 'black';
    c.fillRect(container.x,container.y,container.width,container.height);

    for(var i=0; i <ants.length; i++){
        c.fillStyle = 'hsl(' + ants[i].color + ',100%,50%)';
        c.beginPath();
        c.arc(ants[i].x,ants[i].y,ants[i].r,0,2*Math.PI,false);
        c.fill();


        if((ants[i].x + ants[i].vx + ants[i].r > container.x + container.width) || (ants[i].x - ants[i].r + ants[i].vx < container.x)){
        ants[i].vx = - ants[i].vx;
        }
        if((ants[i].y + ants[i].vy + ants[i].r > container.y + container.height) || (ants[i].y - ants[i].r + ants[i].vy < container.y)){
         ants[i].vy = - ants[i].vy;
        }
        ants[i].x +=ants[i].vx;
        ants[i].y +=ants[i].vy;
    }

}

function animate(){
    
    c.clearRect(container.x,container.y,container.width,container.height);
    draw();
    // console.log("Entered");
    for(var i=0; i < ants.length; i++){
        // console.log("Entered");
        ants[i].collide();
    }

    requestAnimationFrame(animate);
}
animate();