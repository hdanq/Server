const router = require("express").Router();
const UserController = require("../controllers/UserController");

router.post("/register", UserController.register);
router.post("/login", UserController.login);

module.exports = router;
// Compare this snippet from routes/index.js:
