var clock = new THREE.Clock();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var terrain = new Terrain();
terrain.generate(100, 100, 1, 0.01, 5);

var mat = new THREE.PointCloudMaterial();
mat.size = 0.3;

var mesh = new THREE.PointCloud(terrain.geometry, mat);

scene.add(mesh);

camera.position.y = 10;
camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), 5 * Math.PI / 4);
// camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), 30);
// camera.lookAt(new THREE.Vector3(150, 150, 0));

clock.start();
function render() { 
	requestAnimationFrame( render ); 
	renderer.render( scene, camera ); 
	var delta = clock.getDelta();
	var time = clock.getElapsedTime();
} 
render();
clock.stop();