const express = require("express");

const viewController = require("../controllers/viewController");

const router = express.Router();
router.get("/", (req, res) => {
  res.status(200).render("Home");
});

router.get("/discover", viewController.getDiscover);

router.get("/login", viewController.getLoginPage);

router.get("/:slug", viewController.getImage);

module.exports = router;
