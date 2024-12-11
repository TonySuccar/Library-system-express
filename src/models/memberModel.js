const mongoose = require("mongoose");
const { Schema } = mongoose;

const memberSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    birthDate: { type: Date, required: true },
    subscribedBooks: [{ type: Schema.Types.ObjectId, ref: "Book" }],
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
    returnRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);
