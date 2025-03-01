import React, { useState } from 'react';
import { languageSettings } from '../config'
import '../css/Contact.css'

export default function Contact({ language }) {
    const [showPopup, setShowPopup] = useState(false)
    return (
        <div className="make-call-container">
            <button className="make-call-button" onClick={() => setShowPopup(true)}>
                <span className="material-icons">call</span> {languageSettings[language]?.Contact_Us || 'Contact Us'}
            </button>
            {showPopup && (
                <div className="call-popup-overlay">
                    <div className="call-popup">
                        <div className="call-popup-content">
                            <div className="call-popup-left">
                                <h4>{languageSettings[language]?.Make_A_Call || 'Make A Call'}</h4>
                                <p><strong>+1 (800) 123-4567</strong></p>
                                <button className="call-now">Call Now</button>
                            </div>
                            <div className="call-popup-right">
                                <h4>Text Our Chatbot</h4>
                                <button className="chat-now">{languageSettings[language]?.Chat_With_Ruff || 'Chat With Ruff'}</button>
                            </div>
                        </div>
                        <button className="close-popup" onClick={() => setShowPopup(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}