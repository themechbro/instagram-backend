const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./db/user");
const Post = require("./db/post");
const Comment = require("./db/comment");
const Follower = require("./db/followers");
const app = express();
const port = 3001;
const session = require("express-session");
const passport = require("passport");
const LocalStartegy = require("passport-local");
const jwt = require("jsonwebtoken");
const secret = "jesusisking";
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const multer = require("multer"); //package used to parse uploaded image
const { storage } = require("./cloudinary/index");
const upload = multer({ storage });

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

//CORS NEW
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend domain
    credentials: true, // Allow credentials (cookies) to be sent
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
      secure: false, // Set to true if using HTTPS
      httpOnly: false, // Allow client-side access (optional)
      sameSite: "lax", // Cross-site cookie sharing settings, could be 'strict' or 'none' based on your requirements
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

//Routes:-

//Home Route
app.get("/", (req, res) => {
  res.send("Hello From Server, and MongoDB is connected");
});

//Register Route
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

//Login Logout Routes
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.authenticate(password, async (err, result) => {
      if (err || !result) {
        return res.status(400).json({ message: "Invalid password" });
      }

      // Capture the user's IP address (in production use req.headers['x-forwarded-for'] to get real IP)
      const userIP = req.ip;

      // Fetch the location information based on the IP address
      let locationData = {};
      try {
        const locationResponse = await axios.get(
          `https://ipapi.co/${userIP}/json/`
        );
        locationData = locationResponse.data;
      } catch (error) {
        console.error("Error fetching location data:", error);
        // You can choose to continue even if location fetch fails, or handle it differently
      }

      // Generate JWT token for user
      const token = jwt.sign({ username: user.username }, secret, {
        expiresIn: "1h",
      });

      // Store user and location data in the session (optional)
      req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email,
      };
      req.session.location = {
        ip: locationData.ip || userIP,
        city: locationData.city || "Unknown",
        region: locationData.region || "Unknown",
        country: locationData.country_name || "Unknown",
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
      };

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        location: {
          ip: req.session.location.ip,
          city: req.session.location.city,
          region: req.session.location.region,
          country: req.session.location.country,
          latitude: req.session.location.latitude,
          longitude: req.session.location.longitude,
        },
      });
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
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

//inst  routes
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { caption } = req.body;
    const image = {
      url: req.file.path, // Cloudinary URL
      filename: req.file.filename, // Cloudinary filename
    };
    const { userId } = req.body;

    const newPost = new Post({
      image: [image],
      caption,
      user: userId,
    });

    await newPost.save();

    res.status(200).json({
      message: "Post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error uploading post:", error);
    res.status(500).json({ message: "Failed to upload post" });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ _id: -1 }).populate("user");
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});
//Comment routes
app.get("/comment/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId }).populate(
      "user",
      "username"
    );
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch comments", error: error.message });
  }
});

app.post("/comment", async (req, res) => {
  console.log(req.body); // Log the incoming data
  const { postId, userId, content } = req.body;

  try {
    const newComment = new Comment({
      post: postId,
      user: userId,
      content,
    });

    const savedComment = await newComment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res
      .status(500)
      .json({ message: "Failed to add comment", error: error.message });
  }
});

//Follower Routes
app.post("/:userId/follow", async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.body.followerId;

    // Check if the follower already follows the user
    const existingFollow = await Follower.findOne({
      user: userId,
      follower: followerId,
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user." });
    }

    // Create a new follow relationship
    const newFollow = new Follower({
      user: userId,
      follower: followerId,
    });

    await newFollow.save();
    res.status(200).json({ message: "Successfully followed the user." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

// Unfollow a user
app.delete("/:userId/unfollow", async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.body.followerId;

    // Find and delete the follow relationship
    const deletedFollow = await Follower.findOneAndDelete({
      user: userId,
      follower: followerId,
    });

    if (!deletedFollow) {
      return res
        .status(400)
        .json({ message: "You are not following this user." });
    }

    res.status(200).json({ message: "Successfully unfollowed the user." });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

//MONGO DB DATA FETCH ROUTES
app.get("/users", async (req, res) => {
  try {
    const { userId, limit = 4, skip = 0 } = req.query; // Default limit to 4 and skip to 0
    const users = await User.find({ _id: { $ne: userId } })
      .limit(Number(limit))
      .skip(Number(skip));
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching users.");
  }
});

app.get("/check-session", (req, res) => {
  if (req.session && req.session.user) {
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

app.get("/:userId/following", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all users that the user is following
    const following = await Follower.find({ follower: userId }).populate(
      "user"
    );

    res.status(200).json(following);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong." });
  }
});

//Port Route
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
