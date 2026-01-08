import { BOOK_DIMENSIONS } from "./BookGeometryFactory.js";

export class BookStacks {
	static getPageThickness(bookGroup) {
		if (bookGroup && bookGroup.userData && bookGroup.userData.pageThickness) {
			return bookGroup.userData.pageThickness;
		}
		return BOOK_DIMENSIONS.PAGE_THICKNESS;
	}

	static getStackTopY(bookGroup, stackLength) {
		const baseY = BOOK_DIMENSIONS.COVER_THICKNESS + 0.005;
		const pageThickness = this.getPageThickness(bookGroup);
		if (stackLength <= 0) return baseY;
		return baseY + pageThickness * stackLength;
	}

	static initializeStacksFromSheets(sheets, leftStack, rightStack) {
		const sheetCount = sheets ? sheets.length : 0;
		leftStack.length = 0;
		rightStack.length = 0;
		for (let i = sheetCount - 1; i >= 0; i--) {
			rightStack.push(i);
		}
	}

	static layoutStacks(sheets, leftStack, rightStack, bookGroup) {
		if (!sheets) return;

		const baseY = BOOK_DIMENSIONS.COVER_THICKNESS + 0.005;
		const pageThickness = this.getPageThickness(bookGroup);

		for (let i = 0; i < leftStack.length; i++) {
			const sheetIndex = leftStack[i];
			const sheetInfo = sheets[sheetIndex];
			if (!sheetInfo) continue;
			const pivot = sheetInfo.pivot;
			const yOffset = baseY + pageThickness * (i + 1);
			pivot.position.set(0, yOffset, 0);
			pivot.rotation.set(0, 0, Math.PI);
		}

		for (let i = 0; i < rightStack.length; i++) {
			const sheetIndex = rightStack[i];
			const sheetInfo = sheets[sheetIndex];
			if (!sheetInfo) continue;
			const pivot = sheetInfo.pivot;
			const yOffset = baseY + pageThickness * (i + 1);
			pivot.position.set(0, yOffset, 0);
			pivot.rotation.set(0, 0, 0);
		}
	}

	static computePageInfoForStacks(sheets, leftStack, rightStack, totalPages) {
		let leftPage = null;
		let rightPage = null;

		if (leftStack.length > 0) {
			const idx = leftStack[leftStack.length - 1];
			const sheetInfo = sheets[idx];
			if (sheetInfo) {
				if (sheetInfo.backPageIndex != null) {
					leftPage = sheetInfo.backPageIndex + 1;
				} else if (sheetInfo.frontPageIndex != null) {
					leftPage = sheetInfo.frontPageIndex + 1;
				}
			}
		}

		if (rightStack.length > 0) {
			const idx = rightStack[rightStack.length - 1];
			const sheetInfo = sheets[idx];
			if (sheetInfo && sheetInfo.frontPageIndex != null) {
				rightPage = sheetInfo.frontPageIndex + 1;
			}
		}

		let currentPage = 0;
		if (rightPage != null) currentPage = rightPage;
		else if (leftPage != null) currentPage = leftPage;

		return { leftPage, rightPage, currentPage, totalPages };
	}

	static getPageInfo(sheets, leftStack, rightStack, totalPages) {
		return this.computePageInfoForStacks(
			sheets,
			leftStack,
			rightStack,
			totalPages
		);
	}

	static jumpToPage(
		sheets,
		leftStack,
		rightStack,
		pageNumber,
		totalPages,
		bookGroup
	) {
		if (!sheets || sheets.length === 0) return null;

		const sheetCount = sheets.length;

		let target = Math.round(Number(pageNumber) || 1);
		if (target < 1) target = 1;
		if (target > totalPages) target = totalPages;
		if (target % 2 === 0 && target > 1) {
			target -= 1;
		}

		let bestLeftStack = null;
		let bestRightStack = null;
		let bestDiff = Infinity;

		for (let leftLen = 0; leftLen <= sheetCount; leftLen++) {
			const candidateLeft = [];
			for (let i = 0; i < leftLen; i++) candidateLeft.push(i);

			const candidateRight = [];
			for (let i = sheetCount - 1; i >= leftLen; i--) {
				candidateRight.push(i);
			}

			const info = this.computePageInfoForStacks(
				sheets,
				candidateLeft,
				candidateRight,
				totalPages
			);

			if (!info.currentPage) continue;

			const diff = Math.abs(info.currentPage - target);
			if (diff < bestDiff) {
				bestDiff = diff;
				bestLeftStack = candidateLeft;
				bestRightStack = candidateRight;
			}
			if (diff === 0) break;
		}

		if (!bestLeftStack || !bestRightStack) return null;

		leftStack.length = 0;
		rightStack.length = 0;

		for (let i = 0; i < bestLeftStack.length; i++) {
			leftStack.push(bestLeftStack[i]);
		}
		for (let i = 0; i < bestRightStack.length; i++) {
			rightStack.push(bestRightStack[i]);
		}

		this.layoutStacks(sheets, leftStack, rightStack, bookGroup);

		return this.getPageInfo(sheets, leftStack, rightStack, totalPages);
	}
}
