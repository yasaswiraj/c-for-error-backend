const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  user_id: { type: String, default: null, unique: true },
  questions: [],
  dates: [Date],
  solved: [],
});

module.exports = mongoose.model("participant", participantSchema);
