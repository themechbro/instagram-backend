const mongoose = require("mongoose");
// const Post = require("./models/Post"); // Assuming Post model is in models/Post.js
const Post = require("./db/post");

async function addLikesFieldToPosts() {
  try {
    await mongoose.connect(
      "Dburl",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    // Update all posts by adding an empty likes array if it doesn't exist
    await Post.updateMany(
      { likes: { $exists: false } }, // Filter posts without a likes field
      { $set: { likes: [] } } // Add the empty likes array
    );

    console.log("All posts updated with likes field.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error updating posts:", error);
    mongoose.connection.close();
  }
}

addLikesFieldToPosts();
