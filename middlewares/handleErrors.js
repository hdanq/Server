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
};

module.exports = { notFound, handleErrors };
