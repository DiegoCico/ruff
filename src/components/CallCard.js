import React from 'react';
import '../css/CallCard.css'

export default function CallCard({ date, time, duration}) {
    return (
        <div className="call-card">
            <div className="call-duration">{duration} min</div>
            <div className="call-details">
                <h4><span className="material-icons call-icon">event</span> {date}</h4>
                <p><span className="material-icons call-icon">schedule</span> {time} • {duration} min</p>
                <p className="transcript-link"><span className="material-icons transcript-icon">description</span> Get transcript of call</p>
            </div>
        </div>
    )
}   