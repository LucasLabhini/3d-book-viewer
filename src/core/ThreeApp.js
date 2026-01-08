import * as THREE from "https://unpkg.com/three@0.166.0/build/three.module.js?module";
import { CameraRig } from "./CameraRig.js";
import { createLights } from "./Lights.js";
import { createTable } from "./Table.js";

export class ThreeApp {
	constructor(container) {
		this.container = container;

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
		});

		THREE.ColorManagement.enabled = true;
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 0.95;

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		this.renderer.setSize(container.clientWidth, container.clientHeight);
		container.appendChild(this.renderer.domElement);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x202020);

		this.cameraRig = new CameraRig(this);
		this.camera = this.cameraRig.camera;
		this.controls = this.cameraRig.controls;

		createLights(this.scene);
		createTable(this.scene);

		this.updatables = [];
		this.clock = new THREE.Clock();
		this._logAccum = 0;

		window.addEventListener("resize", () => this._onResize());
	}

	setCameraMode(mode) {
		this.cameraRig.setCameraMode(mode);
	}

	getCameraMode() {
		return this.cameraRig.getCameraMode();
	}

	resetCameraToReadingView() {
		this.cameraRig.resetCameraToReadingView();
	}

	_onResize() {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		this.renderer.setSize(width, height);
	}

	addUpdatable(obj) {
		if (obj && typeof obj.update === "function") {
			this.updatables.push(obj);
		}
	}

	start() {
		this.clock.start();
		const loop = () => {
			const delta = this.clock.getDelta();
			this._logAccum += delta;

			for (const obj of this.updatables) {
				obj.update(delta);
			}

			this.cameraRig.update(delta);

			this.renderer.render(this.scene, this.camera);
			requestAnimationFrame(loop);
		};

		requestAnimationFrame(loop);
	}
}
