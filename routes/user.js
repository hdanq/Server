const router = require("express").Router();
const userController = require("../controllers/userController");
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/current", verifyAccessToken, userController.getCurrent);
router.post("/refreshtoken", userController.refreshAccessToken);
router.get("/logout", userController.logout);
router.post("/forgotPassword", userController.forgotPassword);
router.put("/auth/resetpassword/:resetToken", userController.resetPassword);
router.get("/", [verifyAccessToken, isAdmin], userController.getAllUsers);
router.delete("/", [verifyAccessToken, isAdmin], userController.deleteUser);
router.put("/current", [verifyAccessToken], userController.updateUser);
router.put(
  "/:uid",
  [verifyAccessToken, isAdmin],
  userController.updateUserByAdmin
);

module.exports = router;
// Compare this snippet from routes/index.js:
