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

camera.position.y = 10;
camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), 5 * Math.PI / 4);

//Align controls with camera
controls.lon = camera.position.x;
controls.lat = camera.position.y;

/* Controls pitch of camera. Default is false.
controls.constrainVertical = true;
controls.verticalMin = -2.0;
controls.verticalMax = 2.0;
*/

var terrain = new TerrainGenerator();
var mesh = new THREE.Mesh(new THREE.Geometry(), new THREE.MeshLambertMaterial());
scene.add(mesh);
generateTerrain();

function generateTerrain() {
	terrain.generate(500, 500, 0.2, 0.002, 8);
	var faces = ShapeHelper.makeFaces(terrain.width, terrain.height);
	ShapeHelper.meshify(mesh, terrain.heightmap, faces);
	mesh.geometry.computeFaceNormals();
	mesh.geometry.computeVertexNormals();
}

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

function onKeyDown(event) {
	if(event.keyCode == 69)
		generateTerrain();
}
document.addEventListener("keydown", onKeyDown);

function onKeyUp() {

}
document.addEventListener("keyup", onKeyUp);
