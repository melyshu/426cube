myAmmo = function(mesh, velocity, index) {
	this.mesh = mesh; 
	this.velocity = velocity; 
	this.position = mesh.position.clone(); 
	this.alive = true; 
}

myAmmo.prototype = {
	constructor: myAmmo, 

}

myAmmo.updatePosition = function(position) {
	this.position = position; 
}

myAmmo.kill = function() {
	this.alive = false; 
}