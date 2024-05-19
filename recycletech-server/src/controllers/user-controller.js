// userController.js
const User = require("../models/user-model");

// Fake database (replace with your actual database operations)
const users = [];

// Controller for handling user-related requests
class UserController {
  static createUser(req, res) {
    const { id, username, email } = req.body;
    const newUser = new User(id, username, email);
    users.push(newUser);
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  }

  static getAllUsers(req, res) {
    res.status(200).json({ users });
  }
}

module.exports = UserController;
