// graphics global variables
var camera, scene, renderer, controls;
var stats; // fps counter

// grid global variables
var gridRegions = []; // regions of space that do stuff
var gridCount = 5;   // region partitions per side
var gridSize = 15;   // sidelength of region cube
var gridDensity = 55;  // number of objects per region

var objectsToGenerate = []; // a queue for objects to be created
var maxGenerationsPerFrame = 150; // max number of objects to be generated per frame

var objectsToRemove = []; // a queue for objects to be removed
var maxRemovalsPerFrame = 150; // max number of objects to be removed per frame

// player global variables
var player = {
  position: new THREE.Vector3(0, 0, 0),
  velocity: new THREE.Vector3(0, 0, 10),
  up: new THREE.Vector3(0, 1, 0),
  object: new THREE.Mesh(new THREE.CubeGeometry(0.5, 0.5, 0.5), new THREE.MeshNormalMaterial())
};
var playerRotationRate = 0.03;

// BEGIN misc sandbox global variables
var geometry = new THREE.CubeGeometry(1, 1, 1);
var materials = []
for (var i = 0; i < 5; i++) {
  var c = Math.floor(0xffffff*(Math.random() + 1)/2);
  materials.push(new THREE.MeshPhongMaterial({ color: c }));
}

var light;

var SPEED = 15;

// END misc sandbox global variables

// time variables
var clock = new THREE.Clock();
var time = 0;

// - Main code -

init();
animate();

// - Functions -

function init() {
  initGraphics();
  initGrid();
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
  //scene.add( ambientLight );

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
  
  scene.add(player.object);
}

