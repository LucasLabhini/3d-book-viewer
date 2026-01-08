import * as THREE from "https://unpkg.com/three@0.166.0/build/three.module.js?module";
import { PageDeformer } from "./PageDeformer.js";

export const BOOK_DIMENSIONS = {
	PAGE_WIDTH: 1.0,
	PAGE_HEIGHT: 1.4,
	PAGE_THICKNESS: 0.0008,
	COVER_THICKNESS: 0.025,
};

const _texLoader = new THREE.TextureLoader();

const PAPER = {
	normal: _texLoader.load("assets/textures/bookPage/paper_normal.png"),
	roughness: _texLoader.load("assets/textures/bookPage/paper_roughness.png"),
};

const PAPER_TILING = 3.5;
const PAPER_NORMAL_STRENGTH = 0.12;
const PAPER_TINT = 0xebe6dd;

function setupPaperTexture(tex, repeat = PAPER_TILING) {
	if (!tex) return;
	tex.colorSpace = THREE.NoColorSpace;
	tex.wrapS = THREE.RepeatWrapping;
	tex.wrapT = THREE.RepeatWrapping;
	tex.repeat.set(repeat, repeat);
	tex.generateMipmaps = true;
	tex.minFilter = THREE.LinearMipmapLinearFilter;
	tex.magFilter = THREE.LinearFilter;
	tex.anisotropy = 8;
}

setupPaperTexture(PAPER.normal);
setupPaperTexture(PAPER.roughness);

function createRoundedRectShape(width, height, radius) {
	const hw = width / 2;
	const hh = height / 2;

	const shape = new THREE.Shape();

	shape.moveTo(-hw + radius, -hh);
	shape.lineTo(hw - radius, -hh);
	shape.quadraticCurveTo(hw, -hh, hw, -hh + radius);

	shape.lineTo(hw, hh - radius);
	shape.quadraticCurveTo(hw, hh, hw - radius, hh);

	shape.lineTo(-hw + radius, hh);
	shape.quadraticCurveTo(-hw, hh, -hw, hh - radius);

	shape.lineTo(-hw, -hh + radius);
	shape.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);

	return shape;
}

function createCovers() {
	const { PAGE_WIDTH, PAGE_HEIGHT, COVER_THICKNESS } = BOOK_DIMENSIONS;

	const outerWidth = PAGE_WIDTH + 0.04;
	const outerHeight = PAGE_HEIGHT + 0.04;
	const radius = 0.03;

	const coverShape = createRoundedRectShape(outerWidth, outerHeight, radius);

	const coverGeo = new THREE.ExtrudeGeometry(coverShape, {
		depth: COVER_THICKNESS,
		bevelEnabled: true,
		bevelThickness: 0.004,
		bevelSize: 0.004,
		bevelSegments: 3,
		curveSegments: 16,
	});

	coverGeo.rotateX(-Math.PI / 2);

	const loader = new THREE.TextureLoader();

	const colorMap = loader.load(
		"assets/textures/bookCover/book_cover_colour.png"
	);
	const normalMap = loader.load(
		"assets/textures/bookCover/book_cover_normal.png"
	);
	const roughnessMap = loader.load(
		"assets/textures/bookCover/book_cover_roughness.png"
	);

	colorMap.colorSpace = THREE.SRGBColorSpace;
	normalMap.colorSpace = THREE.NoColorSpace;
	roughnessMap.colorSpace = THREE.NoColorSpace;

	colorMap.wrapS = THREE.RepeatWrapping;
	colorMap.wrapT = THREE.RepeatWrapping;
	normalMap.wrapS = THREE.RepeatWrapping;
	normalMap.wrapT = THREE.RepeatWrapping;
	roughnessMap.wrapS = THREE.RepeatWrapping;
	roughnessMap.wrapT = THREE.RepeatWrapping;

	colorMap.repeat.set(2.2, 2.2);
	normalMap.repeat.set(2.2, 2.2);
	roughnessMap.repeat.set(2.2, 2.2);

	const coverMat = new THREE.MeshPhysicalMaterial({
		map: colorMap,
		normalMap,
		roughnessMap,
		roughness: 0.95,
		metalness: 0.0,
		clearcoat: 0.22,
		clearcoatRoughness: 0.7,
		normalScale: new THREE.Vector2(0.35, 0.35),
	});

	const rightCover = new THREE.Mesh(coverGeo, coverMat);
	rightCover.castShadow = true;
	rightCover.receiveShadow = true;
	rightCover.position.set(PAGE_WIDTH / 2, 0, 0);
	rightCover.name = "RightCover";

	const leftCover = new THREE.Mesh(coverGeo.clone(), coverMat);
	leftCover.castShadow = true;
	leftCover.receiveShadow = true;
	leftCover.position.set(-PAGE_WIDTH / 2, 0, 0);
	leftCover.rotation.y = Math.PI;
	leftCover.name = "LeftCover";

	return { leftCover, rightCover };
}

