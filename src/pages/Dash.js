import React from 'react';
import '../css/Dash.css'

export default function Dash() {
    return (
        <div className='dashboard-container'>
            <div className='dashboard-card'>
                <div className='dashboard-header'>
                    Patient Home
                </div>
                <div className='dashboard-content'>
                    <div className="profile-section">
                        <div className="profile-image"></div> {/* fetch from server */}
                        <div className="profile-info">
                            <h2>Sarah Johnson</h2>
                            <p><strong>Age:</strong> 34 years</p>
                            <p>Sarah has been a patient since January 2023. She is currently undergoing treatment for anxiety and depression. Her progress has been steady, with significant improvements noted in the last three months.</p>
                            <div className="badges">   {/* fetch from server */}
                                <span className="badge active">Active Patient</span>
                                <span className="badge weekly">Weekly Sessions</span>
                            </div>
                        </div>
                    </div>
                    <hr className="divider" />
                    <div className="main-sections">
                        <div className="left-section">
                            <h3><span className="material-icons">call</span>Calls Made</h3>
                            <CallCard date="March 15, 2025" time="10:30 AM" duration="15" />
                        </div>
                        <div className="right-section">
                            <h3><span className="material-icons">description</span>Reports</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}