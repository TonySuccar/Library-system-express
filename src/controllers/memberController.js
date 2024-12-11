const Member = require("../models/memberModel");
const Book = require("../models/bookModel");
const { sendEmail } = require("../utils/emailService");

class MemberController {
  //CMS

  async addMember(req, res) {
    try {
      const memberData = req.body;
      const member = new Member(memberData);

      await member.save();

      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding member:", error.message);

      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "Username or email already exists." });
      }

      res.status(400).json({ error: error.message });
    }
  }
  async updateMember(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedMember = await Member.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedMember) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error.message);

      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid member ID" });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
  async deleteMember(req, res) {
    try {
      const { id } = req.params;
      const deletedMember = await Member.findByIdAndDelete(id);

      if (!deletedMember) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json({ message: "Member deleted successfully" });
    } catch (error) {
      console.error("Error deleting member:", error.message);

      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid member ID" });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
  async getMembers(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      const members = await Member.find(query)
        .sort({ returnRate: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select("name username email borrowedBooks returnRate")
        .lean();

      const formattedMembers = members.map((member) => ({
        name: member.name,
        username: member.username,
        email: member.email,
        numberOfBorrowedBooks: member.borrowedBooks.length,
        returnRate: member.returnRate,
      }));

      const totalCount = await Member.countDocuments(query);
      res.status(200).json({
        metadata: {
          totalItems: totalCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
        },
        members: formattedMembers,
      });
    } catch (error) {
      console.error("Error fetching members:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  //Web
  async getMemberById(req, res) {
    try {
      const { id } = req.params;

      const member = await Member.findById(id)
        .populate("subscribedBooks", "title")
        .populate("borrowedBooks.borrowedBookId", "title");

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      res.status(200).json(member);
    } catch (error) {
      console.error("Error fetching member by ID:", error.message);

      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid member ID" });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
  async borrowBook(req, res) {
    try {
      const { memberId, bookId } = req.params;

      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const book = await Book.findById(bookId).populate("authorId");
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (member.returnRate < 0.3) {
        return res.status(400).json({
          error: "Member's return rate is below 30%. Cannot borrow books.",
        });
      }

      const currentYear = new Date().getFullYear();
      const memberAge = currentYear - new Date(member.birthDate).getFullYear();
      if (memberAge < book.minAge) {
        return res.status(400).json({
          error: `Member must be at least ${book.minAge} years old to borrow this book.`,
        });
      }

      if (book.numberOfAvailableCopies <= 0) {
        return res.status(400).json({
          error: "No available copies of the book to borrow.",
        });
      }

      book.numberOfAvailableCopies -= 1;
      await book.save();

      const borrowedDate = new Date();
      const returnDate = new Date();
      returnDate.setDate(borrowedDate.getDate() + book.numberOfBorrowableDays);

      member.borrowedBooks.push({
        borrowedBookId: book._id,
        borrowedDate,
        returnDate,
      });

      await member.save();

      const subject = `Your book "${book.title.en}" has been borrowed`;
      const text = `Dear ${book.authorId.name.en},\n\nThe book "${book.title.en}" has been borrowed by a member.\n\nBest regards,\nLibrary Team`;
      await sendEmail(book.authorId.email, subject, text);

      res.status(200).json({
        message: "Book borrowed successfully",
        borrowedBook: {
          memberId: member._id,
          bookId: book._id,
          borrowedDate,
          returnDate,
        },
      });
    } catch (error) {
      console.error("Error borrowing book:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  async getBorrowedBooks(req, res) {
    try {
      const { memberId } = req.params;

      const member = await Member.findById(memberId).populate(
        "borrowedBooks.borrowedBookId",
        "title.en title.ar"
      );

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const currentDate = new Date();

      const borrowedBooksWithFlags = member.borrowedBooks.map(
        (borrowedBook) => {
          const daysLeft =
            Math.ceil(
              (new Date(borrowedBook.returnDate) - currentDate) /
                (1000 * 60 * 60 * 24)
            ) || 0;

          return {
            bookId: borrowedBook.borrowedBookId._id,
            title: borrowedBook.borrowedBookId.title,
            daysLeft,
            isOverdue: daysLeft < 0,
            isCloseToDue: daysLeft <= 3 && daysLeft >= 0,
          };
        }
      );

      const sortedBorrowedBooks = borrowedBooksWithFlags.sort(
        (a, b) => a.daysLeft - b.daysLeft
      );
      res.status(200).json(sortedBorrowedBooks);
    } catch (error) {
      console.error("Error fetching borrowed books:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  async subscribeToBook(req, res) {
    try {
      const { memberId, bookId } = req.params;
      const { action } = req.body; // 'subscribe' or 'unsubscribe'

      // Validate the action
      if (!["subscribe", "unsubscribe"].includes(action)) {
        return res
          .status(400)
          .json({ error: "Invalid action. Use 'subscribe' or 'unsubscribe'." });
      }

      // Find the member
      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Find the book
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (action === "subscribe") {
        if (!member.subscribedBooks.includes(bookId)) {
          member.subscribedBooks.push(bookId);
        } else {
          return res
            .status(400)
            .json({ error: "Already subscribed to this book." });
        }
      } else if (action === "unsubscribe") {
        const index = member.subscribedBooks.indexOf(bookId);
        if (index > -1) {
          member.subscribedBooks.splice(index, 1);
        } else {
          return res
            .status(400)
            .json({ error: "Not subscribed to this book." });
        }
      }

      await member.save();

      res.status(200).json({
        message: `Successfully ${
          action === "subscribe" ? "subscribed to" : "unsubscribed from"
        } the book.`,
        subscribedBooks: member.subscribedBooks,
      });
    } catch (error) {
      console.error(`Error in subscribeToBook: ${error.message}`);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  async returnBook(req, res) {
    try {
      const { memberId, bookId } = req.params;

      const member = await Member.findById(memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const borrowedBook = member.borrowedBooks.find(
        (b) => b.borrowedBookId.toString() === bookId
      );
      if (!borrowedBook) {
        return res
          .status(404)
          .json({ error: "This book is not borrowed by the member" });
      }

      const currentDate = new Date();

      const isReturnedOnTime = currentDate <= new Date(borrowedBook.returnDate);

      if (isReturnedOnTime) {
        member.returnRate = Math.min(member.returnRate + 0.1, 1);
      } else {
        member.returnRate = Math.max(member.returnRate - 0.1, 0);
      }

      member.borrowedBooks = member.borrowedBooks.filter(
        (b) => b.borrowedBookId.toString() !== bookId
      );

      await member.save();

      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      book.numberOfAvailableCopies += 1;

      await book.save();

      res.status(200).json({
        message: `Book returned successfully. ${
          isReturnedOnTime ? "Returned on time!" : "Returned late!"
        }`,
        updatedReturnRate: member.returnRate,
      });
    } catch (error) {
      console.error("Error returning book:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new MemberController();
