const notFound = (req, res, next) => {
  try {
    const error = new Error(`404 Not Found! - ${req.originalUrl}`);
    res.status(404);
    throw error;
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const handleErrors = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (statusCode === 404) {
    return res.status(404).json({ success: false, message: "404 Not Found!" });
  }
  if (err && err.code === 11000) {
    return res
      .status(400)
      .json({ success: false, message: "Email already exists" });
  }
  if (err.message === "Incorrect password") {
    return res
      .status(400)
      .json({ success: false, message: "Incorrect password" });
  }

  if (err.message === "Incorrect email") {
    return res.status(400).json({
      success: false,
      message: "Incorrect email",
    });
  }
  if (err.message.includes("Users validation failed")) {
    Object.values(err.errors).forEach((val) => {
      return res.status(400).json({
        success: false,
        message: val.message,
      });
    });
  }
};

module.exports = { notFound, handleErrors };
