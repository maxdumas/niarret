var TerrainGenerator = function() {
	this.width = -1;
	this.height = -1;
	this.heightmap = [];
};

TerrainGenerator.prototype.generate = function(w, h, padding, frequency, amplitude) {
	if(w > 0) this.width = w;
	if(h > 0) this.height = h;

	var png = new SimplexNoise();
	this.heightmap = [];
	for(var i = 0; i < w; ++i)
		for(var j = 0; j < h; ++j) {
			this.heightmap.push(new THREE.Vector3(
				i * padding, 
				amplitude * png.fnoise2d(i * frequency, j * frequency, 8),
				j * padding
			));
		}
};