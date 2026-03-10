const express = require("express");
const path = require("path");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

module.exports = (client) => {

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended:true }));

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));

/* ================================
HOME
================================ */

app.get("/",(req,res)=>{
res.send("Dashboard Online");
});

/* ================================
HEALTHCHECK (for Railway)
================================ */

app.get("/health",(req,res)=>{
res.status(200).send("OK");
});

/* ================================
DASHBOARD PAGE
================================ */

app.get("/dashboard",(req,res)=>{

const stats = {
status: client.ws.status === 0 ? "Online":"Offline",
latency: client.ws.ping,
uptime: Math.floor(process.uptime())
};

res.render("dashboard",{stats});

});

/* ================================
PAGES
================================ */

app.get("/panels",(req,res)=>res.render("panels"));
app.get("/tickets",(req,res)=>res.render("tickets"));
app.get("/settings",(req,res)=>res.render("settings"));

/* ================================
CREATE PANEL
================================ */

app.post("/create-panel", async (req,res)=>{

try{

const guild = client.guilds.cache.first();
if(!guild) return res.send("Guild not found");

const title = req.body.title;
const description = req.body.description;
const channelID = req.body.channelID;

/* find channel */

const channel = guild.channels.cache.get(channelID);

if(!channel){
return res.send("Invalid Channel ID");
}

/* embed */

const embed = new EmbedBuilder()
.setTitle(title || "Support Ticket")
.setDescription(description || "Click the button below to open a ticket.")
.setColor(0x5865F2);

/* button */

const button = new ButtonBuilder()
.setCustomId("create_ticket")
.setLabel("Create Ticket")
.setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder().addComponents(button);

/* send panel */

await channel.send({
embeds:[embed],
components:[row]
});

res.redirect("/panels");

}catch(err){

console.error(err);
res.send("Panel creation failed");

}

});

/* ================================
SERVER
================================ */

const PORT = process.env.PORT || 3000;

app.listen(PORT,"0.0.0.0",()=>{
console.log(`Dashboard running on port ${PORT}`);
});

};