const express = require("express");
require("dotenv").config();

const app = express();

/* TEST ROUTE */

app.get("/test",(req,res)=>{
res.send("dashboard working");
});

/* START WEB SERVER */

const PORT = process.env.PORT;

app.listen(PORT, () => {
console.log(`Web server running on port ${PORT}`);
});

/* START BOT */

require("./bot");

/* START DASHBOARD */

require("./dashboard");