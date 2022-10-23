const Image = require("../models/imageModel");

const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

exports.getUserProfile = async (req, res) => {
  try {
    //Get all the images of the current user
    const features = new APIFeatures(
      Image.find({ owner_id: req.user.id }),
      req.query
    )
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

exports.addItem = async (req, res) => {
  //add new item to the current user's listed items
  try {
    const newItem = new Image({
      name: req.body.name,
      image: req.body.image,
      description: req.body.description,
      price: req.body.price,
      orientation: req.body.orientation,
      owner_id: req.user._id,
    });

    await newItem.save();

    res.status(200).json({
      id: "AddItem page",
      data: { newItem },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Image.findByIdAndDelete(req.params.id);

    if (!item) {
      return next(new AppError("No tour found with that id", 404));
    }
    res.status(204).json({ id: "Item deleted" });
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
//TODO think of how we will implement the aggregatiom pipeline to get site statistics
exports.getImageStats = async (req, res) => {
  try {
    const stats = await Image.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: "$price" },
        },
      },
    ]);
    res.status(200).json({
      id: "stats",
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};
