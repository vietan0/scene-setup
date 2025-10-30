import earcut from 'earcut';
import * as THREE from 'three';
import type { Entity } from '../types/DXF';
import getColorFromACI from './getColorFromACI';
import sortPolygonVertices from './sortPolygonVertices';

export default function renderSolid(
	solid: Entity,
	position = { x: 0, y: 0, z: 0 },
	customColorIndex?: number,
	xScale = 1,
	yScale = 1,
	rotation = 0, // degrees
) {
	const { points, colorIndex } = solid;
	if (!points || !Array.isArray(points) || points.length === 0) {
		throw new Error(`Invalid points: ${points}`);
	}

	const pointsSorted = sortPolygonVertices(points);

	// Convert rotation to radians
	const angleRad = (rotation * Math.PI) / 180;
	const cos = Math.cos(angleRad);
	const sin = Math.sin(angleRad);

	// Build matching 2D coordinates for earcut and 3D positions for geometry
	const flat2D: number[] = [];
	const flat3D: number[] = [];
	for (const p of pointsSorted) {
		const x_scaled = (p.x ?? 0) * xScale;
		const y_scaled = (p.y ?? 0) * yScale;

		const x_rot = x_scaled * cos - y_scaled * sin;
		const y_rot = x_scaled * sin + y_scaled * cos;

		flat2D.push(x_rot, y_rot);

		// use provided z or default to 0
		const z = p.z ?? 0;
		flat3D.push(x_rot, y_rot, z);
	}

	const indices = earcut(flat2D);

	const vertices3D = new Float32Array(flat3D);
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(vertices3D, 3));

	// choose 16- or 32-bit index buffer depending on max index
	const maxIndex = Math.max(...indices);
	let indexBuffer: Uint16Array | Uint32Array;
	if (maxIndex > 0xffff) {
		indexBuffer = new Uint32Array(indices);
	} else {
		indexBuffer = new Uint16Array(indices);
	}
	geo.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

	geo.translate(position.x, position.y, position.z);

	const solidMaterial = new THREE.MeshBasicMaterial({
		color: getColorFromACI(customColorIndex ?? colorIndex),
		side: THREE.DoubleSide,
	});
	const solidMesh = new THREE.Mesh(geo, solidMaterial);

	// optional: compute normals if using non-basic materials later
	// geo.computeVertexNormals();

	return solidMesh;
}
