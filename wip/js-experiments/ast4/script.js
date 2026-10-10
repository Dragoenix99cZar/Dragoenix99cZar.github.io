//var flag = 0;
var imageWidth = 640;
var imageCount = 0;
//var delta = 10;
//var count = 0;
var ref;
var ref2;
var delta = 10;

var imageDiv = document.getElementsByClassName('pics')[0];
var images = document.getElementsByClassName('image');
imageDiv.setAttribute('style', 'margin-left: 4px');

var leftButton = document.getElementsByClassName('left-arrow')[0];

leftButton.onclick = function(){
	console.log('Clicked!');
	
	clearInterval(ref);
	clearInterval(ref2);
	var margL = imageDiv.getAttribute('style').substr(12).replace('px;', '');
	console.log("marg: ",margL);
	if( margL > -640){
	   imageDiv.setAttribute('style', 'margin-left: 4px');
	}
	if(margL < -640 && margL > -1280){
		imageDiv.setAttribute('style', 'margin-left: -638px');
		sleep(50);
	}
	if(margL < -1280 && margL > -1920){
		imageDiv.setAttribute('style', 'margin-left: -1278px');
		sleep(50);
	}
	slide();
//	imageDiv.style.marginLeft = 640 + 'px';
}

function slide(){
//	var flag = 1;
	
	ref = setInterval(function(){
//		console.log("L: ", delta);
		imageDiv.style.marginLeft = -delta + 'px';
		delta++;
		
		if(delta % imageWidth === 0){
			imageCount = (imageCount + 1) % 4;
			console.log("imgC: ",imageCount);
			sleep(200);
//			clearInterval(ref2);
		}
		
		if(delta > imageWidth*3 ){
			delta = 9;
		}
	}, 10);
}



function sleep(milliseconds) {
	clearInterval(ref);
	var timer = 0;
	ref2 = setInterval(function(){
//		console.log(timer);
		if(timer < milliseconds){
			timer++;
		} else {
			clearInterval(ref2);
			console.log("sleep end!");
			slide();   
		}
	}, 1);
	
}



window.onload = slide;