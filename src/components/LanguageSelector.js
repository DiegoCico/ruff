import React, {useState} from 'react';
import '../css/LanguageSelector.css'

export default function LanguageSelector() {
    const [language, setLanguage] = useState("English")
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