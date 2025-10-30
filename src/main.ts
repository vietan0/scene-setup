import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import compressedUrl from './json/plot_screening_and_fill_patterns.json.gz?url';
import type { DXF } from './types/DXF';
import loadGz from './utils/loadGz';
import MinMaxGUIHelper from './utils/MinMaxGUIHelper';
import renderSolid from './utils/renderSolid';
import resizeRendererToDisplaySize from './utils/resizeRendererToDisplaySize';

const dxf: DXF = await loadGz(compressedUrl);

function main() {
	const canvas = document.getElementById('canvas')!;
	const view1Elem = document.querySelector('#view1') as HTMLElement;
	const view2Elem = document.querySelector('#view2') as HTMLElement;
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: true,
		logarithmicDepthBuffer: true,
	});
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0xffffff);

	function setScissorForElement(elem: HTMLElement) {
		const canvasRect = canvas.getBoundingClientRect();
		const elemRect = elem.getBoundingClientRect();

		// compute a canvas relative rectangle
		const right = Math.min(elemRect.right, canvasRect.right) - canvasRect.left;
		const left = Math.max(0, elemRect.left - canvasRect.left);
		const bottom = Math.min(elemRect.bottom, canvasRect.bottom) - canvasRect.top;
		const top = Math.max(0, elemRect.top - canvasRect.top);

		const width = Math.min(canvasRect.width, right - left);
		const height = Math.min(canvasRect.height, bottom - top);

		// setup the scissor to only render to that part of the canvas
		const positiveYUpBottom = canvasRect.height - bottom;
		renderer.setScissor(left, positiveYUpBottom, width, height);
		renderer.setViewport(left, positiveYUpBottom, width, height);

		// return the aspect
		return width / height;
	}

	function addMainCam() {
		const left = -25;
		const right = 25;
		const top = 25;
		const bottom = -25;
		const near = 0.1;
		const far = 1000;
		const mainCam = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		mainCam.zoom = 0.09;
		mainCam.position.set(0, 0, 500); // 0,0 would be center

		const controls = new OrbitControls(mainCam, view1Elem);
		controls.zoomToCursor = true;
		controls.mouseButtons = {
			LEFT: THREE.MOUSE.PAN,
			RIGHT: THREE.MOUSE.ROTATE,
		};
		controls.update();

		return mainCam;
	}

	function addMetaCam() {
		const metaCam = new THREE.PerspectiveCamera(50, 1, 0.1, 5000);
		metaCam.position.set(120, 50, 1000);

		const controls2 = new OrbitControls(metaCam, view2Elem);
		controls2.update();
		return metaCam;
	}

	function addHelpers() {
		const cameraHelper = new THREE.CameraHelper(mainCam);
		scene.add(cameraHelper);
		const axesHelper = new THREE.AxesHelper(50);
		scene.add(axesHelper);
		const gridHelper = new THREE.GridHelper(2500, 50, 0xff00ff);
		gridHelper.material.transparent = true;
		gridHelper.material.opacity = 0.5;
		gridHelper.rotation.x = Math.PI / 2;
		scene.add(gridHelper);
		return { cameraHelper, axesHelper, gridHelper };
	}

	function addGUIs() {
		const gui = new GUI();
		const mainCamFolder = gui.addFolder('mainCam position');
		mainCamFolder.add(mainCam.position, 'x', 1, 200, 10).listen();
		mainCamFolder.add(mainCam.position, 'y', 1, 200, 10).listen();
		mainCamFolder.add(mainCam.position, 'z', 1, 200, 10).listen();
		mainCamFolder.open(); // Optionally open the folder by default
		gui.add(mainCam, 'zoom', 0.01, 1, 0.01).listen();
		const minMaxGUIHelper = new MinMaxGUIHelper(mainCam, 'near', 'far', 0.1);
		gui.add(minMaxGUIHelper, 'min', 0.1, 500, 10).name('near');
		gui.add(minMaxGUIHelper, 'max', 0.1, 1000, 10).name('far');

		const stats = new Stats();
		document.body.appendChild(stats.dom);
		return { gui, stats };
	}

	function addObjects() {
		const solids = dxf.entities.filter((entity) => entity.type === 'SOLID');
		solids.forEach((solid) => {
			const solidMesh = renderSolid(solid);
			scene.add(solidMesh);
		});

		const inserts = dxf.entities.filter((entity) => entity.type === 'INSERT');
		const colorSwatchBlock = dxf.blocks['Color Swatch'];
		inserts.forEach((insert) => {
			const insertMesh = renderSolid(
				colorSwatchBlock.entities[0],
				insert.insertionPoint,
				insert.colorIndex,
				insert.xScale,
				undefined,
				insert.rotation,
			);
			scene.add(insertMesh);
		});
	}

	const mainCam = addMainCam();
	const metaCam = addMetaCam();
	const { cameraHelper } = addHelpers();
	const { stats } = addGUIs();
	addObjects();

	function onWindowResize() {
		const newWidth = window.innerWidth;
		const newHeight = window.innerHeight;

		const view1Aspect = setScissorForElement(view1Elem); // render the original view
		mainCam.left = -view1Aspect;
		mainCam.right = view1Aspect;
		mainCam.updateProjectionMatrix();

		renderer.setSize(newWidth, newHeight);
		metaCam.aspect = newWidth / newHeight;
		metaCam.updateProjectionMatrix();
	}

	onWindowResize();
	window.addEventListener('resize', onWindowResize, false);

	function render() {
		resizeRendererToDisplaySize(renderer);
		renderer.setScissorTest(true); // turn on the scissor

		const view1Aspect = setScissorForElement(view1Elem); // render the original view
		mainCam.left = -view1Aspect * 25;
		mainCam.right = view1Aspect * 25;
		mainCam.updateProjectionMatrix();
		cameraHelper.update();
		cameraHelper.visible = false;
		(scene.background as THREE.Color).set(0xffffff);
		renderer.render(scene, mainCam);

		const view2Aspect = setScissorForElement(view2Elem); // render from the 2nd camera
		metaCam.aspect = view2Aspect;
		metaCam.updateProjectionMatrix();
		cameraHelper.visible = true;
		(scene.background as THREE.Color).set(0x1b409e);
		renderer.render(scene, metaCam);

		stats.update();
	}

	renderer.setAnimationLoop(render);
}

main();

async function logDxfInfo() {
	const allTypes = dxf.entities.map((entity) => entity.type);
	const allPossibleTypes = new Set();
	allTypes.forEach((type) => {
		allPossibleTypes.add(type);
	});
	console.log('allPossibleTypes', allPossibleTypes);

	const target = dxf.entities.filter((entity) => entity.type === 'HATCH');
	console.log('target.length', target.length);
	console.log('target', target);
}
logDxfInfo();
