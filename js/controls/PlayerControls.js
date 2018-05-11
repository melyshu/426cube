THREE.PlayerControls = function() {
  var scope = this;
  
  this.moveUp = false;
	this.moveDown = false;
	this.moveLeft = false;
	this.moveRight = false;

	var onKeyDown = function ( event ) {
    switch ( event.keyCode ) {
      case 38: // up
      case 87: // w
        scope.moveUp = true;
        break;
      case 37: // left
      case 65: // a
        scope.moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        scope.moveDown = true;
        break;
      case 39: // right
      case 68: // d
        scope.moveRight = true;
        break;
    }
	};

	var onKeyUp = function ( event ) {
    switch( event.keyCode ) {
      case 38: // up
      case 87: // w
        scope.moveUp = false;
        break;
      case 37: // left
      case 65: // a
        scope.moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        scope.moveDown = false;
        break;
      case 39: // right
      case 68: // d
        scope.moveRight = false;
        break;
    }
	};

	document.addEventListener( 'keydown', onKeyDown, false );
	document.addEventListener( 'keyup', onKeyUp, false );
};