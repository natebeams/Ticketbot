const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const session = require("express-session");
const path = require("path");

require("dotenv").config();

module.exports = (client) => {

const app = express();

/* ================================
TEST ROUTE
================================ */

app.get("/test",(req,res)=>{
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
scope:["identify","guilds"]
},
(accessToken, refreshToken, profile, done)=>{
return done(null, profile);
}));

/* ================================
SESSION
================================ */

app.use(session({
secret: process.env.SESSION_SECRET || "ticket-dashboard-secret",
resave:false,
saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

/* ================================
BODY PARSER
================================ */

app.use(express.json());
app.use(express.urlencoded({ extended:true }));

/* ================================
VIEWS
================================ */

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));

app.use(express.static(path.join(__dirname,"public")));

/* ================================
LOGIN ROUTES
================================ */

app.get("/login", passport.authenticate("discord"));

app.get("/auth/discord/callback",
passport.authenticate("discord",{ failureRedirect:"/" }),
(req,res)=>{
res.redirect("/dashboard");
});

/* ================================
LOGOUT
================================ */

app.get("/logout",(req,res)=>{
req.logout(()=>{});
res.redirect("/");
});

/* ================================
HOME PAGE
================================ */

app.get("/",(req,res)=>{
res.send(`
<h2>Ticket Dashboard</h2>
<a href="/login">Login with Discord</a>
`);
});

/* ================================
DASHBOARD
================================ */

app.get("/dashboard", async (req,res)=>{

if(!req.user) return res.redirect("/login");

try{

const guild = await client.guilds.fetch(process.env.GUILD_ID).catch(()=>null);

if(!guild){
return res.send("Server not found.");
}

const channels = await guild.channels.fetch();

const tickets = [...channels.values()]
.filter(c => c && c.name && c.name.startsWith("ticket-"))
.map(c => ({
name:c.name,
id:c.id
}));

res.render("tickets",{
user:req.user,
tickets
});

}catch(err){

console.error("Dashboard error:",err);
res.send("Dashboard crashed.");

}

});

/* ================================
CLOSE TICKET
================================ */

app.get("/close/:id", async (req,res)=>{

if(!req.user) return res.redirect("/login");

try{

const guild = await client.guilds.fetch(process.env.GUILD_ID).catch(()=>null);
if(!guild) return res.redirect("/dashboard");

const channel = guild.channels.cache.get(req.params.id);

if(channel){
await channel.delete().catch(()=>{});
}

}catch(err){
console.error("Close ticket error:",err);
}

res.redirect("/dashboard");

});

/* ================================
ERROR HANDLER
================================ */

app.use((err, req, res, next)=>{
console.error("Express error:",err);
res.status(500).send("Internal server error.");
});

/* ================================
START SERVER (RAILWAY SAFE)
================================ */

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", ()=>{
console.log(`Dashboard running on port ${PORT}`);
});

};