const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../backend/secrets.config") });

// Load Twilio credentials from secrets.config
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER_SID = process.env.TWILIO_PHONE_NUMBER_SID;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER_SID) {
    console.error("❌ Missing Twilio credentials. Check your secrets.config file.");
    process.exit(1);
}

setTimeout(async () => {
    try {
        // Get Ngrok public URL
        const response = await axios.get("http://127.0.0.1:4040/api/tunnels");
        if (!response.data.tunnels || response.data.tunnels.length === 0) {
            throw new Error("Ngrok tunnel not found. Ensure ngrok is running.");
        }
        const ngrokUrl = response.data.tunnels[0].public_url;
        console.log(`🌍 Ngrok URL detected: ${ngrokUrl}`);

        // Twilio API URL to update the webhook
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${TWILIO_PHONE_NUMBER_SID}.json`;

        // Update Twilio Webhook using PUT
        const updateResponse = await axios.put(
            twilioUrl,
            new URLSearchParams({ VoiceUrl: `${ngrokUrl}/answer` }).toString(),
            {
                auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN },
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            }
        );

        console.log(`✅ Twilio Webhook Updated: ${ngrokUrl}/answer`);
    } catch (error) {
        console.error(
            "❌ Error updating Twilio Webhook:",
            error.response?.status,
            error.response?.data || error.message
        );
    }
}, 5000); // Delay 5 seconds to ensure Ngrok starts
