console.log("Hello World");

function animate () {
	var star = "";
	var max_no_star = 10;
	var flag = 1;
	var count = 0;
	var ref = setInterval(function() {
		
		// console.log(count);	
		
		if(flag === 1){
			star += "*";
			console.log(star); 	
			// document.write(star + "<br>");
			if (star.length > max_no_star) {
				flag = 0;
			}
		}
		if(flag === 0){
			star = star.substr(0, star.length-1);
			console.log(star);
			// document.write(star + "<br>");
			if (star.length ===1) {
				flag = 1;
			}
		}
		(count<200)?count++:clearInterval(ref);

	}, 30);
}
animate();