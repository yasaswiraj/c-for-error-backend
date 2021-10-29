const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  roll_number: { type: String, default: null, unique: true },
  name: { type: String },
  password: { type: String },
  score: { type: Number },
});

module.exports = mongoose.model("user", userSchema);
