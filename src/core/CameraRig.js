import * as THREE from "https://unpkg.com/three@0.166.0/build/three.module.js?module";
import { OrbitControls } from "https://unpkg.com/three@0.166.0/examples/jsm/controls/OrbitControls.js?module";

export class CameraRig {
	constructor(threeApp) {
		this.threeApp = threeApp;
		const { container, renderer } = threeApp;

		const aspect = container.clientWidth / container.clientHeight;
		this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);

		this.controls = new OrbitControls(this.camera, renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.target.set(0, 0.4, 0);
		this.controls.minPolarAngle = 0.1;
		this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
		this.controls.minDistance = 1.2;
		this.controls.maxDistance = 10;

		this.cameraMode = "reading";

		this._setReadingViewCamera();
		this.controls.update();
	}

	_setReadingViewCamera() {
		this.camera.position.set(0, 2.233, 0.197);
		this.camera.lookAt(0, 0.4, 0);
		this.controls.target.set(0, 0.4, 0);
		this.controls.update();
	}

	_setFreeViewCamera() {
		this.camera.position.set(0.04, 1.768, 3.123);
		this.camera.lookAt(0, 0.4, 0);
		this.controls.target.set(0, 0.4, 0);
		this.controls.update();
	}

	_stopControlsMotion() {
		const c = this.controls;
		if (!c) return;

		const prevDamping = c.enableDamping;
		c.enableDamping = false;
		if (c.sphericalDelta?.set) c.sphericalDelta.set(0, 0, 0);
		if (c.panOffset?.set) c.panOffset.set(0, 0, 0);
		if (typeof c.zoomDelta === "number") c.zoomDelta = 0;
		c.update();
		c.enableDamping = prevDamping;
	}

	setCameraMode(mode) {
		const c = this.controls;
		if (!c) return;

		if (mode === "reading") {
			this.cameraMode = "reading";
			this._stopControlsMotion();
			this._setReadingViewCamera();
			this._stopControlsMotion();
			c.enabled = true;
			c.enableRotate = false;
			c.enableZoom = true;
			c.enablePan = false;
			c.enableDamping = false; // snap, no inertia in reading mode
			c.update();
		} else if (mode === "free") {
			this.cameraMode = "free";
			this._setFreeViewCamera();
			this._stopControlsMotion();
			c.enabled = true;
			c.enableRotate = true;
			c.enableZoom = true;
			c.enablePan = true;
			c.enableDamping = true;
			c.update();
		}
	}

	getCameraMode() {
		return this.cameraMode;
	}

	resetCameraToReadingView() {
		this._setReadingViewCamera();
	}

	update() {
		if (this.controls) {
			this.controls.update();
		}
	}
}
