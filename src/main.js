import { ThreeApp } from "./core/ThreeApp.js";
import { BookController } from "./book/BookController.js";
import { UiController } from "./ui/UiController.js";
import { PdfLoader } from "./pdf/PdfLoader.js";

const container = document.getElementById("app");
const threeApp = new ThreeApp(container);

PdfLoader.setMaxAnisotropy(threeApp.renderer.capabilities.getMaxAnisotropy());

const bookController = new BookController(threeApp);
const uiController = new UiController(bookController, threeApp);

threeApp.addUpdatable(bookController);
threeApp.start();

window._threeApp = threeApp;
window._bookController = bookController;
window._uiController = uiController;
