const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookSchema = new Schema(
  {
    title: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    isbn: { type: String, unique: true, required: true }, 
    genre: { type: String, required: true },
    description: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    numberOfAvailableCopies: { type: Number, required: true },
    isBorrowable: { type: Boolean, default: true },
    numberOfBorrowableDays: { type: Number, required: true },
    isOpenToReviews: { type: Boolean, default: true },
    minAge: { type: Number, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "Author", required: true },
    coverImageUrl: { type: String, required: true },
    publishedDate: { type: Date, required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
