import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import MinMaxGUIHelper from './utils/MinMaxGUIHelper';
import resizeRendererToDisplaySize from './utils/resizeRendererToDisplaySize';

function main() {
	const canvas = document.getElementById('canvas')!;
	const view1Elem = document.querySelector('#view1') as HTMLElement;
	const view2Elem = document.querySelector('#view2') as HTMLElement;
	const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
	const scene = new THREE.Scene();
	scene.background = new THREE.Color('black');

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
		mainCam.position.set(20, 20, 500); // 0,0 would be center

		const controls = new OrbitControls(mainCam, view1Elem);
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
		const axesHelper = new THREE.AxesHelper(10);
		scene.add(axesHelper);
		const gridHelper = new THREE.GridHelper(2500, 50, 0xff00ff);
		gridHelper.material.transparent = true;
		gridHelper.material.opacity = 0.3;
		gridHelper.rotation.x = Math.PI / 2;
		scene.add(gridHelper);
		return { cameraHelper, axesHelper, gridHelper };
	}

	function addGUIs() {
		const gui = new GUI();
		gui.add(mainCam, 'zoom', 0.01, 1, 0.01).listen();
		const minMaxGUIHelper = new MinMaxGUIHelper(mainCam, 'near', 'far', 0.1);
		gui.add(minMaxGUIHelper, 'min', 0.1, 500, 10).name('near');
		gui.add(minMaxGUIHelper, 'max', 0.1, 1000, 10).name('far');

		const stats = new Stats();
		document.body.appendChild(stats.dom);
		return { gui, stats };
	}

	function addLight() {
		const color = 0xffffff;
		const intensity = 3;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-200, 100, 100);
		scene.add(light);
		scene.add(light.target);

		const helper = new THREE.DirectionalLightHelper(light, 50);
		scene.add(helper);
	}

	function addObjects() {
		const sphereRadius = 50;
		const sphereWidthDivisions = 32;
		const sphereHeightDivisions = 16;
		const sphereGeo = new THREE.SphereGeometry(
			sphereRadius,
			sphereWidthDivisions,
			sphereHeightDivisions,
		);
		const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });
		const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
		sphereMesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
		scene.add(sphereMesh);

		const geometry = new THREE.PlaneGeometry(60, 120);
		const material = new THREE.MeshBasicMaterial({
			color: 'red',
			transparent: true,
			opacity: 0.5,
		});
		const plane = new THREE.Mesh(geometry, material);
		scene.add(plane);
		const box = new THREE.BoxHelper(plane, 0xffff00);
		scene.add(box);

		const bufferGeometry = new THREE.BufferGeometry();
		// create a simple square shape. We duplicate the top left and bottom right
		// vertices because each vertex needs to appear once per triangle.
		const vertices = new Float32Array([
			-10,
			-10,
			10, // v0
			10,
			-10,
			10, // v1
			10,
			10,
			10, // v2

			10,
			10,
			10, // v3
			-10,
			10,
			10, // v4
			-10,
			-10,
			10, // v5
		]);

		// itemSize = 3 because there are 3 values (components) per vertex
		bufferGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		const meshMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
		const mesh = new THREE.Mesh(bufferGeometry, meshMaterial);
		scene.add(mesh);

		const points = [];
		points.push(new THREE.Vector3(-50, -50, 0));
		points.push(new THREE.Vector3(50, 50, 0));
		const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 'hotpink' }));
		scene.add(line);

		const caPts = [
			new THREE.Vector2(610, 320),
			new THREE.Vector2(450, 300),
			new THREE.Vector2(392, 392),
			new THREE.Vector2(266, 438),
			new THREE.Vector2(190, 570),
			new THREE.Vector2(190, 600),
			new THREE.Vector2(160, 620),
			new THREE.Vector2(160, 650),
			new THREE.Vector2(180, 640),
			new THREE.Vector2(165, 680),
			new THREE.Vector2(150, 670),
			new THREE.Vector2(90, 737),
			new THREE.Vector2(80, 795),
			new THREE.Vector2(50, 835),
			new THREE.Vector2(64, 870),
			new THREE.Vector2(60, 945),
			new THREE.Vector2(300, 945),
			new THREE.Vector2(300, 743),
			new THREE.Vector2(600, 473),
			new THREE.Vector2(626, 425),
			new THREE.Vector2(600, 370),
			new THREE.Vector2(610, 320),
		];

		const caShape = new THREE.Shape(caPts);
		const caGeo = new THREE.ShapeGeometry(caShape);
		const caMaterial = new THREE.MeshBasicMaterial({ color: 'hotpink' });
		const caMesh = new THREE.Mesh(caGeo, caMaterial);
		scene.add(caMesh);
	}

	const mainCam = addMainCam();
	const metaCam = addMetaCam();
	const { cameraHelper } = addHelpers();
	const { stats } = addGUIs();
	addLight();
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
		(scene.background as THREE.Color).set(0x000000);
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
