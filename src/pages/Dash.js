import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../css/Dash.css'
import CallCard from '../components/CallCard'
import ReportCard from '../components/ReportCard'
import LanguageSelector from '../components/LanguageSelector'
import Contact from '../components/Contact'
import { API_BASE_URL, languageSettings } from '../config';

export default function Dash() {
    // TODO:
    // fetch user language from database
    const [language, setLanguage] = useState('')
    const [userData, setUserData] = useState({})
    const [calls, setCalls] = useState([])
    const [reports, setReports] = useState([])
    const { uid } = useParams()
    console.log(uid)

    useEffect(() => {
        const fetchUserData = async() => {
            try {
                const response = await fetch(`${API_BASE_URL}/home`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',

                    },
                    body: JSON.stringify({ uid })
                })

                const result = await response.json()

                if (response.ok) {
                    console.log(result)
                    setLanguage(result.userData.lang)
                    setUserData(result.userData.personal)
                    setCalls(result.calls)
                    setReports(result.reports)
                }
            } catch (error) {
                console.log(error)
            }
        }

        fetchUserData()
    }, [uid])

    const updateLang = async(newLang) => {
        try {
            const response = await fetch(`${API_BASE_URL}/change-lang`, {
                method: 'POST',
                headers: {
                    'Content-Type':'application/json'
                }, 
                body: JSON.stringify({ uid, newLang })
            })

            const result = await response.json()
            if (response.ok) {
                console.log(result)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const getAge = (dob) => {
        const bDate = new Date(dob)
        const today = new Date()

        let age = today.getFullYear() - bDate.getFullYear()
        const monthDiff = today.getMonth() - bDate.getMonth()
        const dayDiff = today.getDate() - bDate.getDate()

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--
        }

        return age
    }

    return (
        <div className='dashboard-container'>
            <div className='dashboard-card'>
                <div className='dashboard-header'>
                    <div className='header-left'>
                        {languageSettings[language]?.Home || 'Home'}
                    </div>
                    <div className='header-right'>
                        <LanguageSelector language={language} setLanguage={setLanguage} updateLang={updateLang} />
                        <Contact language={language} />
                    </div>
                </div>
                <div className='dashboard-content'>
                    <div className="profile-section">
                        <div className="profile-image"></div> {/* fetch from server */}
                        <div className="profile-info">
                            <h2>{userData.firstName} {userData.lastName}</h2>
                            <p><strong>{languageSettings[language]?.Age || 'Age'}:</strong>{getAge(userData.dob)}</p>
                            <p>Sarah has been a patient since January 2023. She is currently undergoing treatment for anxiety and depression. Her progress has been steady, with significant improvements noted in the last three months.</p>
                            <div className="badges">   {/* replace with 'Schedule a Visit' btn */}
                                <span className="badge active">Active Patient</span>
                                <span className="badge weekly">Weekly Sessions</span>
                            </div>
                        </div>
                    </div>
                    <hr className="divider" />
                    <div className="main-sections">
                        <div className="left-section">
                            <h3><span className="material-icons">call</span>{languageSettings[language]?.Call_Records || 'Calls Made'}</h3>
                            {calls.length > 0 ? (
                                <div>
                                    {calls.map((call, index) => (
                                        
                                        <CallCard key={index} date={call.timestamp} duration="15" transcription={call.transcription} fName={userData.firstName} language={language} />
                                    ))}
                                </div>
                            ) : (
                                <h2>No calls yet</h2>
                            )}
                        </div>
                        <div className="right-section">
                            <h3><span className="material-icons">description</span>{languageSettings[language]?.Reports || 'Reports'}</h3>
                            <ReportCard language={language}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}