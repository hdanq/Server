const mongoose = require("mongoose");

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected Successfully to mongodb");
  } catch (error) {
    console.error("Error connecting to mongodb");
    console.error(error);
  }
};

module.exports = { connect };