// initialize grid
function initGrid() {
  for (var i = 0; i < gridCount; i++) {
    for (var j = 0; j < gridCount; j++) {
      for (var k = 0; k < gridCount; k++) {
        gridRegions[gridIndex(i, j, k)] = {
          x: NaN,
          y: NaN,
          z: NaN,
          objects: []
        }
      }
    }
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
  var gridX = Math.round(player.object.position.x/gridSize);
  var gridY = Math.round(player.object.position.y/gridSize);
  var gridZ = Math.round(player.object.position.z/gridSize);

  updateGridRegions(gridX, gridY, gridZ);
  generateObjects(deltaTime);
  removeObjects(deltaTime);
  
  light.position.set(player.object.position.x, player.object.position.y, player.object.position.z);
}

// moves the location of the camera
function updateCamera(deltaTime) {
  
  var pos = player.object.position.clone().sub(player.velocity.clone().normalize().multiplyScalar(3.0)).addScaledVector(player.up, 2);
  camera.up.set(player.up.x, player.up.y, player.up.z);
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(player.object.position);
  //camera.
  // @ALICE: something?
  // controls.update(deltaTime);
  //camera.position.z -= SPEED*deltaTime;
}

// returns the positive remainder of n divided by k
function posMod(n, k) {
  return ((n % k) + k) % k;
}

// returns the index in gridRegions for the gridRegion indexed by (x, y, z)
function gridIndex(x, y, z) {
  var i = (posMod(x, gridCount)* gridCount + posMod(y, gridCount))* gridCount + posMod(z, gridCount);
  return i;
}

// returns whether this gridRegion index is still near the camera
function gridIsValid(x, y, z) {
  var gridX = Math.round(player.object.position.x/gridSize);
  var gridY = Math.round(player.object.position.y/gridSize);
  var gridZ = Math.round(player.object.position.z/gridSize);
  var halfGridCount = Math.floor(gridCount/2);

  return !(
    x < gridX - halfGridCount || gridX + halfGridCount < x ||
    y < gridY - halfGridCount || gridY + halfGridCount < y ||
    z < gridZ - halfGridCount || gridZ + halfGridCount < z
  );
}

// creates some objects from objectsToGenerate
function generateObjects(deltaTime) {

  if (objectsToGenerate.length <= 0) return;

  objectsToGenerate.unshift({ count: 0 });
  var entry = { count: 0 };
  var x = NaN;
  var y = NaN;
  var z = NaN;
  var gridRegion = gridRegions[gridIndex(x, y, z)];

  var count = 0;
  var maxToUpdate = gridCount*gridCount*gridDensity;
  var progressToUpdate = deltaTime*SPEED/gridSize;
  var total = maxGenerationsPerFrame; // Math.max(maxToUpdate*progressToUpdate*1.1, maxGenerationsPerFrame); // tried dynamically adjusting to speed
  while (count < total) {

    // go to next entry if no more
    if (entry.count <= 0) {

      // discard entries that are no longer relevant
      do {
        objectsToGenerate.shift();
        if (objectsToGenerate.length <= 0) return;
        entry = objectsToGenerate[0];
      } while (!gridIsValid(entry.x, entry.y, entry.z));

      x = entry.x;
      y = entry.y;
      z = entry.z;
      gridRegion = gridRegions[gridIndex(x, y, z)];
      continue;
    }

    // generate random cube
    var index = Math.floor(materials.length*Math.random());
    var material = materials[index];
    var cube = new THREE.Mesh(geometry, material);
    cube.position.set(
      x*gridSize + (Math.random() - 0.5)*gridSize,
      y*gridSize + (Math.random() - 0.5)*gridSize,
      z*gridSize + (Math.random() - 0.5)*gridSize,
    );

    // update
    scene.add(cube);
    gridRegion.objects.push(cube);
    entry.count--;
    count++;
  }
}

// removes some objects from objectsToRemove
function removeObjects(deltaTime) {
  var count = 0;
  var maxToUpdate = gridCount*gridCount*gridDensity;
  var progressToUpdate = deltaTime*SPEED/gridSize;
  var total = maxRemovalsPerFrame; // Math.max(maxToUpdate*progressToUpdate*1.1, maxRemovalsPerFrame); // tried dynamically adjusting to speed
  while (count < total && objectsToRemove.length > 0) {
    scene.remove(objectsToRemove.shift());
    count++;
  }
}

// updates the grid given the current grid indices
function updateGridRegions(gridX, gridY, gridZ) {

  // initialize queue
  var halfGridCount = Math.floor(gridCount/2);
  var queue = [{ x: gridX, y: gridY, z: gridZ }];
  queue.push({ x: gridX+halfGridCount, y: gridY, z: gridZ });
  queue.push({ x: gridX-halfGridCount, y: gridY, z: gridZ });
  queue.push({ x: gridX, y: gridY+halfGridCount, z: gridZ });
  queue.push({ x: gridX, y: gridY-halfGridCount, z: gridZ });
  queue.push({ x: gridX, y: gridY, z: gridZ+halfGridCount });
  queue.push({ x: gridX, y: gridY, z: gridZ-halfGridCount });

  while (queue.length > 0) {
    var queueXYZ = queue.shift();
    var qX = queueXYZ.x;
    var qY = queueXYZ.y;
    var qZ = queueXYZ.z;

    // ignore if out of bounds
    if (!gridIsValid(qX, qY, qZ)) continue;

    // update if necessary
    var gridRegion = gridRegions[gridIndex(qX, qY, qZ)];
    if (gridRegion.x !== qX || gridRegion.y !== qY || gridRegion.z !== qZ) {

      // remove old region
      for (var i = 0; i < gridRegion.objects.length; i++) {
        objectsToRemove.push(gridRegion.objects[i]);
      }

      // create new region
      gridRegions[gridIndex(qX, qY, qZ)] = {
        x: qX,
        y: qY,
        z: qZ,
        objects: []
      };

      // send generation request
      objectsToGenerate.push({
        x: qX,
        y: qY,
        z: qZ,
        count: gridDensity
      });

      // search neighbors
      queue.push({ x: qX+1, y: qY  , z: qZ   });
      queue.push({ x: qX-1, y: qY  , z: qZ   });
      queue.push({ x: qX  , y: qY+1, z: qZ   });
      queue.push({ x: qX  , y: qY-1, z: qZ   });
      queue.push({ x: qX  , y: qY  , z: qZ+1 });
      queue.push({ x: qX  , y: qY  , z: qZ-1 });
    }
  }
}

// update the position and velocity of the player
function updatePlayer(deltaTime) {
  /*
  // Set the velocity.x and velocity.z using the calculated time delta
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  // As velocity.y is our "gravity," calculate delta
  //velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
  var speed = 400.0 * delta;*/
  
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
  
  //camera.translateX( velocity.x * delta );
  // camera.translateY( velociaty.y * delta );
  //camera.translateZ( velocity.z * delta );
  // Prevent the camera/player from falling out of the 'world'
  // if ( controls.getObject().position.y < 10 ) {
  // 	velocity.y = 0;
  // 	controls.getObject().position.y = 10;
  // }
  // Save the time for future delta calculations
  prevTime = time;

}
