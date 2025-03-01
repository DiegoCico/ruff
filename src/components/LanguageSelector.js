// import React, {useState} from 'react';
// import '../css/LanguageSelector.css'
// import { languageSettings } from '../config'

// export default function LanguageSelector({ language, setLanguage, updateLang }) {
//     const languages = [
//         languageSettings[language]?.English || "English", 
//         languageSettings[language]?.Portuguese || "Portuguese",
//         languageSettings[language]?.Spanish || "Spanish"
//     ]
//     const [showPopup, setShowPopup] = useState(false)
//     const [newLang, setNewLang] = useState("")

//     const handleLanguageChange = (e) => {
//         const selectedLang = e.target.value

//         if (selectedLang !== language) {
//             setNewLang(selectedLang)
//             setShowPopup(true)
//         }
//     }

//     const confirmLangChange = () => {
//         setLanguage(newLang)
//         setShowPopup(false)
//         updateLang(newLang)
//     }

//     return (
//         <div className="language-selector-container">
//             <div className="language-selector">
//                 <span className="material-icons">public</span>
//                 <select value={language} onChange={handleLanguageChange}>
//                     {languages.map((lang) => (
//                         <option key={lang} value={lang}>{lang}</option>
//                     ))}
//                 </select>
//             </div>

//             {showPopup && (
//                 <div className="language-popup-overlay">
//                     <div className="language-popup">
//                         <p>Are you sure you want to change the language to <strong>{newLang}</strong>?</p>
//                         <div className="popup-buttons">
//                             <button className="confirm-button" onClick={confirmLangChange}>Yes</button>
//                             <button className="cancel-button" onClick={() => setShowPopup(false)}>No</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     )
// }


import React, { useState } from "react";
import "../css/LanguageSelector.css";
import { languageSettings } from "../config";

export default function LanguageSelector({ language, setLanguage, updateLang }) {
    const [showPopup, setShowPopup] = useState(false)
    const [newLang, setNewLang] = useState("")

    const languageKeys = ["English", "Portuguese", "Spanish"]

    const handleLanguageChange = (e) => {
        const selectedLang = e.target.value

        if (selectedLang !== language) {
            setNewLang(selectedLang)
            setShowPopup(true)
        }
    }

    const confirmLangChange = () => {
        setLanguage(newLang)
        setShowPopup(false)
        updateLang(newLang)
    }

    return (
        <div className="language-selector-container">
            <div className="language-selector">
                <span className="material-icons">public</span>
                <select value={language} onChange={handleLanguageChange}>
                {languageKeys.map((lang) => (
                    <option key={lang} value={lang}>
                        {languageSettings[language]?.[lang] || lang}
                    </option>
                ))}
                </select>
            </div>

            {showPopup && (
                <div className="language-popup-overlay">
                    <div className="language-popup">
                        <p>
                            {languageSettings[language]?.Confirm_Change || "Are you sure you want to change the language to"} <strong>{languageSettings[language]?.[newLang] || newLang}</strong>?
                        </p>
                        <div className="popup-buttons">
                            <button className="confirm-button" onClick={confirmLangChange}>
                                {languageSettings[language]?.Yes || "Yes"}
                            </button>
                            <button className="cancel-button" onClick={() => setShowPopup(false)}>
                                {languageSettings[language]?.No || "No"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
