const Image = require("../models/imageModel");

exports.getDiscover = async (req, res, next) => {
  try {
    const images = await Image.find();

    res.status(200).render("discover", {
      title: "Discover",
      images,
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.getImage = async (req, res, next) => {
  try {
    const image = await Image.findOne({ slug: req.params.slug });

    res.status(200).render("image", {
      title: image.slug,
      image,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.getLoginPage = async (req, res, next) => {
  try {
    res.status(200).render("login", {
      title: "Login",
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err.message,
    });
  }
};
