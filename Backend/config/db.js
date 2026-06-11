const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {

  //Find out why?
  await mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((err) => {
      console.log(`Error aa gya MongoDB: ${err}`);
    });
}

module.exports = connectDB;