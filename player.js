var LEFT = 0;
var RIGHT = 1;

var ANIM_IDLE_LEFT = 0;
var ANIM_JUMP_LEFT = 1;
var ANIM_WALK_LEFT = 2;
var ANIM_SHOOT_LEFT = 3;
var ANIM_CLIMB = 4;
var ANIM_IDLE_RIGHT = 5;
var ANIM_JUMP_RIGHT = 6;
var ANIM_WALK_RIGHT = 7;
var ANIM_SHOOT_RIGHT = 8;
var ANIM_MAX = 9;

var Player = function() {
	this.sprite = new Sprite("pictures/ChuckNorris.png");
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [0, 1, 2, 3, 4, 5, 6, 7]);
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [8, 9, 10, 11, 12]);
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]);
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [27, 28 , 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]);
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]);
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [52, 53, 54, 55, 56, 57, 58, 59]);
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [60, 61, 62, 63, 64]);
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78]);
	this.sprite.buildAnimation(12, 8, 165, 126, 0.05, [79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92]);
	
	for(var i = 0; i<ANIM_MAX; i++) {
		this.sprite.setAnimationOffset(i, -55, -87);
	}
	
	this.position = new Vector2();
	this.position.set(9*TILE, 0*TILE);
	
	this.width = 165;
	this.height = 126;
	
	this.velocity = new Vector2();;
	
	this.falling = true;
	this.jumping = false;
	
	this.direction = RIGHT;
	
	this.cooldownTimer = 0;
};

