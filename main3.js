// Graphics global variables
var camera, scene, renderer;
var gridRegions = []; // regions of space that do stuff
var gridCount = 3;   // region partitions per side
var gridSize = 40;   // sidelength of region cube
var gridDensity = 100;  // number of objects per region

var objectsToGenerate = []; // a queue for objects to be created
var maxGenerationsPerFrame = 100; // max number of objects to be generated per frame

var objectsToRemove = []; // a queue for objects to be removed
var maxRemovalsPerFrame = 100; // max number of objects to be removed per frame

var stats; // fps counter

var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshNormalMaterial();

var SPEED = 100;

// time variables
var clock = new THREE.Clock();
var time = 0;

// - Main code -

init();
animate();

// - Functions -

function init() {
  initGraphics();
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
}

function initObjects() {  
  var gridX = Math.round(camera.position.x/gridSize);
  var gridY = Math.round(camera.position.y/gridSize);
  var gridZ = Math.round(camera.position.z/gridSize);
  
  var halfGridCount = Math.floor(gridCount/2);
  
  for (var x = gridX - halfGridCount; x < gridX + halfGridCount + 1; x++) {
    for (var y = gridY - halfGridCount; y < gridY + halfGridCount + 1; y++) {
      for (var z = gridZ - halfGridCount; z < gridZ + halfGridCount + 1; z++) {
        
        gridRegions[gridIndex(x, y, z)] = {
          x: x,
          y: y,
          z: z,
          objects: []
        };
        
        objectsToGenerate.push({
          x: x,
          y: y,
          z: z,
          count: gridDensity
        });
      }
    }
  }
}

function posMod(n, k) {
  return ((n % k) + k) % k;
}

function gridIndex(x, y, z) {
  var i = (posMod(x, gridCount)* gridCount + posMod(y, gridCount))* gridCount + posMod(z, gridCount);
  return i;
}

function generateObjects() {
  
  if (objectsToGenerate.length <= 0) return;
  
  var entry = objectsToGenerate[0];
  var x = entry.x;
  var y = entry.y;
  var z = entry.z;
  var gridRegion = gridRegions[gridIndex(x, y, z)];
  
  var count = 0;
  while (count < maxGenerationsPerFrame) {
    
    // go to next entry if no more
    if (entry.count <= 0) {
      
      objectsToGenerate.shift();
      if (objectsToGenerate.length <= 0) return;
      
      entry = objectsToGenerate[0];
      x = entry.x;
      y = entry.y;
      z = entry.z;
      gridRegion = gridRegions[gridIndex(x, y, z)];
      continue;
    }
    
    var cube = new THREE.Mesh(geometry, material);
    cube.position.set(
      x*gridSize + (Math.random() - 0.5)*gridSize,
      y*gridSize + (Math.random() - 0.5)*gridSize,
      z*gridSize + (Math.random() - 0.5)*gridSize,
    );
    
    scene.add(cube);
    gridRegion.objects.push(cube);
    entry.count--;
    count++;
  }
}

function removeObjects() {
  var count = 0;
  while (count < maxRemovalsPerFrame && objectsToRemove.length > 0) {
    scene.remove(objectsToRemove.shift());
    count++;
  }
}

// updates view
function render() {
  var deltaTime = clock.getDelta();
  updatePhysics(deltaTime);
  renderer.render(scene, camera);
  time += deltaTime;
  
  stats.update();
}

function updatePhysics(deltaTime) {
  camera.position.z -= SPEED*deltaTime;
  updateObjects();
}

function updateObjects() {
  var gridX = Math.round(camera.position.x/gridSize);
  var gridY = Math.round(camera.position.y/gridSize);
  var gridZ = Math.round(camera.position.z/gridSize);
  
  var halfGridCount = Math.floor(gridCount/2);
  
  for (var x = gridX - halfGridCount; x < gridX + halfGridCount + 1; x++) {
    for (var y = gridY - halfGridCount; y < gridY + halfGridCount + 1; y++) {
      for (var z = gridZ - halfGridCount; z < gridZ + halfGridCount + 1; z++) {
        
        // get the grid region
        var gridRegion = gridRegions[gridIndex(x, y, z)];
        
        // if this is different, remove and update!
        if (gridRegion.x !== x || gridRegion.y !== y || gridRegion.z !== z) {
          
          // remove old region
          for (var i = 0; i < gridRegion.objects.length; i++) {
            objectsToRemove.push(gridRegion.objects[i]);
          }
          
          gridRegions[gridIndex(x, y, z)] = {
            x: x,
            y: y,
            z: z,
            objects: []
          };
          
          objectsToGenerate.push({
            x: x,
            y: y,
            z: z,
            count: gridDensity
          });
        }
      }
    }
  }

  generateObjects();
  removeObjects();
}