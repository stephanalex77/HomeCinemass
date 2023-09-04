const mongoose = require("mongoose");
require("dotenv").config();
const path = require('path')

mongoose
  .connect(process.env.MONGO_DB_URL)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log(err.message);
  });

const express = require("express");
const app = express();
app.use("/public", express.static("public"));

//for user
app.use(express.json());

const userRoute = require("./routes/userRoute");
app.use("/", userRoute);

app.set("view engine", "ejs");
app.set("views", "../views/users");
// app.set("views", "../views/admin");


app.get("/register", function (req, res) {
  res.render("registeration");
});

const adminRoute = require("./routes/adminRouter");
app.use("/admin", adminRoute);


app.listen(3001, function () {
  console.log("server is running...");
});
