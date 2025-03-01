from flask import Flask, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from twilio.twiml.voice_response import VoiceResponse

app = Flask(__name__)
CORS(app)  # Allow all origins

# Initialize Firebase
cred = credentials.Certificate("./servicekey.json")  # Replace with your Firebase key
firebase_admin.initialize_app(cred)
db = firestore.client()

@app.route("/answer", methods=["POST", "GET"])  # Accept both GET and POST requests
def answer_call():
    """Handles incoming calls and records them."""
    response = VoiceResponse()
    response.say("This call is being recorded. Please leave your message after the beep.")
    response.record(max_length=60, recording_status_callback="/recording_complete")
    return str(response)

@app.route("/recording_complete", methods=["POST"])
def recording_complete():
    """Stores recording data in Firebase."""
    phone_number = request.form.get("From")  # Caller number
    recording_url = request.form.get("RecordingUrl")  # Twilio recording link

    # Save to Firebase
    db.collection("call_records").add({
        "phone_number": phone_number,
        "recording_url": recording_url
    })

    return "OK"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)  # Allow external access
