
var container, stats;
var camera, scene, projector, renderer;
var mesh, mixer;

// clock
var clock = new THREE.Clock();
var time = 0;

init();
animate();

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	var info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '10px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	info.innerHTML = '<a href="http://threejs.org" target="_blank" rel="noopener">three.js</a> webgl - morph targets - horse. model by <a href="http://mirada.com/">mirada</a> from <a href="http://ro.me">rome</a>';
	container.appendChild( info );

	//

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.y = 300;
	camera.target = new THREE.Vector3( 0, 150, 0 );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xf0f0f0 );

	//

	var light = new THREE.DirectionalLight( 0xefefff, 1.5 );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light );

	var light = new THREE.DirectionalLight( 0xffefef, 1.5 );
	light.position.set( -1, -1, -1 ).normalize();
	scene.add( light );

	var loader = new THREE.JSONLoader();
	loader.load( "js/models/horse.js", function( geometry ) {

		mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( {
			vertexColors: THREE.FaceColors,
			morphTargets: true
		} ) );
		mesh.scale.set( 1.5, 1.5, 1.5 );
		scene.add( mesh );

		mixer = new THREE.AnimationMixer( mesh );

		var clip = THREE.AnimationClip.CreateFromMorphTargetSequence( 'gallop', geometry.morphTargets, 30 );
		mixer.clipAction( clip ).setDuration( 1 ).play();

	} );

	//

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild(renderer.domElement);

	//

	stats = new Stats();
	container.appendChild( stats.dom );

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

	requestAnimationFrame( animate );

	render();
	stats.update();

}

var radius = 600;
var theta = 0;

var prevTime = Date.now();


function render() {

	theta += 0.1;

	camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
	camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );

	camera.lookAt( camera.target );

	var deltaTime = clock.getDelta();
  time += deltaTime;

	if ( mixer ) {

		mixer.update( ( deltaTime )  );

	}
	// console.log(mesh.position);

	renderer.render( scene, camera );

}
