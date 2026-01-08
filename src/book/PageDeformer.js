import * as THREE from "https://unpkg.com/three@0.166.0/build/three.module.js?module";
import { BOOK_DIMENSIONS } from "./BookGeometryFactory.js";

export class PageDeformer {
	static ensureBasePositions(geometry) {
		if (!geometry) return;
		if (geometry.attributes.basePosition) return;

		const pos = geometry.attributes.position;
		const base = new Float32Array(pos.array.length);
		base.set(pos.array);

		geometry.setAttribute("basePosition", new THREE.BufferAttribute(base, 3));
	}

	static reset(geometry) {
		if (!geometry) return;
		const base = geometry.getAttribute("basePosition");
		const pos = geometry.getAttribute("position");
		if (!base || !pos) return;

		pos.array.set(base.array);
		pos.needsUpdate = true;
		geometry.computeVertexNormals();
	}

	static applyBend(geometry, flipProgress, direction = 1) {
		if (!geometry) return;

		this.ensureBasePositions(geometry);

		const pos = geometry.getAttribute("position");
		const base = geometry.getAttribute("basePosition");
		if (!pos || !base) return;

		const width = BOOK_DIMENSIONS.PAGE_WIDTH;

		const p = THREE.MathUtils.clamp(flipProgress, 0, 1);

		if (p === 0 || p === 1e-6) {
			this.reset(geometry);
			return;
		}

		const strength = Math.sin(Math.PI * p);
		const amplitude = width * 0.25;

		const v = new THREE.Vector3();

		for (let i = 0; i < pos.count; i++) {
			v.fromBufferAttribute(base, i);
			const ox = v.x;
			const oy = v.y;
			const oz = v.z;

			const u = THREE.MathUtils.clamp((ox + width / 2) / width, 0, 1);
			const arch = Math.sin((Math.PI * u) / 2);

			const yNew = oy + amplitude * strength * arch * direction;

			pos.setXYZ(i, ox, yNew, oz);
		}

		pos.needsUpdate = true;
		geometry.computeVertexNormals();
	}
}
