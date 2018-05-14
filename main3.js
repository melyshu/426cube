// === GLOBAL VARIABLES ===

// graphics
var camera, scene, renderer, controls, stats;

// player
var player = {};
var playerBaseSpeed = 5;
var playerSpeedupRate = 0.03;
var playerSpeed = 0;
var playerRotationRate = 0.3;
var playerScore = 0;
var cameraPlayerDistance = 4;
var cameraUpDistance = 1;
var cameraCentering = 2;

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
var ringSpeedupOffset = 0;
var ringSpeedupOffsetRate = 3;
var ringmaterial;
var ringmaterialVisited;

// score and speed tracker
var htmlScoreDiv;
var htmlSpeedDiv;
var htmlGameOverDiv;
var htmlResetDiv;

// clock
var clock = new THREE.Clock();
var time = 0;

// shooter balls
var ammo = [];

// graphics stuff
var engine;
var textures = {};
var myMaterials = {};
var fog;
var texture_placeholder;
var milkyBox;

// sound effect
var boomSound;
var dingSound;

// animal player
var myAnimal = 0;
var animals = [];
var mixer;
var prevChangeAnimal = false;

// === MAIN CODE ===
init();
animate();

// === FUNCTIONS ===
function init() {
  initHtml();
  initTextures();
  initGraphics();

	initAnimals();
	initSounds();
  initPlayer();
  initCubes();
  initRings();
  initInput();
  initEngine();
}

function initHtml() {
  htmlScoreDiv = document.getElementById('score');
  htmlSpeedDiv = document.getElementById('speed');
  htmlGameOverDiv = document.getElementById('gameover');
  htmlResetDiv = document.getElementById('reset');
  htmlResetDiv.onclick = function() {
    htmlGameOverDiv.style = "display: none;";
  }
}

function initEngine() {
  engine = new ParticleEngine();
}

function initSounds() {
  boomSound = new Audio("effects/boom.mp3");
  dingSound = new Audio("effects/ding.wav");
}
function initTextures() {

  var loader = new THREE.TextureLoader();
  var texture = loader.load("effects/fire.png");
  textures.fire = texture;
  texture = loader.load("effects/light2.png");
  textures.light = texture;

  var ddsLoader = new THREE.DDSLoader();
  var map4 = ddsLoader.load( 'textures/explosion_dxt5_mip.dds' );
  map4.anisotropy = 4;
  myMaterials.fire = new THREE.MeshBasicMaterial( { map: map4, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthTest: true, transparent: true } );

  myMaterials.cloud = new THREE.MeshBasicMaterial( {
        map: loader.load( 'textures/cloud.png' ),
        depthTest: false,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      } );

  var materials = [

    loadTexture( 'textures/skybox/px.jpg' ), // right
    loadTexture( 'textures/skybox/nx.jpg' ), // left
    loadTexture( 'textures/skybox/py.jpg' ), // top
    loadTexture( 'textures/skybox/ny.jpg' ), // bottom
    loadTexture( 'textures/skybox/pz.jpg' ), // back
    loadTexture( 'textures/skybox/nz.jpg' )  // front

  ];
  myMaterials.skybox = materials;

  materials = [

    loadTexture( 'textures/MilkyWay/dark-s_px.jpg' ), // bottom
    loadTexture( 'textures/MilkyWay/dark-s_nx.jpg' ), // right
    loadTexture( 'textures/MilkyWay/dark-s_py.jpg' ), // back
    loadTexture( 'textures/MilkyWay/dark-s_ny.jpg' ), // left
    loadTexture( 'textures/MilkyWay/dark-s_pz.jpg' ),  // front
    loadTexture( 'textures/MilkyWay/dark-s_nz.jpg' ) // top

  ];
  myMaterials.milkyway = materials;
}

function animate() {
  requestAnimationFrame(animate);
  render();

}

