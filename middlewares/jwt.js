const jwt = require("jsonwebtoken");

const generateAccessToken = (id, role) => {
  return jwt.sign({ _id: id, role }, process.env.ACCESS_TOKEN, {
    expiresIn: "3d",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ _id: id }, process.env.ACCESS_TOKEN, {
    expiresIn: "7d",
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
