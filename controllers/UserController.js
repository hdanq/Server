const Users = require("../models/Users");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middlewares/jwt");

const jwt = require("jsonwebtoken");
const sendEmail = require("../ultils/email");
const crypto = require("crypto");
const { get } = require("http");

const userController = {
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

  // Forgot password function
  async forgotPassword(req, res, next) {
    const { email } = req.body;
    const user = await Users.findOne({ email });

    try {
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Missing email" });
      }

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const resetToken = await user.createResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      // Send email with reset token
      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/user/auth/resetpassword/${resetToken}`;

      const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nThis link will be vaild only for 10 minutes, please ignore this email if you don't forgot your password!`;

      const html = `
      <div style="background-color: #f4f4f4; max-width: 600px; margin: auto; padding: 20px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333333;">Password Change Request</h1>
        <p style="color: #555555; line-height: 1.5;">We've received a password change request for your account.</p>
        <p style="color: #555555; line-height: 1.5;">This link will expire in 10 minutes. If you did not request a password change, please ignore this email, no changes will be made to your account.</p>
        <p><a href="${resetURL}" style="color: #1a73e8; text-decoration: none; word-wrap: break-word; word-break: break-all; overflow-wrap: break-word;">${resetURL}</a></p>
        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #aaaaaa;">
            <p>If you have any questions, feel free to contact our support team.</p>
        </div>
      </div>`;

      try {
        await sendEmail({
          email: user.email,
          subject: "Your password reset (valid for 10 minutes)",
          message,
          html,
        });

        return res.status(200).json({
          success: true,
          message: "Token sent to email!",
        });
      } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save({ validateBeforeSave: false });

        return res.status(500).json({
          success: false,
          message: "Email could not be sent!. Please try again later",
        });
      }
    } catch (error) {
      next(error);
    }
  },

  // Reset password function
  async resetPassword(req, res, next) {
    const { password, resetToken } = req.body;
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    if (!password || !resetToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const user = await Users.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    console.log(user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This link is invalid or has expired",
      });
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    const loginToken = generateAccessToken(user._id, user.role);

    return res.status(200).json({
      success: user ? true : false,
      message: user ? "Password reset successfully" : "Something went wrong!",
      token: user ? loginToken : null,
    });
  },

  // Get all users
  async getAllUsers(req, res, next) {
    try {
      const users = await Users.find().select("-password -refreshToken -role");
      res.status(200).json({
        success: users ? true : false,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  async deleteUser(req, res, next) {
    const { _id } = req.query;
    if (!_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }
    const user = await Users.findByIdAndDelete(_id);
    return res.status(200).json({
      success: user ? true : false,
      message: user ? "User deleted successfully" : "Something went wrong!",
    });
  },

  // Update user
  async updateUser(req, res, next) {
    const { _id } = req.user;
    if (!_id || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }
    const user = await Users.findByIdAndUpdate(_id, req.body, {
      new: true,
    }).select("-password -refreshToken -role");
    return res.status(200).json({
      success: user ? true : false,
      message: user ? "User updated successfully" : "Something went wrong!",
    });
  },

  // Update user by admin
  async updateUserByAdmin(req, res, next) {
    const { uid } = req.params;
    if (!uid || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }
    const user = await Users.findByIdAndUpdate(uid, req.body, {
      new: true,
    }).select("-password -refreshToken -role");
    return res.status(200).json({
      success: user ? true : false,
      message: user ? "User updated successfully" : "Something went wrong!",
    });
  },
};

module.exports = userController;
