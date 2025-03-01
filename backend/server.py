from config import app, db, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER_SID
from flask import request, jsonify
import requests
from twilio.twiml.voice_response import VoiceResponse
import random
from firebase_admin import firestore
import time

@app.route("/answer", methods=["POST", "GET"])
def answer_call():
    """Handles incoming calls and records them."""
    response = VoiceResponse()
    response.say("Welcome to Ruff, please state your name, age, and symptoms after the beep.")
    # Use Twilio's built-in pause so we don't block the HTTP response.
    response.pause(length=3)
    response.record(recording_status_callback="/recording_complete", transcribe=True, transcribe_callback="/transcription_complete")
    return str(response)

@app.route("/recording_complete", methods=["POST"])
def recording_complete():
    """Stores recording data in Firebase after a short wait.
       If the phone number belongs to a user, saves under their account's 'calls' subcollection.
       Otherwise, saves under a 'calls' collection with a subcollection named with the call time.
    """
    try:
        # Wait a bit to ensure processing is complete
        time.sleep(5)
        phone_number = request.form.get("From")
        recording_url = request.form.get("RecordingUrl")
        
        # If parameters are missing, log and return a success status to avoid Twilio retries.
        if not phone_number or not recording_url:
            print("Recording complete callback received without phone number or recording URL")
            return "No data", 200
        
        call_data = {
            "recording_url": recording_url,
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        
        # Check if a user exists with this phone number
        user_query = db.collection("users").where("phoneNumber", "==", phone_number).limit(1).get()
        
        if user_query:
            # User exists: store the recording under the user's "calls" subcollection.
            user_doc_id = user_query[0].id
            db.collection("users").document(user_doc_id).collection("calls").add(call_data)
            print("Recording saved under user account:", recording_url)
        else:
            # No user found: store under "calls" collection with phone number as key and subcollection named by the call time.
            call_time = time.strftime("%Y-%m-%d_%H-%M-%S")
            db.collection("calls").document(phone_number).collection(call_time).add({
                "recording_url": recording_url
            })
            print("Recording saved under calls collection:", recording_url)
            
        return "Recording saved!", 200
    except Exception as e:
        print("Error in recording_complete:", str(e))
        return f"Invalid data: {str(e)}", 400

@app.route("/transcription_complete", methods=["POST"])
def transcription_complete():
    """Stores transcription data in Firebase after a short wait.
       If the phone number belongs to a user, saves under their account's 'transcriptions' subcollection.
       Otherwise, saves under the 'calls' collection with a subcollection named with the call time.
    """
    try:
        # Wait to ensure processing is complete
        time.sleep(5)
        phone_number = request.form.get("From")
        transcription_text = request.form.get("TranscriptionText")
        
        # If parameters are missing, log and return success.
        if not phone_number or not transcription_text:
            print("Transcription complete callback received without phone number or transcription text")
            return "No data", 200
        
        transcription_data = {
            "transcription": transcription_text,
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        
        # Check if a user exists with this phone number
        user_query = db.collection("users").where("phoneNumber", "==", phone_number).limit(1).get()
        
        if user_query:
            # User exists: store the transcription under the user's "transcriptions" subcollection.
            user_doc_id = user_query[0].id
            db.collection("users").document(user_doc_id).collection("transcriptions").add(transcription_data)
            print("Transcription saved under user account:", transcription_text)
        else:
            # No user found: store under "calls" collection with phone number as key and subcollection named by the call time.
            call_time = time.strftime("%Y-%m-%d_%H-%M-%S")
            db.collection("calls").document(phone_number).collection(call_time).add({
                "transcription": transcription_text
            })
            print("Transcription saved under calls collection:", transcription_text)
            
        return "Transcription saved!", 200
    except Exception as e:
        print("Error in transcription_complete:", str(e))
        return f"Invalid transcription data: {str(e)}", 400

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

@app.route("/api/check-phone", methods=["POST"])
def check_phone():
    """Check if a phone number exists in the 'users' collection."""
    data = request.get_json()
    phone = data.get("phone")
    if not phone:
        return jsonify({"error": "Phone number is required"}), 400

    try:
        users_ref = db.collection("users")
        query_ref = users_ref.where("phoneNumber", "==", phone).limit(1).get()
        exists = len(query_ref) > 0
        # Optionally, if the user exists you can include their userId.
        user_id = query_ref[0].id if exists else None
        return jsonify({"exists": exists, "userId": user_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/signup", methods=["POST"])
def signup():
    """Create a new user with phone number and personal info."""
    data = request.get_json()
    phone = data.get("phone")
    firstName = data.get("firstName")
    lastName = data.get("lastName")
    dob = data.get("dob")
    email = data.get("email")
    
    if not all([phone, firstName, lastName, dob, email]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Create a new user document in Firestore
        doc_ref = db.collection("users").add({
            "phoneNumber": phone,
            "personal": {
                "firstName": firstName,
                "lastName": lastName,
                "dob": dob,
                "email": email
            }
        })
        # doc_ref returns a tuple (update_time, reference); use reference id
        user_id = doc_ref[1].id
        return jsonify({"message": "User created", "userId": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/send-code", methods=["POST"])
def send_code():
    """
    Generates a verification code, stores it in Firestore, and sends it via Firebase Cloud Messaging (FCM).
    
    Expected JSON payload:
      {
         "phone": "+15551234567",
         "fcmToken": "optional_fcm_device_token"  // If not provided, returns code in response (for development)
      }
    """
    data = request.get_json()
    phone = data.get("phone")
    fcm_token = data.get("fcmToken")  # Optional: device token for push notification
    if not phone:
        return jsonify({"error": "Phone number is required"}), 400

    # Generate a 6-digit verification code
    verification_code = random.randint(100000, 999999)

    try:
        # Store the code in Firestore (for later verification)
        db.collection("verification_codes").add({
            "phoneNumber": phone,
            "code": str(verification_code),
            "timestamp": firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        return jsonify({"error": f"Error storing verification code: {str(e)}"}), 500

    # If an FCM token is provided, send the code via Firebase Cloud Messaging
    if fcm_token:
        try:
            from firebase_admin import messaging
            message = messaging.Message(
                data={
                    'verification_code': str(verification_code)
                },
                token=fcm_token,
            )
            response = messaging.send(message)
            return jsonify({
                "message": "Verification code sent via push notification", 
                "response": response
            }), 200
        except Exception as e:
            return jsonify({"error": f"Error sending push notification: {str(e)}"}), 500
    else:
        # For development purposes only, return the code in the response (do not do this in production)
        return jsonify({
            "message": "Verification code generated (development mode)",
            "code": str(verification_code)
        }), 200

@app.route("/api/verify-code", methods=["POST"])
def verify_code():
    """Verifies the code entered by the user."""
    data = request.get_json()
    phone = data.get("phone")
    code = data.get("code")
    if not phone or not code:
        return jsonify({"error": "Phone number and code are required"}), 400

    try:
        codes_ref = db.collection("verification_codes")
        query_ref = codes_ref.where("phoneNumber", "==", phone).where("code", "==", code).limit(1).get()
        if query_ref:
            db.collection("verification_codes").document(query_ref[0].id).delete()
            return jsonify({"verified": True}), 200
        else:
            return jsonify({"verified": False}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/home", methods=['POST'])
def home():
    try:
        data = request.json

        if not data or 'uid' not in data:
            return jsonify({'error':'Missing data or user ID'}), 400

        user_id = data.get('uid')

        user_ref = db.collection('users').document(user_id)

        return jsonify({'message': 'Fetched user data successfully', 'uid':user_id})
    except Exception as e:
        return jsonify({'error':f'Server error: {str(e)}'}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
