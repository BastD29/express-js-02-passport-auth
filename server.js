if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

const app = express();

// replace database
const users = [];

app.set("view-engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs", { name: "Jane" });
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs", { name: "Jack" });
});

// app.post("/login", (req, res) => {});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    };
    users.push(user);
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }

  console.log(users);
});

app.delete("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

// check if user is authenticated so he cannot see '/' without being authenticated
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

// check if user is authenticated so if he go back to '/login' he is redirected to '/'
// (we do not want users to go to login page if authenticated, register neither
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(3000);
