from config import app, db, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER_SID
from flask import request, jsonify
import requests
from twilio.twiml.voice_response import VoiceResponse
import time
import os
from dotenv import load_dotenv
from firebase_admin import firestore
from datetime import datetime
from analysis import analyze_report

basedir = os.path.abspath(os.path.dirname(__file__))
secrets_path = os.path.join(basedir, "secrets.config")
load_dotenv(dotenv_path=secrets_path)

@app.route("/answer", methods=["POST", "GET"])
def answer_call():
    """Handles incoming calls and records them."""
    response = VoiceResponse()
    response.say("Welcome to Ruff, please state your name, age, and symptoms after the beep.")
    # Use Twilio's built-in pause so we don't block the HTTP response.
    response.pause(length=3)
    response.record(
        recording_status_callback="/recording_complete", 
        transcribe=True, 
        transcribe_callback="/transcription_complete"
    )
    return str(response)

@app.route("/recording_complete", methods=["POST"])
def recording_complete():
    """Stores recording data in Firebase after a short wait.
       If the phone number belongs to a user, saves under their account's 'calls' subcollection.
       Otherwise, saves under a 'calls' collection with a subcollection named with the call time.
    """
    try:
        time.sleep(5)
        phone_number = request.form.get("From")
        recording_url = request.form.get("RecordingUrl")
        
        if not phone_number or not recording_url:
            print("Recording complete callback received without phone number or recording URL")
            return "No data", 200
        
        call_data = {
            "recording_url": recording_url,
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        
        user_query = db.collection("users").where("phoneNumber", "==", phone_number).limit(1).get()
        if user_query:
            user_doc_id = user_query[0].id
            db.collection("users").document(user_doc_id).collection("calls").add(call_data)
            print("Recording saved under user account:", recording_url)
        else:
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
    """Stores transcription data in Firebase under 'transcriptions' with a timestamp."""
    try:
        time.sleep(5)
        phone_number = request.form.get("From")
        transcription_text = request.form.get("TranscriptionText")
        
        if not phone_number or not transcription_text:
            print("⚠️ Transcription callback received without phone number or transcription text")
            return "No data", 400

        transcription_data = {
            "transcription": transcription_text,
            "timestamp": firestore.SERVER_TIMESTAMP
        }

        # Check if user exists
        user_query = db.collection("users").where("phoneNumber", "==", phone_number).limit(1).get()
        if user_query and len(user_query) > 0:
            user_doc_id = user_query[0].id

            # Store transcription under the 'transcriptions' collection
            db.collection("users").document(user_doc_id).collection("transcriptions").add(transcription_data)
            print(f"✅ Transcription saved under user account: {transcription_text}")

            # Also analyze and store report
            result = analyze_and_store_report(transcription_text, user_doc_id)
            return jsonify(result), 200
        else:
            # Store for unknown users
            call_time = time.strftime("%Y-%m-%d_%H-%M-%S")
            db.collection("calls").document(phone_number).collection("transcriptions").add(transcription_data)
            print(f"⚠️ Transcription saved under unknown calls collection: {transcription_text}")

        return "Transcription saved!", 200
    except Exception as e:
        print(f"❌ Error in transcription_complete: {str(e)}")
        return jsonify({"error": f"Invalid transcription data: {str(e)}"}), 400


def analyze_and_store_report(transcription, user_id):
    try:
        report_data = analyze_report(transcription)
        timestamp = firestore.SERVER_TIMESTAMP
        user_ref = db.collection("users").document(user_id)

        # Check if user exists
        if not user_ref.get().exists:
            print(f"⚠️ User with ID {user_id} not found in Firestore!")
            return {"error": f"User with ID: {user_id} not found"}

        # Store report under 'reports' collection
        report_ref = user_ref.collection("reports").add({
            "transcription": transcription,
            "diseases": report_data["diseases"],
            "call_logistics": report_data["call_logistics"],
            "timestamp": timestamp
        })

        print(f"✅ Report successfully stored! Report ID: {report_ref.id}")
        return {"message": "Report successfully stored", "report_id": report_ref.id}

    except Exception as e:
        print(f"❌ Error storing report: {str(e)}")
        return {"error": f"Failed to store report: {str(e)}"}


@app.route('/server', methods=['POST', 'GET', 'OPTIONS'])
def server():
    return jsonify({'message': 'Server OK'})

@app.route("/update_twilio_webhook", methods=["GET"], endpoint="update_twilio_webhook")
def update_twilio_webhook():
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels")
        data = response.json()
        
        if "tunnels" not in data or not data["tunnels"]:
            return jsonify({"error": "Ngrok tunnel not found"}), 500
        
        ngrok_url = data["tunnels"][0]["public_url"]
        print(f"🌍 Ngrok URL detected: {ngrok_url}")

        twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/{TWILIO_PHONE_NUMBER_SID}.json"
        payload = {"VoiceUrl": f"{ngrok_url}/answer"}
        auth_credentials = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        twilio_response = requests.put(twilio_url, data=payload, auth=auth_credentials)
        
        return jsonify({
            "message": f"✅ Twilio Webhook Updated: {ngrok_url}/answer",
            "status_code": twilio_response.status_code
        })

    except Exception as e:
        return jsonify({"error": f"⚠️ Error updating Twilio webhook: {str(e)}"}), 500

@app.route("/api/check-phone", methods=["POST"])
def check_phone():
    data = request.get_json()
    phone = data.get("phone")
    if not phone:
        return jsonify({"error": "Phone number is required"}), 400

    try:
        users_ref = db.collection("users")
        query_ref = users_ref.where("phoneNumber", "==", phone).limit(1).get()
        exists = len(query_ref) > 0
        user_id = query_ref[0].id if exists else None
        return jsonify({"exists": exists, "userId": user_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    phone = data.get("phone")
    firstName = data.get("firstName")
    lastName = data.get("lastName")
    dob = data.get("dob")
    email = data.get("email")
    
    if not all([phone, firstName, lastName, dob, email]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        doc_ref = db.collection("users").add({
            "phoneNumber": phone,
            "personal": {
                "firstName": firstName,
                "lastName": lastName,
                "dob": dob,
                "email": email
            }
        })
        user_id = doc_ref[1].id
        return jsonify({"message": "User created", "userId": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# The endpoints for sending and verifying SMS codes are no longer needed
# since the verification is handled on the client-side via Firebase's JS SDK.
# You may remove or comment out these endpoints.

# @app.route("/api/send-code", methods=["POST"])
# def send_code():
#     return jsonify({"error": "This endpoint is deprecated. Use Firebase JS SDK on the client."}), 400

# @app.route("/api/verify-code", methods=["POST"])
# def verify_code():
#     return jsonify({"error": "This endpoint is deprecated. Use Firebase JS SDK on the client."}), 400

@app.route("/home", methods=['POST'])
def home():
    try:
        data = request.json

        if not data or 'uid' not in data:
            return jsonify({'error':'Missing data or user ID'}), 400

        user_id = data.get('uid')
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            return jsonify({'error': f"User with ID: {user_id} does not exist"})
        
        user_data = user_doc.to_dict()

        calls_ref = user_ref.collection('transcriptions')
        calls = calls_ref.stream()

        try:
            calls_list = sorted(
                [doc.to_dict() for doc in calls],
                key=lambda call: call['timestamp'],
                reverse=True
            )
        except Exception as e:
            return jsonify({'error':f'Calls list error {str(e)}'})

        reports_ref = user_ref.collection('reports')
        reports = reports_ref.stream()
        reports_list = [
            doc.to_dict() for doc in reports
        ]

        return jsonify({'message': 'Fetched user data successfully', 'uid': user_id, 'userData': user_data, 'calls':calls_list, 'reports': reports_list})
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/change-lang', methods=['POST'])
def change_lang():
    try:
        data = request.json
        if not data or 'newLang' not in data or 'uid' not in data:
            return jsonify({'error':'Missing data or new language'}), 400

        new_lang = data.get('newLang')
        user_id = data.get('uid')
        user_ref = db.collection('users').document(user_id)
        user_ref.update({'lang': new_lang})
        return jsonify({'message':'Received', 'uid': user_id, 'newLang': new_lang}), 200
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
