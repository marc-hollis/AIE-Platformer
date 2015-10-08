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

var ENEMY_MAXDX = METER * 5;
var ENEMY_ACCEL = ENEMY_MAXDX * 2;

var enemies = [];

var LAYER_OBJECT_ENEMIES = 3;
var LAYER_OBJECT_TRIGGERS = 4;

var timer = 120;
var second = 1;
var score = 0;
var lives = 3;
var bullet = new Bullet();
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
var worldOffsetX = 0;
function drawMap() {
	//Sidescrolling Variables
	var startX = -1;
	var maxTiles = Math.floor(SCREEN_WIDTH/TILE) + 2;
	var tileX = pixelToTile(player.position.x);
	var offsetX = TILE + Math.floor(player.position.x%TILE);
	
	startX = tileX - Math.floor(maxTiles/2);
	if(startX < -1) {
		startX = 0;
		offsetX = 0;
	}
	if(startX > MAP.tw - maxTiles) {
		startX = MAP.tw - maxTiles + 1;
		offsetX = TILE;
	}
	
	worldOffsetX = startX * TILE + offsetX;
	
	for(var layerIdx=0; layerIdx<LAYER_COUNT; layerIdx++) {
		for( var y = 0; y < level1.layers[layerIdx].height; y++ ) {
			var idx = y * level1.layers[layerIdx].width + startX;
			for( var x = startX; x < startX + maxTiles; x++ ) {
				if( level1.layers[layerIdx].data[idx] != 0 ) {
					// the tiles in the Tiled map are base 1 (meaning a value of 0 means no tile), so subtract one from the tileset id to get the
					// correct tile
					var tileIndex = level1.layers[layerIdx].data[idx] - 1;
					var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) * (TILESET_TILE + TILESET_SPACING);
					var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) * (TILESET_TILE + TILESET_SPACING);
					context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE, (x-startX)*TILE-offsetX, (y-1)*TILE, TILESET_TILE, TILESET_TILE);
				}
				idx++;
			}
		}
	}
}

var cells = [];  //The array that holds the collision data
var musicBackground;
var sfxFire
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
	
	idx = 0;
	for(y = 0; y < level1.layers[LAYER_OBJECT_ENEMIES].height; y++) {
		for(var x = 0; x < level1.layers[LAYER_OBJECT_ENEMIES].width; x++) {
			if(level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0) {
				var px = tileToPixel(x);
				var py = tileToPixel(y);
				var e = new Enemy(px, py);
				enemies.push(e);
			}
			idx++;
		}
	}
	
	musicBackground = new Howl( {
		urls: ["sounds/background.ogg"],
		loop: true,
		buffer: true,
		volume: 0.1
	});
	musicBackground.play();
	
	sfxFire = new Howl({
		urls: ["sounds/fireEffect.ogg"],
		buffer: true,
		volume: 1,
		onend: function() {
			isSfxPlaying = false;
		}
	});
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
	for(var i = 0; i < enemies.length; i++) {
		enemies[i].draw(deltaTime);
	}
	for(var i = 0; i < enemies.length; i++) {
		enemies[i].update(deltaTime);
	}
	player.update(deltaTime);
	drawMap();
	player.draw();
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
		second -= deltaTime;
		if(second < 0) {
			timer -= 1;
			second = 1;
		}
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
	context.fillText("Time Left: " + timer, SCREEN_WIDTH-110, 20);
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
		timer = 120;
		score = 0;
		player.position.set(9*TILE, 0*TILE);
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
