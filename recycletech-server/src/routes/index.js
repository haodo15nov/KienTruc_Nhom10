const express = require("express");
const router = express.Router();

// Import all routes
const quotationRoutes = require("./quotationRoutes");

// Use the routes
router.use("/", quotationRoutes);

module.exports = router;
