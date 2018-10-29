let canvas = null;
let ctx = null;

let spritesheet = null;
let spritesheetLoaded = false;

let world = [[]];

let pathDensity = 0.7;

let worldWidth = 18;
let worldHeight = 18;

let tileWidth = 32;
let tileHeight = 32;

let pathStart = [worldWidth,worldHeight];
let pathEnd = [0,0];
let currentPath = [];
let closedSet = [];	

let pathAnimationTime = 40;
let ref1;	//ClosedPath setInterval reference
let ref2;	//Path setInterval reference
let ref3;	//Move Start Point setInterval reference

let pathText = document.getElementById('pathLength');
let coord = document.getElementById('coordinates');
let activeButton = document.getElementsByClassName('btnActive')[0].style;
let inactiveButton = document.getElementsByClassName('btnInactive')[0].style;

function onload()
{
	canvas = document.getElementById('gameCanvas');
	canvas.width = worldWidth * tileWidth;
	canvas.height = worldHeight * tileHeight;
	canvas.addEventListener("click", canvasClick, false);
	ctx = canvas.getContext("2d");
	spritesheet = new Image();
	spritesheet.src = 'spritesheet.png';
	spritesheet.onload = loaded;

	pathText.style.margin = "5px auto";
	pathText.style.fontAlign = 'center';
	pathText.style.width = '300px';
}

// the spritesheet is loaded
function loaded()
{
	spritesheetLoaded = true;
	createWorld();
}

