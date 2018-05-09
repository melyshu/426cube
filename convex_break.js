
// Detects webgl
if ( ! Detector.webgl ) {
	Detector.addGetWebGLMessage();
	document.getElementById( 'container' ).innerHTML = "";
}

// Graphics variables
var container, stats;
var camera, controls, scene, renderer;
var textureLoader;
var clock = new THREE.Clock();

var geometry, material, meshes;
var COUNT = 1e7;
var RATE = 1;

var mouseCoords = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var ballMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );

// Physics variables
var gravityConstant = 7.8;
var collisionConfiguration;
var dispatcher;
var broadphase;
var solver;
var physicsWorld;
var margin = 0.05;

var convexBreaker = new THREE.ConvexObjectBreaker();

// Rigid bodies include all movable objects
var rigidBodies = [];

var pos = new THREE.Vector3();
var quat = new THREE.Quaternion();
var transformAux1 = new Ammo.btTransform();
var tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );

var time = 0;

var objectsToRemove = [];
for ( var i = 0; i < 500; i++ ) {
	objectsToRemove[ i ] = null;
}
var numObjectsToRemove = 0;

var impactPoint = new THREE.Vector3();
var impactNormal = new THREE.Vector3();

function initGraphics() {
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

function updateStats() {

  container = document.getElementById( 'container' );
  container.innerHTML = "";

  container.appendChild( renderer.domElement );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );

  stats.update(); 
}

function initPhysics() {

	// Physics configuration

	collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	broadphase = new Ammo.btDbvtBroadphase();
	solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
	physicsWorld.setGravity( new Ammo.btVector3( 0, - gravityConstant, 0 ) );

}

function createObject( mass, halfExtents, pos, quat, material ) {

	var object = new THREE.Mesh( new THREE.BoxGeometry( halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2 ), material );
	object.position.copy( pos );
	object.quaternion.copy( quat );
	convexBreaker.prepareBreakableObject( object, mass, new THREE.Vector3(), new THREE.Vector3(), true );
	createDebrisFromBreakableObject( object );

}

function createObjects() {

	// Ground
	pos.set( 0, - 0.5, 0 );
	quat.set( 0, 0, 0, 1 );
	var ground = createParalellepipedWithPhysics( 40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
	ground.receiveShadow = true;
	textureLoader.load( "textures/grid.png", function( texture ) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 40, 40 );
		ground.material.map = texture;
		ground.material.needsUpdate = true;
	} );
}

function createDebrisFromBreakableObject( object ) {

	object.castShadow = true;
	object.receiveShadow = true;

	var shape = createConvexHullPhysicsShape( object.geometry.vertices );
	shape.setMargin( margin );

	var body = createRigidBody( object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity );

	// Set pointer back to the three object only in the debris objects
	var btVecUserData = new Ammo.btVector3( 0, 0, 0 );
	btVecUserData.threeObject = object;
	body.setUserPointer( btVecUserData );

}

function removeDebris( object ) {

	scene.remove( object );

	physicsWorld.removeRigidBody( object.userData.physicsBody );

}

function createConvexHullPhysicsShape( points ) {

	var shape = new Ammo.btConvexHullShape();

	for ( var i = 0, il = points.length; i < il; i++ ) {
		var p = points[ i ];
		this.tempBtVec3_1.setValue( p.x, p.y, p.z );
		var lastOne = ( i === ( il - 1 ) );
		shape.addPoint( this.tempBtVec3_1, lastOne );
	}

	return shape;

}

function createRigidBody( object, physicsShape, mass, pos, quat, vel, angVel ) {

	if ( pos ) {
		object.position.copy( pos );
	}
	else {
		pos = object.position;
	}
	if ( quat ) {
		object.quaternion.copy( quat );
	}
	else {
		quat = object.quaternion;
	}

	var transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	var motionState = new Ammo.btDefaultMotionState( transform );

	var localInertia = new Ammo.btVector3( 0, 0, 0 );
	physicsShape.calculateLocalInertia( mass, localInertia );

	var rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	var body = new Ammo.btRigidBody( rbInfo );

	body.setFriction( 0.5 );

	if ( vel ) {
		body.setLinearVelocity( new Ammo.btVector3( vel.x, vel.y, vel.z ) );
	}
	if ( angVel ) {
		body.setAngularVelocity( new Ammo.btVector3( angVel.x, angVel.y, angVel.z ) );
	}

	object.userData.physicsBody = body;
	object.userData.collided = false;

	scene.add( object );

	if ( mass > 0 ) {
		rigidBodies.push( object );

		// Disable deactivation
		body.setActivationState( 4 );
	}

	physicsWorld.addRigidBody( body );

	return body;
}

function createRandomColor() {
	return Math.floor( Math.random() * ( 1 << 24 ) );
}

function createMaterial( color ) {
	color = color || createRandomColor();
	return new THREE.MeshPhongMaterial( { color: color } );
}

