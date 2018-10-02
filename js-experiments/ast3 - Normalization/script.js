console.log("Hello World");

function findEven(x){
	var y = [];
	for(var i=0; i<=x.length; i++){
		if(x[i]%2 === 0){
			y.push(x[i]);
		}
	}
	return y;
}

// var x = [1,2,3,4,5,6,7,8]
console.log("input: " + [1,2,3,4,5,6,7,8]);
// var y = findEven(x);
console.log("output: " + findEven([1,2,3,4,5,6,7,8]));

console.log("input: " + [4,4,5,3,2]);
console.log("output: " + findEven([4,4,5,3,2]));


var aman = {
	name : "Aman Karn",
	address : {
		temprory : "Shantinagar, Kathmandu - 31",
		permanent : "Shantinagar, Kathmandu - 31",
	},
	interest : ["Video Games", "Art", "Music"],
	education : [{
		secondary : "E.P.S School",
		higher_secondary : "Pentagon Internation College",
		be: "Advanced College of Engg and Mgmt", 
	}]
}
console.log(aman);







function searchById(fruits, key, val){

	for(var i=0; i<=fruits.length; i++){
		// if(fruits[i].id == x){
		// 	return fruits[i].name;
		// }
		var item = fruits[i];
		if( item[key] === val ){
			return fruits[i];	
		}
	}
}
var fruits = [
	{id:1, name:"apple", color:"red"},
	{id:2, name:"banana", color:"yellow"}
];
fruit = searchById(fruits, "color", "yellow");
console.log(fruit);








function getData(callbackFn){
	var data = { id:1, name:"Pikachu"};
	var val = callbackFn(data);
	return val;
}
function myFunc(d){
	console.log("MyFunc Data:", d);
	return 369;
}
var rValue = getData(myFunc); 
// var rValue = getData(function(d){
// 	console.log("Data", d);
// 	return 123;
// });

console.log("rValue", rValue);








var numbers = [1,2,3,4];
function transform( collection, tranFunc){
	var out = []
	for(var i=0; i<=collection.length; i++){
		out.push(tranFunc(collection[i]));
	}
	return out;
}
var output = transform(numbers, function(num){
	return num*2;
});
console.log(output);









// console.log("From outside");
// setTimeout(function(){
// 	console.log("From inside");
// }, 2000);
// console.log("second from outside");


// console.log("from outside");
// var ref = setInterval(function() {
// console.log("from inside");
// }, 2000);
// clearTimeout(ref);
// console.log("from outside 2");

// var count = 0;
// var ref = setInterval(function() {
// 	if( count<= 20){
// 		count++;
// 	} else {
// 		clearTimeout(ref);
// 	}
// 	console.log(count);
// }, 1000);
// // clearTimeout(ref);
// console.log(count);





// function counter() {
// 	for(var i=0; i < 10; i++) {
// 		setTimeout(function() {
// 			console.log(i);
// 		}, 1000);
// 	}
// }
// counter();






var fruits = ["apple", "orange"];
function addToArray(collection, value) {
collection.push(value);
return collection;
}
var newFruits = addToArray(fruits, "grape");
console.log(fruits, newFruits);



