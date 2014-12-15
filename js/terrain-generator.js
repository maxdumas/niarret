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
	
	this.altitudeExtrema = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };
	this.values = [];
	for(var i = 0; i < this.width; ++i)
		for(var j = 0; j < this.height; ++j) {
			var h = amplitude * this.png.fnoise2d(i * frequency, j * frequency, 8);
			if (h < this.altitudeExtrema.min) this.altitudeExtrema.min = h;
			else if (h > this.altitudeExtrema.max) this.altitudeExtrema.max = h;

			this.values.push({
				altitude: h
			});
		}

	return this;
};

TerrainGenerator.prototype.generateMoisture = function(frequency, amplitude) {
	if(this.width <= 0 || this.height <= 0) throw "Must specify a terrain width and height before generation";

	this.moistureExtrema = { min: Number.MAX_VALUE, max: Number.MIN_VALUE };
	for(var i = 0; i < this.width; ++i)
		for(var j = 0; j < this.height; ++j) {
			var m = 0.5; //amplitude * this.png.noise2d(i * frequency, j * frequency);
			if (m < this.altitudeExtrema.min) this.altitudeExtrema.min = m;
			else if (m > this.altitudeExtrema.max) this.altitudeExtrema.max = m;
			var v = this.values[i * this.height + j];
			v.moisture = m;
			v.sediment = m;
		}

	return this;
};

TerrainGenerator.prototype.apply = function(func, edges, iterations) {
	if(!iterations) iterations = 1;
	var o = edges ? 0 : 1;

	for(var t = 0; t < iterations; ++t)
		for(var i = o; i < this.width - o; ++i)
			for(var j = o; j < this.height - o; ++j)
				func.bind(this)(i, j);

	return this;
};

TerrainGenerator.HydraulicErosion = function(i, j) {
	var Kc = 0.5, // Maximum ratio of water to sediment
		Kd = 0.1, // Rate of sediment settlement
		Ks = 0.3; // Rate of conversion of soil to sediment
	// This is based on Musgrave[1985]
	var loc = this.values[i * this.height + j];
	var v = {}; // We are using v as shorthand
	v.a = loc.altitude; // Height of v
	v.w = loc.moisture; // Water at v
	v.s = loc.sediment; // Sediment suspended in water at v

	for(var x = -1; x <= 1; ++x)
		for(var y = -1; y <= 1; ++y) {
			if(x == 0 && y == 0) continue;
			var k = (i + x) * this.height + (j + y);

			var neighbor = this.values[k];
			var u = {};
			u.a = neighbor.altitude;
			u.w = neighbor.moisture;
			u.s = neighbor.sediment;

			var dw = Math.min(v.w, (v.w + v.a) - (u.w + u.a));

			if(dw <= 0) { // Deposit sediment in water at v
				v.a = v.a + Kd * v.s;
				v.s = (1 - Kd) * v.s;
			} else { // Transfer sediment from v to u
				v.w -= dw;
				u.w += dw;
				var cs = Kc * dw; // Sediment capacity

				if(v.s >= cs) { // If vs is holding more sediment than it can...
					u.s += cs; // Deposit some of that onto the surface!
					v.a += Kd * (v.s - cs);
					v.s = (1 - Kd) * (v.s - cs);
				} else { // If the water above vs could hold more sediment
					u.s += v.s + Ks * (cs - v.s); // We take some away
					v.a -= Ks * (cs - v.s);
					v.s = 0;
				}
			}

			neighbor.altitude = u.a;
			neighbor.moisture = u.w;
			neighbor.sediment = u.s;
		}

	loc.altitude = v.a;
	loc.moisture = v.w;
	loc.sediment = v.s;
};

TerrainGenerator.prototype.determineFaceColor = function(i, j, k) {
	var a = this.values[i], b = this.values[j], c = this.values[k];

	function p(x) { return x < 0.5 ? 0 : x; }
	function n(x) { return x >= 0.5 ? 0 : x; }

	var psum = p(a.moisture) + p(b.moisture) + p(c.moisture);
	var nsum = n(a.moisture) + n(b.moisture) + n(c.moisture);
	return new THREE.Color(2 * nsum / 3, 0.5, 2 * psum / 3);
};

TerrainGenerator.prototype.createFaces = function(w, h) {
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