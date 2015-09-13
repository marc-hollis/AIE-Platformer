var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

// This function will return the time in seconds since the function 
// was last called
// You should only call this function once per frame
function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

		// Find the delta time (dt) - the change in time since the last drawFrame
		// We need to modify the delta time to something we can use.
		// We want 1 to represent 1 second, so if the delta is in milliseconds
		// we divide it by 1000 (or multiply by 0.001). This will make our 
		// animations appear at the right speed, though we may need to use
		// some large values to get objects movement and rotation correct
	var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;
	
		// validate that the delta is within range
	if(deltaTime > 1)
		deltaTime = 1;
		
	return deltaTime;
}

//-------------------- Don't modify anything above here

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;
//Background Variables
var LAYER_COUNT = 3;
var LAYER_WATER = 0;
var LAYER_PLATFORMS = 1;
var LAYER_LADDERS = 2;
var MAP = {tw: 40, th: 18};
var TILE = 35;
var TILESET_TILE = TILE * 2;
var TILESET_PADDING = 2;
var TILESET_SPACING = 2;
var TILESET_COUNT_X = 14;
var TILESET_COUNT_Y = 14;
var BULLET_SPEED = 0.03;
var STATE_SPLASH = 0;
var STATE_GAME = 1;
var STATE_GAMEOVER = 2;
var gameState = STATE_SPLASH;

//Force Variables
var METER = TILE;
var GRAVITY = METER * 9.8 * 6;
var MAXDX = METER * 10;
var MAXDY = METER * 15;
var ACCEL = MAXDX * 2;
var FRICTION = MAXDX * 6;
var JUMP = METER * 1500;

timer = 60;
var score = 0;
var lives = 3;
var heartImage = document.createElement("img");
heartImage.src = "pictures/heart.png";
// some variables to calculate the Frames Per Second (FPS - this tells use
// how fast our game is running, and allows us to make the game run at a 
// constant speed)
var fps = 0;
var fpsCount = 0;
var fpsTime = 0;

var tileset = document.createElement("img");
tileset.src = "pictures/tileset.png";


//Make Player and Keyboard things
var player = new Player();
var enemy = new Enemy();
var keyboard = new Keyboard();

function cellAtPixelCoord(layer, x, y) {
	if(x < 0 || x > SCREEN_WIDTH || y < 0) {
		return 1;
	}
	if(y < SCREEN_HEIGHT) {
		return 0;
	}
	return cellAtTileCoord(layer, p2t(x), p2t(y));
};

function cellAtTileCoord(layer, tx, ty) {
	if(tx < 0 || tx >= MAP.tw || ty < 0) {
		return 1;
	}
	if(ty >= MAP.th) {
		return 0;
	}
	return cells[layer][ty][tx];
};

function tileToPixel(tile) {
	return tile * TILE;
};

function pixelToTile(pixel) {
	return Math.floor(pixel/TILE);
};
function bound(value, min, max) {
	if(value < min) {
		return min;
	}
	if(value > max) {
		return max;
	}	
	return value;
}


//~~~~~~~~~~~~~~~~~~~Drawing the level~~~~~~~~~~~//											<--------Level Drawing
function drawMap() {
	for(var layerIdx=0; layerIdx<LAYER_COUNT; layerIdx++) {
		var idx = 0;
		for( var y = 0; y < level1.layers[layerIdx].height; y++ ) {
			for( var x = 0; x < level1.layers[layerIdx].width; x++ ) {
				if( level1.layers[layerIdx].data[idx] != 0 ) {
					// the tiles in the Tiled map are base 1 (meaning a value of 0 means no tile), so subtract one from the tileset id to get the
					// correct tile
					var tileIndex = level1.layers[layerIdx].data[idx] - 1;
					var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) * (TILESET_TILE + TILESET_SPACING);
					var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) * (TILESET_TILE + TILESET_SPACING);
					context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE, x*TILE, (y-1)*TILE, TILESET_TILE, TILESET_TILE);
				}
				idx++;
			}
		}
	}
}

