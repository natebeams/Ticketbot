const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const path = require("path");
const fs = require("fs");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {

const app = express();

/* ================================
MIDDLEWARE
================================ */

app.use(express.json());

/* ================================
VIEWS
================================ */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ================================
HEALTHCHECK
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
scope: ["identify","guilds"]
},
(accessToken, refreshToken, profile, done) => {
return done(null, profile);
}));

/* ================================
ROUTES
================================ */

app.get("/", (req,res)=>{
res.send("Dashboard online");
});

app.get("/dashboard",(req,res)=>{

const stats = {
status: client?.ws?.status === 0 ? "Online" : "Offline",
latency: client?.ws?.ping || 0,
uptime: Math.floor(process.uptime()),
openTickets: 0,
totalTickets: 0,
serverName: client?.guilds?.cache?.first()?.name || "Unknown"
};

res.render("dashboard",{stats});

});

/* Sidebar pages */

app.get("/panels",(req,res)=>{
res.render("panels");
});

app.get("/tickets",(req,res)=>{
res.render("tickets");
});

app.get("/settings",(req,res)=>{
res.render("settings");
});

/* ================================
API: GET SERVER DATA
================================ */

app.get("/guild-data",(req,res)=>{

const guild = client.guilds.cache.first();

if(!guild){
return res.json({
roles:[],
channels:[],
categories:[]
});
}

const roles = guild.roles.cache
.filter(r=>r.name !== "@everyone")
.map(r=>({id:r.id,name:r.name}));

const channels = guild.channels.cache
.filter(c=>c.type === 0)
.map(c=>({id:c.id,name:c.name}));

const categories = guild.channels.cache
.filter(c=>c.type === 4)
.map(c=>({id:c.id,name:c.name}));

res.json({
roles,
channels,
categories
});

});

/* ================================
SAVE SETTINGS
================================ */

app.post("/save-settings",(req,res)=>{

const settings = req.body;

fs.writeFileSync(
"./settings.json",
JSON.stringify(settings,null,2)
);

res.json({success:true});

});

/* ================================
LOAD SETTINGS
================================ */

app.get("/load-settings",(req,res)=>{

if(!fs.existsSync("./settings.json")){
return res.json({});
}

const settings = JSON.parse(
fs.readFileSync("./settings.json")
);

res.json(settings);

});

/* ================================
CREATE TICKET PANEL
================================ */

app.post("/create-panel", async (req,res)=>{

try{

if(!fs.existsSync("./settings.json")){
return res.json({success:false,error:"Settings not configured"});
}

const settings = JSON.parse(
fs.readFileSync("./settings.json")
);

const guild = client.guilds.cache.first();

if(!guild){
return res.json({success:false,error:"Guild not found"});
}

const channel = guild.channels.cache.get(settings.logsChannel);

if(!channel){
return res.json({success:false,error:"Channel not found"});
}

const embed = new EmbedBuilder()
.setTitle("Support Ticket")
.setDescription("Click the button below to open a ticket.")
.setColor(0x5865F2);

const button = new ButtonBuilder()
.setCustomId("create_ticket")
.setLabel("Create Ticket")
.setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder().addComponents(button);

await channel.send({
embeds:[embed],
components:[row]
});

res.json({success:true});

}catch(err){

console.error(err);
res.json({success:false,error:"Panel creation failed"});

}

});

/* ================================
DISCORD LOGIN
================================ */

app.get("/login",passport.authenticate("discord"));

app.get("/auth/discord/callback",
passport.authenticate("discord",{failureRedirect:"/"}),
(req,res)=>{
res.redirect("/dashboard");
});

/* ================================
START SERVER
================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT,"0.0.0.0",()=>{
console.log(`Dashboard running on port ${PORT}`);
});

};