// initializes graphics variables
function initGraphics() {

  // camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  // camera.position.set(0, 0, 0);
	// camera.target = new THREE.Vector3( 0, 120, 0 ); // @TODO

  // scene
  scene = new THREE.Scene();

	/// light on animal @TODO
	var light = new THREE.DirectionalLight( 0xefefff, 1.5 );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffefef, 1.5 );
	light.position.set( -1, -1, -1 ).normalize();
	scene.add( light );
  scene.add(new THREE.AmbientLight(0x707070)); // MEL: base light for debugging?

  // background
  texture_placeholder = document.createElement( 'canvas' );
  texture_placeholder.width = 128;
  texture_placeholder.height = 128;
  var context = texture_placeholder.getContext( '2d' );
  context.fillStyle = 'rgb( 200, 200, 200 )';
  context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );

  var container = document.getElementById( 'container' );
  var geometry = new THREE.BoxGeometry( 300, 300, 300, 7, 7, 7 );
  geometry.scale( - 1, 1, 1 );

  milkyBox = new THREE.Mesh( geometry, myMaterials.milkyway );
  scene.add( milkyBox );

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
  
  // resize updates
  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }, false);
}

function loadTexture( path ) {

  var texture = new THREE.Texture( texture_placeholder );
  var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );

  var image = new Image();
  image.onload = function () {

    texture.image = this;
    texture.needsUpdate = true;

  };
  image.src = path;

  return material;

}

function initAnimals() {
	animals = [
		{model: "js/models/butterfly.js", size: .1},
		{model: "js/models/eagle.js", size: .01}
	]
}

function initPlayer() {
  playerSpeed = playerSpeedupRate*(time - ringSpeedupOffset) + playerBaseSpeed;

  player.position = new THREE.Vector3(0, 0, 0);
  camera.position.set(0, cameraUpDistance, -cameraPlayerDistance);
  player.velocity = new THREE.Vector3(0, 0, playerSpeed);
  player.up = new THREE.Vector3(0, 1, 0);
  player.size = 0.5;

	var loader = new THREE.JSONLoader();
	loader.load( animals[myAnimal].model, function( geometry ) {

		player.object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
			vertexColors: THREE.FaceColors,
			morphTargets: true
		} ) );
		var animalSize = animals[myAnimal].size;
		player.object.scale.set( animalSize, animalSize, animalSize ); //@TODO:
		scene.add( player.object );

		mixer = new THREE.AnimationMixer( player.object );

		var clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'gallop', geometry.morphTargets, 30 );
		mixer.clipAction( clip ).setDuration( 1 ).play();

	} );
  // player.object = new THREE.Mesh(new THREE.CubeGeometry(player.size, player.size, player.size), new THREE.MeshNormalMaterial());
  // player.light = new THREE.PointLight(0xffffff, 1, 50, 2);
  // player.light.position.set(0, 0, 0);

  // scene.add(player.object);
  // scene.add(player.light);
}