Player.prototype.update = function(deltaTime) {
	this.sprite.update(deltaTime);
	
	var left = false;
	var right = false;
	var jump = false;
	
	//Check key presses
	if(keyboard.isKeyDown(keyboard.KEY_LEFT)) {
		left = true;
		this.direction = LEFT;
		if(this.sprite.currentAnimation != ANIM_WALK_LEFT && this.jumping == false) {
			this.sprite.setAnimation(ANIM_WALK_LEFT);
		}
	}
	else if(keyboard.isKeyDown(keyboard.KEY_RIGHT) == true) {
		right = true;
		this.direction = RIGHT;
		if(this.sprite.currentAnimation != ANIM_WALK_RIGHT && this.jumping == false) {
			this.sprite.setAnimation(ANIM_WALK_RIGHT);
		}
	} 
	else {
		if(this.jumping == false && this.falling == false) {
			if(this.direction == LEFT) {
 				if(this.sprite.currentAnimation != ANIM_IDLE_LEFT)
 				this.sprite.setAnimation(ANIM_IDLE_LEFT);
			}
			else {
 				if(this.sprite.currentAnimation != ANIM_IDLE_RIGHT)
 				this.sprite.setAnimation(ANIM_IDLE_RIGHT);
			}
		}
	}
	
	if(keyboard.isKeyDown(keyboard.KEY_UP) == true) {
		jump = true;
	}
	if(this.cooldownTimer > 0) {
		this.cooldownTimer -= deltaTime;
	}
	if(keyboard.isKeyDown(keyboard.KEY_SPACE) == true && this.cooldownTimer <= 0) {
		sfxFire.play();
		this.cooldownTimer = 0.3;
		
		//Shoot a bullet
		bullet.shoot(deltaTime);
	}

	var wasleft = this.velocity.x < 0;
	var wasright = this.velocity.x > 0;
	var falling = this.falling;
	var ddx = 0;	//Acceleration
	var ddy = GRAVITY;
	
	if(left) {
		ddx = ddx - ACCEL;	//Player goes left
		this.direction = LEFT;
		if(this.sprite.currentAnimation != ANIM_WALK_LEFT && this.jumping == false) {
			this.sprite.setAnimation(ANIM_WALK_LEFT);
		}
	}
	else if(wasleft) {
		ddx = ddx + FRICTION;	//Player starts stopping after going left
	}
	
	if(right) {
		ddx = ddx + ACCEL;	//Player goes right
	}
	else if(wasright) {
		ddx = ddx - FRICTION;	//Player starts stopping after going right
	}
	//if(enemy hits player)
	//	lives -= 1;
	//	ddx -= METER;
	
	if(jump && !this.jumping && !falling) {
		ddy = ddy - JUMP;	//Player jumps
		this.jumping = true;
		if(this.direction == LEFT) {
			this.sprite.setAnimation(ANIM_JUMP_LEFT);
		}
		else {
			this.sprite.setAnimation(ANIM_JUMP_RIGHT);
		}
	}
	
	//Calculate position and velocity
	this.position.y = Math.floor(this.position.y + (deltaTime * this.velocity.y));
	this.position.x = Math.floor(this.position.x + (deltaTime * this.velocity.x));
	this.velocity.x = bound(this.velocity.x + (deltaTime * ddx), -MAXDX, MAXDX);
	this.velocity.y = bound(this.velocity.y + (deltaTime * ddy), -MAXDY, MAXDY);
	
	if((wasleft && (this.velocity.x > 0)) || (wasright && (this.velocity.x < 0))) {
		this.velocity.x = 0;	//Clamp at zero to prevent jiggling from friction
	}
	
	//Collision Detection. Player can only occupy at most 4 tiles so check each tile for 1 or 0
	var tx = pixelToTile(this.position.x);
	var ty = pixelToTile(this.position.y);
	var nx = (this.position.x)%TILE; //True if player overlaps right
	var ny = (this.position.y)%TILE; //True is player overlaps below
	var cell = cellAtTileCoord(LAYER_PLATFORMS, tx, ty);
	var cellright = cellAtTileCoord(LAYER_PLATFORMS, tx+1, ty);
	var celldown = cellAtTileCoord(LAYER_PLATFORMS, tx, ty+1);
	var celldiag = cellAtTileCoord(LAYER_PLATFORMS, tx+1, ty+1);
	
	//If the player is going up/down, check to see if they hit a platform above/below
	//if so, stop their vertical velocity and clap their y position
	if(this.velocity.y > 0) {
		if((celldown && !cell) || (celldiag && !cellright & nx)) {
			//Clamp y position to avoid falling into platform below
			this.position.y = tileToPixel(ty);
			this.velocity.y = 0;	//Stop vertical velocity
			this.falling = false;	//Stop 'falling'
			this.jumping = false;	//Stop 'jumping'
			ny = 0;					//No Longer overlaps cells below
		}
	}
	else if(this.velocity.y < 0) {
		if((cell && !celldown) || (cellright && !celldiag && nx)) {
			//Clamp y position to avoid jumping into platform above
			this.position.y = tileToPixel(ty+1);
			this.velocity.y = 0;	//Stop vertical velocity
			//Clamp them to cell(s) below
			cell = celldown;
			cellright = celldiag	//Clamp them to cell(s) below
			ny = 0					//No longer overlaps cells below
		}
	}
	if(this.velocity.x > 0) {
		if((cellright && !cell) || (celldiag && !celldown && ny)) {
			//Clamp x position to avoid walking through platforms
			this.position.x = tileToPixel(tx);
			this.velocity.x = 0;	//Stop horizontal velocity
		}
	}
	else if(this.velocity.x < 0) {
		if((cell && !cellright) || (celldown && !celldiag && ny)) {
			//Clamp x position to avoid walking through platforms
			this.position.x = tileToPixel(tx + 1);
			this.velocity.x = 0;	//Stop horizontal velocity
		}
	}

	//Edges of Screen
	if(this.position.y > SCREEN_HEIGHT || this.position.y < 0) {
		lives -= 1;
		this.position.set(9*TILE, 0*TILE);
	}
	else if(this.position.x > SCREEN_WIDTH*2) {
		this.velocity.x = -this.velocity.x;
	}
	else if(this.position.x < 0) {
		this.velocity.x += 2*(this.velocity.x);
	}
}

Player.prototype.draw = function() {
	this.sprite.draw(context, this.position.x - worldOffsetX, this.position.y);
}