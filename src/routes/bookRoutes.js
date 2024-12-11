const express = require("express");

const bookController = require("../controllers/bookController");
const upload = require("../config/multer");

const router = express.Router();

router.post(
  "/",
  upload.single("coverImageUrl"),
  bookController.createBook.bind(bookController)
);

router.get("/", bookController.fetchBooks.bind(bookController));

router.get("/kpis", bookController.getKPIs.bind(bookController));

router.get("/published", bookController.getPublishedBooks.bind(bookController));

router.get("/lang/:id", bookController.getBookByIdbyLang.bind(bookController));

router.get("/:id", bookController.fetchBookbyId.bind(bookController));

router.patch(
  "/:id",
  upload.single("coverImageUrl"),
  bookController.updateBook.bind(bookController)
);
router.delete(
  "/:id",
  upload.single("coverImageUrl"),
  bookController.deleteBookById.bind(bookController)
);

router.patch("/:id/publish", bookController.publishBook.bind(bookController));

module.exports = router;
