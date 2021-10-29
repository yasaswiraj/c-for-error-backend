const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  user_id: { type: String, default: null, unique: true },
  solvedQuestions: [],
});

module.exports = mongoose.model("participant", participantSchema);
