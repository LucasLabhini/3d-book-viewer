import * as THREE from "https://unpkg.com/three@0.166.0/build/three.module.js?module";

export function createTable(scene) {
	const geometry = new THREE.BoxGeometry(10, 0.25, 10);
	geometry.setAttribute(
		"uv2",
		new THREE.BufferAttribute(geometry.attributes.uv.array, 2)
	);

	const loader = new THREE.TextureLoader();

	const base = loader.load("assets/textures/table/table_basecolor.png");
	const normal = loader.load("assets/textures/table/table_normal.png");
	const rough = loader.load("assets/textures/table/table_roughness.png");

	base.colorSpace = THREE.SRGBColorSpace;
	normal.colorSpace = THREE.NoColorSpace;
	rough.colorSpace = THREE.NoColorSpace;

	base.wrapS = base.wrapT = THREE.RepeatWrapping;
	normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
	rough.wrapS = rough.wrapT = THREE.RepeatWrapping;

	const tiling = 2.2;
	base.repeat.set(tiling, tiling);
	normal.repeat.set(tiling, tiling);
	rough.repeat.set(tiling, tiling);

	base.anisotropy = 8;
	normal.anisotropy = 8;
	rough.anisotropy = 8;

	const matParams = {
		map: base,
		normalMap: normal,
		roughnessMap: rough,
		roughness: 1.0,
		metalness: 0.0,
	};

	const aoPath = "assets/textures/table/table_ao.png";
	let aoTex = null;

	aoTex = loader.load(
		aoPath,
		() => {},
		undefined,
		() => {}
	);

	if (aoTex) {
		aoTex.colorSpace = THREE.NoColorSpace;
		aoTex.wrapS = aoTex.wrapT = THREE.RepeatWrapping;
		aoTex.repeat.set(tiling, tiling);
		aoTex.anisotropy = 8;
		matParams.aoMap = aoTex;
		matParams.aoMapIntensity = 0.6;
	}

	const material = new THREE.MeshStandardMaterial(matParams);

	const table = new THREE.Mesh(geometry, material);
	table.name = "TableMesh";
	table.position.y = -0.125;
	table.receiveShadow = true;

	scene.add(table);
}
