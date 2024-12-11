const mongoose = require("mongoose");
const { Schema } = mongoose;

const memberSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, required: true }, // Unique username
    email: { type: String, unique: true, required: true }, // Unique email
    birthDate: { type: Date, required: true },
    subscribedBooks: [{ type: Schema.Types.ObjectId, ref: "Book" }], // Array of subscribed book IDs
    borrowedBooks: [
      {
        borrowedBookId: {
          type: Schema.Types.ObjectId,
          ref: "Book",
          required: true,
        },
        borrowedDate: { type: Date, required: true },
        returnDate: { type: Date, required: true },
      },
    ],
    returnRate: { type: Number, default: 0 }, // Default return rate
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("Member", memberSchema);
