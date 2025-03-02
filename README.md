# Ruff - Medical Symptom Analysis and Call Handling

## Purpose
Ruff is an AI-powered medical symptom analysis and call-handling system designed to assist individuals in assessing their symptoms through voice interactions. By leveraging natural language processing and sentiment analysis, Ruff aims to provide users with insights into potential health conditions and direct them to appropriate medical resources.

## Features
- **Twilio Integration**: Handles incoming calls via the Twilio number **+1 833 365 8247**, records responses, and transcribes them.
- **AI Symptom Analysis**: Uses NLP and fuzzy string matching to identify potential diseases.
- **Sentiment Analysis**: Determines the tone of the call using VADER sentiment analysis.
- **Named Entity Recognition**: Extracts relevant details like dates, locations, and numbers from descriptions.
- **Firebase Integration**: Stores user call records, transcriptions, and analyzed reports.
- **Web App with React**: Provides a frontend dashboard for users to view their call history, reports, and schedule appointments.
- **Multilingual Support**: Currently available in **English, Spanish, and Portuguese** to assist a wider range of users.

## Technologies Used
### Backend (Flask API)
- Python
- Flask
- Twilio API
- Firebase Admin SDK
- NLTK (Natural Language Toolkit)
- SpaCy
- RapidFuzz (Fuzzy Matching)
- Matplotlib (Data Visualization)

### Frontend (React App)
- ReactJS
- Firebase Authentication
- Tailwind CSS
- jsPDF (for PDF generation)
- React Router

## Usage
### Handling Calls
- A user calls the Twilio number **+1 833 365 8247**.
- The system records and transcribes the call.
- The transcription is analyzed for symptoms and sentiment.
- A report is generated and stored in Firebase.

### Viewing Reports
- Users log into the React dashboard.
- They can view past call logs, medical analysis reports, and sentiment evaluations.
- The system provides a probability-based analysis of possible medical conditions.
- Users can download their reports as PDFs.

## API Endpoints
### Call Handling
- `POST /answer` - Answers an incoming call and starts recording.
- `POST /recording_complete` - Saves the recording URL in Firebase.
- `POST /transcription_complete` - Analyzes the transcription and stores a report.

### User Management
- `POST /api/check-phone` - Checks if a phone number exists in the database.
- `POST /api/signup` - Creates a new user with personal details.
- `POST /api/change-lang` - Updates the user’s preferred language.

### Webhook Management
- `GET /update_twilio_webhook` - Updates Twilio webhook with the latest Ngrok tunnel URL.

## Future Work
- **Multilingual Support**: Expand language capabilities to cater to a broader audience.
- **Integration with Healthcare Providers**: Enable direct booking of medical appointments.
- **Enhanced AI Diagnosis**: Improve the NLP model with deep learning for better accuracy.
- **Voice-Based Assistant**: Implement a conversational AI to guide users in real time.
- **Emergency Services Integration**: Automatically detect severe symptoms and provide emergency contact options.

This project is continuously evolving, with ongoing efforts to enhance its accuracy, usability, and accessibility.

