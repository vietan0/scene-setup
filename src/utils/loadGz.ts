import { gunzipSync } from 'fflate';

export default async function loadGz(compressedUrl: string) {
	try {
		const res = await fetch(compressedUrl);

		// helpful debug: server may advertise gzip and browser may auto-decompress
		// console.debug('response content-encoding:', res.headers.get('content-encoding'));

		const arrayBuffer = await res.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		// gzip magic numbers: 0x1f 0x8b
		const isGz = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;

		let jsonString: string;
		if (isGz) {
			const decompressed = gunzipSync(bytes);
			jsonString = new TextDecoder().decode(decompressed);
		} else {
			// already decompressed (or not gz at all)
			jsonString = new TextDecoder().decode(bytes);
		}

		const data = JSON.parse(jsonString);
		return data;
	} catch (error) {
		console.error(error);
	}
}
