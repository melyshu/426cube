var camera, scene, renderer;
var geometry, material, meshes;
var COUNT = 1e7;
var RATE = 1;

init();
animate();

function init() {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.z = 1;

	scene = new THREE.Scene();
  
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