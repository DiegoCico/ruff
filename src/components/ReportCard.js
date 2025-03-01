import React from 'react';
import '../css/ReportCard.css'
import { languageSettings } from '../config'

export default function ReportCard({ language }) {
    return (
        <div className="report-card">
            <div className="report-details">
                <h4>{title}</h4>
                <p><span className="material-icons report-icon">event</span> {date}</p>
                <button className="view-report">{languageSettings[language]?.View_Report || 'View Report'}</button>
            </div>
            <span className={`report-status`}>status</span>
        </div>
    )
}