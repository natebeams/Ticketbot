const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");
const path = require("path");

require("dotenv").config();

module.exports = (client) => {

const app = express();
app.get("/test", (req,res)=>{
res.send("dashboard working");
});
/* ================================
PASSPORT CONFIG
================================ */

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
SESSION
================================ */

app.use(session({
    secret: "ticket-dashboard-secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/* ================================
VIEWS
================================ */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

/* ================================
LOGIN ROUTES
================================ */

app.get("/login", passport.authenticate("discord"));

app.get("/callback",
    passport.authenticate("discord", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("/dashboard");
    }
);

/* ================================
LOGOUT
================================ */

app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if (err) console.error(err);
        res.redirect("/");
    });
});

/* ================================
HOME PAGE
================================ */

app.get("/", (req, res) => {
    res.send("Ticket Dashboard Online");
});

/* ================================
DASHBOARD
================================ */

app.get("/dashboard", (req, res) => {

    if (!req.user) return res.redirect("/login");

    const guild = client.guilds.cache.get(process.env.GUILD_ID);

    if (!guild) {
        return res.send("Server not found.");
    }

    const tickets = guild.channels.cache
        .filter(c => c.name.startsWith("ticket-"))
        .map(c => ({
            name: c.name,
            id: c.id
        }));

    res.render("tickets", {
        user: req.user,
        tickets
    });

});

/* ================================
CLOSE TICKET
================================ */

app.get("/close/:id", async (req, res) => {

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return res.redirect("/dashboard");

    const channel = guild.channels.cache.get(req.params.id);

    if (channel) {
        await channel.delete().catch(() => {});
    }

    res.redirect("/dashboard");

});

/* ================================
START SERVER
================================ */

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Dashboard running on port ${PORT}`);
});

};