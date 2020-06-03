var GAME_LEVELS = `
......................
..#................#..
..#..............=.#..
..#................#..
..#........#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;
if (typeof module != "undefined" && module.exports && (typeof window == "undefined" || window.exports != exports))
  module.exports = GAME_LEVELS;
if (typeof global != "undefined" && !global.GAME_LEVELS)
  global.GAME_LEVELS = GAME_LEVELS;

/**
 * @class Level
 * @summary crea un array con contenido empty,wall,lava y llena el array de Actores
 * @description la variable local rows obtiene un array de nxm de las dimensiones de plan. 
 *  se crean las variables globales height, width, startActors y rows.
 *  height y width definen el tamaño del plano
 *  startActors contiene los objetos Coin, Lava, Player los cuales con creados con type.crate (type que es un strig o un objeto se obtiene de levelCars[ch])
 *  y para crarlo es necesario pasar su ubicacion con la clase Vev
 * @param {String[]} plan es el plano a dibujar
 */

var Level = class Level {
  constructor(plan) {
    let rows = plan.trim().split("\n").map(l => [...l]);  
    this.height = rows.length;           
    this.width = rows[0].length;
    this.startActors = [];    

    this.rows = rows.map((row, y) => {
      return row.map((ch, x) => {
        let type = levelChars[ch];
        if (typeof type == "string") return type;
        this.startActors.push(
          type.create(new Vec(x, y), ch));
        return "empty";
      });
    });
  }
}



/**
 * @class State
 * @description se recive el plano, los actores y el status la que nos permite crar una 
 *  instancia unica de la clase asi como obtener los jugadores
 * @param {Level} level el plano
 * @param {any} actors los actores que se guardaron en el level
 * @param {any} status y el estado del juego
 */
var State = class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
  }

  /**
   * @function start funcion estatica que crea una instancia de la clase y la retorna
   * @param {Level} level 
   * @returns State instancia de la clase State
   */
  static start(level) {
    return new State(level, level.startActors, "playing");
  }
  /**
   * @function player
   * @description regresa el objeto Player haciendo una busqueda en el arreglo de la variable global actors
   * @returns Player
   */
  get player() {
    return this.actors.find(a => a.type == "player");
  }
}
/**
 * @class Vec
 * @summary crea el vector de posicion
 * @description el constructor recive la posicion del objeto. 
 * @param {number} x  columna
 * @param {number} y  fila
 */
var Vec = class Vec {
  constructor(x, y) {
    this.x = x; this.y = y;
  }
  /**
   * @description suma los valores de x y de y con los nuevos valores
   * @param {Vec} other es un nuevo vector
   */
  plus(other) {
    return new Vec(this.x + other.x, this.y + other.y);
  }
  /**
   * @function times
   * @description Multiplica el valor de x y de y por factor
   * @param {nunber} factor 
   */
  times(factor) {
    return new Vec(this.x * factor, this.y * factor);
  }
}

var Player = class Player {
  constructor(pos, speed) {
    this.pos = pos;
    this.speed = speed;
  }

  get type() { return "player"; }

  static create(pos) {
    return new Player(pos.plus(new Vec(0, -0.5)),
                      new Vec(0, 0));
  }
}

Player.prototype.size = new Vec(0.8, 1.5);

var Lava = class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }

  get type() { return "lava"; }

  static create(pos, ch) {
    if (ch == "=") {
      return new Lava(pos, new Vec(2, 0));
    } else if (ch == "|") {
      return new Lava(pos, new Vec(0, 2));
    } else if (ch == "v") {
      return new Lava(pos, new Vec(0, 3), pos);
    }
  }
}

Lava.prototype.size = new Vec(1, 1);

var Coin = class Coin {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble;
  }

  get type() { return "coin"; }

  static create(pos) {
    let basePos = pos.plus(new Vec(0.2, 0.1));
    return new Coin(basePos, basePos,
                    Math.random() * Math.PI * 2);
  }
}

Coin.prototype.size = new Vec(0.6, 0.6);

var levelChars = {
  ".": "empty", "#": "wall", "+": "lava",
  "@": Player, "o": Coin,
  "=": Lava, "|": Lava, "v": Lava
};

// var simpleLevel = new Level(simpleLevelPlan);


/**
 * @function elt
 * @description crea un elemento name y le añade los atributos.
 * una vez crado el elemento html lo regresa
 * @param {HTML TAG} name 
 * @param {Object} attrs 
 * @param  {...any} children 
 * @returns dom Es el elemento HTML creado
 */
function elt(name, attrs, ...children) {
  let dom = document.createElement(name);
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }
  for (let child of children) {
    dom.appendChild(child);
  }
  return dom;
}

/**
 * @class DOMDisplay
 * @description cra un div.game el cual contiene la tabla que crea la funcion drawGrid
 * y lo guarda en la varible this.dom. 
 * div.game es añadido a document.body 
 * @param {document.body} parent 
 * @param {Level} level 
 */
var DOMDisplay = class DOMDisplay {
  constructor(parent, level) {
    this.dom = elt("div", {class: "game"}, drawGrid(level));
    this.actorLayer = null;
    parent.appendChild(this.dom);
  }

  clear() { this.dom.remove(); }
}

var scale = 20;


/**
 * @function drawGrid 
 * @description regresa una tabla ya que llama la funcion elt
 *  la cual recibe:
 *  1.- el nombre del objeto HTML
 *  2.- las propiedades del elemento HTML
 *  3.- y los hijos del elemento
 *   primero secran los hijos por lo que va primero td, despues tr y despues table
 *   si son dos tr con 2 td cada una primero se crearinan los td con los atributos class:<empy,wall o laza>
 *   despues se crearia un tr donde tendria los atributos de css height y se añadirian los td creados. 
 *   despues se crearian los otros 2 td y se añadirian al tr, entonces ya se tienen dos filas con sus contenidos
 *   y estos son agregados a al la tabla;
 *   `#.
 *    ##`
 *  crearía un objeto como el siguiente y con las propiedades escritas de css ya le da color
 *  <table class = "background" style = "width:40px" >
 *    <tr style = "height:20px">
 *      <td class="wall"></td>
 *      <td class="empy"></td>
 *    </tr>
 *    <tr style = "height:20px">
 *      <td class="wall"></td>
 *      <td class="wall"></td>
 *    </tr>
 *  </table>
 * @param {Level} level 
 */
