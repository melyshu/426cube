/**
* based heavily off of particle Engine by Lee Stemkoski   http://www.adelphi.edu/~stemkoski/
*/

///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////

////////////////////
// PARTICLE CLASS //
////////////////////

function ParticleCluster()
{
	this.positions    = [];
	this.origin 	  = new THREE.Vector3(); 
	this.velocity     = new THREE.Vector3(); // units per second
	
	this.numParticles = 25;

	this.color   = new THREE.Color();
	this.opacity = 1.0;
	this.size = 1.0;
			
	this.ages = []; 
	this.liveParticles = []; // use float instead of boolean for shader purposes	
	this.alive = 1; // 1 if at least one live particle in cluster is still present
	this.killed = false; 

	this.particleMaterial = new THREE.PointsMaterial();  
	this.particleGeometry = new THREE.Geometry(); 
	this.points = new THREE.Points(); 
}

ParticleCluster.prototype.initialize = function(origin, velocity, color, opacity, num, texture)
{
	this.origin.copy(origin); 
	this.velocity = velocity; 
	this.numParticles = num; 
	for (var i = 0; i < this.numParticles; i++) {
		var noise = 2;
		var offsetX = 2*Math.random()*noise - noise; 
		var offsetY = 2*Math.random()*noise - noise; 
		var offsetZ = 2*Math.random()*noise - noise; 
		var center = new THREE.Vector3(origin.x+offsetX, origin.y+offsetY, origin.z+offsetZ);
		this.particleGeometry.vertices.push(center); 

		this.positions.push(origin.x, origin.y, origin.z); 
		this.ages.push(0) 
		this.liveParticles.push(1);  
	}

	this.particleMaterial = new THREE.PointsMaterial({
		color: this.color,
		opacity: this.opacity,
		map: texture,
		size: 1,
		transparent: true, // alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5, 
		depthTest: false,		
	});

	this.particleGeometry.computeBoundingSphere(); 
	this.points = new THREE.Points(this.particleGeometry, this.particleMaterial);
}

ParticleCluster.prototype.update = function(deltaTime)
{
	this.alive = 0; 
	var vertices = this.particleGeometry.vertices;

	for (var i = 0; i < this.numParticles; i++) {
		if (this.liveParticles[i] == 0)
			continue; 
		else 
			this.alive = 1; // still have at least one live particle 

		vertices[i].x += this.velocity.x*deltaTime; 
		vertices[i].y += this.velocity.y*deltaTime; 
		vertices[i].z += this.velocity.z*deltaTime; 

		this.ages[i] += deltaTime;
		if (this.ages[i] >  20*deltaTime) {
			this.liveParticles[i] = 0; 
			//this.particleMaterial.opacity = 0.0; 
		}
	}
	this.particleGeometry.verticesNeedsUpdate = true; 
}
	
///////////////////////////////////////////////////////////////////////////////

///////////////////////////
// PARTICLE ENGINE CLASS //
///////////////////////////

function ParticleEngine()
{
	this.particleClusterArray = [];	
	this.pointsArray = []; 
}

ParticleEngine.prototype.randomDirection = function(origin) {
  var x, y, z, rsq; 
  do {
      x = 1.0 - 2.0*Math.random(); 
      y = 1.0 - 2.0*Math.random(); 
      z = 1.0 - 2.0*Math.random(); 
      rsq = Math.pow(x, 2.0) + Math.pow(y, 2.0) + Math.pow(z, 2.0); 
  }
  while (rsq > 1.0)

  // normalize
  var r = Math.sqrt(rsq); 
  var dir = new THREE.Vector3(x/r, y/r, z/r);
  dir.add(origin); 
  dir.normalize(); 
  return dir; 
}

ParticleEngine.prototype.createParticleCluster = function(origin, speed, color, opacity, size, texture)
{
	var cluster = new ParticleCluster();
	var vel = this.randomDirection(origin).multiplyScalar(speed); 
	cluster.initialize(origin, vel, color, opacity, size, texture); 
	this.particleClusterArray.push(cluster); 

	scene.add(cluster.points); 
}

ParticleEngine.prototype.update = function(deltaTime)
{
	for (var i = 0; i < this.particleClusterArray.length; i++) {
		if (this.particleClusterArray[i].alive == 0 && !this.particleClusterArray[i].killed) {
			scene.remove(this.particleClusterArray[i].points);
			this.particleClusterArray[i].killed = true; 
			this.particleClusterArray.shift(); 
			continue; 
		}
		this.particleClusterArray[i].update(deltaTime); 
	}
}
///////////////////////////////////////////////////////////////////////////////