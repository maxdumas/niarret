var TerrainGenerator = function() {
};

TerrainGenerator.generateHeightmap = function(w, h, frequency, amplitude) {
	if(w > 0) this.width = w;
	if(h > 0) this.height = h;

	var png = new SimplexNoise();
	var heightmap = [];
	for(var i = 0; i < w; ++i)
		for(var j = 0; j < h; ++j) {
			heightmap.push(
				amplitude * png.fnoise2d(i * frequency, j * frequency, 8)
			);
		}

	return heightmap;
};

TerrainGenerator.createFaces = function(rows, cols) {
	var faces = [];
	for (var j = 0; j < cols - 1; j ++) {
		for (var i = 0; i < rows - 1; i ++) {
			var bl = (j * rows + i);
			var tl = j * rows + (i + 1) % rows;
			var tr = (j + 1) * rows + (i + 1) % rows;
			var br = (j + 1) * rows + i;

			faces.push(new THREE.Face3(tr, br, bl));
			faces.push(new THREE.Face3(bl, tl, tr));
		}
	}

	return faces;
};

TerrainGenerator.createGeometry = function(w, h, heightmap, gridSize) {
	var geo = new THREE.Geometry();

	var faces = this.createFaces(h, w);

	for(var i = 0; i < w; ++i)
		for(var j = 0; j < h; ++j) {
			geo.vertices.push(new THREE.Vector3(
				i * gridSize,
				heightmap[i * h + j],
				j * gridSize
			));
		}

	for (var i = 0; i < faces.length; ++i)
		geo.faces.push(faces[i]);

	geo.computeFaceNormals();
	geo.computeVertexNormals();

	return geo;
};