const { 
Client,
GatewayIntentBits,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
ChannelType,
PermissionsBitField
} = require("discord.js");

const fs = require("fs");
const transcripts = require("discord-html-transcripts");
require("dotenv").config();

/* ================================
DISCORD CLIENT
================================ */

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

/* ================================
READY EVENT
================================ */

client.once("ready", () => {

console.log(`Logged in as ${client.user.tag}`);

/* START DASHBOARD AFTER BOT IS READY */

require("./dashboard")(client);

});

/* ================================
INTERACTIONS
================================ */

client.on("interactionCreate", async interaction => {

if(!interaction.isButton()) return;

/* LOAD CONFIG */

const config = JSON.parse(fs.readFileSync("./config.json"));
const logChannel = interaction.guild.channels.cache.get(config.logsChannel);

/* ================================
OPEN TICKET
================================ */

if(interaction.customId === "open_ticket"){

try{

const guild = interaction.guild;
let ticketNumber = 1;

if(fs.existsSync("./ticketCount.json")){
const data = JSON.parse(fs.readFileSync("./ticketCount.json"));
ticketNumber = data.count + 1;
}

fs.writeFileSync("./ticketCount.json", JSON.stringify({ count: ticketNumber }));

const ticketChannel = await guild.channels.create({
name:`ticket-${ticketNumber}`,
type:ChannelType.GuildText,
parent: config.ticketCategory || null,

permissionOverwrites:[
{
id:guild.id,
deny:[PermissionsBitField.Flags.ViewChannel]
},
{
id:interaction.user.id,
allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
},
{
id:config.supportRole,
allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]
}
]
});

const closeButton = new ButtonBuilder()
.setCustomId("close_ticket")
.setLabel("Close Ticket")
.setStyle(ButtonStyle.Danger);

const row = new ActionRowBuilder().addComponents(closeButton);

await ticketChannel.send({
content:`${interaction.user} <@&${config.supportRole}>`,
components:[row]
});

await interaction.reply({
content:`✅ Ticket created: ${ticketChannel}`,
ephemeral:true
});

/* LOG CREATION */

if(logChannel){

logChannel.send({
embeds:[{
title:"📩 Ticket Created",
color:0x22c55e,
fields:[
{ name:"User", value:`${interaction.user}`, inline:true },
{ name:"Channel", value:`${ticketChannel}`, inline:true }
],
timestamp:new Date()
}]
});

}

}catch(err){

console.error("Ticket error:", err);

interaction.reply({
content:"❌ Failed to create ticket. Check settings.",
ephemeral:true
});

}

}

/* ================================
CLOSE TICKET
================================ */

if(interaction.customId === "close_ticket"){

try{

const transcript = await transcripts.createTranscript(interaction.channel,{
limit:-1,
filename:`${interaction.channel.name}.html`
});

if(logChannel){

await logChannel.send({
content:`🔒 Ticket closed by ${interaction.user}`,
files:[transcript]
});

}

await interaction.reply({
content:"🔒 Closing ticket...",
ephemeral:true
});

setTimeout(()=>{
interaction.channel.delete().catch(()=>{});
},3000);

}catch(err){

console.error("Close ticket error:",err);

}

}

});

/* ================================
LOGIN BOT
================================ */

client.login(process.env.TOKEN);

module.exports = client;