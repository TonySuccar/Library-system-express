const Author = require("../models/authorModel");

class AuthorController {
  //  CMS

  async createAuthor(req, res) {
    try {
      const authorData = req.body;

      if (req.file) {
        authorData.profileImageUrl = `/uploads/${req.file.filename}`;
      }

      const author = new Author(authorData);
      await author.save();

      res.status(201).json(author);
    } catch (error) {
      console.error("Error adding author:", error.message);
      res.status(400).json({ error: error.message });
    }
  }
  async updateAuthor(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (req.file) {
        updateData.profileImageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedAuthor = await Author.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedAuthor) {
        return res.status(404).json({ error: "Author not found" });
      }

      res.status(200).json(updatedAuthor);
    } catch (error) {
      console.error("Error updating author:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  async deleteAuthor(req, res) {
    try {
      const { id } = req.params;

      const deletedAuthor = await Author.findByIdAndDelete(id);
      if (!deletedAuthor) {
        return res.status(404).json({ error: "Author not found" });
      }
      res.status(200).json({ message: "Author deleted successfully" });
    } catch (error) {
      console.error("Error deleting author:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  async getAuthorById(req, res) {
    try {
      const { id } = req.params;

      const author = await Author.findById(id);
      if (!author) {
        return res.status(404).json({ error: "Author not found" });
      }
      res.status(200).json(author);
    } catch (error) {
      console.error("Error fetching author by ID:", error.message);

      res.status(500).json({ error: "Internal server error" });
    }
  }

  //Web

  async getAuthorByIdByLanguage(req, res) {
    try {
      const { id } = req.params;
      const { language = "en" } = req.query;

      const author = await Author.findById(id);

      if (!author) {
        return res.status(404).json({ error: "Author not found" });
      }

      res.status(200).json({
        name: author.name[language],
        biography: author.biography[language],
        email: author.email,
        profileImageUrl: author.profileImageUrl,
        birthDate: author.birthDate,
      });
    } catch (error) {
      console.error("Error fetching author by ID and language:", error.message);

      if (error.name === "CastError") {
        return res.status(400).json({ error: "Invalid author ID" });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new AuthorController();
