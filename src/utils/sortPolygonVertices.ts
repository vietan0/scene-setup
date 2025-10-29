interface Point {
	x: number;
	y: number;
	z: number;
}

/**
 * Sorts the vertices of a polygon in counter-clockwise order.
 * Work with convex, might not work with concave.
 * Crucial for triangulation algorithms like Earcut.
 * @param points An array of vertices.
 * @returns The array of points sorted counter-clockwise.
 */
export default function sortPolygonVertices(points: Point[]): Point[] {
	if (points.length !== 4) {
		console.warn(
			`This shape has ${points.length} points - sorting might be less reliable for complex shapes`,
		);
	}

	// 1. Calculate the centroid (average position) of the polygon
	const center = points.reduce(
		(acc, p) => ({
			x: acc.x + p.x,
			y: acc.y + p.y,
			z: acc.z + p.z,
		}),
		{ x: 0, y: 0, z: 0 },
	);
	center.x /= points.length;
	center.y /= points.length;
	center.z /= points.length;

	// 2. Sort the points based on the angle (using atan2) relative to the centroid
	// atan2(y, x) returns the angle in radians between the positive x-axis and the point (x, y)
	const sortedPoints = [...points].sort((a, b) => {
		// Calculate angle for point A
		const angleA = Math.atan2(a.y - center.y, a.x - center.x);

		// Calculate angle for point B
		const angleB = Math.atan2(b.y - center.y, b.x - center.x);

		// Sorting in ascending order of angle will result in a Counter-Clockwise (CCW) order
		return angleA - angleB;
	});

	return sortedPoints;
}
