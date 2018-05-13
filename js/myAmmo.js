myAmmo = function(mesh, velocity, index) {
	this.mesh = mesh; 
	this.velocity = velocity; 
	this.position = mesh.position.clone(); 
	this.index = index; // index of ammo in 
}

myAmmo.prototype = {
	constructor: myAmmo, 

}

myAmmo.triggerCollision = function(mesh) {

	mesh.material.color = new THREE.Color(0xff0000); 
}