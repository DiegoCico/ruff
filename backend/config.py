import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore, auth  

# Determine the absolute path to the secrets file.
basedir = os.path.abspath(os.path.dirname(__file__))
secrets_path = os.path.join(basedir, "secrets.config")

# Load environment variables from backend/secrets.config
load_dotenv(dotenv_path=secrets_path)

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# Firebase Initialization (ensure it's only initialized once)
if not firebase_admin._apps:
    try:
        cred_path = os.path.join(basedir, "servicekey.json")  # Adjust if servicekey.json is in a different location
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"❌ Firebase Initialization Error: {e}")
        exit(1)

# Firestore Database
db = firestore.client()

# Load Twilio Credentials from environment variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER_SID = os.getenv("TWILIO_PHONE_NUMBER_SID")

# Check that the credentials are loaded correctly
if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER_SID:
    print("❌ Missing Twilio credentials in environment variables. Check your secrets.config file.")
    exit(1)

print("✅ Flask app and Firebase initialized successfully!")
