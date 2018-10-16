/* 
 Write a function such that it takes list of people with nested children and normalizes it as shown in example
*/

var people = [{
                id: 1,
                name: "Aegon Targaryen",
                children: [{
                              id: 2,
                              name: "Jaehaerys Targaryen",
                              children: [{
                                            id: 4,
                                            name: "Daenerys Targaryen"
                                          },
                                          {
                                            id: 5,
                                            name: "Rhaegar Targaryen",
                                            children: [{
                                                          id: 6,
                                                          name: "Aegon Targaryen"
                                                        }]
                                          }] 
                            },
                            {
                              id: 3,
                              name: "Rhaelle Targaryen"
                            }],
              }];

var output = {
  1: {
    id: 1,
    name: "Aegon Targaryen",
    children: [2, 3]
  },
  2: {
    id: 2,
    name: "Jaehaerys Targaryen",
    children: [4, 5]
  },
  3: {
    id: 3,
    name: "Rhaelle Targaryen",
    children: []
  },
  4: {
    id: 4,
    name: "Daenerys Targaryen",
    children: []
  },
  5: {
    id: 5,
    name: "Rhaegar Targaryen",
    children: [6]
  },
  6: {
    id: 6,
    name: "Aegon Targaryen",
    children: []
  }
}

// function info( person){
  
//   var parent = person;
//   var child = person.children;
//   var child_id = [];
//   if( child.length !== 0){
//       for (var i = 0; i < child.length ; i++){
//         child_id.push(child.id);
//       }
//   }
//   var temp = {
//     id: person.id,
//     name: person.name,
//     children: child_id
//   }
//   return temp;
// }

function hasChild( person){
  if( person.children !== undefined){
    return true;
  } else {
    return false;
  }
}

function info( person){
  
  var parent = person;
  var child_id = [];
  if( hasChild(person)){
  // if( person.children !== undefined){
      for (var i = 0; i < person.children.length ; i++){
        child_id.push(person.children.id);
      }
  }
  var temp = {
    id: person.id,
    name: person.name,
    children: child_id
  }
  return temp;
}


var output = [];  //output array


function normalize(people)
{
  for(var i = 0 ; i< people.length ; i++)
    {
        getChildren(people[i]);
    }
}

// console.log(people[0]);

function getChildren(peopleElement)
{

  if (peopleElement.children === undefined)
  {
    var list = {
      id :  peopleElement.id,
      name : peopleElement.name,
      children : [] 
      }
          output.push(list); //for pushing elements that have no children
        }

        else
        {
          // console.log (peopleElement.children.length);
         var childrenId = [];

          for (var i = 0; i < peopleElement.children.length; i++)  //gets the id's of childrens recursively
          {
            childrenId.push(peopleElement.children[i].id);
            // console.log (childrenId);
            getChildren(peopleElement.children[i]); 
          }
          
          var newlist = {
            id :  peopleElement.id,
            name : peopleElement.name,
            children : childrenId
          }


            // console.log(newlist);

          output.push(newlist); // pushes elements that have childrens

      }


  } 

normalize(people);

function arraySort(output){
  var tmp;
  for( var i = 0; i < output.length-1; i++){
    for(var j = 0; j<output.length-i-1; j++){
     if (output[j].id > output[j+1].id){
      tmp =output[j];
      output[j] = output[j+1];
      output[j+1] = tmp;
    }   
  }
}
}


arraySort(output);
console.log(output);







