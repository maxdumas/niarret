var TerrainGenerator = function() {
	this.width = -1;
	this.height = -1;
	this.png = new SimplexNoise();
	this.values = null;
};

TerrainGenerator.prototype.dim = function(w, h) {
	if(w <= 0) throw "Must specify a width greater than 0.";
	if(h <= 0) throw "Must specify a height greater than 0.";

	this.width = w;
	this.height = h;

	return this;
}

TerrainGenerator.prototype.generateHeightmap = function(frequency, amplitude) {
	if(this.width <= 0 || this.height <= 0) throw "Must specify a terrain width and height before generation";
	this.values = [];
	for(var i = 0; i < this.width; ++i)
		for(var j = 0; j < this.height; ++j) {
			this.values.push({
				altitude: amplitude * this.png.fnoise2d(i * frequency, j * frequency, 8)
			});
		}

	return this;
};

TerrainGenerator.prototype.generateMoisture = function(frequency, amplitude) {
	if(this.width <= 0 || this.height <= 0) throw "Must specify a terrain width and height before generation";

	for(var i = 0; i < this.width; ++i)
		for(var j = 0; j < this.height; ++j)
			this.values[i * this.height + j].moisture = amplitude * this.png.noise2d(i * frequency, j * frequency);

	return this;
};

TerrainGenerator.prototype.determineFaceColor = function(i, j, k) {
	var a = this.values[i], b = this.values[j], c = this.values[k];

	function p(x) { return x < 0 ? 0 : x; }
	function n(x) { return x >= 0 ? 0 : -x; }

	var psum = p(a.moisture) + p(b.moisture) + p(c.moisture);
	var nsum = n(a.moisture) + n(b.moisture) + n(c.moisture);
	return new THREE.Color(2 * nsum / 3, 0.5, 2 * psum / 3);
};

TerrainGenerator.prototype.createFaces = function(w, h) {
	console.log(this);
	var faces = [];
	for (var j = 0; j < w - 1; ++j) {
		for (var i = 0; i < h - 1; ++i) {
			var bl = j * h + i;
			var tl = j * h + (i + 1) % h;
			var tr = (j + 1) * h + (i + 1) % h;
			var br = (j + 1) * h + i;

			var c0 = this.determineFaceColor(tr, br, bl);
			var c1 = this.determineFaceColor(bl, tl, tr);

			faces.push(new THREE.Face3(tr, br, bl, null, c0));
			faces.push(new THREE.Face3(bl, tl, tr, null, c1));
		}
	}

	return faces;
};

TerrainGenerator.prototype.createGeometry = function(gridSize) {
	if(this.width <= 0 || this.height <= 0) throw "Must specify a terrain width and height before generation";

	var geo = new THREE.Geometry();
	var faces = this.createFaces(this.width, this.height);

	for(var i = 0; i < this.width; ++i)
		for(var j = 0; j < this.height; ++j) {
			geo.vertices.push(new THREE.Vector3(
				i * gridSize,
				this.values[i * this.height + j].altitude,
				j * gridSize
			));
		}

	for (var i = 0; i < faces.length; ++i)
		geo.faces.push(faces[i]);

	geo.computeFaceNormals();
	geo.computeVertexNormals();

	return geo;
};