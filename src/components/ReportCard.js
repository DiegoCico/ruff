import React from 'react';
import '../css/ReportCard.css'

export default function ReportCard({ title, date }) {
    return (
        <div className="report-card">
            <div className="report-details">
                <h4>{title}</h4>
                <p><span className="material-icons report-icon">event</span> {date}</p>
                <button className="view-report">View Report</button>
            </div>
            <span className={`report-status`}>status</span>
        </div>
    )
}