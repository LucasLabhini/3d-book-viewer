import * as THREE from "https://unpkg.com/three@0.166.0/build/three.module.js?module";
import {
	getDocument,
	GlobalWorkerOptions,
} from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs";

GlobalWorkerOptions.workerSrc =
	"https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";

let _maxAnisotropy = 8;

export class PdfLoader {
	static setMaxAnisotropy(value) {
		_maxAnisotropy = value || 8;
	}

	static async load(file) {
		if (!file) {
			throw new Error("Aucun fichier PDF fourni à PdfLoader.load");
		}

		const arrayBuffer = await file.arrayBuffer();
		const loadingTask = getDocument({ data: arrayBuffer });
		const pdf = await loadingTask.promise;

		const pageCount = pdf.numPages;
		const canvases = [];
		const textures = [];

		const MAX_RENDER_SIZE = 3072;
		const MAX_TEXTURE_SIZE = 2048;

		for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
			const page = await pdf.getPage(pageNum);

			const viewport1 = page.getViewport({ scale: 1.0 });
			const maxDim = Math.max(viewport1.width, viewport1.height);
			const scale = Math.min(MAX_RENDER_SIZE / maxDim, 3.25);

			const viewport = page.getViewport({ scale });

			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");

			canvas.width = Math.round(viewport.width);
			canvas.height = Math.round(viewport.height);

			const renderContext = {
				canvasContext: context,
				viewport,
			};

			context.setTransform(1, 0, 0, 1, 0, 0);
			context.clearRect(0, 0, canvas.width, canvas.height);
			await page.render(renderContext).promise;

			if (pageNum % 2 === 0) {
				const w = canvas.width;
				const h = canvas.height;

				const tempCanvas = document.createElement("canvas");
				tempCanvas.width = w;
				tempCanvas.height = h;
				const tempCtx = tempCanvas.getContext("2d");
				tempCtx.drawImage(canvas, 0, 0);

				context.save();
				context.setTransform(-1, 0, 0, 1, w, 0);
				context.clearRect(0, 0, w, h);
				context.drawImage(tempCanvas, 0, 0);
				context.restore();
			}

			let finalCanvas = canvas;

			const srcMaxDim = Math.max(canvas.width, canvas.height);
			if (srcMaxDim > MAX_TEXTURE_SIZE) {
				const scaleDown = MAX_TEXTURE_SIZE / srcMaxDim;
				const finalW = Math.max(1, Math.round(canvas.width * scaleDown));
				const finalH = Math.max(1, Math.round(canvas.height * scaleDown));

				const downCanvas = document.createElement("canvas");
				downCanvas.width = finalW;
				downCanvas.height = finalH;

				const downCtx = downCanvas.getContext("2d");
				downCtx.imageSmoothingEnabled = true;
				downCtx.imageSmoothingQuality = "high";

				downCtx.setTransform(1, 0, 0, 1, 0, 0);
				downCtx.clearRect(0, 0, finalW, finalH);
				downCtx.drawImage(canvas, 0, 0, finalW, finalH);

				finalCanvas = downCanvas;
			}

			const texture = new THREE.CanvasTexture(finalCanvas);
			texture.needsUpdate = true;
			texture.colorSpace = THREE.SRGBColorSpace;

			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;

			texture.generateMipmaps = false;
			texture.minFilter = THREE.LinearFilter;
			texture.magFilter = THREE.LinearFilter;

			texture.anisotropy = Math.min(_maxAnisotropy || 8, 16);

			canvases.push(finalCanvas);
			textures.push(texture);
		}

		return {
			pageCount,
			canvases,
			textures,
		};
	}
}
