function ShapeHelper() {

}

ShapeHelper.convertVertToVec3 = function(xyz_vertices) {
	var vertices = [];

	for (var i = 0; i < xyz_vertices.length; i ++) {
		var x = xyz_vertices[i][0];
		var y = xyz_vertices[i][1];
		var z = xyz_vertices[i][2];
		vertices.push(new THREE.Vector3(x, y, z));
	}

	return vertices;
};

ShapeHelper.makeFaces = function(rows, cols, vertices) {
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

ShapeHelper.meshify = function(vertices, faces) {
	var geo = new THREE.Geometry();

	for (var i = 0; i < vertices.length; ++i) {
		geo.vertices.push(vertices[i]);
	}

	for (var i = 0; i < faces.length; ++i) {
		geo.faces.push(faces[i]);
	}

	var material = new THREE.MeshPhongMaterial();
	return new THREE.Mesh(geo, material);
};