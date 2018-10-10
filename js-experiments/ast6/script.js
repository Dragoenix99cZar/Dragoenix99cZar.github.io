var canvas = document.getElementById('track');
var ctx = canvas.getContext('2d');
var scoreBoard = document.getElementById('score-board');
// var carSound = document.getElementById('car-sound');

var WIDTH = canvas.width;
var HEIGHT = canvas.height;

/* Background class to render background onto canvas
500*500 image is made into single image of 1500*500
*/
function Background(){
  var bgImg = new Image();
  bgImg.src = 'background.png';

  this.x = 0;
  this.y = 0;

  var self = this;

  this.update = function(){
    renderBg();
  };

  var renderBg = function(){
    ctx.drawImage(bgImg, self.x-=2, 0);
    if(self.x <= -550){
      self.x = 0;
    }
  };

};

/*Car class*/
function Car(){
  var carImg = new Image();
  carImg.src = 'car3.png';

  this.x = 15;
  this.y = 22;
  this.width = 90;
  this.height = 45;
  this.offset = 15;

  var self = this;

  this.update = function(){
    renderCar();
  };

  var renderCar = function(){
    //rules
    if(self.x < 0){
      self.x = 0;
    }else if(self.x > WIDTH-self.width){
      self.x = WIDTH-self.width;
    }else if(self.y < 0){
      self.y = 0;
    }else if(self.y > HEIGHT-self.height){
      self.y = HEIGHT-self.height;
    }

    ctx.drawImage(carImg, self.x, self.y, self.width, self.height);
  };

};


/*Enemy class*/
function Enemy(){
  var self = this;

  var enemyImg = new Image();
  enemyImg.src = 'enemy.png';
  
  this.x = 100;
  this.y = 100;
  this.width = 90;
  this.height = 45;
  this.noOfEnemies = 100;
  this.maxWidth = 20000; // maximum width upto which the boxes will come
  this.minWidth = 600;
  this.enemyMovementRate = 3;
  this.randomX = [];// pushed by randXGenerator()
  this.randomY = [];

  this.randXGenerator = function(){
    for(var i=0; i<self.noOfEnemies; i++){
      var ranVal = Math.floor((Math.random()*self.maxWidth + this.minWidth));
      self.randomX.push(ranVal);
    }
  };
  this.randYGenerator = function(){
    for(var i=0; i<self.noOfEnemies; i++){
      var ranVal = Math.floor((Math.random()*(WIDTH-50) + 15));
      self.randomY.push(ranVal);
    }
  };
  this.randXGenerator();
  this.randYGenerator();

  //console.log(this.randomX, this.randomY);


  this.update = function(){
    renderEnemy();
  };

  var renderEnemy = function(){
    //rules
    if(self.x < 0){
      self.x = 0;
    }else if(self.x > WIDTH-self.width){
      self.x = WIDTH-self.width;
    }else if(self.y < 0){
      self.y = 0;
    }else if(self.y > HEIGHT-self.height){
      self.y = HEIGHT-self.height;
    }

    for(var i=0; i<self.randomX.length; i++){
      spawnEnemy(self.randomX[i]-=self.enemyMovementRate, self.randomY[i]);
    }

  };

  // var makeRectangle = function(ranX, ranY){
  //   ctx.beginPath();
  //   ctx.rect(ranX, ranY, self.width, self.height);
  //   ctx.fillStyle = "#fcb449";
  //   ctx.fill();
  //   ctx.closePath();
  // };

  var spawnEnemy = function(ranX, ranY){
    ctx.drawImage(enemyImg, ranX, ranY, self.width, self.height);
  };

};


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}




/* Main game class that contains game loop*/
function Game(){

  var UP_ARROW = 38;
  var LEFT_ARROW = 37;
  var DOWN_ARROW = 40;
  var RIGHT_ARROW = 39;

  var bg = '';
  var car = '';
  var enemy = '';

  this.score = 0;

  var self = this;

  //game loop
  this.draw = function(){
    ctx.clearRect(0, 0, WIDTH, HEIGHT);//clearing the canvas
    //update()
    bg.update();
    car.update();
    enemy.update();

    self.score++;
    displayScore();

    self.collisonDetection();
  };

  this.init = function() {
    //console.log('Game started!');
    //initialize elments and objects
    bg = new Background();
    car = new Car();
    enemy = new Enemy();

    setInterval(self.draw, 10);

    //event listener for keydown
    document.addEventListener('keydown', function(event){
      if(event.keyCode == UP_ARROW){car.y-=car.offset;}
      else if(event.keyCode == DOWN_ARROW){car.y+=car.offset;}
      else if(event.keyCode == LEFT_ARROW){car.x-=car.offset;}
      else if(event.keyCode == RIGHT_ARROW){car.x+=car.offset;}
    }, false);
  };

  this.collisonDetection = function(){
    for(var i=0; i<enemy.randomX.length; i++){
      if(car.x < enemy.randomX[i] + enemy.width && car.x + enemy.width > enemy.randomX[i] &&
         car.y < enemy.randomY[i] + enemy.height && car.y + enemy.height > enemy.randomY[i])
      {
        //console.log('collision!');
        // carSound.play();
        delete car.x;
        delete car.y;
        alert('Game over! Play again?');
        location.reload();
      }
    }

  };

  var displayScore = function(){
    scoreBoard.innerHTML = self.score;
  };


};


var game = new Game();
game.init();
