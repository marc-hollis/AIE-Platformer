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
var LAYER_COUNT = 2;
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

//Force Variables
//Abitrary choice for one meter
var METER = TILE;
//Super gravity (6 times normal)
var GRAVITY = METER * 9.8 * 6;
//Max horizontal speed (ten tiles per second)
var MAXDX = METER * 10;
//Max vertical speed (ten tiles per second)
var MAXDY = METER * 15;
//Horizontal acceleration (takes 1/2 of a second to reach max)
var ACCEL = MAXDX * 2;
//Horizontal friction (takes 1/6 of a second to stop from max)
var FRICTION = MAXDX * 6;
//A large, instant jump impulse
var JUMP = METER * 2000;
var cells = []; //The array that holds the simplified collision data

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
	if(x < 0 || x > SCREEN_WIDTH ||  y < 0) {
		return 1;
	}
	//Let the player drop to the bottom of the screen (death)
	if(y>SCREEN_HEIGHT) {
		return 0;
	}
	return cellAtTileCoord(layer, p2t(x), p2t(y));
};

function cellAtTileCoord(layer, tx, ty) {
	if(tx < 0 || tx >= Map.tw || ty < 0) {
		return 1;
	}
	//Let the player drop to the bottom of the screen (death)
	if(ty >= Map.th) {
		return 0;
	}
	return cells[layer][tx][ty];
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

function initialize() {
	for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) { //Initialize the collision map
		cells[layerIdx] = [];
		var idx = 0;
		for(var y = 0; y < level1.layers[0].height; y++) {
			cells[layerIdx][y] = [];
			for(var x = 0; x < level1.layers[layerIdx].width; x++) {
				if(level1.layers[layerIdx].data[idx] != 0) {
					//for each tile we find in the layer data, we need to create 4 collisions
					//(because our collision squares are 35x35 but the tile in the
					//level are 70x70)
					cells[layerIdx][y][x] = 1;
					cells[layerIdx][y-1][x] = 1;
					cells[layerIdx][y-1][x+1] = 1;
					cells[layerIdx][y][x+1] = 1;
				}
				else if(cells[layerIdx][y][x] != 1) {
					//If we haven't set this cells value, then set it to 0 now
					cells[layerIdx][y][x] = 0;
				}
				idx++;
			}
		}
	}
}

//~~~~~~~~~~~~~~~~~~~The Run Function~~~~~~~~~~~~//											<--------Run Function
function run()
{
	context.fillStyle = "#ccc";		
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	var deltaTime = getDeltaTime();
	
	player.update(deltaTime);
	drawMap();
	player.draw();
	enemy.draw();
		
	// update the frame counter 
	fpsTime += deltaTime;
	fpsCount++;
	if(fpsTime >= 1)
	{
		fpsTime -= 1;
		fps = fpsCount;
		fpsCount = 0;
	}		
		
	// draw the FPS
	context.fillStyle = "#f00";
	context.font="14px Arial";
	context.fillText("FPS: " + fps, 5, 20, 100);
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
