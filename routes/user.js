const router = require("express").Router();
const UserController = require("../controllers/UserController");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/current", verifyAccessToken, UserController.getCurrent);
router.post("/refreshtoken", UserController.refreshAccessToken);
router.get("/logout", UserController.logout);

module.exports = router;
// Compare this snippet from routes/index.js:
