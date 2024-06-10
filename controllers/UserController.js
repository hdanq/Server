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
        message: "User created successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = UserController;
