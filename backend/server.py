from config import app, db, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER_SID
from flask import request, jsonify
import requests
from twilio.twiml.voice_response import VoiceResponse

@app.route("/answer", methods=["POST", "GET"])
def answer_call():
    """Handles incoming calls and records them."""
    response = VoiceResponse()
    response.say("Welcome to Ruff, please state your name, age, and symptoms after the beep.")
    response.record(max_length=60, recording_status_callback="/recording_complete")
    return str(response)

@app.route("/recording_complete", methods=["POST"])
def recording_complete():
    """Stores recording data in Firebase."""
    phone_number = request.form.get("From")
    recording_url = request.form.get("RecordingUrl")
    if phone_number and recording_url:
        db.collection("call_records").add({
            "phone_number": phone_number,
            "recording_url": recording_url
        })
        return "Recording saved!", 200
    return "Invalid data", 400

@app.route('/server', methods=['POST', 'GET', 'OPTIONS'])
def server():
    return jsonify({'message': 'Server OK'})

@app.route("/update_twilio_webhook", methods=["GET"], endpoint="update_twilio_webhook")
def update_twilio_webhook():
    """Fetches the Ngrok URL and updates the Twilio webhook."""
    try:
        # Get Ngrok public URL
        response = requests.get("http://127.0.0.1:4040/api/tunnels")
        data = response.json()
        
        # Ensure Ngrok tunnel exists before accessing it
        if "tunnels" not in data or not data["tunnels"]:
            return jsonify({"error": "Ngrok tunnel not found"}), 500
        
        ngrok_url = data["tunnels"][0]["public_url"]
        print(f"🌍 Ngrok URL detected: {ngrok_url}")

        # Update Twilio Webhook
        twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/{TWILIO_PHONE_NUMBER_SID}.json"
        payload = {"VoiceUrl": f"{ngrok_url}/answer"}
        auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        twilio_response = requests.put(twilio_url, data=payload, auth=auth)
        
        return jsonify({
            "message": f"✅ Twilio Webhook Updated: {ngrok_url}/answer",
            "status_code": twilio_response.status_code
        })

    except Exception as e:
        return jsonify({"error": f"⚠️ Error updating Twilio webhook: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
