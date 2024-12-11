const express = require("express");
const authorController = require("../controllers/authorController");
const upload = require("../config/multer");

const router = express.Router();

router.post(
  "/",
  upload.single("profileImage"),
  authorController.createAuthor.bind(authorController)
);
router.get(
  "/lang/:id",
  authorController.getAuthorByIdByLanguage.bind(authorController)
);
router.put(
  "/:id",
  upload.single("profileImageUrl"),
  authorController.updateAuthor.bind(authorController)
);

router.delete("/:id", authorController.deleteAuthor.bind(authorController));

router.get("/:id", authorController.getAuthorById.bind(authorController));
module.exports = router;
