myAmmo = function(mesh, velocity) {
	this.mesh = mesh; 
	this.velocity = velocity; 
	this.position = mesh.position.clone(); 
}

myAmmo.prototype = {
	constructor: myAmmo, 

}