export class BookGeometryFactory {
	static createPlaceholderBook() {
		const group = new THREE.Group();
		group.name = "BookRoot_Placeholder";

		const { PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS, COVER_THICKNESS } =
			BOOK_DIMENSIONS;

		const { leftCover, rightCover } = createCovers();
		group.add(rightCover);
		group.add(leftCover);

		const segmentsX = 32;
		const segmentsY = 32;

		const pageGeo = new THREE.PlaneGeometry(
			PAGE_WIDTH,
			PAGE_HEIGHT,
			segmentsX,
			segmentsY
		);
		pageGeo.rotateX(-Math.PI / 2);
		PageDeformer.ensureBasePositions(pageGeo);

		const pageMat = new THREE.MeshStandardMaterial({
			color: PAPER_TINT,
			roughness: 1.0,
			metalness: 0.0,
			side: THREE.DoubleSide,
			normalMap: PAPER.normal || null,
			roughnessMap: PAPER.roughness || null,
			normalScale: new THREE.Vector2(
				PAPER_NORMAL_STRENGTH,
				PAPER_NORMAL_STRENGTH
			),
			envMapIntensity: 0.2,
		});

		const sheetCountPlaceholder = 6;
		const sheets = [];

		for (let i = 0; i < sheetCountPlaceholder; i++) {
			const pivot = new THREE.Group();

			const mesh = new THREE.Mesh(pageGeo, pageMat);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.position.set(PAGE_WIDTH / 2, 0.001, 0);

			const yOffset =
				COVER_THICKNESS + 0.005 + PAGE_THICKNESS * (sheetCountPlaceholder - i);
			pivot.position.set(0, yOffset, 0);
			pivot.rotation.set(0, 0, 0);

			pivot.add(mesh);
			pivot.name = `SheetPlaceholder_${i}`;
			group.add(pivot);

			sheets.push({
				sheetIndex: i,
				pivot,
				rectoMesh: mesh,
				versoMesh: null,
				geometry: null,
				frontPageIndex: null,
				backPageIndex: null,
			});
		}

		group.position.y = 0.001;

		group.userData = {
			type: "placeholder",
			sheets,
			leftCover,
			rightCover,
			pageThickness: PAGE_THICKNESS,
		};

		return group;
	}

	static createBookFromPdf(pdfDoc) {
		const group = new THREE.Group();
		group.name = "BookRoot";

		const { PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS, COVER_THICKNESS } =
			BOOK_DIMENSIONS;

		const pageCount = pdfDoc.pageCount;
		const textures = pdfDoc.textures;

		const { leftCover, rightCover } = createCovers();
		group.add(rightCover);
		group.add(leftCover);

		const sheets = [];
		const sheetCount = Math.ceil(pageCount / 2);

		const segmentsX = 32;
		const segmentsY = 32;

		for (let sheetIndex = 0; sheetIndex < sheetCount; sheetIndex++) {
			const frontPageIndex = sheetIndex * 2;
			const backPageIndex = frontPageIndex + 1;

			const frontTexture = textures[frontPageIndex] || null;
			const backTexture =
				backPageIndex < pageCount ? textures[backPageIndex] : null;

			const pivot = new THREE.Group();
			pivot.name = `Sheet_${sheetIndex}_Pivot`;

			const sheetGeo = new THREE.PlaneGeometry(
				PAGE_WIDTH,
				PAGE_HEIGHT,
				segmentsX,
				segmentsY
			);
			sheetGeo.rotateX(-Math.PI / 2);
			PageDeformer.ensureBasePositions(sheetGeo);

			const rectoMat = new THREE.MeshStandardMaterial({
				map: frontTexture || null,
				color: frontTexture ? PAPER_TINT : 0xf2eadf,
				roughness: 1.0,
				metalness: 0.0,
				side: THREE.FrontSide,
				normalMap: PAPER.normal || null,
				roughnessMap: PAPER.roughness || null,
				normalScale: new THREE.Vector2(
					PAPER_NORMAL_STRENGTH,
					PAPER_NORMAL_STRENGTH
				),
				envMapIntensity: 0.2,
			});

			const rectoMesh = new THREE.Mesh(sheetGeo, rectoMat);
			rectoMesh.castShadow = true;
			rectoMesh.receiveShadow = true;
			rectoMesh.position.set(PAGE_WIDTH / 2 - 0.001, 0.001, 0);
			rectoMesh.name = `Sheet_${sheetIndex}_Recto`;

			const versoMat = new THREE.MeshStandardMaterial({
				map: backTexture || null,
				color: backTexture ? PAPER_TINT : 0xf2eadf,
				roughness: 1.0,
				metalness: 0.0,
				side: THREE.BackSide,
				normalMap: PAPER.normal || null,
				roughnessMap: PAPER.roughness || null,
				normalScale: new THREE.Vector2(
					-PAPER_NORMAL_STRENGTH,
					PAPER_NORMAL_STRENGTH
				),
				envMapIntensity: 0.2,
			});

			const versoMesh = new THREE.Mesh(sheetGeo, versoMat);
			versoMesh.castShadow = true;
			versoMesh.receiveShadow = true;
			versoMesh.position.set(PAGE_WIDTH / 2 - 0.001, 0.001, 0);
			versoMesh.name = `Sheet_${sheetIndex}_Verso`;

			pivot.add(rectoMesh);
			pivot.add(versoMesh);

			const yOffset =
				COVER_THICKNESS + 0.005 + PAGE_THICKNESS * (sheetCount - sheetIndex);
			pivot.position.set(0, yOffset, 0);
			pivot.rotation.set(0, 0, 0);

			group.add(pivot);

			sheets.push({
				sheetIndex,
				pivot,
				rectoMesh,
				versoMesh,
				geometry: sheetGeo,
				frontPageIndex,
				backPageIndex: backPageIndex < pageCount ? backPageIndex : null,
			});
		}

		group.position.y = 0.001;

		group.userData = {
			type: "book",
			sheets,
			leftCover,
			rightCover,
			pageThickness: PAGE_THICKNESS,
		};

		return group;
	}
}
