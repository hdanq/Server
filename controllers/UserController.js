const Users = require("../models/Users");

const UserController = {
  async register(req, res, next) {
    const { firstname, lastname, email, password } = req.body;
    try {
      if (!firstname || !lastname || !email || !password) {
        return res
          .status(400)
          .json({ sucess: false, message: "Missing fields" });
      }
      const user = await Users.create(req.body);
      return res.status(201).json({
        sucess: user ? true : false,
        message: user ? "User created successfully" : "Something went wrong!",
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        return res
          .status(400)
          .json({ sucess: false, message: "Missing fields" });
      }

      const user = await Users.login(email, password);
      if (!user) {
        return res
          .status(404)
          .json({ sucess: false, message: "User not found" });
      }
      res.status(200).json({ user: user._id });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = UserController;
