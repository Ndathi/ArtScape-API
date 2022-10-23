const express = require("express");

const discoverController = require("../controllers/discoverController");

const router = express.Router();

router.route("/:id").get(discoverController.getItem);
router.route("/").get(discoverController.getDiscoverPage);

module.exports = router;
