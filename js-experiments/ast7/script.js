
window.onload = function() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const width = canvas.width 
  const height = canvas.height
  
  const bird = new Image();
  const bg = new Image();
  const fg = new Image();
  const pipeNorth = new Image();
  const pipeSouth = new Image();
  
  const pipe = [];
  const gap = 90;
  const GRAVITY = 1.5;
  
  let flag = false;
  let player;
  let score = 0;
  // let hiScore = 0;

  pipe[0] = {
      x : width,
      y : 0
  }

  
  class flappyBird {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.velY = 2;
      this.liftUp = this.liftUp.bind(this);
    }

    gameOver(){
      ctx.fillStyle = "#fff";
      ctx.font = "30px Verdana";
      ctx.fillText("Game Over",100,height - height/2);
    }

    render(){
      bg.src = "images/bg.png";
      fg.src = "images/fg.png";
      bird.src = "images/bird.png";
      pipeNorth.src = "images/pipeNorth.png";
      pipeSouth.src = "images/pipeSouth.png";

      ctx.drawImage(bg,0,0);
      ctx.drawImage(bird,this.x,this.y);

      for(let i = 0; i < pipe.length; i++){      
        let constant = pipeNorth.height+gap;
        pipe[i].x--;
        if( pipe[i].x == 125 ){
          pipe.push({
            x : width + 10,
            y : Math.floor(Math.random()*pipeNorth.height)-pipeNorth.height
          }); 
        }
        ctx.drawImage(pipeNorth,pipe[i].x,pipe[i].y);
        ctx.drawImage(pipeSouth,pipe[i].x,pipe[i].y+constant);

        if( this.x + bird.width >= pipe[i].x && this.x <= pipe[i].x + pipeNorth.width && 
            (this.y <= pipe[i].y + pipeNorth.height || this.y+bird.height >= pipe[i].y+constant) || 
            this.y + bird.height >=  height - fg.height
          )
        {
            flag = true;
            location.reload(); // reload the page
        }
        if(pipe[i].x == 5){
          score++;
          // if( score > hiScore) hiScore = score;
        }
      }
      ctx.drawImage(fg,0,height-fg.height);
    }
    
    update() {
      document.addEventListener('keydown', this.liftUp)
      this.y += GRAVITY;
    }

    liftUp(){
      this.y -= 35;
    }
    changeScore(){
      ctx.fillStyle = "#000";
      ctx.font = "20px Verdana";
      ctx.fillText("Score : "+score,10,height-20);
      // ctx.fillText("Hi-Score : "+hiScore,50,height-20);
    }
  }
  //class - ends here
  

  //on each frame
  function draw() {
    player.render();
    player.update();
    player.changeScore();  
  }

  //At startup
  function setup() {
    player = new flappyBird(0,Math.random() * height - (fg.height+20));
  }
  
  //animation frame
  function animate() {
    draw();
    window.requestAnimationFrame(animate);
  }
  
  setup();
  animate();
}