function initRings() {

  // set up torus mesh
  var ringgeometry = new THREE.TorusGeometry(torusRadius, tubeRadius, 32, 100);
  ringmaterial = new THREE.MeshPhongMaterial( { color: 0xffff00, emissive: 0x200020, emissiveIntensity: 1 } );
  ringmaterialVisited = new THREE.MeshPhongMaterial( { color: 0xff00ff, emissive: 0x200020, emissiveIntensity: 0});

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
  var colors = [0xdd0000, 0x00dd00, 0x0000dd, 0xdddd00, 0xdd00dd, 0x00dddd];
  var materials = []
  for (var i = 0; i < colors.length; i++) {
    var c = colors[i];
    materials.push(new THREE.MeshPhongMaterial({ color: c }));
  }

  // generate cubes
  for (var i = 0; i < cubeCount; i++) {
    var index = Math.floor(materials.length*Math.random());
    var material = materials[index];

    var cube = new THREE.Mesh(geometry, myMaterials.fire);

    var R2 = visibleRadius*visibleRadius;
    var x, y, z;
    do {
      x = (2*Math.random() - 1)*visibleRadius;
      y = (2*Math.random() - 1)*visibleRadius;
      z = (2*Math.random() - 1)*visibleRadius;
    } while (x*x + y*y + z*z > R2);
    cube.position.set(x, y, z);

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
  updateSpeed();

	// updateAnimal(deltaTime);
	if (player.object) {
		updateCubes(deltaTime);
	  updateRings(deltaTime);
	  updatePlayer(deltaTime);
		updateCamera(deltaTime);
	}
  updateAmmoPhysics(deltaTime);
  engine.update(deltaTime);
  stats.update();

  // render!
  renderer.render(scene, camera);
}

function updateRings(deltaTime) {
  var playerPosition = player.object.position;
  var playerToCamera = camera.position.clone().sub(player.object.position).normalize();
  for (var i = 0; i < rings.length; i++) {
    var ring = rings[i];
    if (playerPosition.distanceToSquared(ring.position) > visibleRadius*visibleRadius) {
      ring.position.sub(playerPosition).normalize().multiplyScalar(-visibleRadius).add(playerPosition);
      ring.material = ringmaterial;
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

    // jess - lol
    var time = Date.now() * 0.001;
    cube.rotation.x = time;
    cube.rotation.y = time;

  }
}

// update the position and velocity of the player
function updatePlayer(deltaTime) {
	if (player.object) {
		var position = player.object.position.clone();
	  var velocity = player.velocity.clone().setLength(playerSpeed);
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
		if (controls.changeAnimal && !prevChangeAnimal) {
			myAnimal = (myAnimal+1)%animals.length;
			scene.remove(player.object);
			var loader = new THREE.JSONLoader();
			loader.load( animals[myAnimal].model, function( geometry ) {

				player.object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
					vertexColors: THREE.FaceColors,
					morphTargets: true
				} ) );
				var animalSize = animals[myAnimal].size;
				player.object.scale.set( animalSize, animalSize, animalSize ); //@TODO:
				player.object.position.copy(player.position);
				scene.add( player.object );

				mixer = new THREE.AnimationMixer( player.object );

				var clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'gallop', geometry.morphTargets, 30 );
				mixer.clipAction( clip ).setDuration( 1 ).play();

			} );
		}
		prevChangeAnimal = controls.changeAnimal;

	  // detect ring visits
	  for (var i = 0; i < rings.length; i++) {
	    var ring = rings[i];
	    var playerPosition = player.object.position;
	    var ringPosition = ring.position;
	    if (playerPosition.distanceTo(ringPosition) <= torusRadius) {
        // MEL: no more speed modifications
	      // player.velocity.addScaledVector(player.velocity, -1/10);
	      // ringSpeedupOffset += deltaTime*ringSpeedupOffsetRate;

        // use this as a flag for ring visited
        if (ring.material === ringmaterial) {
          playerScore++;
          ring.material = ringmaterialVisited;
          dingSound.play();
        }
	    }
	  }

    // update score
    htmlScoreDiv.innerHTML = `Score: ${playerScore}`;
    
	  //update speed tracker
	  htmlSpeedDiv.innerHTML = `Speed: ${playerSpeed.toFixed(3)}`;

	  // Update the position using the changed delta
	  player.object.position.addScaledVector(player.velocity, deltaTime);
	  player.position.copy(player.object.position);
	  // player.light.position.copy(player.object.position);
	  milkyBox.position.copy(player.object.position);
	  player.velocity = velocity;
	  player.up = up;

	  // make the player look at the camera
	  player.object.up = player.up;

	  // check for player collision with cube
	  if (handleCubeCollision(player.object)) {
      // YOU LOST LEL
      htmlGameOverDiv.style = "";
	   // player.object.
	  }

	  player.object.lookAt(camera.position.clone().addScaledVector(player.velocity, 1));

	}
	if ( mixer ) {

		mixer.update( ( deltaTime )  );

	}
}
function killPlayer(mesh) {
  scene.remove(mesh);
}

