var Player = function() {
	this.image = document.createElement("img");
	this.position = new Vector2();
	this.position.set(9*TILE, 0*TILE);
	
	this.width = 159;
	this.height = 163;
	
	this.offset = new Vector2();
	this.offset.set(-55, -87);
	
	this.velocity = new Vector2();
	
	this.falling = true;
	this.jumping = false;
	
	this.image.src = "pictures/hero.png";
};

Player.prototype.update = function(deltaTime) {
	var left = false;
	var right = false;
	var jump = false;
	
	//Check keypress events
	if(keyboard.isKeyDown(keyboard.KEY_LEFT) == true) {
		left = true;
	}
	if(keyboard.isKeyDown(keyboard.KEY_RIGHT) == true) {
		right = true;
	}
	if(keyboard.isKeyDown(keyboard.KEY_SPACE) == true) {
		jump = true;
	}
	
	var wasleft = this.velocity.x < 0;
	var wasright = this.velocity.x > 0;
	var falling = this.falling;
	var ddx = 0;	//Acceleration
	var ddy = GRAVITY;
	
	if(left) {
		ddx = ddx - ACCEL;		//Player starts going left
	}
	else if(wasleft) {
		ddx = ddx + FRICTION;	//Player starts stopping after going left
	}
	if(right) {
		ddx = ddx + ACCEL; 		//Player starts going right
	}
	else if(wasright) {
		ddx = ddx - FRICTION;	//Player starts stopping after going right
	}
	if(jump && !this.jumping && !falling) {
		ddy = ddy - JUMP;		//Apply and instantaneous (large) vertical movement
		this.jumping = true;
	}
	
	//Calculate the new position and velocity:
	this.position.y = Math.floor(this.position.y + (deltaTime * this.velocity.y));
	this.position.x = Math.floor(this.position.x + (deltaTime * this.velocity.x));
	this.velocity.x = bound(this.velocity.x + (deltaTime * ddx), -MAXDX, MAXDX);
	this.velocity.y = bound(this.velocity.y + (deltaTime * ddy), -MAXDY, MAXDY);
	
	if((wasleft && (this.velocity.x > 0)) || (wasright && (this.velocity.x < 0))) {
		this.velocity.x = 0;
	}
	
	//Collision detection: Our collision detection logic is greatly simplified by the fact
	//that the player is a rectangle and is exactly the same size as a single tile. So we 
	//know that the player can only ever occupy 1, 2 or 4 cells.
	//This means we can short-circuit and avoid building a general purpose collision detection
	//engine by simply looking at the 1 to 4 cells that the player occupies.
	var tx = pixelToTile(this.position.x);
	var ty = pixelToTile(this.position.y);
	var nx = (this.position.x)%TILE; //True if player overlaps right
	var ny = (this.position.y)%TILE; //True if the player overlaps left
	var cell = cellAtTileCoord(LAYER_PLATFORMS, tx, ty);
	var cellright = cellAtTileCoord(LAYER_PLATFORMS, tx + 1, ty);
	var celldown = cellAtTileCoord(LAYER_PLATFORMS, tx, ty + 1);
	var celldiag = cellAtTileCoord(LAYER_PLATFORMS, tx + 1, ty + 1);
	
	//If the player has a vertical velocity, then check to see if they have hit a platform
	//below or above, in which case, stop their vertical velocity, and clamp their y position:
	if(this.velocity.y > 0) {
		if((celldown && !cell) || (celldiag && !cellright && nx)) {
			//Clamp the y position to avoid falling into the platform below
			this.position.y = tileToPixel(ty);
			this.velocity.y = 0; 	//Stop downward velocity
			this.falling = false;	//No longer falling
			this.jumping = false; 	//No longer jumping
			ny = 0;					//No longer overlaps the cells below
		}
	}
	else if(this.velocity.y < 0) {
		if((cell && !celldown) || (cellright && !celldiag && nx)) {
			//Clamp the y position to avoid jumping into the platform above
			this.position.y = tileToPixel(ty + 1);
			this.velocity.y = 0;		//Stop upward velocity
			//Player is no longer really in that cell, we clamped them to the cell below
			cell = celldown;
			cellright = celldiag 		//(Ditto)
			ny = 0;						//Player no longer overlaps the cells below
		}
	}
	if(this.velocity.x > 0) {
		if((cellright && !cell) || (celldiag && !celldiag && ny)) {
			//Clamp the x position to avoid moving in to the platform we just hit
			this.position.x = tileToPixel(tx);
			this.velocity.x = 0;		//Stop horizontal velocity
		}
	}
	else if(this.velocity.x < 0) {
		if((cell && !cellright) || (celldown && !celldiag && ny)) {
			//Clamp the x position to avoid moving into the platform we just hit
			this.position.x = tileToPixel(tx + 1);
			this.velocity.x = 0; 		//Stop horizontal velocity
		}
	}
}

Player.prototype.draw = function() {
	context.save();
		context.translate(this.position.x, this.position.y);
		context.rotate(this.rotation);
		context.drawImage(this.image, -this.width/2, -this.height/2);
	context.restore();
}