function drawGrid(level) {
  return elt("table", {
    class: "background",
    style: `width: ${level.width * scale}px`
  }, ...level.rows.map(row =>
    elt("tr", {style: `height: ${scale}px`},
        ...row.map(type => elt("td", {class: type})))
  ));
}

function drawActors(actors) {
  return elt("div", {}, ...actors.map(actor => {
    let rect = elt("div", {class: `actor ${actor.type}`});
    rect.style.width = `${actor.size.x * scale}px`;
    rect.style.height = `${actor.size.y * scale}px`;
    rect.style.left = `${actor.pos.x * scale}px`;
    rect.style.top = `${actor.pos.y * scale}px`;
    return rect;
  }));
}

DOMDisplay.prototype.syncState = function(state) {
  if (this.actorLayer) this.actorLayer.remove();
  this.actorLayer = drawActors(state.actors);
  this.dom.appendChild(this.actorLayer);
  this.dom.className = `game ${state.status}`;
  this.scrollPlayerIntoView(state);
};

DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
  let width = this.dom.clientWidth;
  let height = this.dom.clientHeight;
  let margin = width / 3;

  // The viewport
  let left = this.dom.scrollLeft, right = left + width;
  let top = this.dom.scrollTop, bottom = top + height;

  let player = state.player;
  let center = player.pos.plus(player.size.times(0.5))
                         .times(scale);

  if (center.x < left + margin) {
    this.dom.scrollLeft = center.x - margin;
  } else if (center.x > right - margin) {
    this.dom.scrollLeft = center.x + margin - width;
  }
  if (center.y < top + margin) {
    this.dom.scrollTop = center.y - margin;
  } else if (center.y > bottom - margin) {
    this.dom.scrollTop = center.y + margin - height;
  }
};

Level.prototype.touches = function(pos, size, type) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      let isOutside = x < 0 || x >= this.width ||
                      y < 0 || y >= this.height;
      let here = isOutside ? "wall" : this.rows[y][x];
      if (here == type) return true;
    }
  }
  return false;
};

State.prototype.update = function(time, keys) {
  let actors = this.actors
    .map(actor => actor.update(time, this, keys));
  let newState = new State(this.level, actors, this.status);

  if (newState.status != "playing") return newState;

  let player = newState.player;
  if (this.level.touches(player.pos, player.size, "lava")) {
    return new State(this.level, actors, "lost");
  }

  for (let actor of actors) {
    if (actor != player && overlap(actor, player)) {
      newState = actor.collide(newState);
    }
  }
  return newState;
};

