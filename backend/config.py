from flask import Flask
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import requests
import json
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": {"http://localhost:3000", "http://127.0.0.1:3000"}}})
load_dotenv()

# Firebase
cred = credentials.Certificate("/Users/diegocicotoste/Documents/Hackathons/ruff/backend/servicekey.json") 
firebase_admin.initialize_app(cred)

db = firestore.client()  

# Twilio credentials
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER_SID = os.getenv("TWILIO_PHONE_NUMBER_SID")

# Get Ngrok's current URL
response = requests.get("http://127.0.0.1:4040/api/tunnels")
data = response.json()
ngrok_url = data["tunnels"][0]["public_url"]

# Twilio API request to update webhook
twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/{TWILIO_PHONE_NUMBER_SID}.json"

payload = {"VoiceUrl": f"{ngrok_url}/answer"}
auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

requests.post(twilio_url, data=payload, auth=auth)

print(f"Updated Twilio Webhook to: {ngrok_url}/answer")


