import React from 'react';
import '../css/CallCard.css'

export default function CallCard({ date, time, duration}) {
    return (
        <div className='call-card'>
            <div className='card-details'>
            <h4><span className="material-icons">event</span> {date}</h4>
                <p><span className="material-icons">schedule</span> {time} • {duration} min</p>
                <p className="transcript-link"><span className="material-icons">description</span> Get transcript of call</p>
            </div>
        </div>
    )
}   