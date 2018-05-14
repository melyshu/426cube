
init();
animate();

function init() {

	initGraphics();

  initPhysics();

  //createObjects();

  initInput();

}

function animate() {

	requestAnimationFrame( animate );
  animateCubes(); 

	render( scene, camera );

}