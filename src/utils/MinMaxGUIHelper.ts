// @ts-nocheck
import type * as THREE from 'three';

export default class MinMaxGUIHelper {
	private obj: THREE.Camera;
	private minProp: string;
	private maxProp: string;
	private minDif: number;
	constructor(obj: THREE.Camera, minProp: string, maxProp: string, minDif: number) {
		this.obj = obj;
		this.minProp = minProp;
		this.maxProp = maxProp;
		this.minDif = minDif;
	}
	get min() {
		return this.obj[this.minProp];
	}
	set min(v) {
		this.obj[this.minProp] = v;
		this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
	}
	get max() {
		return this.obj[this.maxProp];
	}
	set max(v) {
		this.obj[this.maxProp] = v;
		this.min = this.min; // this will call the min setter
	}
}
