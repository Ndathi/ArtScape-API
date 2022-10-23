const express = require("express");

const profileController = require("../controllers/profileController");
const authController = require("../controllers/authController");

const router = express.Router();

//TODO; //Check jonas video on middleware param//we can use router.param("id",(req,res,next,val) =>{}) to check the parameters passed.

router.route("/get-Image-stats").get(profileController.getImageStats);

router
  .route("/AddItem.html")
  .post(authController.protect, profileController.addItem);

router
  .route("/:id")
  .get(profileController.getItem)
  .delete(profileController.deleteItem);

router.route("/").get(authController.protect, profileController.getUserProfile);
//check jonas video on chaining middleware

module.exports = router;
