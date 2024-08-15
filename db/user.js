const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // location: {
  //   ip: String, //
  //   network: String, //
  //   version: String, //
  //   city: String, // String
  //   region: String, // String
  //   region_code: String, // String
  //   country: String, // String
  //   country_name: String, // String
  //   country_code: String, // String
  //   country_code_iso3: String, // String
  //   country_capital: String, // String
  //   country_tld: String, // String
  //   continent_code: String, // String
  //   in_eu: Boolean, // Boolean
  //   postal: String, // String (can be a number if no leading zeros)
  //   latitude: Float32Array, // Number (float)
  //   longitude: Float32Array, // Number (float)
  //   timezone: String, // String
  //   utc_offset: String, // String
  //   country_calling_code: String, // String
  //   currency: String, // String
  //   currency_name: String, // String
  //   languages: String,
  //   country_area: Number, // Number (integer)
  //   country_population: Number, // Number (integer)
  //   asn: String, // String
  //   org: String, // String
  // },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
