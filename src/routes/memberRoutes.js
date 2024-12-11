const express = require("express");
const memberController = require("../controllers/memberController");

const router = express.Router();
router.get(
  "/:memberId/borrowed-books",
  memberController.getBorrowedBooks.bind(memberController)
);

router.post("/", memberController.addMember.bind(memberController));

router.get("/", memberController.getMembers.bind(memberController));

router.post(
  "/:memberId/borrow/:bookId",
  memberController.borrowBook.bind(memberController)
);

router.patch(
  "/:memberId/books/:bookId",
  memberController.subscribeToBook.bind(memberController)
);
router.patch(
  "/:memberId/return/:bookId",
  memberController.returnBook.bind(memberController)
);

router.put("/:id", memberController.updateMember.bind(memberController));

router.delete("/:id", memberController.deleteMember.bind(memberController));

router.get("/:id", memberController.getMemberById.bind(memberController));

module.exports = router;
