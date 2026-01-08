import * as THREE from "https://unpkg.com/three@0.166.0/build/three.module.js?module";

export function createLights(scene) {
	const hemi = new THREE.HemisphereLight(0xbfd7ff, 0x2a1a10, 0.18);
	scene.add(hemi);

	const ambient = new THREE.AmbientLight(0xffffff, 0.04);
	scene.add(ambient);

	const key = new THREE.DirectionalLight(0xfff2e6, 0.95);
	key.position.set(2.8, 6.2, 2.4);
	key.castShadow = true;

	key.shadow.mapSize.set(2048, 2048);
	key.shadow.bias = -0.00005;
	key.shadow.normalBias = 0.001;

	const d = 2.15;
	key.shadow.camera.left = -d;
	key.shadow.camera.right = d;
	key.shadow.camera.top = d;
	key.shadow.camera.bottom = -d;
	key.shadow.camera.near = 0.5;
	key.shadow.camera.far = 9.5;

	scene.add(key);

	const fill = new THREE.DirectionalLight(0xe6f0ff, 0.33);
	fill.position.set(-3.6, 3.0, -2.6);
	fill.castShadow = false;
	scene.add(fill);

	const rim = new THREE.DirectionalLight(0xffffff, 0.14);
	rim.position.set(-1.2, 3.8, 3.6);
	rim.castShadow = false;
	scene.add(rim);
}
