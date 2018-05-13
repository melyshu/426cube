// === GLOBAL VARIABLES ===

// graphics
var camera, scene, renderer, controls, stats;

// player
var player = {};
var playerSpeed = 10;
var playerRotationRate = 0.3;

// cubes
var cubes = [];
var cubeCount = 1000;
var cubeColorCount = 5;
var visibleRadius = 50;

// rings
var rings = [];
var ringCount = 100;
var visibleRadius = 50;
var torusRadius = 1.2; // length from center to center of tube
var tubeRadius = 0.1; // radius of the tube

// speed tracker
var infoText;

// clock
var clock = new THREE.Clock();
var time = 0;

// shooter balls
var ammo = [];
var GRAVITY = new THREE.Vector3(0, -5, 0);

// === MAIN CODE ===
init();
animate();

// === FUNCTIONS ===
function init() {
  initGraphics();
  initPlayer();
  initCubes();
  initRings();
  initInput();
}

function animate() {
  render();
  requestAnimationFrame(animate);
}

// initializes graphics variables
function initGraphics() {

  // camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 0);

  // scene
  scene = new THREE.Scene();
  // scene.add(new THREE.AmbientLight(0x707070)); // MEL: base light for debugging?

  // renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // controls
  controls = new THREE.PlayerControls();

  // stats
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );
}

function initPlayer() {
  player.position = new THREE.Vector3(0, 0, 0);
  player.velocity = new THREE.Vector3(0, 0, playerSpeed);
  player.up = new THREE.Vector3(0, 1, 0);
  player.size = 0.5;
  player.object = new THREE.Mesh(new THREE.CubeGeometry(player.size, player.size, player.size), new THREE.MeshNormalMaterial());
  player.light = new THREE.PointLight(0xffffff, 1, 50, 2);
  player.light.position.set(0, 0, 0);
  player.light.castShadow = true;

  scene.add(player.object);
  scene.add(player.light);

  infoText = document.createElement('div');
  infoText.style.position = 'absolute';
  infoText.style.color = "white";
  infoText.innerHTML = "Player Speed:" + player.velocity.length(); // tracks speed of player
  infoText.style.top = 12 + 'px';
  infoText.style.right = 12 + 'px';
  document.body.appendChild(infoText);
}

function initRings() {

  // set up torus mesh
  var ringgeometry = new THREE.TorusGeometry(torusRadius, tubeRadius, 32, 100);
  var ringmaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );

  // TODO: randomize orientation of ring

  // generate rings
  for (var i = 0; i < ringCount; i++) {
    var ring = new THREE.Mesh(ringgeometry, ringmaterial);

    var R2 = visibleRadius*visibleRadius;
    var x, y, z;
    do {
      x = (2*Math.random() - 1)*visibleRadius;
      y = (2*Math.random() - 1)*visibleRadius;
      z = (2*Math.random() - 1)*visibleRadius;
    } while (x*x + y*y + z*z > R2);
    ring.position.set(x, y, z);

    ring.castShadow = true;
    ring.receiveShadow = true;

    scene.add(ring);
    rings.push(ring);
  }
}

function initCubes() {

  // set up colors
  var geometry = new THREE.CubeGeometry(1, 1, 1);
  var materials = []
  for (var i = 0; i < cubeColorCount; i++) {
    var c = Math.floor(0xffffff*(Math.random() + 1)/2);
    materials.push(new THREE.MeshPhongMaterial({ color: c }));
  }

  // generate cubes
  for (var i = 0; i < cubeCount; i++) {
    var index = Math.floor(materials.length*Math.random());
    var material = materials[index];
    var cube = new THREE.Mesh(geometry, material);

    var R2 = visibleRadius*visibleRadius;
    var x, y, z;
    do {
      x = (2*Math.random() - 1)*visibleRadius;
      y = (2*Math.random() - 1)*visibleRadius;
      z = (2*Math.random() - 1)*visibleRadius;
    } while (x*x + y*y + z*z > R2);
    cube.position.set(x, y, z);

    cube.castShadow = true;
    cube.receiveShadow = true;

    scene.add(cube);
    cubes.push(cube);
  }
}

// updates view
function render() {

  // update time
  var deltaTime = clock.getDelta();
  time += deltaTime;

  // update scene
  updateCubes(deltaTime);
  updateRings(deltaTime);
  updatePlayer(deltaTime);
  updateCamera(deltaTime);
  updateAmmoPhysics(deltaTime);
  stats.update();

  // render!
  renderer.render(scene, camera);
}

function updateRings(deltaTime) {
  var playerPosition = player.object.position;
  var playerToCamera = camera.position.clone().sub(player.object.position).normalize();
  console.log(playerToCamera.length());
  for (var i = 0; i < rings.length; i++) {
    var ring = rings[i];
    if (playerPosition.distanceToSquared(ring.position) > visibleRadius*visibleRadius) {
      ring.position.sub(playerPosition).normalize().multiplyScalar(-visibleRadius).add(playerPosition);
    }
    ring.lookAt(player.object.position.clone().add(playerToCamera.multiplyScalar(1.5)));
  }
}

