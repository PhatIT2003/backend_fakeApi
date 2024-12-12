// config/config.js
const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  SERVER_PORT: 4000,
  DELAY_TIMEOUT: 500,
  //unit: milliseconds
  JWT_SECRET: process.env.JWT_Token,
  TELEGRAM_BOT_TOKEN: process.env.PRIVATE_KEY,
  FRONTEND_URL: 'http://localhost:3000'
};