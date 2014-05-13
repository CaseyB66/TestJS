function dom(name, attributes /*, children...*/) {
  var node = document.createElement(name);
  if (attributes) {
    forEachIn(attributes, function(name, value) {
      node.setAttribute(name, value);
    });
  }
  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];
    if (typeof child == "string")
      child = document.createTextNode(child);
    node.appendChild(child);
  }
  return node;
}

function clone(object) {
  function OneShotConstructor(){}
  OneShotConstructor.prototype = object;
  return new OneShotConstructor();
};

function print() {
  var result = [];
  forEach(arguments, function(arg){result.push(String(arg));});
  window.write(result);
  // output.appendChild(dom("PRE", null, result.join("")));
}

function randomInteger(below) {
  return Math.floor(Math.random() * below);
}

function forEachIn(object, action) {
  for (var property in object) {
    if (Object.prototype.hasOwnProperty.call(object, property))
      action(property, object[property]);
  }
};


function Dictionary(startValues) {
  this.values = startValues || {};
}
Dictionary.prototype.store = function(name, value) {
  this.values[name] = value;
};
Dictionary.prototype.lookup = function(name) {
  return this.values[name];
};
Dictionary.prototype.position = function(name) {
  var pnames=this.names();
  var retpos;
  for (retpos=0;retpos<pnames.length;retpos++)
    if (name==pnames[retpos])
      break;
  return retpos;
};
Dictionary.prototype.contains = function(name) {
 return Object.prototype.propertyIsEnumerable.call(this.values, name);
};
Dictionary.prototype.each = function(action) {
  forEachIn(this.values, action);
};
Dictionary.prototype.names = function() {
  var names = [];
  this.each(function(name, value) {names.push(name);});
  return names;
};

function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.add = function(other) {
  return new Point(this.x + other.x, this.y + other.y);
};

function Grid(width, height) {
  this.width = width;
  this.height = height;
  this.cells = new Array(width * height);
};
Grid.prototype.valueAt = function(point) {
  try
    {
    return this.cells[point.y * this.width + point.x];
    }
  catch (e)
    {
    console.log('valueAt caught an exception: '+e.message);
    }
};
Grid.prototype.setValueAt = function(point, value) {
  try
    {
    this.cells[point.y * this.width + point.x] = value;
    }
  catch (e)
    {
    console.log('setValueAt caught an exception: '+e.message);
    }
};
Grid.prototype.isInside = function(point) {
  return point.x >= 0 && point.y >= 0 &&
         point.x < this.width && point.y < this.height;
};
Grid.prototype.moveValue = function(from, to) {
  this.setValueAt(to, this.valueAt(from));
  this.setValueAt(from, undefined);
};
Grid.prototype.each = function(action) {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      var point = new Point(x, y);
        action(point, this.valueAt(point));
    }
  }
};

var directions = new Dictionary(
  {"n":  new Point( 0, -1),
   "ne": new Point( 1, -1),
   "e":  new Point( 1,  0),
   "se": new Point( 1,  1),
   "s":  new Point( 0,  1),
   "sw": new Point(-1,  1),
   "w":  new Point(-1,  0),
   "nw": new Point(-1, -1)});

var wall = {};
wall.character = "#";

//function elementFromCharacter(character) {
//  if (character == " ")
//    return undefined;
//  else if (character == "#")
//    return wall;
//  else if (character == "o")
//    return new StupidBug();
//}

function characterFromElement(element) {
  if (element == undefined)
    return " ";
  else
    return element.character;
}

function bind(func, object) {
  return function(){
    return func.apply(object, arguments);
  };
}

function Terrarium(plan) {
  var grid = new Grid(plan[0].length, plan.length);
  for (var y = 0; y < plan.length; y++) {
    var line = plan[y];
    for (var x = 0; x < line.length; x++) {
      grid.setValueAt(new Point(x, y), elementFromCharacter(line.charAt(x)));
    }
  }
  this.grid = grid;
}

Terrarium.prototype.toString = function() {
  var characters = []; var c;
  var endOfLine = this.grid.width - 1;
  this.grid.each(function(point, value) {
    characters.push(characterFromElement(value));
    if (point.x == endOfLine)
      characters.push("<br>");
  });
  // Use non-printing character as delimiter
  // space does not seem to work here!
  return characters.join(String.fromCharCode(2));
}

Terrarium.prototype.listActingCreatures = function() {
  var found = [];
  this.grid.each(function(point, value) {
    if (value != undefined && value.act)
      {
      found.push({object: value, point: point});
      }
    }
  );
  return found;
};

Terrarium.prototype.listSurroundings = function(center) {
  var result = {};
  var grid = this.grid;
  directions.each(function(name, direction) {
    var place = center.add(direction);
    if (grid.isInside(place))
      result[name] = characterFromElement(grid.valueAt(place));
    else
      result[name] = "#";
  });
  return result;
};

