const Users = require("../models/Users");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");

const jwt = require("jsonwebtoken");

const UserController = {
  // Register function
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

  // Login function
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

      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token to database
      await Users.findByIdAndUpdate(user._id, { refreshToken }, { new: true });

      // Set refresh token to cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ token: accessToken });
    } catch (error) {
      next(error);
    }
  },

  // Get current user function
  async getCurrent(req, res, next) {
    const { _id } = req.user;

    const user = await Users.findById(_id).select(
      "-password -refreshToken -role"
    );
    try {
      if (!user) {
        return res
          .status(404)
          .json({ sucess: false, message: "User not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  // Refresh access token function
  async refreshAccessToken(req, res, next) {
    // Get refresh token from cookie
    const { refreshToken } = req.cookies;

    // Check if refresh token exists
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.ACCESS_TOKEN, async (err, decode) => {
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: "Invalid token" });
      }

      const response = await Users.findOne({ _id: decode._id, refreshToken });
      return res.status(200).json({
        success: response ? true : false,
        newAccessToken: response
          ? generateAccessToken(response._id, response.role)
          : "Refresh token not matched!",
      });
    });
  },

  // Logout function
  async logout(req, res, next) {
    // Clear cookie
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Clear refresh token from database
    await Users.findOneAndUpdate(
      { refreshToken },
      { refreshToken: "" },
      { new: true }
    );

    // Clear cookie from browser
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });

    return res
      .status(200)
      .json({ success: true, message: "Logout successfully" });
  },
};

module.exports = UserController;
