var Bullet = function() {
	this.image = document.createElement("img");
	
	this.position = new Vector2();
	this.width = 5;
	this.height = 5;
	
	this.image.src = "pictures/bullet.png";
}

Bullet.prototype.update = function(deltaTime) {
	//Calculate position and velocity
	this.position.x = Math.floor(this.position.x + (deltaTime * this.velocity.x));
	this.velocity.x = bound(this.velocity.x + (deltaTime * ddx), -MAXDX, MAXDX);
}

Bullet.prototype.shoot = function(deltaTime) {
	this.position.set(player.position.x, player.position.y);
	
	if(LEFT) {
		this.velocity.x = 50;
	}
	if(LEFT) {
		this.velocity.x = -50;
	}
	this.draw(deltaTime);
}

Bullet.prototype.draw = function(deltaTime) {
	context.drawImage(this.image, this.position.x, this.position.y);
}