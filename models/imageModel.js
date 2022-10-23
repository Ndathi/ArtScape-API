const mongoose = require("mongoose");

const slugify = require("slugify");

const validator = require("validator");

const imageSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, "Artwork must have a picture"],
  },
  name: {
    type: String,
    required: [true, "Artwork must have a name"],
    unique: true,
    maxLength: [20, "The name must be less than twenty characters."],
    minLength: [3, "The name must be more than three characters."],
    validate: [validator.isAlpha, "the name must only contian characters"],
  },
  price: {
    type: Number,
    required: [true, "Artwork must have a price set"],
    min: [10, "the price of art must be greater than 10 dollars"],
    max: [100000, "The price is set too high"],
  },
  orientation: {
    type: String,
    required: [true, "Artwork must have a orientation"],
  },
  description: {
    type: String,
    required: [true, "Artwork must have a description"],
    maxLength: [50, "The description cannot be more than 50 characters long"],
    // validate: [
    //  validator.isAlpha,
    //  "the description must only contian characters",
    //],
  },
  slug: String,

  owner_id: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

imageSchema.index({ price: 1 });
imageSchema.index({ slug: 1 });

//DOCUMENT MIDDLEWARE

imageSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Image = mongoose.model("Image", imageSchema);

module.exports = Image;
