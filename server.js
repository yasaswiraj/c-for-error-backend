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
      score: 0,
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
    const data1 = await Question.find({ round: "one" });
    const data2 = await Participant.find({ user_id: req.user.user_id });
    var data = [];
    if (data2 && data2.length > 0) {
      data1.map((d) => {
        if (
          data2[0].questions.includes(d._id) &&
          data2[0].solved[data2[0].questions.indexOf(d._id)]
        );
        else data.push(d);
      });
    } else data = data1;
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
app.post("/set-score", auth, async (req, res) => {
  try {
    const { questionID, score } = req.body;
    if (!(questionID && score)) {
      res.status(400).send("All input is required");
    } else {
      const data = await User.updateOne(
        { _id: req.user.user_id },
        { score: parseInt(score) }
      );
      const data2 = await Participant.findOne({ user_id: req.user.user_id });
      var arr = data2.solved;
      arr[data2.questions.indexOf(questionID)] = true;
      const p = await Participant.updateOne(
        { user_id: req.user.user_id },
        { solved: arr }
      );
      res.status(200).send(p);
    }
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

app.post("/get-date", auth, async (req, res) => {
  try {
    const { questionID } = req.body;
    if (!questionID) {
      res.status(400).send("All input is required");
    }
    const old = await Participant.findOne({ user_id: req.user.user_id });
    var out = new Date();
    if (old && old.questions.includes(questionID))
      out = old.dates[old.questions.indexOf(questionID)];

    console.log(out);
    const data = {
      date: out,
    };
    res.status(201).json(data);
  } catch (error) {
    console.log(error);
  }
});

app.post("/add-solved", auth, async (req, res) => {
  try {
    const { questionID, date } = req.body;
    if (!(questionID && date)) {
      res.status(400).send("All input is required");
    }
    const old = await Participant.findOne({ user_id: req.user.user_id });
    console.log(old);
    if (old) {
      var arr1 = old.questions;
      var arr2 = old.dates;
      var arr3 = old.solved;

      if (!arr1.includes(questionID)) {
        arr1.push(questionID);
        arr2.push(new Date());
        arr3.push(false);
      }
      await Participant.updateMany(
        { user_id: req.user.user_id },
        { questions: arr1, dates: arr2, solved: arr3 }
      );
      res.status(201).send("done updating");
    } else {
      var arr1 = [];
      var arr2 = [];
      var arr3 = [];
      arr1.push(questionID);
      arr2.push(new Date());
      arr3.push(false);
      const participant = new Participant({
        user_id: req.user.user_id,
        questions: arr1,
        dates: arr2,
        solved: arr3,
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
