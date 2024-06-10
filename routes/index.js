const userRouter = require("./user");
const { notFound, handleErrors } = require("../middlewares/handleErrors");

const initRouters = (app) => {
  app.use("/api/user", userRouter);

  app.use(notFound);
  app.use(handleErrors);
};

module.exports = initRouters;
