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
var being = [];
function func( person){
  if( hasChild(person)){
    being.push(info(person));
    func(person.children);
  } else{
    return being;
  }
}





var first = info(people[0]);
var second = info(people[0].children[0]);
var third = info(people[0].children[1]);

var data = func(people[0]);







