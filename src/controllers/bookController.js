const Book = require("../models/bookModel");
const Member = require("../models/memberModel");
const { sendEmail } = require("../utils/emailService");

class bookController {
  //  CMS

  async createBook(req, res) {
    try {
      const bookData = req.body;
      if (req.file) {
        bookData.coverImageUrl = `/uploads/${req.file.filename}`;
      }
      const book = new Book(bookData);
      await book.save();
      res.status(201).json(book);
    } catch (error) {
      console.error("Error adding book:", error.message);
      res.status(400).json({ error: error.message });
    }
  }

  async fetchBooks(req, res) {
    try {
      const { page = 1, limit = 10, genre, search } = req.query;

      const query = {};
      if (genre) {
        query.genre = genre;
      }
      if (search) {
        query.$or = [
          { "title.en": { $regex: search, $options: "i" } },
          { "title.ar": { $regex: search, $options: "i" } },
          { isbn: { $regex: search, $options: "i" } },
        ];
      }

      const books = await Book.find(query)
        .sort({ createdAt: -1, authorId: 1 })
        .limit(parseInt(limit))
        .select("-updatedAt -coverImageUrl");

      const totalCount = await Book.countDocuments(query);

      res.status(200).json({
        metadata: {
          totalItems: totalCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
        },
        books,
      });
    } catch (error) {
      console.error("Error fetching books:", error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async fetchBookbyId(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Book ID is required" });
      }
      const book = await Book.findById(id).select("-updatedAt -publishedDate");
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.status(200).json(book);
    } catch (error) {
      console.error(`error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  async updateBook(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (req.file) {
        updateData.coverImageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedBook = await Book.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-updatedAt -publishedDate");

      if (!updatedBook) {
        return res.status(404).json({ error: "Book not found" });
      }

      res.status(200).json(updatedBook);
    } catch (error) {
      console.error(`Error updating book: ${error.message}`);

      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteBookById(req, res) {
    try {
      const { id } = req.params;

      const deletedBook = await Book.findByIdAndDelete(id);

      if (!deletedBook) {
        return res.status(404).json({ error: "Book not found" });
      }

      res
        .status(200)
        .json({ message: "Book deleted successfully", book: deletedBook });
    } catch (error) {
      console.error(`Error deleting book: ${error.message}`);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async publishBook(req, res) {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;

      if (typeof isPublished !== "boolean") {
        return res.status(400).json({ error: "isPublished must be a boolean" });
      }

      const updatedBook = await Book.findByIdAndUpdate(
        id,
        { isPublished },
        { new: true }
      );

      if (!updatedBook) {
        return res.status(404).json({ error: "Book not found" });
      }

      if (isPublished) {
        const subscribedMembers = await Member.find({ subscribedBooks: id });

        if (subscribedMembers.length > 0) {
          const emailPromises = subscribedMembers.map((member) => {
            const subject = `The book "${updatedBook.title.en}" has been published!`;
            const text = `Dear ${member.name},\n\nWe are excited to inform you that the book "${updatedBook.title.en}" has been published and is now available in our library.\n\nThank you for being part of our community!\n\nBest regards,\nLibrary Team`;
            return sendEmail(member.email, subject, text);
          });

          await Promise.all(emailPromises);
        }
      }

      res.status(200).json({
        message: `Book has been ${isPublished ? "published" : "unpublished"}.`,
        updatedBook,
      });
    } catch (error) {
      console.error(`Error in publishBook: ${error.message}`);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getKPIs(req, res) {
    try {
      const totalBooks = await Book.countDocuments();
      const publishedBooks = await Book.countDocuments({ isPublished: true });
      const publishRate =
        totalBooks > 0 ? (publishedBooks / totalBooks) * 100 : 0;

      const members = await Member.find();
      const totalMembers = members.length;
      const totalReturnRate = members.reduce(
        (sum, member) => sum + (member.returnRate || 0),
        0
      );
      const averageReturnRate =
        totalMembers > 0 ? totalReturnRate / totalMembers : 0;

      res.status(200).json({
        KPIs: {
          publishRate: `${publishRate.toFixed(2)}%`,
          averageReturnRate: `${averageReturnRate.toFixed(2)}`,
        },
      });
    } catch (error) {
      console.error("Error calculating KPIs:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  //  Web

  async getPublishedBooks(req, res) {
    try {
      const { page = 1, limit = 1, genre, language = "en" } = req.query;

      const query = { isPublished: true };
      if (genre) {
        query.genre = genre;
      }
      const books = await Book.find(query)
        .sort({ numberOfAvailableCopies: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select(
          `title.${language} description.${language} genre coverImageUrl isBorrowable`
        );

      const totalBooks = await Book.countDocuments(query);

      res.status(200).json({
        metadata: {
          totalItems: totalBooks,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBooks / limit),
        },
        books,
      });
    } catch (error) {
      console.error("Error fetching published books:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  async getBookByIdbyLang(req, res) {
    try {
      const { id } = req.params;
      const { language = "en" } = req.query;
      const book = await Book.findById(id).select(
        `title.${language} description.${language} isbn genre numberOfAvailableCopies numberOfBorrowableDays isOpenToReviews authorId publishedDate`
      );

      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }

      res.status(200).json(book);
    } catch (error) {
      console.error("Error fetching book by ID:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new bookController();
