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

var heatMapToggle = 0;
var heatmapOpts = {
	colorGradient: function(v) {
		return new THREE.Color(v.temperature, 0, 0);
	}
}

var classificationOpts = {
	temperatureClass: TerrainGenerator.DefaultTemperatureClassification,
	moistureClass: TerrainGenerator.DefaultMoistureClassification,
	biomeMatrix: TerrainGenerator.DefaultBiomeMatrix,
	colorGradient: function(v) { 

		//'TemperateDesert',		'TemperateDeciduousForest', 'TemperateRainForest', 'Water']
		
		if(v.biome.name == 'TemperateDesert')
			return new THREE.Color(1, 1, 0); //YELLOW
		else if(v.biome.name == 'TemperateDeciduousForest')
			return new THREE.Color(0, 1, 0); //NEON GREEN
		else if(v.biome.name == 'TemperateRainForest')
			return new THREE.Color(0, 1, 1); //CYAN
		else if(v.biome.name == 'Water')			
			return new THREE.Color(0, 0, 1); //BLUE
		else if(v.biome.name == 'Grassland')
			return new THREE.Color(0, 0.8, 0); //Dark green
		else if(v.biome.name == 'Shrubland')
			return new THREE.Color(0.2, 0.4, 0); //Darker green
		else if(v.biome.name == 'Taiga')
			return new THREE.Color(0, 0.4, 0.4); //Dark turqoise
		else if(v.biome.name == 'Glacier')
			return new THREE.Color(0, 0.8, 0.8); //Dark cyan
        else if(v.biome.name == 'SubTropicalDesert')
        	return new THREE.Color(0.8, 0.4, 0); //Sandy orange
		else if(v.biome.name == 'TropicalSeasonalForest')
			return new THREE.Color(0, 0.6, 0.3); //Green with blue 
		else if(v.biome.name == 'TropicalRainForest')
			return new THREE.Color(0.2, 0.4, 0); //Darkest green
		else if(v.biome.name == 'Bare')
			return new THREE.Color(0.6, 0.6, 0); //Dark yellow
		else if(v.biome.name == 'Tundra')
			return new THREE.Color(0.88, 0.88, 0.88); //Grey
		else if(v.biome.name == 'Snow')
			return new THREE.Color(1, 1, 1); //White
		else {
			return new THREE.Color(1, 0, 0);		
		}
	}
};

function generateTerrain() {
	return (new TerrainGenerator())
						.dim(250, 250)
						.generateHeightmap(0.002, 8)
						.generateMoisture(0.01, 1)
						.apply(TerrainGenerator.MusgraveHydraulicErosion, false, null, 500);
}

function classifyBiomes(generator, opts) {
	generator.apply(TerrainGenerator.BiomeClassification, true, opts);

}

function finalize(generator) {
	mesh.geometry = generator.createGeometry(0.2);
}

var terrain = generateTerrain();
classifyBiomes(terrain, classificationOpts)
finalize(terrain);

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
	if(event.keyCode == 69)  { // Letter E
		terrain = generateTerrain();
		classifyBiomes(terrain, classificationOpts);
		finalize(terrain);
	}
	else if (event.keyCode == 84 && heatMapToggle == 0) { //Letter F
		classifyBiomes(terrain, heatmapOpts);
		finalize(terrain);
		heatMapToggle += 1;
	} 
	else if (event.keyCode == 84 && heatMapToggle == 1) {
		classifyBiomes(terrain, classificationOpts);
		finalize(terrain);
		heatMapToggle -= 1;
	}
}
document.addEventListener("keydown", onKeyDown);

function onKeyUp() {

}
document.addEventListener("keyup", onKeyUp);