// moves the location of the camera
function updateCamera(deltaTime) {
  
  var follow = camera.position.clone().addScaledVector(player.up, -cameraUpDistance).sub(player.object.position).setLength(cameraPlayerDistance).add(player.object.position).addScaledVector(player.up, cameraUpDistance);
  var behind = player.object.position.clone().addScaledVector(player.velocity.clone().normalize(), -cameraPlayerDistance).addScaledVector(player.up, cameraUpDistance);
  
  camera.position.copy(behind.multiplyScalar(deltaTime*cameraCentering).addScaledVector(follow, 1-deltaTime*cameraCentering));
  
  var up = camera.up.clone().multiplyScalar(1 - deltaTime*cameraCentering).addScaledVector(player.up, deltaTime*cameraCentering).normalize();
  
  camera.up.copy(up);
  
// @TODO
  // var pos = player.object.position.clone().addScaledVector(player.velocity.clone().normalize(), -3).addScaledVector(player.up, 1);
  // camera.position.copy(pos);
  // camera.up.copy(player.up);
  camera.lookAt(player.object.position);
}

function updateAmmoPhysics(deltaTime) {

  while (ammo.length > 0 && !ammo[0].alive) {
    ammo.shift();
  }

  for (var i = 0; i < ammo.length; i++) {

    if (!ammo[i].alive)
      continue;

    ammo[i].mesh.position.add(ammo[i].velocity.clone().multiplyScalar(deltaTime));
    if (player.position.distanceToSquared(ammo[i].mesh.position) > visibleRadius*visibleRadius) {
      killAmmo(ammo[i]);
    }

    // check for collisions with cubes
    if (handleCubeCollision(ammo[i].mesh)) {
      killAmmo(ammo[i]);
    }
  }

}
function killAmmo(object) {
  scene.remove(object.mesh);
  object.alive = false;
}

// checks if collision with any cubes with mesh
function handleCubeCollision(mesh) {

 var meshBBox = new THREE.Box3().setFromObject(mesh);

  for (var i = 0; i < cubes.length; i++) {
    cubes[i].geometry.computeBoundingBox();
    var halfdiag = Math.sqrt(3)/2.0;
    var min = cubes[i].position.clone().sub(new THREE.Vector3(halfdiag, halfdiag, halfdiag));
    var max = cubes[i].position.clone().add(new THREE.Vector3(halfdiag, halfdiag, halfdiag));
    var box = new THREE.Box3(min, max);

    if (box.intersectsBox(meshBBox)) {
      var playerPosition = player.object.position;
      cubes[i].position.sub(playerPosition).normalize().multiplyScalar(-visibleRadius).add(playerPosition);

      boomSound.play();

      // origin, velocity, color, opacity, num, texture
      engine.createParticleCluster(mesh.position, 10, new THREE.Color(0xff0000), 0.8, 100, textures.fire);
      return true;
    }
  }
  return false;
}

function updateSpeed() {
  playerSpeed = playerSpeedupRate*(time - ringSpeedupOffset) + playerBaseSpeed;
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

    var direction = new THREE.Vector3(raycaster.ray.direction.x, raycaster.ray.direction.y, raycaster.ray.direction.z);
    var origin = new THREE.Vector3(raycaster.ray.origin.x, raycaster.ray.origin.y, raycaster.ray.origin.z);

    // Creates a ball and throws it
    var ballMass = 35;
    var ballRadius = 0.4;
    var ballMaterial = new THREE.MeshPhongMaterial( { color: 0xe0ffff, map: textures.fire } );

    var ball = new THREE.Mesh( new THREE.SphereBufferGeometry( ballRadius, 9, 3 ), ballMaterial );
    ball.castShadow = true;
    ball.receiveShadow = true;

    ball.position.x = direction.x + origin.x;
    ball.position.y = direction.y + origin.y;
    ball.position.z = direction.z + origin.z;

    var offset = player.object.position.clone().sub(camera.position);
    ball.position.add(offset);

    var velocity = new THREE.Vector3(direction.x, direction.y, direction.z);
    velocity.multiplyScalar(40 + 1.5*playerSpeed);

    var newAmmo = new myAmmo(ball, velocity, ammo.length);
    scene.add(ball);
    ammo.push(newAmmo);


  }, false );
}
