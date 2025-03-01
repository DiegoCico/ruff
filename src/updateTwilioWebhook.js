const fs = require("fs");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/secrets.config") });

// Load Twilio credentials from secrets.config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER_SID = process.env.TWILIO_PHONE_NUMBER_SID;

setTimeout(async () => {
    try {
        // Get Ngrok public URL
        const response = await axios.get("http://127.0.0.1:4040/api/tunnels");
        const ngrokUrl = response.data.tunnels[0].public_url;

        // Update Twilio Webhook
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${TWILIO_PHONE_NUMBER_SID}.json`;

        await axios.post(twilioUrl, `VoiceUrl=${ngrokUrl}/answer`, {
            auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        console.log(`✅ Twilio Webhook Updated: ${ngrokUrl}/answer`);
    } catch (error) {
        console.error("❌ Error updating Twilio Webhook:", error.response?.data || error.message);
    }
}, 5000); // Delay 5s to ensure Ngrok starts