var cells = [];  //The array that holds the collision data
function initialize() {
	for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) { //initialize the collision map
		cells[layerIdx] = [];
		var idx = 0;
		for(var y = 0; y < level1.layers[layerIdx].height; y++) {
			cells[layerIdx][y] = [];
			for(var x = 0; x < level1.layers[layerIdx].width; x++) {
				if(level1.layers[layerIdx].data[idx] != 0) {
					cells[layerIdx][y][x] = 1;
					cells[layerIdx][y-1][x] = 1;
					cells[layerIdx][y][x+1] = 1;
					cells[layerIdx][y-1][x+1] = 1;
				}
				else if(cells[layerIdx][y][x] != 1) {
					cells[layerIdx][y][x] = 0;
				}
				idx++;
			}
		}
	}
}


function runSplash(deltaTime) {
	context.fillStyle = "#ccc";		
	context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	context.fillStyle = "#000000";
	context.font="20px Arial";
	context.fillText("Click Space to Start", SCREEN_WIDTH/2-100, SCREEN_HEIGHT/2);
	
	if(keyboard.isKeyDown(keyboard.KEY_SPACE) == true) {
		gameState = STATE_GAME;
	}
}

function runGame(deltaTime) {
	player.update(deltaTime);
	drawMap();
	player.draw();
	enemy.draw();
	
	//Score
	context.fillStyle = "black";
	context.font = "28px Comic Sans MS";
	var scoreText = "Score: " + score;
	context.fillText(scoreText, 0, 50);
	
	//Life counter
	for(var i=0; i<lives; i++) {
		context.drawImage(heartImage, (canvas.width-100) + ((heartImage.width+2)*i), 30);
	}
	// update the frame counter 
	fpsTime += deltaTime;
	fpsCount++;
	if(fpsTime >= 1) {
		fpsTime -= 1;
		fps = fpsCount;
		fpsCount = 0;
	}
	if(timer >= 0) {
		timer-=deltaTime;
	}
	else {
		gameState = STATE_GAMEOVER;
	}
	
	//if(bullet hits enemy) 
	//	enemy.dead = true
	//	bullet.dead == true
	//	score += 1;
	
	if(lives <= 0) {
		gameState = STATE_GAMEOVER;
	}
	
	//Draw the FPS and Time Left
	context.fillStyle = "#f00";
	context.font="16px Arial";
	context.fillText("FPS: " + fps, 5, 20, 100);
	context.fillText("Time Left: " + timer, SCREEN_WIDTH-95, 20);
}

function runGameOver(deltaTime) {
	context.fillStyle = "#ccc";		
	context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	context.fillStyle = "#000000";
	context.font="20px Arial";
	context.fillText("Game Over", SCREEN_WIDTH/2-100, SCREEN_HEIGHT/2);
	context.fillText("Press SPACE to Reset", SCREEN_WIDTH/2-100, SCREEN_HEIGHT/2+30);
	if(keyboard.isKeyDown(keyboard.KEY_SPACE)) {
		lives = 3;
		timer = 60;
		score = 0;
		gameState = STATE_GAME;
	}
}

//~~~~~~~~~~~~~~~~~~~The Run Function~~~~~~~~~~~~//											<--------Run Function
function run()
{
	context.fillStyle = "#ccc";		
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	var deltaTime = getDeltaTime();
	
	switch(gameState) {
		case STATE_SPLASH:
			runSplash(deltaTime);
			break;
		case STATE_GAME:
			runGame(deltaTime);
			break;
		case STATE_GAMEOVER:
			runGameOver(deltaTime);
			break;
	}
}
initialize();
//-------------------- Don't modify anything below here


// This code will set up the framework so that the 'run' function is called 60 times per second.
// We have a some options to fall back on in case the browser doesn't support our preferred method.
(function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000 / 60);
    }
  }
  
  window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);
