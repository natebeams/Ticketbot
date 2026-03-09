const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

module.exports = (client) => {

const app = express();

app.use(session({
secret: process.env.SESSION_SECRET,
resave: false,
saveUninitialized: false
}));

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

app.set("view engine", "ejs");
const path = require("path");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
res.send("Dashboard online");
});

app.get("/test", (req,res)=>{
res.send("dashboard working");
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

app.get("/login",
passport.authenticate("discord"));

app.get("/auth/discord/callback",
passport.authenticate("discord", { failureRedirect: "/" }),
(req, res) => {
res.send("Logged in with Discord!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dashboard running on port ${PORT}`);
});

};