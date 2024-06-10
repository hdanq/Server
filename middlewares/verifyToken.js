const jwt = require("jsonwebtoken");

const verifyAccessToken = async (req, res, next) => {
  if (req?.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
      if (err) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid token!" });
      }
      req.user = decode;
      next();
    });
  } else {
    return res
      .status(401)
      .json({ success: false, message: "Require authentication!" });
  }
};

module.exports = { verifyAccessToken };
