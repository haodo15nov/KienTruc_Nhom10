// userRoutes.js
const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user-controller");

// Route for creating a new user
router.post("/users", UserController.createUser);

// Route for getting all users
router.get("/users", UserController.getAllUsers);

module.exports = router;
