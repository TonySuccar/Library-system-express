require("dotenv").config({ path: "./.env" });
const express = require("express");
const mongoose = require("mongoose");
const bookRoutes = require("./routes/bookRoutes");
const memberRoutes = require("./routes/memberRoutes");
const authorRoutes = require("./routes/authorRoutes");

const app = express();

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/books", bookRoutes);
app.use("/members", memberRoutes);
app.use("/authors", authorRoutes);

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("connected to mongodb");
    app.listen(process.env.PORT, () => console.log("Server Started"));
  })
  .catch((err) => {
    console.log(process.env.PORT);
    console.log("failed to connect to mogodb: " + err);
  });
