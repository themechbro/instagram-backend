const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  url: String,
  filename: String,
});

imageSchema.virtual("thumbnail").get(function () {
  //virtual is used to make partial changes to schema without updating it in the database.
  return this.url.replace("/upload", "/upload/w_200");
});

const opts = { toJSON: { virtuals: true } };

const postSchema = new Schema(
  {
    image: [imageSchema],
    caption: String,
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  opts
);

module.exports = mongoose.model("Post", postSchema);

// const postSchema = new Schema({
//   caption: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   author: {
//     type: String,
//   },
// });
