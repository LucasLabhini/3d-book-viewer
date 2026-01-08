export class BookState {
	constructor() {
		this.totalPages = 0;
		this.currentPage = 0;
	}

	setDocument(pageCount) {
		this.totalPages = pageCount;
		this.currentPage = pageCount > 0 ? 1 : 0;
	}

	getCurrentPage() {
		return this.currentPage;
	}

	getTotalPages() {
		return this.totalPages;
	}
}
