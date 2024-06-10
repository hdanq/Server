const express = require("express");
const dbConnect = require("./config/db");
const initRouters = require("./routes");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

dbConnect.connect();
initRouters(app);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
