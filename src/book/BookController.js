import { BookState } from "./BookState.js";
import { BookGeometryFactory } from "./BookGeometryFactory.js";
import { PdfLoader } from "../pdf/PdfLoader.js";
import { PageDeformer } from "./PageDeformer.js";
import { BookStacks } from "./BookStacks.js";

export class BookController {
	constructor(threeApp) {
		this.threeApp = threeApp;
		this.state = new BookState();

		this.bookGroup = BookGeometryFactory.createPlaceholderBook();
		this.threeApp.scene.add(this.bookGroup);

		this.pdfDocument = null;

		this.leftStack = [];
		this.rightStack = [];

		this.stateChangeCallback = null;
		this.currentFlip = null;

		this.sheets = this.bookGroup.userData.sheets || [];
		if (this.sheets.length > 0) {
			this._initializeStacksFromSheets();
		}

		window.addEventListener("keydown", (e) => this._onKeyDown(e));
	}

	setStateChangeCallback(cb) {
		this.stateChangeCallback = cb;
	}

	_emitStateChange() {
		if (typeof this.stateChangeCallback === "function") {
			this.stateChangeCallback(this.getPageInfo());
		}
	}

	_getPageThickness() {
		return BookStacks.getPageThickness(this.bookGroup);
	}

	_getStackTopY(stackLength) {
		return BookStacks.getStackTopY(this.bookGroup, stackLength);
	}

	async loadPdf(file) {
		const pdfDoc = await PdfLoader.load(file);
		this.pdfDocument = pdfDoc;

		this.state.setDocument(pdfDoc.pageCount);
		this.currentFlip = null;

		if (this.bookGroup) {
			this.threeApp.scene.remove(this.bookGroup);
		}

		this.bookGroup = BookGeometryFactory.createBookFromPdf(pdfDoc);
		this.threeApp.scene.add(this.bookGroup);

		this.sheets = this.bookGroup.userData.sheets || [];
		this._initializeStacksFromSheets();

		this._emitStateChange();
	}

	_initializeStacksFromSheets() {
		BookStacks.initializeStacksFromSheets(
			this.sheets,
			this.leftStack,
			this.rightStack
		);
		this._layoutStacks();
	}

	_layoutStacks() {
		BookStacks.layoutStacks(
			this.sheets,
			this.leftStack,
			this.rightStack,
			this.bookGroup
		);
	}

	flipNext() {
		if (!this.pdfDocument) return;
		if (this.currentFlip) return;
		if (this.rightStack.length === 0) return;

		const leftLen = this.leftStack.length;
		const rightLen = this.rightStack.length;

		const leftTopYBefore = this._getStackTopY(leftLen);
		const rightTopYBefore = this._getStackTopY(rightLen);

		const sheetIndex = this.rightStack[rightLen - 1];
		const sheetInfo = this.sheets[sheetIndex];
		if (!sheetInfo) return;

		const pivot = sheetInfo.pivot;
		const geometry = sheetInfo.geometry;
		if (geometry) PageDeformer.reset(geometry);

		const pageThickness = this._getPageThickness();

		const startY = rightTopYBefore;
		const endY = this._getStackTopY(leftLen + 1);

		const maxStacksTop = Math.max(
			this._getStackTopY(leftLen + 1),
			rightTopYBefore
		);

		let needsLift = false;
		let maxY = startY;

		if (maxStacksTop > startY + 1e-5 || maxStacksTop > endY + 1e-5) {
			needsLift = true;
			maxY = maxStacksTop + pageThickness * 2.0;
		}

		this.rightStack.pop();

		this.currentFlip = {
			direction: "forward",
			sheetIndex,
			sheetInfo,
			startY,
			endY,
			maxY,
			needsLift,
			elapsed: 0,
			duration: 0.7,
			startAngle: 0,
			endAngle: Math.PI,
		};
	}