// fill the world with walls
function createWorld()
{
	// create emptiness
	for (let x=0; x < worldWidth; x++)
	{
		world[x] = [];

		for (let y=0; y < worldHeight; y++)
		{
			world[x][y] = 0;
		}
	}

	// scatter some obstacles
	for (let x=0; x < worldWidth; x++)
	{
		for (let y=0; y < worldHeight; y++)
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

	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for (let x=0; x < worldWidth; x++){
		for (let y=0; y < worldHeight; y++){

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

	try{
		ctx.drawImage(spritesheet,
			2*tileWidth, 0,
			tileWidth, tileHeight,
			pathStart[0]*tileWidth,
			pathStart[1]*tileHeight,
			tileWidth, tileHeight);	
		ctx.drawImage(spritesheet,
			3*tileWidth, 0,
			tileWidth, tileHeight,
			pathEnd[0]*tileWidth,
			pathEnd[1]*tileHeight,
			tileWidth, tileHeight);	
	} catch(err){
		console.log(err);
	}

	
	if( currentPath.length === 0){
		pathText.style.color = 'red';
		pathText.style.fontSize = '20px';
		pathText.innerText = "Path doesn't exist!!!";		
	} else {
		pathText.style.color = 'rgb(26, 66, 58)';
		pathText.style.fontSize = '18px';
		let tmpText = 
		pathText.innerText = '\nCurrent Path Information: \nLength: ' + (currentPath.length-1) + 
							 ' steps\nCost: ' + (closedSet.length * pathAnimationTime / 1000) + ' sec\n';;

		coord.innerText = 'Start: (' + pathStart[0] + ',' + pathStart[1] + '), Goal: (' + pathEnd[0] + ',' + pathEnd[1] + ')\n\n';;

		activeButton.display = 'none';
		inactiveButton.display = 'block';

	 	showClosedPath();
 	}
}

function showClosedPath(){
	clearInterval(ref1);
	let i=0;
	let subClosedSet = [];
	if( currentPath.length === 0){
		try{
			ctx.drawImage(spritesheet,
				2*tileWidth, 0,
				tileWidth, tileHeight,
				closedSet[0][0]*tileWidth,
				closedSet[0][1]*tileHeight,
				tileWidth, tileHeight);	

			ctx.drawImage(spritesheet,
				3*tileWidth, 0,
				tileWidth, tileHeight,
				currentPath[currentPath.length - 1][0]*tileWidth,
				currentPath[currentPath.length - 1][1]*tileHeight,
				tileWidth, tileHeight);	
		} catch(err){
			console.log(err);
		}
	} else {
		ref1 = setInterval(function(){
			subClosedSet.push(closedSet[i]);

			for (let k = 1; k < subClosedSet.length; k++) {
				let infoText = document.getElementById('pathLength');
				infoText.innerText = '\nCurrent Path Information: \nLength: ' + (currentPath.length-1) + 
									 ' steps\nCost: ' + (subClosedSet.length * pathAnimationTime / 1000) + ' sec\n';
				try{
					spriteNum = 5;
					ctx.drawImage(spritesheet,
					spriteNum*tileWidth, 0,
					tileWidth, tileHeight,
					subClosedSet[k][0]*tileWidth,
					subClosedSet[k][1]*tileHeight,
					tileWidth, tileHeight);
				} catch(error){
					console.log(error);
					clearInterval(ref1)
				}
			}
			(i < closedSet.length-1)? i++: clearInterval(ref1);
		}, pathAnimationTime);
		setTimeout( showPath, closedSet.length * pathAnimationTime);
	}	
}

function showPath(){
	clearInterval(ref1);
	let spriteNum = 0;
	let k=0;
	let subCurrentPath = [];
	ref2 = setInterval(function(){
		subCurrentPath.push(currentPath[k]);

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
				clearInterval(ref2)
			}
		}
		(k < currentPath.length-1)? k++: clearInterval(ref2);
	}, pathAnimationTime - 20);
	setTimeout( moveStartPoint, currentPath.length * (pathAnimationTime - 20) + 20);
}

function moveStartPoint(){
	clearInterval(ref1);
	clearInterval(ref2);
	let spriteNum = 2;
	let k=0;
	let subCurrentPath = [];
	ref3 = setInterval(function(){
		subCurrentPath.push(currentPath[k]);
		for (let j = 0; j < subCurrentPath.length; j++) {
			try{
				ctx.drawImage(spritesheet,
					spriteNum*tileWidth, 0,
					tileWidth, tileHeight,
					subCurrentPath[j][0]*tileWidth,
					subCurrentPath[j][1]*tileHeight,
					tileWidth, tileHeight);
				if( j > 0){
					ctx.drawImage(spritesheet,
					4*tileWidth, 0,
					tileWidth, tileHeight,
					subCurrentPath[j-1][0]*tileWidth,
					subCurrentPath[j-1][1]*tileHeight,
					tileWidth, tileHeight);
				}
			} catch(error){
				console.log(error);
				clearInterval(ref3)
			}
		}
		if(subCurrentPath.length === currentPath.length){
			inactiveButton.display = "none";
			activeButton.display = "block";
		}
		(k < currentPath.length-1)? k++: clearInterval(ref3);
	}, pathAnimationTime + 50);
	return;
}



function canvasClick(e)
{
	let x;
	let y;

	clearInterval(ref1);
	clearInterval(ref2);

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
	let cell =
	[
	Math.floor(x/tileWidth),
	Math.floor(y/tileHeight)
	];

	// now we know while tile we clicked
	pathStart = pathEnd;
	pathEnd = cell;

	try{
		ctx.drawImage(spritesheet,
			2*tileWidth, 0,
			tileWidth, tileHeight,
			pathStart[0]*tileWidth,
			pathStart[1]*tileHeight,
			tileWidth, tileHeight);	
		ctx.drawImage(spritesheet,
			3*tileWidth, 0,
			tileWidth, tileHeight,
			pathEnd[0]*tileWidth,
			pathEnd[1]*tileHeight,
			tileWidth, tileHeight);	
	} catch(err){
		console.log(err);
	}
	
	// calculate path
	currentPath = findPath(world,pathStart,pathEnd);
	redraw();
}

function findPath(world, pathStart, pathEnd)
{
	closedSet = [];	

	let	abs = Math.abs;
	let	max = Math.max;
	let	pow = Math.pow;
	let	sqrt = Math.sqrt;

	let maxWalkableTileNum = 0;

	let worldWidth = world[0].length;
	let worldHeight = world.length;
	let worldSize =	worldWidth * worldHeight;

	let distanceFunction = ManhattanDistance;

	function ManhattanDistance(Point, Goal)
	{	
		return ((document.getElementById('dijkstra').checked)? 0: abs(Point.x - Goal.x) + abs(Point.y - Goal.y));
	}

	function Neighbours(x, y)
	{
		let	North = y - 1,
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
		let newNode = {
			
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
		
		let	mypathStart = Node(null, {x:pathStart[0], y:pathStart[1]});
		let mypathEnd = Node(null, {x:pathEnd[0], y:pathEnd[1]});
		
		let AStar = new Array(worldSize);
		
		let Open = [mypathStart];
		let Closed = [];
		
		let result = [];
		
		let myNeighbours;
		let myNode;
		let myPath;
		
		let length, max, min, i, j;
		
		while(Open.length){
			length = Open.length;
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
						// myPath.g = myNode.g;
						// myPath.f = myPath.g;
						
						Open.push(myPath);
						
						AStar[myPath.value] = true;
					}
				}
				closedSet.push([myNode.x, myNode.y]);
				Closed.push(myNode);
			}
		}
		return result;
	}
	let calcPath = calculatePath();
	return calcPath;

} // end of findPath() function

