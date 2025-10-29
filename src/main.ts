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
		const left = -1;
		const right = 1;
		const top = 1;
		const bottom = -1;
		const near = 0.1;
		const far = 70;
		const camera1 = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
		camera1.zoom = 0.03;
		camera1.position.set(5, 5, 50); // 0,0 would be center - 5,5 to be slightly off

		const controls = new OrbitControls(camera1, view1Elem);
		controls.update();

		return camera1;
	}

	function addMetaCam() {
		const camera2 = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
		camera2.position.set(120, 20, 70);

		const controls2 = new OrbitControls(camera2, view2Elem);
		controls2.update();
		return camera2;
	}

	function addHelpers() {
		const cameraHelper = new THREE.CameraHelper(mainCam);
		scene.add(cameraHelper);
		const axesHelper = new THREE.AxesHelper(10);
		scene.add(axesHelper);
		const gridHelper = new THREE.GridHelper(50, 50, 0xff00ff);
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
		gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near');
		gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far');

		const stats = new Stats();
		document.body.appendChild(stats.dom);
		return { gui, stats };
	}

	function addLight() {
		const color = 0xffffff;
		const intensity = 3;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-20, 10, 10);
		scene.add(light);
		scene.add(light.target);

		const helper = new THREE.DirectionalLightHelper(light, 5);
		scene.add(helper);
	}

	function addObjects() {
		const sphereRadius = 2;
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

		const geometry = new THREE.PlaneGeometry(4, 2);
		const material = new THREE.MeshBasicMaterial({
			color: 'red',
			transparent: true,
			opacity: 0.5,
		});
		const plane = new THREE.Mesh(geometry, material);
		scene.add(plane);
		const box = new THREE.BoxHelper(plane, 0xffff00);
		scene.add(box);

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
		mainCam.left = -view1Aspect;
		mainCam.right = view1Aspect;
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
