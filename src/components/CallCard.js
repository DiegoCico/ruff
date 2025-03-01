import React from 'react';
import '../css/CallCard.css';
import { jsPDF } from 'jspdf'
import { languageSettings } from '../config'

export default function CallCard({ date, duration, transcription, fName, language }) {
    const formatDate = (timestamp) => {
        if (!timestamp) {
            return { formattedDate: "Invalid Date", formattedTime: "Invalid Time" }
        }

        const parsedDate = new Date(timestamp);

        if (isNaN(parsedDate.getTime())) {
            console.error("Failed to parse timestamp:", timestamp);
            return { formattedDate: "Invalid Date", formattedTime: "Invalid Time" }
        }

        const formattedDate = parsedDate.toLocaleDateString("en-US", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "America/New_York",
        })

        const formattedTime = parsedDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "America/New_York",
            timeZoneName: "short",
        })

        return { formattedDate, formattedTime };
    }

    const { formattedDate, formattedTime } = formatDate(date)

    const generatePDF = () => {
        const doc = new jsPDF()
        
        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.text(`Call Transcript for ${fName}`, 20, 20)
        
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(`Date: ${formattedDate}`, 20, 40)
        doc.text(`Time: ${formattedTime}`, 20, 50)
        doc.text(`Duration: ${duration} min`, 20, 60)
        
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Transcript:", 20, 80)

        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(transcription || "No transcript available.", 20, 90, { maxWidth: 170 })

        const pdfURL = doc.output("bloburl")
        window.open(pdfURL, "_blank")
    }

    return (
        <div className="call-card">
            {/* <div className="call-duration">{duration} min</div> */}
            <div className="call-details">
                <h4><span className="material-icons call-icon">event</span> {formattedDate}</h4>
                <p><span className="material-icons call-icon">schedule</span> {formattedTime} • {duration} min</p>
                <p className="transcript-link" onClick={generatePDF}>
                    <span className="material-icons transcript-icon">description</span>{languageSettings[language]?.Get_Transcript || 'Get transcript of call'}
                </p>
            </div>
        </div>
    );
}