Terrarium.prototype.processCreature = function(creature, point) {
  var action = creature.act(this.listSurroundings(point));

  if (action.type == "move") 
    if (directions.contains(action.direction)) {
      var to = point.add(directions.lookup(action.direction));
      if (this.grid.isInside(to) && this.grid.valueAt(to) == undefined)
        this.grid.moveValue(point, to);
      }
    else {
      throw new Error("direction not valid");
      }
  else {
    throw new Error("Unsupported action: " + action.type);
    }
};

Terrarium.prototype.step = function() {
  console.log("step calling forEach(processCreature)");
  forEach(this.listActingCreatures(), bind(this.processCreature, this));
};

function forEach(array, action) {
  console.log("forEach has "+arguments.length+" arguments")
  if (arguments.length>0)
    {
  	// console.log("forEach array lgth "+array.length);
    for (var i = 0; i < array.length; i++)
        {
        // console.log("forEach using point "+array[i].point);
        action(array[i].object,array[i].point);
        }	
    }
}

Point.prototype.toString = function() {
  return "(" + this.x + "," + this.y + ")";
};

var creatureTypes = new Dictionary();
creatureTypes.register = function(constructor, character) {
  constructor.prototype.character = character;
  this.store(character, constructor);
};

function elementFromCharacter(character) {
  if (character == " ")
    return undefined;
  else if (character == "#")
    return wall;
  else if (creatureTypes.contains(character))
    return new (creatureTypes.lookup(character))();
  else
    throw new Error("Unknown character: " + character);
}

function StupidBug() {
  this.energy = 80;
  };
StupidBug.prototype.act = function(surroundings) {
  return {type: "move", direction: "s"};
};
StupidBug.prototype.character = "o";
creatureTypes.register(StupidBug, "o");

function BouncingBug() {
  this.direction = "ne";
  this.energy = 150;
}
BouncingBug.prototype.act = function(surroundings) {
  if (surroundings[this.direction] != " ")
    this.direction = (this.direction == "ne" ? "sw" : "ne");
  return {type: "move", direction: this.direction};
};
creatureTypes.register(BouncingBug, "%");

function CircleBug() {
  this.direction = "se";
  this.energy = 500;
}
CircleBug.prototype.act = function(surroundings) {
  var dirnames=directions.names();
  var strtpos=directions.position(this.direction);
  if (strtpos>=dirnames-1)
    strtpos=0;
  else
    strtpos++;
  var newdir=dirnames[strtpos];
  for (i=0;i<dirnames.length;i++)
    {
    if (surroundings[newdir] != " ")
      {
      if (strtpos>=dirnames.length-1)
        strtpos=0;
      else
        strtpos++;
      newdir=dirnames[strtpos];
      }
    else
      break;
    }
  var retDir=this.direction;
  this.direction=newdir;
  return {type: "move", direction: retDir};
};
creatureTypes.register(CircleBug, "&");


function randomElement(array) {
  if (array.length == 0)
    throw new Error("The array is empty.");
  return array[Math.floor(Math.random() * array.length)];
}

function DrunkBug() {
  this.energy = 250;
  };
DrunkBug.prototype.act = function(surroundings) {
  return {type: "move", direction: randomElement(directions.names())};
};
creatureTypes.register(DrunkBug, "~");

var thePlan =
  ["########################################################",
   "## %   %#    #  &   o      ## %   %#    #  &   o      ##",
   "##                                  o               o  #",
   "##     ~    #####                 ~     &              #",
   "###         #   #    ##                         ##     #",
   "####     ~     ## %   #             ~     #  %   #     #",
   "##           ###      #                   #      #     #",
   "#   ####                        #                      #",
   "#   ##       o                  #        o             #",
   "# o  #         o       ###    o  #         o       # # #",
   "##    #                          #                     #",
   "####     ~     ## %   #             ~     #  %   #     #",
   "##           ###      #     #             #      #     #",
   "#   ####                        #                      #",
   "#   ##       o                  #        o             #",
   "# o  #         o       ###  # o  #         o       # # #",
   "##    #                     #    #                     #",
   "########################################################"];

// tst=new Array('x',' ','x','x',' ',' ',' ',' ',' ','x','x','x','<br>');
// window.document.write(tst+": join "+tst.join(String.fromCharCode(32)));
// window.document.write(tst+": join "+tst.join(String.fromCharCode(2)));

var TElmnt=window.document.getElementById("TElmnt");

//var terrarium = new Terrarium(thePlan);
//var outstr="<font face=\"courier\" color=\"black\">"+terrarium.toString()+"</font>";
//TElmnt.innerHTML=outstr;
//
//function stepBugs()
//{
//  terrarium.step();
//  outstr="<font face=\"courier\" color=\"black\">"+terrarium.toString()+"</font>";
//  TElmnt.innerHTML=outstr;
//}

function LifeLikeTerrarium(plan) {
  Terrarium.call(this, plan);
}
LifeLikeTerrarium.prototype = clone(Terrarium.prototype);
LifeLikeTerrarium.prototype.constructor = LifeLikeTerrarium;

