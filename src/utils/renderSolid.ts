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
	if (!points) {
		throw new Error(`Invalid points: ${points}`);
	}

	const pointsSorted = sortPolygonVertices(solid.points);
	const vertices2D: number[] = [];

	// Convert rotation to radians
	const angleRad = (rotation * Math.PI) / 180;
	const cos = Math.cos(angleRad);
	const sin = Math.sin(angleRad);

	// for (const p of pointsSorted) {
	// 	vertices2D.push(p.x, p.y);
	// }

	for (const p of pointsSorted) {
		// 1. SCALING: Apply x/y scale factors
		const x_scaled = p.x * xScale;
		const y_scaled = p.y * yScale;

		// 2. ROTATION: Apply rotation to the scaled point
		const x_rotated = x_scaled * cos - y_scaled * sin;
		const y_rotated = x_scaled * sin + y_scaled * cos;

		// 3. Collect the transformed 2D points for earcut
		// Note: The final translation (insertionPoint) is applied to the
		// whole geometry later by geo.translate()
		vertices2D.push(x_rotated, y_rotated);
	}

	const indices = earcut(vertices2D);
	const vertices3D = new Float32Array(pointsSorted.flatMap((p) => [p.x, p.y, p.z]));
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(vertices3D, 3));
	geo.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
	geo.translate(position.x, position.y, position.z);
	const solidMaterial = new THREE.MeshBasicMaterial({
		color: getColorFromACI(customColorIndex || colorIndex),
		side: THREE.DoubleSide,
	});
	const solidMesh = new THREE.Mesh(geo, solidMaterial);

	return solidMesh;
}
