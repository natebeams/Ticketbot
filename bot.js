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
LOAD CONFIG FILES
================================ */

let config = {};
let settings = {};

try{
config = JSON.parse(fs.readFileSync("./config.json"));
}catch(err){
console.error("config.json error:",err);
}

try{
settings = JSON.parse(fs.readFileSync("./settings.json"));
}catch(err){
console.error("settings.json error:",err);
}

/* merge them together */
const CONFIG = { ...config, ...settings };

/* ================================
DISCORD CLIENT
================================ */

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
});

/* ================================
READY EVENT
================================ */

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});
/* ================================
INTERACTIONS
================================ */

client.on("interactionCreate", async interaction => {

if(!interaction.isButton()) return;

const logChannel = interaction.guild.channels.cache.get(CONFIG.logsChannel);

/* ================================
OPEN TICKET
================================ */

if(interaction.customId === "create_ticket"){

try{

await interaction.deferReply({ ephemeral:true });

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
parent: CONFIG.ticketCategory || null,

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
id:CONFIG.supportRole,
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
content:`${interaction.user} <@&${CONFIG.supportRole}>`,
components:[row]
});

await interaction.editReply({
content:`✅ Ticket created: ${ticketChannel}`
});

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

interaction.editReply({
content:"❌ Failed to create ticket. Check settings."
}).catch(()=>{});

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