function overlap(actor1, actor2) {
  return actor1.pos.x + actor1.size.x > actor2.pos.x &&
         actor1.pos.x < actor2.pos.x + actor2.size.x &&
         actor1.pos.y + actor1.size.y > actor2.pos.y &&
         actor1.pos.y < actor2.pos.y + actor2.size.y;
}

Lava.prototype.collide = function(state) {
  return new State(state.level, state.actors, "lost");
};

Coin.prototype.collide = function(state) {
  let filtered = state.actors.filter(a => a != this);
  let status = state.status;
  if (!filtered.some(a => a.type == "coin")) status = "won";
  return new State(state.level, filtered, status);
};

Lava.prototype.update = function(time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
  if (!state.level.touches(newPos, this.size, "wall")) {
    return new Lava(newPos, this.speed, this.reset);
  } else if (this.reset) {
    return new Lava(this.reset, this.speed, this.reset);
  } else {
    return new Lava(this.pos, this.speed.times(-1));
  }
};

var wobbleSpeed = 8, wobbleDist = 0.07;

Coin.prototype.update = function(time) {
  let wobble = this.wobble + time * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Coin(this.basePos.plus(new Vec(0, wobblePos)),
                  this.basePos, wobble);
};

var playerXSpeed = 7;
var gravity = 30;
var jumpSpeed = 17;

Player.prototype.update = function(time, state, keys) {
  let xSpeed = 0;
  if (keys.ArrowLeft) xSpeed -= playerXSpeed;
  if (keys.ArrowRight) xSpeed += playerXSpeed;
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  if (!state.level.touches(movedX, this.size, "wall")) {
    pos = movedX;
  }

  let ySpeed = this.speed.y + time * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, "wall")) {
    pos = movedY;
  } else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
  } else {
    ySpeed = 0;
  }
  return new Player(pos, new Vec(xSpeed, ySpeed));
};

function trackKeys(keys) {
  let down = Object.create(null);
  function track(event) {
    if (keys.includes(event.key)) {
      down[event.key] = event.type == "keydown";
      event.preventDefault();
    }
  }
  window.addEventListener("keydown", track);
  window.addEventListener("keyup", track);
  return down;
}

var arrowKeys =
  trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);
/**
 * @function runAnimation
 * @description esta funcion se esta ejecutando continuamnete hatta que 
 *  frameFunc regresa false, lo que puede indicar que toco la lava  y el jugador a perdido
 * @param {function reference} frameFunc    
 */
function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(time) {
    if (lastTime != null) {    // lastTime es null la primera vez que entra a la función 
      let timeStep = Math.min(time - lastTime, 100) / 1000; // obtiene el tiempo de refresqueo
      if (frameFunc(timeStep) === false) { // frameFunc es la instancia que se le pasó asi que regresa a runAnimation() y ejecuta la función interna pasandole timeStep
        return;                           
      }
    }          
                                              
    lastTime = time;
    requestAnimationFrame(frame);   // llama internamente la funciónframe 
  }
  requestAnimationFrame(frame);     // ejecuta la función frame 
}
/**
 * @function runLevel
 * @description 
 * @param {Level} level 
 * @param {DOMDisplay} Display 
 * @returns 
 */
function runLevel(level, Display) {
  let display = new Display(document.body, level);  //crea el plano con new Display:DOMDisplay 
  let state = State.start(level);                   // crea un nuevo Estado con el nivel que se le pase
  let ending = 1;
  return new Promise(resolve => {                 // regresa una promesa 
    runAnimation(time => {                        // cuando se cumpla llama la gunción runAnimation y lo que se regrese lo manda a tima
      state = state.update(time, arrowKeys);      //
      display.syncState(state);
      if (state.status == "playing") {
        return true;
      } else if (ending > 0) {
        ending -= time;
        return true;
      } else {
        display.clear();
        resolve(state.status);
        return false;
      }
    });
  });
}


/**
 * @function runGame
 * @summary Es la función que inicia el juego. una vez que un nivel se retimina se avanza al siguente
 * @description Antes de ejecutar runLevel se crea el nivel al se le pasa el nivel a jugar y la referencia
 *  de DOMDisplay (ir a la clase Level).
 *  despues de que se crea el nivel, ahora si se ejecuta runLevel donde se corre el nivel.
 * @param plans Son los planos o diseños que se van a usar en el juego,
 * @param Display Aqui se debe de envíar la referencia de la clase DOMDisplay
 *  */ 
async function runGame(plans, Display) {
  for (let level = 0; level < plans.length;) {
    let status = await runLevel(new Level(plans[level]),Display);  
    if (status == "won") level++;                                  
  }
  console.log("You've won!");
}
