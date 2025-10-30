import aci from '../aci.json';

export default function getColorFromACI(colorIndex: number) {
	if (typeof colorIndex !== 'number') {
		throw new Error(`colorIndex is not a number but ${typeof colorIndex}`);
	}
	if (!(colorIndex >= 1 && colorIndex <= 255)) {
		throw new Error(`Invalid colorIndex: ${colorIndex}`);
	}
	return aci[colorIndex];
}
