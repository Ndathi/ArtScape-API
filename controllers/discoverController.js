const Image = require("../models/imageModel");

const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

exports.getDiscoverPage = async (req, res) => {
  try {
    const features = new APIFeatures(Image.find(), req.query)
      .filter()
      .sorting()
      .fieldLimits()
      .paging();

    const images = await features.query;

    res.status(200).json({
      id: "My user profile",
      results: images.length,
      data: {
        images,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const item = await Image.findById(req.params.id);

    if (!item) {
      return next(new AppError("No image found with that id", 404));
    }
    res.status(200).json({
      id: "image",
      data: {
        item,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};
