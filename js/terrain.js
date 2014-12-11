var Terrain = function() {
	this.width = -1;
	this.height = -1;
	this.PNG = new SimplexNoise();
	this.grid = [];
	this.geometry = new THREE.Geometry();
};

Terrain.prototype.generate = function(w, h, padding, frequency, amplitude) {
	for(var i = 0; i < w; ++i)
		for(var j = 0; j < h; ++j) {
			this.grid.push(new THREE.Vector3(
				i * padding, 
				amplitude * this.PNG.fnoise(i * frequency, j * frequency, 8),
				j * padding
			));
		}

	this.geometry.vertices = this.grid;
};