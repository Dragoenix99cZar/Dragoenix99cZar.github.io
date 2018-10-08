var slideIndex = 1;
showDivs(slideIndex);

function plusDivs(n) {
  showDivs(slideIndex += n);
}

function showDivs(n) {
  var i;
  var x = document.getElementsByClassName("mySlides");
  if (n > x.length) {slideIndex = 1}    
  if (n < 1) {slideIndex = x.length}
  for (i = 0; i < x.length; i++) {
     x[i].style.display = "none";  
  }
  x[slideIndex-1].style.display = "block";  
}

var slideIndexHead = 1;
showDivsHead(slideIndexHead);

function plusDivsHead(k) {
  showDivsHead(slideIndexHead += k);
}

function showDivsHead(k) {
  var j;
  var y = document.getElementsByClassName("head-text");
  if (k > y.length) {slideIndexHead = 1}    
  if (k < 1) {slideIndexHead = y.length}
  for (j = 0; j < y.length; j++) {
     y[j].style.display = "none";  
  }
  y[slideIndexHead-1].style.display = "block";  
}