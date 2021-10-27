const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  roll_number: { type: String, default: null },
  password: { type: String },
});

module.exports = mongoose.model("user", userSchema);
