const express = require("express");

const stkController = require("../controllers/stkController");

const router = express.Router();

router.post(
  "/",
  stkController.generateToken,
  stkController.sendStkNotification
);

router.post("/callback", stkController.callback);
module.exports = router;
