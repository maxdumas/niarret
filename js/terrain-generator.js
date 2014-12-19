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
			var v = this.values[i * this.height + j];
			v.moisture = m;
			v.sediment = 0.25;
		}

	return this;
};

TerrainGenerator.prototype.apply = function(func, edges, iterations) {
	if(!iterations) iterations = 1;
	var o = edges ? 0 : 1;

	for(var t = 0; t < iterations; ++t)
		for(var i = o; i < this.width - o; ++i)
			for(var j = o; j < this.height - o; ++j)
				func(this, i, j);

	return this;
};

TerrainGenerator.MusgraveHydraulicErosion = function(terrain, i, j) {
	// This is based on Musgrave[1989]
	var Kc = 1.0, // Maximum ratio of water to sediment
		Kd = 0.1, // Rate of sediment settlement
		Ks = 0.3; // Rate of conversion of soil to sediment
	var loc = terrain.values[i * terrain.height + j];
	var v = {}; // We are using v as shorthand
	v.a = loc.altitude; // Height of v
	v.w = loc.moisture; // Water at v
	v.s = loc.sediment; // Sediment suspended in water at v

	// Deposit any remaining sediment in the water
	

	var dh = [];
	var sum = 0;
	for(var di = -1; di <= 1; ++di) // Calculating distribution of water
		for(var dj = -1; dj <= 1; ++dj) {
			if(di == 0 && dj == 0) continue;

			var k = (i + di) * terrain.height + (j + dj);

			var neighbor = terrain.values[k];
			var u = {};
			u.a = neighbor.altitude;
			u.w = neighbor.moisture;
			u.s = neighbor.sediment;

			
			var dhi = (v.a + v.w) - (u.a + u.w);

			// v's height and water make it higher than its surrounding neighbors,
			// so prepare to distribute the water
			if(dhi > 0) {
				sum += dhi;
				dh.push({ k: k, u: u, dhi: dhi });
			}
		}

	if(dh.length == 0) {
		v.a += Kd * v.s;
		v.s *= (1 - Kd);
	}

	dh.forEach(function(x) {
		var u = x.u;
		var dw = Math.min(v.w, (v.w + v.a) - (u.w + u.a));

		dw *= x.dhi / sum;

		v.w -= dw; // BUG: if dw = v.w here, all moisture in v goes to this one u!
		u.w += dw;
		var cs = Kc * dw; // Sediment capacity

		if(v.s >= cs) { // If vs is holding more sediment than it can...
			u.s += cs; 
			v.a += Kd * (v.s - cs); // Deposit some of that onto the surface!
			v.s = (1 - Kd) * (v.s - cs);
		} else { // If the water above vs could hold more sediment
			u.s += v.s + Ks * (cs - v.s); // We take some away
			v.a -= Ks * (cs - v.s);
			v.s = 0;
		}

		terrain.values[x.k].altitude = u.a;
		terrain.values[x.k].moisture = u.w;
		terrain.values[x.k].sediment = u.s;
	});

	loc.altitude = v.a;
	loc.moisture = v.w;
	loc.sediment = v.s;
};

TerrainGenerator.BenesHydraulicErosion = function(terrain, i, j) {

}

TerrainGenerator.prototype.determineFaceColor = function(i, j, k) {
	var a = this.values[i], b = this.values[j], c = this.values[k];

	function p(x) { return x < 0.5 ? 0 : x; }
	function n(x) { return x >= 0.5 ? 0 : x; }

	// var psum = p(a.moisture) + p(b.moisture) + p(c.moisture);
	// var nsum = n(a.moisture) + n(b.moisture) + n(c.moisture);
	var sum = a.moisture + b.moisture + c.moisture;
	return new THREE.Color(0.5, 0.5, 0.5);//sum / 3);//(2 * nsum / 3, 0.5, 2 * psum / 3);
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