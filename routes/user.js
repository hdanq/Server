const router = require("express").Router();
const userController = require("../controllers/userController");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/current", verifyAccessToken, userController.getCurrent);
router.post("/refreshtoken", userController.refreshAccessToken);
router.get("/logout", userController.logout);

module.exports = router;
// Compare this snippet from routes/index.js:
