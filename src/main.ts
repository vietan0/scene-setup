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

	const mult = 20;

	function addMainCam() {
		const left = -mult;
		const right = mult;
		const top = mult;
		const bottom = -mult;
		const near = 0.1;
		const far = 15 * mult;
		const mainCam = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		mainCam.zoom = 0.1;
		mainCam.position.set(0, 0, far / 2);

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
		const metaCam = new THREE.PerspectiveCamera(50, 1, 10, 400 * mult);
		metaCam.position.set(0, 50, 50 * mult);

		const controls2 = new OrbitControls(metaCam, view2Elem);
		controls2.update();
		return metaCam;
	}

	function addHelpers() {
		const cameraHelper = new THREE.CameraHelper(mainCam);
		scene.add(cameraHelper);
		const axesHelper = new THREE.AxesHelper(5 * mult);
		scene.add(axesHelper);
		const gridHelper = new THREE.GridHelper(50 * mult, 20, 0xff00ff);
		gridHelper.material.transparent = true;
		gridHelper.material.opacity = 0.5;
		gridHelper.rotation.x = Math.PI / 2;
		scene.add(gridHelper);
		return { cameraHelper, axesHelper, gridHelper };
	}

	function addGUIs() {
		const gui = new GUI();
		const mainCamFolder = gui.addFolder('mainCam position');
		mainCamFolder.add(mainCam.position, 'x', -mult * 25, mult * 25, 10).listen();
		mainCamFolder.add(mainCam.position, 'y', -mult * 25, mult * 25, 10).listen();
		mainCamFolder.add(mainCam.position, 'z', -mult * 25, mult * 25, 10).listen();
		mainCamFolder.open();
		gui.add(mainCam, 'zoom', 0.01, 1, 0.01).listen();
		const minMaxGUIHelper = new MinMaxGUIHelper(mainCam, 'near', 'far', 0.1);
		gui.add(minMaxGUIHelper, 'min', 0.1, mainCam.far / 2, 10).name('near');
		gui.add(minMaxGUIHelper, 'max', mainCam.far / 2, mainCam.far, 10).name('far');

		const stats = new Stats();
		document.body.appendChild(stats.dom);
		return { gui, stats };
	}

	function addViewports() {
		const viewports = dxf.entities.filter((entity) => entity.type === 'VIEWPORT');
		viewports.forEach((vp) => {
			const aspect = vp.width / vp.height;
			const viewHeight = vp.viewHeight;
			const viewWidth = viewHeight * aspect;
			const geo = new THREE.PlaneGeometry(viewWidth, viewHeight);
			const mat = new THREE.MeshBasicMaterial({
				color: 'lightblue',
				side: THREE.DoubleSide,
				transparent: true,
				opacity: 0.5,
			});
			const plane = new THREE.Mesh(geo, mat);
			plane.position.set(vp.displayCenter.x, vp.displayCenter.y, -20);
			scene.add(plane);

			const edges = new THREE.EdgesGeometry(geo);
			const outline = new THREE.LineSegments(
				edges,
				new THREE.LineBasicMaterial({ color: 0x000000 }),
			);
			plane.add(outline);
		});
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
			const { colorIndex } = insert;

			const insertMesh = renderSolid(
				colorSwatchBlock.entities[0],
				insert.insertionPoint,
				colorIndex,
				insert.xScale,
				undefined,
				insert.rotation,
			);
			scene.add(insertMesh);
		});

		const target = dxf.entities.filter((entity) => entity.type === 'LWPOLYLINE').slice(0, 10);
		target.forEach((polyline) => {
			const positions: number[] = [];

			polyline.vertices.forEach((v: { x: number; y: number }) => {
				const divider = 1;
				positions.push(v.x / divider, v.y / divider, 0);
			});

			// 1. Geometry (using Float32BufferAttribute for performance)
			const geometry = new THREE.BufferGeometry();
			// Convert the array to a typed array
			const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
			geometry.setAttribute('position', positionAttribute);

			// 2. Material (using LineBasicMaterial)
			// You can use entity data like 'layer' or 'lineType' to determine color/style
			const material = new THREE.LineBasicMaterial({
				color: 0xff0000,
				// linewidth: polyline.constantWidth || 1, // Use constantWidth if applicable
				linewidth: 1000,
			});

			// 3. Line Object
			const line = new THREE.Line(geometry, material);

			// Add to the scene
			scene.add(line);
		});
	}

	const mainCam = addMainCam();
	const metaCam = addMetaCam();
	const { cameraHelper } = addHelpers();
	const { stats } = addGUIs();
	addViewports();
	addObjects();

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
	function onWindowResize() {
		const view1Aspect = setScissorForElement(view1Elem); // render the original view
		mainCam.left = -view1Aspect;
		mainCam.right = view1Aspect;
		mainCam.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
		metaCam.aspect = window.innerWidth / window.innerHeight;
		metaCam.updateProjectionMatrix();
	}

	onWindowResize();
	window.addEventListener('resize', onWindowResize, false);

	function render() {
		resizeRendererToDisplaySize(renderer);
		renderer.setScissorTest(true); // turn on the scissor

		const view1Aspect = setScissorForElement(view1Elem); // render the original view
		mainCam.left = -view1Aspect * mult;
		mainCam.right = view1Aspect * mult;
		mainCam.updateProjectionMatrix();
		cameraHelper.update();
		cameraHelper.visible = false;
		(scene.background as THREE.Color).set(0xffffff);
		renderer.render(scene, mainCam);

		const view2Aspect = setScissorForElement(view2Elem); // render from the 2nd camera
		metaCam.aspect = view2Aspect;
		metaCam.updateProjectionMatrix();
		cameraHelper.visible = true;
		(scene.background as THREE.Color).set(0x0c1426);
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
}
logDxfInfo();
