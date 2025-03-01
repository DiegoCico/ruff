import React from 'react';
import '../css/LanguageSelector.css'

export default function LanguageSelector({ language, setLanguage }) {
    const languages = ["English", "Portuguese", "Spanish"]

    return (
        <div className="language-selector">
            <span className="material-icons">public</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {languages.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                ))}
            </select>
        </div>
    )
}