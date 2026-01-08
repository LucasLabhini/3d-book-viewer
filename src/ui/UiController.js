export class UiController {
	constructor(bookController, threeApp) {
		this.bookController = bookController;
		this.threeApp = threeApp;

		this.fileInput = document.getElementById("pdfFileInput");

		this.welcomeOverlay = document.getElementById("welcomeOverlay");
		this.welcomeChooseBtn = document.getElementById("welcomeChooseBtn");

		this.loadingOverlay = document.getElementById("loadingOverlay");

		this.topBar = document.getElementById("topBar");
		this.fileNameDisplay = document.getElementById("fileNameDisplay");

		this.bottomHud = document.getElementById("bottomHud");
		this.hudPrevBtn = document.getElementById("hudPrevBtn");
		this.hudNextBtn = document.getElementById("hudNextBtn");
		this.hudPageInput = document.getElementById("hudPageInput");
		this.hudTotalPages = document.getElementById("hudTotalPages");

		this.spreadInfo = document.getElementById("spreadInfo");
		this.spreadText = document.getElementById("spreadText");

		this.modeBar = document.getElementById("modeBar");
		this.readingModeBtn = document.getElementById("readingModeBtn");
		this.freeModeBtn = document.getElementById("freeModeBtn");

		this._wireEvents();

		this.bookController.setStateChangeCallback((info) =>
			this._onBookStateChange(info)
		);
	}

	_wireEvents() {
		this.welcomeChooseBtn.addEventListener("click", () => {
			if (this.fileInput) this.fileInput.click();
		});

		this.fileNameDisplay.addEventListener("click", () => {
			if (this.fileInput) this.fileInput.click();
		});

		this.fileInput.addEventListener("change", async (event) => {
			const file = event.target.files && event.target.files[0];
			if (!file) return;

			try {
				this._showLoadingOverlay();

				await this.bookController.loadPdf(file);

				await new Promise((resolve) => setTimeout(resolve, 450));

				this._hideWelcomeOverlay();
				this._showViewerChrome(file.name);

				if (this.threeApp) {
					this.threeApp.setCameraMode("reading");
					this._updateModeButtons("reading");
				}
			} catch (err) {
				console.error("Error while loading PDF:", err);
				alert("Failed to load the PDF file.");
			} finally {
				this._hideLoadingOverlay();
			}
		});

		this.hudPrevBtn.addEventListener("click", () => {
			this.bookController.flipPrevious();
		});

		this.hudNextBtn.addEventListener("click", () => {
			this.bookController.flipNext();
		});

		const commitInput = () => {
			const raw = this.hudPageInput.value.trim();
			if (!raw) return;
			const n = parseInt(raw, 10);
			if (Number.isNaN(n)) return;
			this.bookController.jumpToPage(n);
		};

		this.hudPageInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				commitInput();
				this.hudPageInput.blur();
			}
		});

		this.hudPageInput.addEventListener("blur", () => {
			commitInput();
		});

		this.readingModeBtn.addEventListener("click", () => {
			if (!this.threeApp) return;
			this.threeApp.setCameraMode("reading");
			this._updateModeButtons("reading");
		});

		this.freeModeBtn.addEventListener("click", () => {
			if (!this.threeApp) return;
			this.threeApp.setCameraMode("free");
			this._updateModeButtons("free");
		});
	}

	_showLoadingOverlay() {
		this.loadingOverlay.classList.remove("overlay-hidden");
		this.loadingOverlay.classList.add("overlay-visible");
	}

	_hideLoadingOverlay() {
		this.loadingOverlay.classList.remove("overlay-visible");
		this.loadingOverlay.classList.add("overlay-hidden");
	}

	_hideWelcomeOverlay() {
		this.welcomeOverlay.classList.remove("overlay-visible");
		this.welcomeOverlay.classList.add("overlay-hidden");
	}

	_showViewerChrome(fileName) {
		this.topBar.classList.remove("hidden");
		this.bottomHud.classList.remove("hidden");
		this.spreadInfo.classList.remove("hidden");
		this.modeBar.classList.remove("hidden");

		if (fileName) {
			this.fileNameDisplay.textContent = fileName;
			this.fileNameDisplay.title = fileName;
		}
	}

	_updateModeButtons(mode) {
		if (!this.readingModeBtn || !this.freeModeBtn) return;

		if (mode === "reading") {
			this.readingModeBtn.classList.add("mode-btn-active");
			this.freeModeBtn.classList.remove("mode-btn-active");
		} else {
			this.freeModeBtn.classList.add("mode-btn-active");
			this.readingModeBtn.classList.remove("mode-btn-active");
		}
	}

	_onBookStateChange(info) {
		if (!info) return;

		const { leftPage, rightPage, currentPage, totalPages } = info;

		let displayPage = null;
		if (rightPage != null) displayPage = rightPage;
		else if (leftPage != null) displayPage = leftPage;

		this.hudPageInput.value = displayPage != null ? String(displayPage) : "";

		const leftText = leftPage != null ? leftPage : "–";
		const rightText = rightPage != null ? rightPage : "–";
		this.spreadText.textContent = `${leftText} | ${rightText}`;

		const total = totalPages != null ? totalPages : 0;
		if (this.hudTotalPages) {
			this.hudTotalPages.textContent = total > 0 ? ` / ${total}` : "";
		}

		const atBeginning = currentPage <= 1 && leftPage == null;
		const atEnd = rightPage == null && currentPage >= total && total > 0;

		this.hudPrevBtn.disabled = !!atBeginning;
		this.hudNextBtn.disabled = !!atEnd;
	}
}