function initInput() {

	window.addEventListener( 'mousedown', function( event ) {

		mouseCoords.set(
			( event.clientX / window.innerWidth ) * 2 - 1,
			- ( event.clientY / window.innerHeight ) * 2 + 1
		);

		raycaster.setFromCamera( mouseCoords, camera );

		// Creates a ball and throws it
		var ballMass = 35;
		var ballRadius = 0.4;

		var ball = new THREE.Mesh( new THREE.SphereBufferGeometry( ballRadius, 14, 10 ), ballMaterial );
		ball.castShadow = true;
		ball.receiveShadow = true;
		var ballShape = new Ammo.btSphereShape( ballRadius );
		ballShape.setMargin( margin );
		pos.copy( raycaster.ray.direction );
		pos.add( raycaster.ray.origin );
		quat.set( 0, 0, 0, 1 );
		var ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );

		pos.copy( raycaster.ray.direction );
		pos.multiplyScalar( 24 );
		ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

	}, false );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animateCubes() {
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

    cubeMass = 500; 
    convexBreaker.prepareBreakableObject( newMesh, cubeMass, new THREE.Vector3(), new THREE.Vector3(), true );
	//createDebrisFromBreakableObject( newMesh );
  }
  
  for (var i = 0; i < meshes.length; i++) {
    var mesh = meshes[i];
    mesh.rotation.x += Math.random()*0.1 - 0.05;
    mesh.rotation.y += Math.random()*0.1 - 0.05;
    mesh.position.x += Math.random()*0.01 - 0.005;
    mesh.position.y += Math.random()*0.01 - 0.005;
    mesh.position.z += Math.random()*0.1;
  }

}

function render() {

	var deltaTime = clock.getDelta();

	updatePhysics( deltaTime );

	renderer.render( scene, camera );

	time += deltaTime;

}

function updatePhysics( deltaTime ) {

	// Step world
	physicsWorld.stepSimulation( deltaTime, 10 );

	// Update rigid bodies
	for ( var i = 0, il = rigidBodies.length; i < il; i++ ) {
		var objThree = rigidBodies[ i ];
		var objPhys = objThree.userData.physicsBody;
		var ms = objPhys.getMotionState();
		if ( ms ) {

			ms.getWorldTransform( transformAux1 );
			var p = transformAux1.getOrigin();
			var q = transformAux1.getRotation();
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

			objThree.userData.collided = false;

		}
	}

	for ( var i = 0, il = dispatcher.getNumManifolds(); i < il; i ++ ) {

		var contactManifold = dispatcher.getManifoldByIndexInternal( i );
		var rb0 = contactManifold.getBody0();
		var rb1 = contactManifold.getBody1();

		var threeObject0 = Ammo.castObject( rb0.getUserPointer(), Ammo.btVector3 ).threeObject;
		var threeObject1 = Ammo.castObject( rb1.getUserPointer(), Ammo.btVector3 ).threeObject;

		if ( ! threeObject0 && ! threeObject1 ) {
			continue;
		}

		var userData0 = threeObject0 ? threeObject0.userData : null;
		var userData1 = threeObject1 ? threeObject1.userData : null;

		var breakable0 = userData0 ? userData0.breakable : false;
		var breakable1 = userData1 ? userData1.breakable : false;

		var collided0 = userData0 ? userData0.collided : false;
		var collided1 = userData1 ? userData1.collided : false;

		if ( ( ! breakable0 && ! breakable1 ) || ( collided0 && collided1 ) ) {
			continue;
		}

		var contact = false;
		var maxImpulse = 0;
		for ( var j = 0, jl = contactManifold.getNumContacts(); j < jl; j ++ ) {
			var contactPoint = contactManifold.getContactPoint( j );
			if ( contactPoint.getDistance() < 0 ) {
				contact = true;
				var impulse = contactPoint.getAppliedImpulse();
				if ( impulse > maxImpulse ) {
					maxImpulse = impulse;
					var pos = contactPoint.get_m_positionWorldOnB();
					var normal = contactPoint.get_m_normalWorldOnB();
					impactPoint.set( pos.x(), pos.y(), pos.z() );
					impactNormal.set( normal.x(), normal.y(), normal.z() );
				}
				break;
			}
		}

		// If no point has contact, abort
		if ( ! contact ) {
			continue;
		}

		// Subdivision

		var fractureImpulse = 250;

		if ( breakable0 && !collided0 && maxImpulse > fractureImpulse ) {

			var debris = convexBreaker.subdivideByImpact( threeObject0, impactPoint, impactNormal , 1, 2, 1.5 );

			var numObjects = debris.length;
			for ( var j = 0; j < numObjects; j++ ) {

				createDebrisFromBreakableObject( debris[ j ] );

			}

			objectsToRemove[ numObjectsToRemove++ ] = threeObject0;
			userData0.collided = true;

		}

		if ( breakable1 && !collided1 && maxImpulse > fractureImpulse ) {

			var debris = convexBreaker.subdivideByImpact( threeObject1, impactPoint, impactNormal , 1, 2, 1.5 );

			var numObjects = debris.length;
			for ( var j = 0; j < numObjects; j++ ) {

				createDebrisFromBreakableObject( debris[ j ] );

			}

			objectsToRemove[ numObjectsToRemove++ ] = threeObject1;
			userData1.collided = true;

		}

	}

	for ( var i = 0; i < numObjectsToRemove; i++ ) {

		removeDebris( objectsToRemove[ i ] );

	}
	numObjectsToRemove = 0;

}