require("dotenv").config();

/* start bot */
const client = require("./bot");

/* start dashboard */
require("./dashboard")(client);