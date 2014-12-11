var clock = new THREE.Clock();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var directionalLight = new THREE.PointLight( 0xffffff, 0.5 ); 
directionalLight.position.set( 0, 10, 0 ); 
scene.add( directionalLight );

var terrain = new Terrain();
terrain.generate(100, 100, 1, 0.01, 5);

var faces = ShapeHelper.makeFaces(terrain.width, terrain.height, terrain.grid);
var mesh = ShapeHelper.meshify(terrain.grid, faces, { color : 0xcccccc });
scene.add(mesh);

camera.position.y = 10;
camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), 5 * Math.PI / 4);

clock.start();
function render() { 
	var delta = clock.getDelta();
	var time = clock.getElapsedTime();



	requestAnimationFrame(render); 
	renderer.render(scene, camera); 
} 
render();
clock.stop();