function updateCubes(deltaTime) {
  var playerPosition = player.object.position;
  for (var i = 0; i < cubes.length; i++) {
    var cube = cubes[i];
    if (playerPosition.distanceToSquared(cube.position) > visibleRadius*visibleRadius) {
      cube.position.sub(playerPosition).normalize().multiplyScalar(-visibleRadius).add(playerPosition);
    }
  }
}

// update the position and velocity of the player
function updatePlayer(deltaTime) {
  var position = player.object.position.clone();
  var velocity = player.velocity.clone();
  var up = player.up.clone();
  var right = velocity.clone().cross(up).normalize();

  if (controls.moveUp) {
    velocity.addScaledVector(up, playerRotationRate).setLength(playerSpeed);
    up = right.clone().cross(velocity).normalize();
  }
  if (controls.moveDown) {
    velocity.addScaledVector(up, -playerRotationRate).setLength(playerSpeed);
    up = right.clone().cross(velocity).normalize();
  }
  if (controls.moveRight) {
    velocity.addScaledVector(right, playerRotationRate).setLength(playerSpeed);
  }
  if (controls.moveLeft) {
    velocity.addScaledVector(right, -playerRotationRate).setLength(playerSpeed);
  }

  // change player speed if in ring

  for (var i = 0; i < rings.length; i++) {
    var ring = rings[i];
    var playerPosition = player.object.position;
    var ringPosition = ring.position;
    if (playerPosition.distanceTo(ringPosition) <= torusRadius) {
      player.velocity.addScaledVector(player.velocity, -1/10);
    }
  }

  //update speed tracker
  infoText.innerHTML = "Player Speed:" + player.velocity.length();

  // Update the position using the changed delta
  player.object.position.addScaledVector(player.velocity, deltaTime);
  player.light.position.copy(player.object.position);
  player.velocity = velocity;
  player.up = up;

  // make the player look at the camera
  player.object.up = player.up;
  player.object.lookAt(camera.position.clone().addScaledVector(player.up, -2));
}

// moves the location of the camera
function updateCamera(deltaTime) {

  var pos = player.object.position.clone().addScaledVector(player.velocity.clone().normalize(), -3).addScaledVector(player.up, 2);
  camera.position.copy(pos);
  camera.up.copy(player.up);
  camera.lookAt(player.object.position);
}

function updateAmmoPhysics(deltaTime) {
  for (var i = 0; i < ammo.length; i++) {
    ammo[i].mesh.position.add(ammo[i].velocity.clone().multiplyScalar(deltaTime));
   // ammo[i]._l.position.copy(ammo[i].mesh.position);
    //scene.add(ammo[i].mesh); // MEL: i think this is not necessary once it's already there
  }
}

function initInput() {
window.addEventListener( 'mousedown', function( event ) {


    var mouseCoords = new THREE.Vector2();
    mouseCoords.set(
      ( event.clientX / window.innerWidth ) * 2 - 1,
      - ( event.clientY / window.innerHeight ) * 2 + 1
    );

    var raycaster = new THREE.Raycaster();

    raycaster.setFromCamera( mouseCoords, camera);
    //console.log("raycaster " + raycaster.ray.direction.x + " " + raycaster.ray.direction.y + " " + raycaster.ray.direction.z);
    var direction = new THREE.Vector3(raycaster.ray.direction.x, raycaster.ray.direction.y, raycaster.ray.direction.z);
    var origin = new THREE.Vector3(raycaster.ray.origin.x, raycaster.ray.origin.y, raycaster.ray.origin.z);

    // Creates a ball and throws it
    var ballMass = 35;
    var ballRadius = 1;
    var ballMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );

    var ball = new THREE.Mesh( new THREE.SphereBufferGeometry( ballRadius, 14, 10 ), ballMaterial );
    ball.castShadow = true;
    ball.receiveShadow = true;

    ball.position.x = direction.x + origin.x;
    ball.position.y = direction.y + origin.y;
    ball.position.z = direction.z + origin.z;

    var offset = player.object.position.clone().sub(camera.position);
    ball.position.add(offset);

    var velocity = new THREE.Vector3(direction.x, direction.y, direction.z);
    velocity.multiplyScalar(70);

    var newAmmo = new myAmmo(ball, velocity);

    // MEL: hehe
    // newAmmo._l = new THREE.PointLight(0xffffff, 1, 50, 2);
    // newAmmo._l.position.copy(position);
    //scene.add(newAmmo._l);
    scene.add(ball);
    ammo.push(newAmmo);

  }, false );
}
