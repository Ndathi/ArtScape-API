const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const profileRouter = require("./routes/profileRoutes");
const discoverRouter = require("./routes/discoverRoutes");
const userRouter = require("./routes/userRoutes");
//const viewRouter = require("./routes/viewRoutes");
const stkRouter = require("./routes/stkRoute");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//Global middlewares
app.use(express.static(path.join(__dirname, "public")));
//set security http headers
app.use(helmet());
app.use(cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Implement rate/the number of requests sent
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests, try again in an hour",
});

app.use("/public", limiter);

//body parsing into req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Data sanitization against NoSQL query injection

app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: ["price"],
  })
);

//serving static files

// ROUTES middleware

// app.use("/", stkRouter);

app.use("/public/My-profile.html", profileRouter);

app.use("/public/Discover.html", discoverRouter);

app.use("/api/users", userRouter);
app.use("/api/stk", stkRouter);

//dealing with all the undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
