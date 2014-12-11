
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function ShapeHelper() {

}

ShapeHelper.prototype.convertVertToVec3 = function(xyz_vertices) {
	var vertices = [];

	for (var i = 0; i < xyz_vertices.length; i ++) {
		var x = xyz_vertices[i][0];
		var y = xyz_vertices[i][1];
		var z = xyz_vertices[i][2];
		vertices.push(new THREE.Vector3(x, y, z));
	}

	return vertices;
}

ShapeHelper.prototype.makeFaces = function(rows, cols) {
	var faces = [];
	for (var j = 0; j < cols - 1; j ++) {
		for (var i = 0; i < rows; i ++) {
			var bl = j * rows + i;
			var tl = j * rows + (i + 1) % rows;
			var tr = (j + 1) * rows + (i + 1) % rows;
			var br = (j + 1) * rows + i;

			faces.push(new THREE.Face3(bl, tl, tr));
			faces.push(new THREE.Face3(tr, br, bl));
		}
	}

	return faces;
}

ShapeHelper.prototype.meshify = function(vertices, faces, materials) {
	var geo = new THREE.Geometry();

	for (var i = 0; i < vertices.length; i ++) {
		geo.vertices.push(vertices[i]);
	}

	for (var i = 0; i < faces.length; i ++) {
		geo.faces.push(faces[i]);
	}

	var material = new THREE.MeshBasicMaterial(materials);
	return new THREE.Mesh(geo, material);
}


function render() { 
	requestAnimationFrame( render ); 
	renderer.render( scene, camera ); 
} 

/*

var xyz_vertices = [
   [-1,-1,-1], [ 1,-1,-1], [-1, 1,-1], [ 1, 1,-1], [-1,-1, 1], [ 1,-1, 1], [-1, 1, 1], [ 1, 1, 1],
   [-1,-1,-1], [ 1,-1,-1], [-1, 1,-1], [ 1, 1,-1], [-1,-1, 1], [ 1,-1, 1], [-1, 1, 1], [ 1, 1, 1],
   [-1,-1,-1], [ 1,-1,-1], [-1, 1,-1], [ 1, 1,-1], [-1,-1, 1], [ 1,-1, 1], [-1, 1, 1], [ 1, 1, 1],
]

var helper = new ShapeHelper();
var vertices =  helper.convertVertToVec3(xyz_vertices);
var faces = helper.makeFaces(3, 8);
console.log(faces);
var shape = helper.meshify(vertices, faces, { color : 0x00ff00 });
console.log(shape);
scene.add(shape); camera.position.z = 10;

*/



render();


