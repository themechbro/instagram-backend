const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const followerSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  follower: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  follwedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Follower", followerSchema);
