import React from 'react';
import '../css/ReportCard.css';
import { languageSettings } from '../config';
import { jsPDF } from 'jspdf';

export default function ReportCard({ language, report }) {
    const generateMedicalReportPDF = (reportData) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width - 40; // Max text width (leaving margins)
        let yPos = 20; // Initial Y position
    
        // 🏥 **Title**
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Ruff Medical Insights Report", 20, yPos);
        yPos += 10;
    
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
        yPos += 15;
    
        // 📌 **Summary**
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Summary", 20, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
    
        if (reportData.diseases?.length > 0) {
            const summaryText = `Top Candidate Disease: ${reportData.diseases[0].name} (Confidence: ${reportData.diseases[0].confidence}, Probability: ${(reportData.diseases[0].probability * 100).toFixed(1)}%)`;
            const wrappedSummary = doc.splitTextToSize(summaryText, pageWidth);
            doc.text(wrappedSummary, 20, yPos);
            yPos += wrappedSummary.length * 6;
        } else {
            doc.text("No diseases detected.", 20, yPos);
            yPos += 10;
        }
    
        doc.text(`Overall Call Sentiment: ${reportData.call_logistics?.predominant_tone || "Unknown"}`, 20, yPos);
        yPos += 15;
    
        // 📊 **Call Sentiment Analysis**
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Call Sentiment Analysis", 20, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
    
        doc.text(`Negative Sentiment: ${(reportData.call_logistics?.sentiment_scores?.neg * 100 || 0).toFixed(1)}%`, 20, yPos);
        yPos += 8;
        doc.text(`Neutral Sentiment: ${(reportData.call_logistics?.sentiment_scores?.neu * 100 || 0).toFixed(1)}%`, 20, yPos);
        yPos += 8;
        doc.text(`Positive Sentiment: ${(reportData.call_logistics?.sentiment_scores?.pos * 100 || 0).toFixed(1)}%`, 20, yPos);
        yPos += 15;
    
        // 🏥 **Disease Predictions**
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Disease Predictions", 20, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
    
        if (reportData.diseases?.length > 0) {
            reportData.diseases.forEach((disease, index) => {
                doc.setFont("helvetica", "bold");
    
                // 🔹 **Bold Disease Title**
                const diseaseTitle = `${index + 1}. ${disease.name} (${disease.confidence} Confidence, Probability: ${(disease.probability * 100).toFixed(1)}%)`;
                const wrappedTitle = doc.splitTextToSize(diseaseTitle, pageWidth);
                doc.text(wrappedTitle, 20, yPos);
                yPos += wrappedTitle.length * 7;
    
                doc.setFont("helvetica", "normal");
    
                // 📜 **Description**
                let description = disease.description || "No description available.";
                const urlMatches = description.match(/\[url:(https?:\/\/[^\]]+)\]/g) || [];
                description = description.replace(/\[url:.*?\]/g, ""); // Remove URLs from description text
    
                const wrappedDescription = doc.splitTextToSize(`- ${description}`, pageWidth);
                doc.text(wrappedDescription, 20, yPos);
                yPos += wrappedDescription.length * 6;
    
                // ✅ **Clickable URLs (One per Bullet Point)**
                if (urlMatches.length > 0) {
                    doc.setFont("helvetica", "bold");
                    doc.text("Links:", 20, yPos);
                    yPos += 6;
                    doc.setFont("helvetica", "normal");
    
                    urlMatches.forEach((match) => {
                        let url = match.replace("[url:", "").replace("]", "").trim(); // Clean URL
    
                        if (!url.startsWith("http")) return; // Skip invalid URLs
    
                        console.log("Processed URL:", url); // 🔥 Debugging: Check if URLs are formatted correctly
    
                        doc.setTextColor(0, 0, 255); // Set blue color for links
                        doc.textWithLink(`• ${url}`, 20, yPos, { url }); // Bullet point with clickable link
                        yPos += 6; // Spacing for next URL
                    });
    
                    doc.setTextColor(0, 0, 0); // Reset text color to black
                }
    
                // 📌 **Pagination Handling**
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
            });
        } else {
            doc.text("No diseases identified.", 20, yPos);
            yPos += 10;
        }
    
        // 📎 **Footer**
        doc.setFontSize(10);
        doc.text("Generated by AI-Powered System | For further medical assistance, consult a professional.", 20, 280);
    
        // 📄 **Generate PDF and Open it**
        const pdfBlob = doc.output("blob");
        const pdfURL = URL.createObjectURL(pdfBlob);
        window.open(pdfURL, "_blank"); // Open PDF in a new tab
    };

    return (
        <div className="report-card">
            <div className="report-details">
                <h4>{report?.title || "Medical Report"}</h4>
                <p><span className="material-icons report-icon">event</span> {report?.timestamp || "Unknown Date"}</p>
                <button className="view-report" onClick={() => generateMedicalReportPDF(report)}>
                    {languageSettings[language]?.View_Report || 'View Report'}
                </button>
            </div>
            <span className="report-status">{report?.status || "Pending"}</span>
        </div>
    );
}
