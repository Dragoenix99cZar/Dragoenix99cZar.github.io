var canvas = null;
var ctx = null;

var timer = 0;

var spritesheet = null;
var spritesheetLoaded = false;

var world = [[]];

var pathDensity = 0.68;

var worldWidth = 16;
var worldHeight = 16;

var tileWidth = 32;
var tileHeight = 32;

var pathStart = [worldWidth,worldHeight];
var pathEnd = [0,0];
var currentPath = [];

// ensure that concole.log doesn't cause errors
//if (typeof console == "undefined") var console = { log: function() {} };

function onload()
{
	// console.log('Page loaded.');
	canvas = document.getElementById('gameCanvas');
	canvas.width = worldWidth * tileWidth;
	canvas.height = worldHeight * tileHeight;
	canvas.addEventListener("click", canvasClick, false);
	// if (!canvas) alert('Blah!');
	ctx = canvas.getContext("2d");
	// if (!ctx) alert('Hmm!');
	spritesheet = new Image();
	spritesheet.src = 'spritesheet.png';
	spritesheet.onload = loaded;
}

// the spritesheet is loaded
function loaded()
{
	// console.log('Spritesheet Ready.');
	spritesheetLoaded = true;
	createWorld();
}

// fill the world with walls
function createWorld()
{
	// console.log('Creating world...');

	// create emptiness
	for (var x=0; x < worldWidth; x++)
	{
		world[x] = [];

		for (var y=0; y < worldHeight; y++)
		{
			world[x][y] = 0;
		}
	}

	// scatter some walls
	for (var x=0; x < worldWidth; x++)
	{
		for (var y=0; y < worldHeight; y++)
		{
			if (Math.random() > pathDensity)
			world[x][y] = 1;
		}
	}

	currentPath = [];
	while (currentPath.length == 0)
	{
		pathStart = [Math.floor(Math.random()*worldWidth),Math.floor(Math.random()*worldHeight)];
		pathEnd = [Math.floor(Math.random()*worldWidth),Math.floor(Math.random()*worldHeight)];
		if (world[pathStart[0]][pathStart[1]] == 0)
		currentPath = findPath(world,pathStart,pathEnd);
	}
	redraw();
}

function redraw()
{
	if (!spritesheetLoaded) return;

	// console.log('redrawing...');

	// var spriteNum = 0;

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for (var x=0; x < worldWidth; x++){
		for (var y=0; y < worldHeight; y++){

			// choose a sprite to draw
			switch(world[x][y]){
			case 1:
				spriteNum = 1;
				break;
			default:
				spriteNum = 0;
				break;
			}

			ctx.drawImage(spritesheet,
			spriteNum*tileWidth, 0,
			tileWidth, tileHeight,
			x*tileWidth, y*tileHeight,
			tileWidth, tileHeight);
		}
	}

	// draw the path
	// console.log('Current path length: '+currentPath.length);
	var pathText = document.getElementById('pathLength');
	if( currentPath.length === 0){
		pathText.style.margin = '16px auto';
		pathText.style.fontAlign = 'center';
		pathText.style.width = '200px';
		pathText.style.color = 'red';
		pathText.style.fontSize = '20px';
		pathText.innerText = "Path doesn't exist!!!";
	} else {
		pathText.style.color = 'black';
		pathText.style.fontSize = '16px';
		pathText.innerText = 'Current path length: '+currentPath.length;	
	}
	





	var coord = 'Start: (' + pathStart[0] + ',' + pathStart[1] + '), Goal: (' + pathEnd[0] + ',' + pathEnd[1] + ')';
	document.getElementById('coordinates').innerText = coord;
	// for (rp=0; rp<currentPath.length; rp++)
	// {
	// 	switch(rp)
	// 	{
	// 	case 0:
	// 		spriteNum = 2; // start
	// 		break;
	// 	case currentPath.length-1:
	// 		spriteNum = 3; // end
	// 		break;
	// 	default:
	// 		spriteNum = 4; // path node
	// 		// spriteNum = 0; // path node
	// 		break;
	// 	}
	// 	ctx.drawImage(spritesheet,
	// 		spriteNum*tileWidth, 0,
	// 		tileWidth, tileHeight,
	// 		currentPath[rp][0]*tileWidth,
	// 		currentPath[rp][1]*tileHeight,
	// 		tileWidth, tileHeight);
		
	// }	
	 
 	showPath();
	// setTimeout( showPath(), 50);

}
var ref;
function showPath(){
	var spriteNum = 0;
	let i=0;
	var subCurrentPath = [];
	ref = setInterval(function(){
	// for (let i = 0; i < currentPath.length; i++) {
		// console.log(subCurrentPath);
		subCurrentPath.push(currentPath[i]);

		for (var k = 0; k < closedSet.length; k++) {
			try{
				ctx.drawImage(spritesheet,
					5*tileWidth, 0,
					tileWidth, tileHeight,
					closedSet[k][0]*tileWidth,
					closedSet[k][1]*tileHeight,
					tileWidth, tileHeight);
			} catch(error){
				console.log(error);
				// createWorld();
				// onload();
				clearInterval(ref)
			}

		}

		for (let j = 0; j < subCurrentPath.length; j++) {
			switch(j)
			{
			case 0:
				spriteNum = 2; // start
				break;
			case currentPath.length-1:
				spriteNum = 3; // end
				break;
			default:
				spriteNum = 4; // path node
				// spriteNum = 0; // path node
				break;
			}
			try{
				ctx.drawImage(spritesheet,
					spriteNum*tileWidth, 0,
					tileWidth, tileHeight,
					subCurrentPath[j][0]*tileWidth,
					subCurrentPath[j][1]*tileHeight,
					tileWidth, tileHeight);
			} catch(error){
				console.log(error);
				// createWorld();
				// onload();
				clearInterval(ref)
			}
		}

	
	(i < currentPath.length-1)? i++: clearInterval(ref);
	}, 50);
// }


	
}


