const express = require("express");

const userController = require("../controllers/userController");

const authController = require("../controllers/authController");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch(
  "/updatePassword",
  authController.protect,
  authController.updatePassword
);

router.patch(
  "/updateMyDetails",
  authController.protect,
  userController.updateMyDetails
);
router.delete(
  "/deleteMyAccount",
  authController.protect,
  userController.deleteMe
);

router
  .route("/:id")
  .get(userController.getUser)
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    userController.deleteUser
  );
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

module.exports = router;
