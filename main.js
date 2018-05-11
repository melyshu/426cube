var camera, scene, renderer;
var geometry, material, meshes;
var COUNT = 1e7;
var RATE = 1;
var controls;

var prevTime = performance.now();
var velocity = new THREE.Vector3();

init();
animate();

function init() {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );
	camera.position.z = 1;

	scene = new THREE.Scene();

	controls = new THREE.FirstPersonControls( camera );
	scene.add( controls.getObject() );

  meshes = []

	geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	material = new THREE.MeshPhysicalMaterial();

  var light = new THREE.PointLight( 0xee4400, 1, 100 );
  light.position.set( 0, 0, -3 );
  scene.add( light );

  light = new THREE.PointLight( 0x0044ee, 1, 100);
  light.position.set( 0, 0, 3);
  scene.add(light);

  light = new THREE.PointLight( 0x008844, 1, 100);
  light.position.set( -5, 5, 0);
  scene.add(light);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );

	document.body.appendChild( renderer.domElement );

}

function animate() {

	requestAnimationFrame( animate );

	// Check the FirstPersonControls object and update velocity accordingly
	playerControls();

  while (meshes[0] && meshes[0].position.z > 1) {
    meshes.shift();
  }

  var count = 0;
  while (meshes.length < COUNT && count < RATE) {
    var newMesh = new THREE.Mesh( geometry, material );
    newMesh.position.z = -10;
    newMesh.position.y = Math.random()*10 - 5;
    newMesh.position.x = Math.random()*10 - 5;
    meshes.push(newMesh);
    scene.add(newMesh);
    count++;
  }

  for (var i = 0; i < meshes.length; i++) {
    var mesh = meshes[i];
    mesh.rotation.x += Math.random()*0.1 - 0.05;
    mesh.rotation.y += Math.random()*0.1 - 0.05;
    mesh.position.x += Math.random()*0.01 - 0.005;
    mesh.position.y += Math.random()*0.01 - 0.005;
    mesh.position.z += Math.random()*0.1;
  }

	renderer.render( scene, camera );

}

function playerControls () {
	// Are the controls enabled? (Does the browser have pointer lock?)
	if ( controls.controlsEnabled ) {
		// Save the current time
		var time = performance.now();
		// Create a delta value based on current time
		var delta = ( time - prevTime ) / 1000;
		// Set the velocity.x and velocity.z using the calculated time delta
		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;
		// As velocity.y is our "gravity," calculate delta
		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
		var speed = 400.0 * delta;
		if ( controls.moveForward ) {
			velocity.z -= speed;
		}
		if ( controls.moveBackward ) {
			velocity.z += speed;
		}
		if ( controls.moveLeft ) {
			velocity.x -= speed;
		}
		if ( controls.moveRight ) {
			velocity.x += speed;
		}
		// Update the position using the changed delta
		camera.translateX( velocity.x * delta );
		// camera.translateY( velociaty.y * delta );
		camera.translateZ( velocity.z * delta );
		// Prevent the camera/player from falling out of the 'world'
		// if ( controls.getObject().position.y < 10 ) {
		// 	velocity.y = 0;
		// 	controls.getObject().position.y = 10;
		// }
		// Save the time for future delta calculations
		prevTime = time;
	}
}
