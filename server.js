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

app.get("/", (req, res) => {
  res.send("Server is healthy!");
});

app.post("/register", async (req, res) => {
  try {
    // Get user input
    const { roll_number, password } = req.body;

    // Validate user input
    if (!(roll_number && password)) {
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
      password: encryptedPassword,
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
    }
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
  } catch (err) {
    console.log(err);
  }
});

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});

app.listen(8080 || process.env.PORT, function () {
  console.log("Running FirstRest on Port " + process.env.PORT);
});