function canvasClick(e)
{
	var x;
	var y;

	clearInterval(ref);

	// grab html page coords
	if (e.pageX != undefined && e.pageY != undefined)
	{
		x = e.pageX;
		y = e.pageY;
	}
	else
	{
		x = e.clientX + document.body.scrollLeft +
		document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop +
		document.documentElement.scrollTop;
	}

	// make them relative to the canvas only
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	// return tile x,y that we clicked
	var cell =
	[
	Math.floor(x/tileWidth),
	Math.floor(y/tileHeight)
	];

	// now we know while tile we clicked
	// console.log('Clicked tile (x,y): '+cell[0]+','+cell[1]);
	// console.log(currentPath);
	pathStart = pathEnd;
	pathEnd = cell;


	
	// calculate path
	currentPath = findPath(world,pathStart,pathEnd);

	try{
		ctx.drawImage(spritesheet,
			2*tileWidth, 0,
			tileWidth, tileHeight,
			currentPath[0][0]*tileWidth,
			currentPath[0][1]*tileHeight,
			tileWidth, tileHeight);	

		ctx.drawImage(spritesheet,
			3*tileWidth, 0,
			tileWidth, tileHeight,
			currentPath[currentPath.length - 1][0]*tileWidth,
			currentPath[currentPath.length - 1][1]*tileHeight,
			tileWidth, tileHeight);	
	} catch(err){
		console.log(err);
		// createWorld();
	}

	redraw();
}

var closedSet;	

function findPath(world, pathStart, pathEnd)
{
	closedSet = [];	
	
	var	abs = Math.abs;
	var	max = Math.max;
	var	pow = Math.pow;
	var	sqrt = Math.sqrt;

	var maxWalkableTileNum = 0;

	var worldWidth = world[0].length;
	var worldHeight = world.length;
	var worldSize =	worldWidth * worldHeight;

	var distanceFunction = ManhattanDistance;
	var findNeighbours = function(){};

	function ManhattanDistance(Point, Goal)
	{	
		return abs(Point.x - Goal.x) + abs(Point.y - Goal.y);
		// return sqrt(pow(Point.x - Goal.x, 2) + pow(Point.y - Goal.y, 2));
	}

	function Neighbours(x, y)
	{
		var	North = y - 1,
		South = y + 1,
		East = x + 1,
		West = x - 1,
		myNorth = North > -1 && canWalkHere(x, North),
		mySouth = South < worldHeight && canWalkHere(x, South),
		myEast = East < worldWidth && canWalkHere(East, y),
		myWest = West > -1 && canWalkHere(West, y),
		result = [];
		if(myNorth)
		result.push({x:x, y:North});
		if(myEast)
		result.push({x:East, y:y});
		if(mySouth)
		result.push({x:x, y:South});
		if(myWest)
		result.push({x:West, y:y});
		// findNeighbours(myNorth, mySouth, myEast, myWest, North, South, East, West, result);
		return result;
	}

	// returns boolean value (world cell is available and open)
	function canWalkHere(x, y)
	{
		return ((world[x] != null) &&
			(world[x][y] != null) &&
			(world[x][y] <= maxWalkableTileNum));
	};

	function Node(Parent, Point)
	{
		var newNode = {
			
			Parent:Parent,
			
			value:Point.x + (Point.y * worldWidth),
			
			x:Point.x,
			y:Point.y,
			
			f:0,
			g:0
		};

		return newNode;
	}

	// Path function, executes AStar algorithm operations
	function calculatePath()
	{
		
		var	mypathStart = Node(null, {x:pathStart[0], y:pathStart[1]});
		var mypathEnd = Node(null, {x:pathEnd[0], y:pathEnd[1]});
		
		var AStar = new Array(worldSize);
		
		var Open = [mypathStart];
		var Closed = [];
		
		var result = [];
		
		var myNeighbours;
		var myNode;
		var myPath;
		
		var length, max, min, i, j;
		
		while(length = Open.length){
			max = worldSize;
			min = -1;
			for(i = 0; i < length; i++){
				if(Open[i].f < max)
				{
					max = Open[i].f;
					min = i;
				}
			}
			
			myNode = Open.splice(min, 1)[0];
			
			if(myNode.value === mypathEnd.value){
				myPath = Closed[Closed.push(myNode) - 1];
				do{
					result.push([myPath.x, myPath.y]);
				}while (myPath = myPath.Parent);
			
				AStar = Closed = Open = [];
				
				result.reverse();
			}else {
				
				myNeighbours = Neighbours(myNode.x, myNode.y);
				// test each one that hasn't been tried already
				for(i = 0, j = myNeighbours.length; i < j; i++){
					myPath = Node(myNode, myNeighbours[i]);
					if (!AStar[myPath.value]){
						
						myPath.g = myNode.g + distanceFunction(myNeighbours[i], myNode);
						myPath.f = myPath.g + distanceFunction(myNeighbours[i], mypathEnd);
						
						Open.push(myPath);
						
						AStar[myPath.value] = true;
					}
				}
				// console.log(myNode);
				closedSet.push([myNode.x, myNode.y]);
				Closed.push(myNode);
			}
		}
		return result;
	}
	var calcPath = calculatePath();
	// console.log(calcPath);
	return calcPath;

} // end of findPath() function