	flipPrevious() {
		if (!this.pdfDocument) return;
		if (this.currentFlip) return;
		if (this.leftStack.length === 0) return;

		const leftLen = this.leftStack.length;
		const rightLen = this.rightStack.length;

		const leftTopYBefore = this._getStackTopY(leftLen);
		const rightTopYBefore = this._getStackTopY(rightLen);

		const sheetIndex = this.leftStack[leftLen - 1];
		const sheetInfo = this.sheets[sheetIndex];
		if (!sheetInfo) return;

		const pivot = sheetInfo.pivot;
		const geometry = sheetInfo.geometry;
		if (geometry) PageDeformer.reset(geometry);

		const pageThickness = this._getPageThickness();

		const startY = leftTopYBefore;
		const endY = this._getStackTopY(rightLen + 1);

		const maxStacksTop = Math.max(
			this._getStackTopY(rightLen + 1),
			leftTopYBefore
		);

		let needsLift = false;
		let maxY = startY;

		if (maxStacksTop > startY + 1e-5 || maxStacksTop > endY + 1e-5) {
			needsLift = true;
			maxY = maxStacksTop + pageThickness * 2.0;
		}

		this.leftStack.pop();

		this.currentFlip = {
			direction: "backward",
			sheetIndex,
			sheetInfo,
			startY,
			endY,
			maxY,
			needsLift,
			elapsed: 0,
			duration: 0.7,
			startAngle: Math.PI,
			endAngle: 0,
		};
	}

	_onKeyDown(event) {
		if (event.defaultPrevented) return;
		if (event.key === "ArrowRight") this.flipNext();
		else if (event.key === "ArrowLeft") this.flipPrevious();
	}

	jumpToPage(pageNumber) {
		if (!this.pdfDocument) return;
		if (this.currentFlip) return;
		if (!this.sheets || this.sheets.length === 0) return;

		const totalPages = this.state.totalPages || 0;
		if (!totalPages) return;

		const info = BookStacks.jumpToPage(
			this.sheets,
			this.leftStack,
			this.rightStack,
			pageNumber,
			totalPages,
			this.bookGroup
		);

		if (!info) return;

		this.state.currentPage = info.currentPage;
		this._emitStateChange();
	}

	getPageInfo() {
		const totalPages = this.state.totalPages || 0;
		return BookStacks.getPageInfo(
			this.sheets,
			this.leftStack,
			this.rightStack,
			totalPages
		);
	}

	update(delta) {
		if (!this.currentFlip) return;

		const flip = this.currentFlip;
		const sheetInfo = flip.sheetInfo;
		if (!sheetInfo) {
			this.currentFlip = null;
			return;
		}

		const pivot = sheetInfo.pivot;
		const geometry = sheetInfo.geometry;

		flip.elapsed += delta;
		const tRaw = flip.elapsed / flip.duration;
		const t = Math.min(Math.max(tRaw, 0), 1);

		const isForward = flip.direction === "forward";

		const theta = flip.startAngle + (flip.endAngle - flip.startAngle) * t;

		let y;

		if (!flip.needsLift) {
			y = flip.startY + (flip.endY - flip.startY) * t;
		} else {
			if (t <= 0.5) {
				const tt = t * 2.0;
				y = flip.startY + (flip.maxY - flip.startY) * tt;
			} else {
				const tt = (t - 0.5) * 2.0;
				y = flip.maxY + (flip.endY - flip.maxY) * tt;
			}
		}

		pivot.rotation.set(0, 0, theta);
		pivot.position.y = y;

		if (geometry) {
			const dirSign = isForward ? 1 : -1;
			PageDeformer.applyBend(geometry, t, dirSign);
		}

		if (t >= 1) {
			if (geometry) PageDeformer.reset(geometry);

			pivot.rotation.set(0, 0, flip.endAngle);
			pivot.position.y = flip.endY;

			const sheetIndex = flip.sheetIndex;
			if (isForward) this.leftStack.push(sheetIndex);
			else this.rightStack.push(sheetIndex);

			this._layoutStacks();

			if (this.pdfDocument) {
				const info = this.getPageInfo();
				this.state.currentPage = info.currentPage;
				this._emitStateChange();
			}

			this.currentFlip = null;
		}
	}
}
