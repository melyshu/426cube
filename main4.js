// graphics global variables
var camera, scene, renderer, controls;
var stats; // fps counter

// player global variables
var player;
var playerRotationRate = 0.03;

// object global variables
var objects = [];
var maxObjectCount = 100000;
var objectRadius = 100;

// time variables
var clock = new THREE.Clock();
var time = 0;


var geometry = new THREE.CubeGeometry(1, 1, 1);
var materials = []
for (var i = 0; i < 5; i++) {
  var c = Math.floor(0xffffff*(Math.random() + 1)/2);
  materials.push(new THREE.MeshPhongMaterial({ color: c }));
}





// - Main code -

init();
animate();

// - Functions -

function init() {
  initGraphics();
  initPlayer();
  initObjects();
}

function animate() {
  render();
  requestAnimationFrame(animate);
}

// initializes graphics variables
function initGraphics() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 0);

  scene = new THREE.Scene();

  var ambientLight = new THREE.AmbientLight( 0x707070 );
  scene.add( ambientLight );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.body.appendChild( stats.domElement );

  controls = new THREE.PlayerControls();

  light = new THREE.PointLight(0xffffff, 1, 50, 2);
  light.position.set(0, 0, 0);
  scene.add(light);

}

function initPlayer() {
  player = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 10),
    up: new THREE.Vector3(0, 1, 0),
    object: new THREE.Mesh(new THREE.CubeGeometry(0.5, 0.5, 0.5), new THREE.MeshNormalMaterial())
  };  
  
  scene.add(player.object);
}

function initObjects() {
  for (var i = 0; i < maxObjectCount; i++) {
    
    // generate random cube
    var index = Math.floor(materials.length*Math.random());
    var material = materials[index];
    var cube = new THREE.Mesh(geometry, material);
    var x, y, z;
    do {
      x = (2*Math.random() - 1)*objectRadius;
      y = (2*Math.random() - 1)*objectRadius;
      z = (2*Math.random() - 1)*objectRadius;
    } while (x*x + y*y + z*z > objectRadius*objectRadius);
    cube.position.set(x, y, z);

    // update
    scene.add(cube);
    objects.push(cube);
  }
}

// updates view
function render() {

  // update time
  var deltaTime = clock.getDelta();
  time += deltaTime;

  // update scene
  updateObjects(deltaTime);
  updatePlayer(deltaTime);
  updateCamera(deltaTime); 
  stats.update();

  // render!
  renderer.render(scene, camera);
}

// generates and deletes objects as required
function updateObjects(deltaTime) {
  for (var i = 0; i < objects.length; i++) {
    var obj = objects[i];
    if (player.object.position.distanceToSquared(obj.position) > objectRadius*objectRadius) {
      obj.position.sub(player.object.position).normalize().multiplyScalar(-objectRadius).add(player.object.position);
    }
  }
  
  light.position.set(player.object.position.x, player.object.position.y, player.object.position.z);
}

// moves the location of the camera
function updateCamera(deltaTime) {
  
  var pos = player.object.position.clone().sub(player.velocity.clone().normalize().multiplyScalar(3.0)).addScaledVector(player.up, 2);
  camera.up.set(player.up.x, player.up.y, player.up.z);
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(player.object.position);
}

// update the position and velocity of the player
function updatePlayer(deltaTime) {
  
  if (controls.moveUp) {
    var newVelocity = player.velocity.clone().normalize();
    var right = newVelocity.clone().cross(player.up);
    newVelocity.addScaledVector(player.up, playerRotationRate).normalize();
    newVelocity.multiplyScalar(player.velocity.length());
    player.velocity = newVelocity;
    var newUp = right.clone().cross(newVelocity).normalize();
    player.up = newUp;
  }
  if (controls.moveDown) {
    var newVelocity = player.velocity.clone().normalize();
    var right = newVelocity.clone().cross(player.up);
    newVelocity.addScaledVector(player.up, -playerRotationRate).normalize();
    newVelocity.multiplyScalar(player.velocity.length());
    player.velocity = newVelocity;
    var newUp = right.clone().cross(newVelocity).normalize();
    player.up = newUp;
  }
  if (controls.moveRight) {
    var newVelocity = player.velocity.clone().normalize();
    var right = newVelocity.clone().cross(player.up);
    newVelocity.addScaledVector(right, playerRotationRate).normalize();
    newVelocity.multiplyScalar(player.velocity.length());
    player.velocity = newVelocity;
  }
  if (controls.moveLeft) {
    var newVelocity = player.velocity.clone().normalize();
    var right = newVelocity.clone().cross(player.up);
    newVelocity.addScaledVector(right, -playerRotationRate).normalize();
    newVelocity.multiplyScalar(player.velocity.length());
    player.velocity = newVelocity;
  }
  
  
  // Update the position using the changed delta
  player.object.position.addScaledVector(player.velocity, deltaTime);
  
  // make the player look at the camera
  player.object.up = player.up;
  player.object.lookAt(camera.position.clone().addScaledVector(player.up, -2));
}