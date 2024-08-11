const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
  caption: {
    type: String,
    required: true,
    unique: true,
  },
  author: {
    type: String,
  },
});
