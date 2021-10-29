const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//middleware
const auth = require("./middleware/auth");

require("dotenv").config();

require("./config/database").connect();

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//user model
const User = require("./model/user");
//question model
const Question = require("./model/question");
const Participant = require("./model/participant");

app.get("/", (req, res) => {
  res.send("Server is healthy!");
});

app.post("/register", async (req, res) => {
  try {
    // Get user input
    const { roll_number, name, password } = req.body;
    // Validate user input
    if (!(name && roll_number && password)) {
      res.status(400).send("All input is required");
    }
    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ roll_number });
    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }
    encryptedPassword = await bcrypt.hash(password, 10);
    // Create user in our database
    const user = new User({
      roll_number,
      name,
      password: encryptedPassword,
      score: 500,
    });
    user.save();
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { roll_number, password } = req.body;
    // Validate user input
    if (!(roll_number && password)) {
      res.status(400).send("All input is required");
    } else {
      // Validate if user exist in our database
      const user = await User.findOne({ roll_number });

      if (user && (await bcrypt.compare(password, user.password))) {
        // Create token
        const token = jwt.sign(
          { user_id: user._id, roll_number },
          process.env.ACCESS_TOKEN,
          {
            expiresIn: "24h",
          }
        );
        res.status(200).json(token);
      } else res.status(400).send("Invalid Credentials");
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/upload-question", async (req, res) => {
  try {
    const { title, numberOfErrors, timeLimit, errorLines, lines, round } =
      req.body;
    if (
      !(title && numberOfErrors && timeLimit && errorLines && lines && round)
    ) {
      res.status(400).send("All input is required");
    } else {
      const oldUser = await Question.findOne({ title });
      if (oldUser) {
        return res.status(409).send("Question Already Exist.");
      } else {
        const question = new Question({
          title,
          numberOfErrors,
          timeLimit,
          errorLines,
          lines,
          round,
        });
        question.save();
        res.status(201).json(question);
      }
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});

app.get("/questions", auth, async (req, res) => {
  try {
    const data = await Question.find({});
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
  }
});

app.get("/get-score", auth, async (req, res) => {
  try {
    const data = await User.findById(req.user.user_id);
    res.status(200).json(data.score);
  } catch (err) {
    console.log(err);
  }
});

app.post("/get-question", auth, async (req, res) => {
  try {
    const data = await Question.findById(req.body.id);
    console.log(req.user);
    res.status(200).send(data);
  } catch (err) {
    console.log(err);
  }
});

app.post("/add-solved", auth, async (req, res) => {
  try {
    const { questionID, date } = req.body;
    if (!(questionID && date)) {
      res.status(400).send("All input is required");
    }
    const old = await Participant.findOne({ user_id: req.user_id });
    if (old) {
      var temp = old.solvedQuestions;
      var adata = {
        questionID: questionID,
        date: date,
        solved: false,
      };
      if (!arr.includes(adata)) temp.push(adata);
      await Participant.updateOne(
        { user_id: req.user.user_id },
        { solvedQuestions: temp }
      );
      res.status(201).send("done updating");
    } else {
      var arr = [];
      var adata = {
        questionID: questionID,
        date: date,
        solved: false,
      };
      if (!arr.includes(adata)) arr.push(adata);
      const participant = new Participant({
        user_id: req.user.user_id,
        solvedQuestions: arr,
      });
      participant.save();
      res.status(201).json(participant);
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(8080 || process.env.PORT, function () {
  console.log("Running FirstRest on Port " + process.env.PORT);
});
