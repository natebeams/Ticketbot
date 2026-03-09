const express = require("express");
require("dotenv").config();

const app = express();

app.get("/test",(req,res)=>{
res.send("dashboard working");
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
console.log(`Web server running on port ${PORT}`);
});

require("./bot");
require("./dashboard");