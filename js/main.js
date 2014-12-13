var clock = new THREE.Clock();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 ); 
directionalLight.position.set( 0, 10, 0 ); 
scene.add(directionalLight);


var controls = new THREE.FirstPersonControls(camera);
controls.lookSpeed = 0.1;
controls.movementSpeed = 20;
controls.noFly = false;
controls.lookVertical = true;

/* Controls pitch of camera. Default is false.
controls.constrainVertical = true;
controls.verticalMin = -2.0;
controls.verticalMax = 2.0;
*/


var terrain = new Terrain();
terrain.generate(200, 200, 0.2, 0.002, 8);

var faces = ShapeHelper.makeFaces(terrain.width, terrain.height, terrain.grid);
var mesh = ShapeHelper.meshify(terrain.grid, faces, { color : 0xcccccc });
mesh.geometry.computeFaceNormals();
mesh.geometry.computeVertexNormals();
scene.add(mesh);

camera.position.y = 10;
camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), 5 * Math.PI / 4);

//Align controls with camera
controls.lon = camera.position.x;
controls.lat = camera.position.y;

clock.start();
function render() { 
	var delta = clock.getDelta();
	var time = clock.getElapsedTime();

	controls.update(delta);

	requestAnimationFrame(render); 
	renderer.render(scene, camera); 
} 
render();
clock.stop();