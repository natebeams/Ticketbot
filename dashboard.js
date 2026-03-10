const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const path = require("path");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));

/* ===================== */
/* SESSION */
/* ===================== */

app.use(session({
secret: process.env.SESSION_SECRET || "dashboard-secret",
resave:false,
saveUninitialized:false
}));

/* ===================== */
/* PASSPORT */
/* ===================== */

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user,done)=>done(null,user));
passport.deserializeUser((obj,done)=>done(null,obj));

passport.use(new DiscordStrategy({
clientID:process.env.CLIENT_ID,
clientSecret:process.env.CLIENT_SECRET,
callbackURL:process.env.CALLBACK_URL,
scope:["identify","guilds"]
},
(accessToken,refreshToken,profile,done)=>{
return done(null,profile);
}));

/* ===================== */
/* ROUTES */
/* ===================== */

app.get("/",(req,res)=>{
res.send("Dashboard online");
});

app.get("/health",(req,res)=>{
res.status(200).send("OK");
});

app.get("/dashboard",(req,res)=>{

const stats={
status: client?.ws?.status === 0 ? "Online":"Offline",
latency: client?.ws?.ping || 0,
uptime: Math.floor(process.uptime()),
serverName: client?.guilds?.cache?.first()?.name || "Unknown"
};

res.render("dashboard",{stats});

});

/* ===================== */
/* PAGES */
/* ===================== */

app.get("/panels",(req,res)=>res.render("panels"));
app.get("/tickets",(req,res)=>res.render("tickets"));
app.get("/settings",(req,res)=>res.render("settings"));
/* ===================== */
/* GET SERVER DATA */
/* ===================== */

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
.filter(r => r.name !== "@everyone")
.map(r => ({
id: r.id,
name: r.name
}));

const channels = guild.channels.cache
.filter(c => c.type === 0)
.map(c => ({
id: c.id,
name: c.name
}));

const categories = guild.channels.cache
.filter(c => c.type === 4)
.map(c => ({
id: c.id,
name: c.name
}));

res.json({
roles,
channels,
categories
});

});
/* ===================== */
/* CREATE PANEL */
/* ===================== */

app.post("/create-panel", async (req,res)=>{

try{

const guild = client.guilds.cache.first();
if(!guild) return res.send("Guild not found");

/* get data from form */

const title = req.body.title;
const description = req.body.description;
const button = req.body.button;
const channelId = req.body.channelID;

/* find channel */

const channel = guild.channels.cache.get(channelId);

if(!channel){
return res.send("Channel not found. Check the ID.");
}

/* embed */

const embed = new EmbedBuilder()
.setTitle(title || "Support Ticket")
.setDescription(description || "Click the button below to open a ticket.")
.setColor(0x5865F2);

/* button */

const ticketButton = new ButtonBuilder()
.setCustomId("create_ticket")   // FIXED
.setLabel(button || "Create Ticket")
.setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder().addComponents(ticketButton);

/* send panel */

await channel.send({
embeds:[embed],
components:[row]
});

/* redirect */

res.redirect("/panels");

}catch(err){

console.error(err);
res.send("Panel creation failed. Check console.");

}

});

/* ===================== */
/* LOGIN */
/* ===================== */

app.get("/login",passport.authenticate("discord"));

app.get("/auth/discord/callback",
passport.authenticate("discord",{failureRedirect:"/"}),
(req,res)=>res.redirect("/dashboard")
);

/* ===================== */
/* SERVER */
/* ===================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT,"0.0.0.0",()=>{
console.log(`Dashboard running on port ${PORT}`);
});

};