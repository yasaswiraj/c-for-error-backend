const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: { type: String, default: null, unique: true },
  numberOfErrors: { type: Number },
  timeLimit: { type: Number },
  errorLines: [],
  lines: [],
  round: { type: String },
});

module.exports = mongoose.model("question", questionSchema);