LifeLikeTerrarium.prototype.processCreature = function(creature, point) {
  var energy=0;
  var action, self = this;
  function dir() {
    if (!directions.contains(action.direction)) return null;
    var target = point.add(directions.lookup(action.direction));
    if (!self.grid.isInside(target)) return null;
    return target;
  }

  action = creature.act(this.listSurroundings(point));

  if (action.type == "move") {
    var to=dir();
    if (this.grid.isInside(to) && this.grid.valueAt(to) == undefined)
      energy = this.creatureMove(creature, point, dir());
    }
  else if (action.type == "eat")
    energy = this.creatureEat(creature, dir());
  else if (action.type == "photosynthesize")
    energy = -1;
  else if (action.type == "reproduce")
    energy = this.creatureReproduce(creature, dir());
  else if (action.type == "wait")
    energy = 0.2;
  else
    throw new Error("Unsupported action: " + action.type);

  creature.energy -= energy;
  if (creature.energy <= 0)
    this.grid.setValueAt(point, undefined);
};

LifeLikeTerrarium.prototype.creatureMove = function(creature, from, to) {
  if (to != null || this.grid.valueAt(to) == undefined) {
    // console.log("creatureMove using to "+to.toString());
    this.grid.moveValue(from, to);
    // console.log("creatureMove after moveValue: to "+to.toString());
    from.x = to.x; from.y = to.y;
  }
  return 1;
};  

LifeLikeTerrarium.prototype.creatureEat = function(creature, source) {
  var energy = 1;
  if (source != null) {
    var meal = this.grid.valueAt(source);
    if (meal != undefined && meal.energy) {
      this.grid.setValueAt(source, undefined);
      energy -= meal.energy;
    }
  }
  return energy;
};

LifeLikeTerrarium.prototype.creatureReproduce = function(creature, target) {
  var energy = 1;
  if (target != null && this.grid.valueAt(target) == undefined) {
    var species = characterFromElement(creature);
    var baby = elementFromCharacter(species);
    energy = baby.energy * 2;
    if (creature.energy >= energy)
      this.grid.setValueAt(target, baby);
  }
    return energy;
};

function findDirections(surroundings, wanted) {
  var found = [];
  directions.each(function(name) {
    if (surroundings[name] == wanted)
      found.push(name);
  });
  return found;
}

function Lichen() {
  this.energy = 5;
}
Lichen.prototype.act = function(surroundings) {
  var emptySpace = findDirections(surroundings, " ");
  if (this.energy >= 13 && emptySpace.length > 0)
    return {type: "reproduce", direction: randomElement(emptySpace)};
  else if (this.energy < 20)
    return {type: "photosynthesize"};
  else
    return {type: "wait"};
};
creatureTypes.register(Lichen, "*");
function LichenEater() {
  this.energy = 12;
}
LichenEater.prototype.act = function(surroundings) {
  var emptySpace = findDirections(surroundings, " ");
  var lichen = findDirections(surroundings, "*");

  if (this.energy >= 30 && emptySpace.length > 0)
    return {type: "reproduce", direction: randomElement(emptySpace)};
  else if (lichen.length > 0)
    return {type: "eat", direction: randomElement(lichen)};
  else if (emptySpace.length > 0)
    return {type: "move", direction: randomElement(emptySpace)};
  else
    return {type: "wait"};
};
creatureTypes.register(LichenEater, "c");

var moodyCave =
  ["###############################################################",
   "#           %         #####         ***&      ~~              #",
   "#    ***                **#         **            c **        #",
   "#   *##**         **  c  *#         ****      ##  ~ ***       #",
   "#    ***     c    %#**    ***       **     #####              #",
   "#       c         ##***   **        #                   ***   #",
   "#     ~           ##**              ##                ***~*   #",
   "#   c       #*             ***      ###        ***            #",
   "#*          #**       c             ##         ##**##~  &     #",
   "#***        ##**    c    *    ***   ##         ##**##         #",
   "#*****     ###***       *##                    ##**##         #",
   "#   *##**         **  c  *#                    ######         #",
   "#    ***     c    ##**    ***               cc         c      #",
   "#       c         ##***   *c**         ##          c          #",
   "#                 ##**    ***               &            ~    #",
   "#   c       #*               %      oo           ##           #",
   "#*          #**       c                #         ###          #",
   "#***        ##**    c                 ##         ##**##       #",
   "#oo***     ###***       *##                      ##**##       #",
   "###############################################################"];

var terrarium = new LifeLikeTerrarium(moodyCave);
var outstr="<font face=\"courier\" color=\"black\">"+terrarium.toString()+"</font>";
TElmnt.innerHTML=outstr;

function singleStep(){stepBugs(1);}
function step500(){stepBugs(500);}
function step100(){stepBugs(100);}

function stepBugs(n)
{
  var sct;
  var loopFn=function(){
    terrarium.step();
    outstr="<font face=\"courier\" color=\"black\">"+terrarium.toString()+"</font>";
    TElmnt.innerHTML=outstr;
    scrollBy(-5,5);
    scrollBy(5,-5);
  }
  var timerTime=10;
  for (sct=0;sct<n;sct++)
    {
    console.log("stepBugs "+sct);
    setTimeout(loopFn,timerTime);
    timerTime+=200;
    }
};


