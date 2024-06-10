const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const Users = new Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
      validate: [isEmail, "Please enter a valid email"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please enter an password"],
      minlength: [8, "Password should be at least 8 characters long"],
    },
    role: {
      type: String,
      default: "user",
    },
    cart: {
      type: Array,
      default: [],
    },
    address: [{ type: mongoose.Types.ObjectId, ref: "Address" }],
    wishlist: [{ type: mongoose.Types.ObjectId, ref: "Products" }],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: "",
    },
    passwordChangedAt: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: String,
    },
  },
  { timestamps: true }
);

// fire a function before doc saved to db
Users.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// static method to login user
Users.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error("incorrect password");
  }
  throw Error("incorrect email");
};

module.exports = mongoose.model("Users", Users);
