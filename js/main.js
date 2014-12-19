var clock = new THREE.Clock();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); 
directionalLight.position.set(0, 10, 0); 
scene.add(directionalLight);


var controls = new THREE.FirstPersonControls(camera);
controls.lookSpeed = 0.1;
controls.movementSpeed = 20;
controls.noFly = false;
controls.lookVertical = true;

camera.position.y = 10;
camera.rotateOnAxis(new THREE.Vector3(0, 1, 0), 5 * Math.PI / 4);

//Align controlas with camera
controls.lon = camera.position.x;
controls.lat = camera.position.y;

var mat = new THREE.MeshLambertMaterial();
mat.vertexColors = THREE.FaceColors;
var mesh = new THREE.Mesh(new THREE.Geometry(), mat);
scene.add(mesh);

var classificationOpts = {
	temperatureClass: TerrainGenerator.DefaultTemperatureClassification,
	moistureClass: TerrainGenerator.DefaultMoistureClassification,
	biomeMatrix: TerrainGenerator.DefaultBiomeMatrix,
	colorGradient: function(v) { 
		//'TemperateDesert',		'TemperateDeciduousForest', 'TemperateRainForest', 'Water']
		if(v.biome.name == 'TemperateDesert')
			return new THREE.Color(1, 1, 0);
		else if(v.biome.name == 'TemperateDeciduousForest')
			return new THREE.Color(0, 1, 0);
		else if(v.biome.name == 'TemperateRainForest')
			return new THREE.Color(0, 1, 1);
		else if(v.biome.name == 'Water')
			return new THREE.Color(0, 0, 1);
		else return new THREE.Color(1, 0, 0);
	}
};

generateTerrain();

function generateTerrain() {
	mesh.geometry = (new TerrainGenerator())
						.dim(250, 250)
						.generateHeightmap(0.002, 8)
						.generateMoisture(0.01, 1)
						.apply(TerrainGenerator.MusgraveHydraulicErosion, false, null, 500)
						.apply(TerrainGenerator.BiomeClassification, true, classificationOpts)
						.createGeometry(0.2);
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

function onKeyDown(event) {
	if(event.keyCode == 69) // Letter E
		generateTerrain();
}
document.addEventListener("keydown", onKeyDown);

function onKeyUp() {

}
document.addEventListener("keyup", onKeyUp);
