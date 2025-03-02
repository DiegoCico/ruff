import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../css/Dash.css';
import CallCard from '../components/CallCard';
import ReportCard from '../components/ReportCard';
import LanguageSelector from '../components/LanguageSelector';
import Contact from '../components/Contact';
import { API_BASE_URL, languageSettings } from '../config';

// Updated component to render call records as a contributions-style heatmap
function CallRecordsHeatmap({ calls }) {
    const today = new Date();
    const daysToShow = 90; // Show the last 90 days
    const dates = [];

    // Generate an array of date strings for the past 90 days (YYYY-MM-DD)
    for (let i = 0; i < daysToShow; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        dates.push(dateString);
    }
    dates.reverse();

    // Count calls per day based on the timestamp provided from Firebase
    const callCounts = {};
    calls.forEach(call => {
        const callDate = new Date(call.timestamp);
        const dateStr = callDate.toISOString().split('T')[0];
        callCounts[dateStr] = (callCounts[dateStr] || 0) + 1;
    });

    // Map call count to a color intensity (similar to GitHub's contributions graph)
    const getColor = (count) => {
        if (count === 0) return "#ebedf0";
        else if (count === 1) return "#c6e48b";
        else if (count === 2) return "#7bc96f";
        else if (count === 3) return "#239a3b";
        else return "#196127";
    };

    // Organize dates into weeks (columns) with each week as an array of 7 days.
    let weeks = [];
    const startDate = new Date(dates[0]);
    let currentWeek = new Array(startDate.getDay()).fill(null);
    dates.forEach(dateStr => {
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(dateStr);
    });
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    return (
        <div className="call-heatmap-container">
            <h3 className="heatmap-title">Call Records Frequency</h3>
            <div className="heatmap-grid">
                {weeks.map((week, i) => (
                    <div key={i} className="heatmap-week">
                        {week.map((date, j) => {
                            const count = date ? (callCounts[date] || 0) : 0;
                            return (
                                <div
                                    key={j}
                                    title={date ? `${date}: ${count} call${count !== 1 ? 's' : ''}` : ""}
                                    style={{
                                        backgroundColor: date ? getColor(count) : 'transparent',
                                        width: '20px',
                                        height: '10px',
                                        marginBottom: '2px'
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Dash() {
    const [language, setLanguage] = useState('');
    const [userData, setUserData] = useState({});
    const [calls, setCalls] = useState([]);
    const [reports, setReports] = useState([]);
    const { uid } = useParams();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/home`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ uid }),
                });

                const result = await response.json();

                if (response.ok) {
                    setLanguage(result.userData.lang);
                    setUserData(result.userData.personal);
                    setCalls(result.calls);
                    setReports(result.reports);
                }
            } catch (error) {
                console.log(error);
            }
        };

        fetchUserData();
    }, [uid]);

    const updateLang = async (newLang) => {
        try {
            const response = await fetch(`${API_BASE_URL}/change-lang`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ uid, newLang }),
            });

            const result = await response.json();
            if (response.ok) {
                console.log(result);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const getAge = (dob) => {
        const bDate = new Date(dob);
        const today = new Date();

        let age = today.getFullYear() - bDate.getFullYear();
        const monthDiff = today.getMonth() - bDate.getMonth();
        const dayDiff = today.getDate() - bDate.getDate();

        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
        }

        return age;
    };

    const handleScheduleAppointment = () => {
        window.location.href = "https://www.bmc.org/make-appointment";
    };

    const handleFindClosestER = () => {
        window.open("https://www.google.com/maps/search/?api=1&query=emergency+room+near+me", "_blank");
    };

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
                            <p>
                                <strong>{languageSettings[language]?.Age || 'Age'}:</strong>
                                {getAge(userData.dob)}
                            </p>
                            {/* Call Records Contributions heatmap */}
                            <CallRecordsHeatmap calls={calls} />
                            <div className="action-buttons">
                                <button className="btn schedule-appointment" onClick={handleScheduleAppointment}>
                                    Schedule Hospital Appointment
                                </button>
                                <button className="btn closest-er" onClick={handleFindClosestER}>
                                    Find Closest ER
                                </button>
                            </div>
                        </div>
                    </div>
                    <hr className="divider" />
                    <div className="main-sections">
                        <div className="left-section">
                            <h3>
                                <span className="material-icons">call</span>
                                {languageSettings[language]?.Call_Records || 'Calls Made'}
                            </h3>
                            {calls.length > 0 ? (
                                <div>
                                    {calls.map((call, index) => (
                                        <CallCard 
                                            key={index} 
                                            date={call.timestamp} 
                                            duration="15" 
                                            transcription={call.transcription} 
                                            fName={userData.firstName} 
                                            language={language} 
                                        />
                                    ))}
                                </div>
                            ) : (
                                <h2>No calls yet</h2>
                            )}
                        </div>
                        <div className="right-section">
                            <h3>
                                <span className="material-icons">description</span>
                                {languageSettings[language]?.Reports || 'Reports'}
                            </h3>
                            {reports.length > 0 ? (
                                <div>
                                    {reports.map((report, index) => (
                                        <ReportCard key={index} language={language} report={report} />
                                    ))}
                                </div>
                            ) : (
                                <h2>No reports yet</h2>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
