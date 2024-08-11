const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./db/user");
const app = express();
const port = 3001;
const session = require("express-session");
const passport = require("passport");
const LocalStartegy = require("passport-local");
const jwt = require("jsonwebtoken");
const secret = "jesusisking";
const MongoStore = require("connect-mongo");
const helmet = require("helmet");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const dbUrl = process.env.DB_URL;

const connectSrcUrls = ["https://res.cloudinary.com/dv5vm4sqh/"];
const fontSrcUrls = ["https://res.cloudinary.com/dv5vm4sqh/"];

app.use(
  helmet.contentSecurityPolicy({
    connectSrc: ["'self'", ...connectSrcUrls],
    fontSrc: ["'self'", ...fontSrcUrls],
    mediaSrc: ["https://res.cloudinary.com/dv5vm4sqh/"],
    childSrc: ["blob:"],
  })
);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET, PUT, PATCH, DELETE, POST, HEAD",
    credentials: true,
  })
);
app.use(bodyParser.json());

//mongoose config
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

//passport configuration

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());

// passport.use(new LocalStartegy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Routes
app.get("/", (req, res) => {
  res.send("Hello From Server, and MongoDB is connected");
});

app.post("/register", async (req, res) => {
  const { email, username, password } = req.body;
  console.log("Received data:", { email, password });
  try {
    const newUser = new User({ email, username });
    console.log("Creating new user:", newUser);
    await User.register(newUser, password); // Passport-local-mongoose will hash the password and save the user
    console.log("User registered successfully");
  } catch (error) {
    console.error("Error registering user:", error);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // console.log("Login attempt:", { username, password });

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.authenticate(password, (err, result) => {
      if (err || !result) {
        return res.status(400).json({ message: "Invalid password" });
      }
      const token = jwt.sign({ username: user.username }, secret, {
        expiresIn: "1h",
      });

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    console.log(users);
    res.send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching users.");
  }
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed", error: err });
    }
    res.status(200).json({ message: "Logout successful" });
  });
});

// app.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   console.log("Login attempt:", { username, password });

//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(400).json({ message: "User not found" });
//     }

//     user.authenticate(password, (err, result) => {
//       if (err || !result) {
//         return res.status(400).json({ message: "Invalid password" });
//       }

//       return res.status(200).json({ message: "Login successful" });
//     });
//   } catch (err) {
//     console.error("Error during login:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

// app.post("/login", passport.authenticate("local"), (req, res) => {
//   console.log("Logged in Successfully", req.user);
//   res.status(200).json({
//     message: "Login Successful",
//   });
// });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
