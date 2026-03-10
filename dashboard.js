const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const path = require("path");

module.exports = (client) => {

const app = express();

/* ================================
VIEWS
================================ */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ================================
HEALTHCHECK (RAILWAY)
================================ */

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* ================================
SESSIONS
================================ */

app.use(session({
  secret: process.env.SESSION_SECRET || "dashboard-secret",
  resave: false,
  saveUninitialized: false
}));

/* ================================
PASSPORT
================================ */

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ["identify", "guilds"]
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

/* ================================
ROUTES
================================ */

app.get("/", (req, res) => {
  res.send("Dashboard online");
});

app.get("/test", (req, res) => {
  res.send("dashboard working");
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

app.get("/login", passport.authenticate("discord"));

app.get("/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    res.send("Logged in with Discord!");
  }
);

/* ================================
START SERVER
================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dashboard running on port ${PORT}`);
});

};