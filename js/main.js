var clock = new THREE.Clock();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(new THREE.Color('rgb(66,151,255)'));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); 
directionalLight.position.set(-10, 20, -10);
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

var mapDisplayState = 0;
var keyPressed = false;
var moistureMapOpts = {
	colorGradient: function(v) {
		return new THREE.Color(0, 0, v.moisture);
	}
}

var tempMapOpts = {
	colorGradient: function(v) {
		return new THREE.Color(v.temperature, 0, 0);
	}
}

var classificationOpts = {
	temperatureClass: TerrainGenerator.DefaultTemperatureClassification,
	moistureClass: TerrainGenerator.DefaultMoistureClassification,
	biomeMatrix: TerrainGenerator.DefaultBiomeMatrix,
	colorGradient: function(v) {
		if(v.biome.name == 'Bare')
			return new THREE.Color('rgb(153,153,153)');
		else if(v.biome.name == 'Tundra')
			return new THREE.Color('rgb(225,225,225)');
		else if(v.biome.name == 'Snow')
			return new THREE.Color('rgb(255,255,255)');
		else if(v.biome.name == 'Glacier')
			return new THREE.Color('rgb(209,255,255)');

		else if(v.biome.name == 'Grassland')
			return new THREE.Color('rgb(153,204,204)');
		else if(v.biome.name == 'Shrubland')
			return new THREE.Color('rgb(128,204,153)');
		else if(v.biome.name == 'Taiga')
			return new THREE.Color('rgb(46,150,121)');

		else if(v.biome.name == 'TemperateDesert')
			return new THREE.Color('rgb(255,233,151)');
		else if(v.biome.name == 'TemperateDeciduousForest')
			return new THREE.Color('rgb(67,168,94)');
		else if(v.biome.name == 'TemperateRainForest')
			return new THREE.Color('rgb(107,188,60)');
		else if(v.biome.name == 'Water')			
			return new THREE.Color('rgb(66,151,255)');

        else if(v.biome.name == 'SubTropicalDesert')
        	return new THREE.Color('rgb(224,181,112)');
		else if(v.biome.name == 'TropicalSeasonalForest')
			return new THREE.Color('rgb(0,153,76)');
		else if(v.biome.name == 'TropicalRainForest')
			return new THREE.Color('rgb(51,102,0)');

		
		else {
			return new THREE.Color(1, 0, 0);		
		}
	}
};

function generateTerrain() {
	return (new TerrainGenerator())
			.dim(250, 250)
			.generateHeightmap(0.002, 16)
			.generateClimate(0.01, 0.005)
			.apply(TerrainGenerator.MusgraveHydraulicErosion, false, null, 500)
			.apply(TerrainGenerator.Smooth, false, null);
}

var terrain = generateTerrain();
terrain.apply(TerrainGenerator.BiomeClassification, true, classificationOpts);
mesh.geometry = terrain.createGeometry(0.2);

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
	if(keyPressed) return false;
	keyPressed = true;

	if(event.keyCode == 69)  { // Letter E
		terrain = generateTerrain();
		terrain.apply(TerrainGenerator.BiomeClassification, true, classificationOpts);
		mesh.geometry = terrain.createGeometry(0.2);
	} else if (event.keyCode == 49 && mapDisplayState != 0) { //Letter T
		mapDisplayState = 0;
		terrain.apply(TerrainGenerator.BiomeClassification, true, classificationOpts);
		mesh.geometry = terrain.createGeometry(0.2);
	} else if (event.keyCode == 50 && mapDisplayState != 1) { //Letter T
		mapDisplayState = 1;
		terrain.apply(TerrainGenerator.BiomeClassification, true, tempMapOpts);
		mesh.geometry = terrain.createGeometry(0.2);
	} else if (event.keyCode == 51 && mapDisplayState != 2) { //Letter G
		mapDisplayState = 2;
		terrain.apply(TerrainGenerator.BiomeClassification, true, moistureMapOpts);
		mesh.geometry = terrain.createGeometry(0.2);
	}
}
document.addEventListener("keydown", onKeyDown);

function onKeyUp() {
	keyPressed = false;
}
document.addEventListener("keyup", onKeyUp);
