const { promisify } = require("util");

const crypto = require("crypto");

const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const AppError = require("../utils/appError");

const sendEmail = require("../utils/email");

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    user: {
      user,
    },
  });
};

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};
exports.login = async (req, res, next) => {
  try {
    //const email = req.body.email;
    //const password = req.body.password;
    //the line below is the same as writing these two above some stuff about object restructuring
    const { email, password } = req.body;
    //Check that email and password are there
    if (!email || !password) {
      return next(new AppError("Please input a email and a password", 400));
    }
    //check if the user exists and password is correct

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: "failed to login",
      message: err,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    //get the token and checking if it exits
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in login to access profile", 401)
      );
    }

    //verify the token

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //check if user still exists

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError("The user with this token no longer exists", 401)
      );
    }

    //check if user changed password after the token was issued

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError("User recently changed password. Please login again", 401)
      );
    }

    //Grant access to the protected route
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(400).json({
      status: "failed to login",
      message: err,
    });
  }
};

exports.restrictTo = function (...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this task", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  //Get user based on the POSTed email

  try {
    const user = await User.findOne({ email: req.body.email });
    //the use I am getting from this method does not bring the user details ie it has no name
    if (!user) {
      return next(
        new AppError("There is no user with that email address", 404)
      );
    }
    //Generate the random reset token

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    //Send it to users email

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/public/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a patch request with your new password and password confirm
    to ${resetUrl}.\n If you did not request to reset your password, please ignore this message`;
    try {
      await sendEmail({
        email: user.email,
        subject: "your password reset token()valid for 10 minutes",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "Your password reset token sent to email",
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "there was an error sending the email try again later",
          500
        )
      );
    }
  } catch (err) {
    res.status(400).json({
      status: "failed to reset password at forgot password function",
      message: err,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    //1)Get user based on the token

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //2)if token has not expired,and there is user set new password

    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: true });

    //3)Update changed password at property for the user
    //4) Log the user in,send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: "failed to reset password",
      message: err,
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    //get user from the collection
    const user = await User.findById(req.user.id).select("+password");

    //check if current posted password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError("Your current password is incorrect", 401));
    }

    //if so update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save({ validateBeforeSave: true });

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: "failed to update password",
      message: err,
    });
  }
};
