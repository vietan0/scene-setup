import aci from '../aci.json';

export default function getColorFromACI(colorIndex: number) {
	if (typeof colorIndex !== 'number') {
		throw new Error(`colorIndex is not a number but ${typeof colorIndex}`);
	}
	if (!(Math.abs(colorIndex) >= 1 && Math.abs(colorIndex) <= 255)) {
		throw new Error(`Invalid colorIndex: ${colorIndex}`);
	}
	return aci[Math.abs(colorIndex)];
}
