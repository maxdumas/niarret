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

TerrainGenerator.prototype.get = function(i, j) {
	if(this.width <= 0 || this.height <= 0) throw "Must specify a terrain width and height before generation";

	return this.values[i * this.height + j];
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
			v.temperature = 0.6;
		}

	return this;
};

TerrainGenerator.prototype.apply = function(func, edges, opts, iterations) {
	if(!iterations) iterations = 1;
	var o = edges ? 0 : 1;

	for(var t = 0; t < iterations; ++t)
		for(var i = o; i < this.width - o; ++i)
			for(var j = o; j < this.height - o; ++j)
				func(this, i, j, opts);

	return this;
};

TerrainGenerator.MusgraveHydraulicErosion = function(terrain, i, j) {
	// This is based on Musgrave[1989]
	var Kc = 1.0, // Maximum ratio of water to sediment
		Kd = 0.1, // Rate of sediment settlement
		Ks = 0.3; // Rate of conversion of soil to sediment
	var v = terrain.get(i, j);

	// Deposit any remaining sediment in the water
	var dh = [];
	var sum = 0;
	for(var di = -1; di <= 1; ++di) // Calculating distribution of water
		for(var dj = -1; dj <= 1; ++dj) {
			if(di == 0 && dj == 0) continue;

			// var k = (i + di) * terrain.height + (j + dj);
			var u = terrain.get(i + di, j + dj);
			var dhi = (v.altitude + v.moisture) - (u.altitude + u.moisture);

			// v's height and water make it higher than its surrounding neighbors,
			// so prepare to distribute the water
			if(dhi > 0) {
				sum += dhi;
				dh.push({ u: u, dhi: dhi });
			}
		}

	if(dh.length == 0) {
		v.altitude += Kd * v.sediment;
		v.sediment *= (1 - Kd);
	}

	dh.forEach(function(x) {
		var u = x.u;
		var dw = Math.min(v.moisture, (v.moisture + v.altitude) - (u.moisture + u.altitude));

		dw *= x.dhi / sum;

		v.moisture -= dw; // BUG: if dw = v.moisture here, all moisture in v goes to this one u!
		u.moisture += dw;
		var cs = Kc * dw; // Sediment capacity

		if(v.sediment >= cs) { // If vs is holding more sediment than it can...
			u.sediment += cs; 
			v.altitude += Kd * (v.sediment - cs); // Deposit some of that onto the surface!
			v.sediment = (1 - Kd) * (v.sediment - cs);
		} else { // If the water above vs could hold more sediment
			u.sediment += v.sediment + Ks * (cs - v.sediment); // We take some away
			v.altitude -= Ks * (cs - v.sediment);
			v.sediment = 0;
		}
	});
};

TerrainGenerator.BiomeClassification = function(terrain, i, j, opts) {
	var v = terrain.get(i, j);
	if(!v.biome) v.biome = {};

	if(opts.temperatureClass) 
		v.biome.temperature = TerrainGenerator.DefaultTemperatureClassifier(v, opts.temperatureClass);
	if(opts.moistureClass) 
		v.biome.moisture = TerrainGenerator.DefaultMoistureClassifier(v, opts.moistureClass);
	if(opts.biomeMatrix) {
		v.biome.name = opts.biomeMatrix[v.biome.temperature.index || 0][v.biome.moisture.index || 0];
	}
	if(opts.colorGradient) v.color = opts.colorGradient(v);
};

TerrainGenerator.DefaultTemperatureClassifier = function(v, tempClass) {
	for(var q = 0; q < tempClass.length; ++q)
		if(tempClass[q].value >= v.temperature || q == tempClass.length - 1) {
			return { name: tempClass[q].name, index: q };
		}
};

TerrainGenerator.DefaultMoistureClassifier = function(v, moistureClass) {
	for(var q = 0; q < moistureClass.length; ++q)
		if(moistureClass[q].value >= v.moisture || q == moistureClass.length - 1) {
			return { name: moistureClass[q].name, index: q };
		}
};

TerrainGenerator.prototype.determineFaceColor = function(i, j, k) {
	var a = this.values[i], b = this.values[j], c = this.values[k];
	var ac = a.color || new THREE.Color(0.5, 0.5, 0.5);
	var bc = b.color || new THREE.Color(0.5, 0.5, 0.5);
	var cc = c.color || new THREE.Color(0.5, 0.5, 0.5);
	var rsum = ac.r + bc.r + cc.r;
	var gsum = ac.g + bc.g + cc.g;
	var bsum = ac.b + bc.b + cc.b;
	return new THREE.Color(rsum / 3, gsum / 3, bsum / 3);
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

// In DefaultMoistureClassifier, a vertex recieves the first classification for which
// it fails to exceed that classification's moisture value
TerrainGenerator.DefaultMoistureClassification = [
	{ value: 0.3, name: 'Dry' }, 
	{ value: 0.6, name: 'Normal' }, 
	{ value: 0.9, name: 'Wet' },
	{ value: 1.0, name: 'Underwater'}
];
TerrainGenerator.DefaultTemperatureClassification = [
	{ value: 0.25, name: 'Freezing' }, 
	{ value: 0.5, name: 'Cold' }, 
	{ value: 0.75, name: 'Normal' },
	{ value: 1.0, name: 'Hot' }
];

TerrainGenerator.DefaultBiomeMatrix = 
[	// DRY					NORMAL						WET						UNDERWATER
	['Bare', 				'Tundra', 					'Snow',				 , 'Glacier'],// FREEZING
	['Grassland',			'Shrubland',				'Taiga',			 , 'Glacier'],// COLD
	['TemperateDesert',		'TemperateDeciduousForest', 'TemperateRainForest', 'Water'],// NORMAL
	['SubTropicalDesert',	'TropicalSeasonalForest',	'TropicalRainForest' , 'Water']// HOT
];