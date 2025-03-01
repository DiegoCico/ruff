import React, { useState, useEffect } from 'react';
import {API_BASE_URL} from '../config'

export default function ServerTest() {
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const serverConnect = async() => {
            try {
                const connect = await fetch(`${API_BASE_URL}/server`,
                    {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                    }
                )
                if (connect.ok) {
                    const response = await connect.json()
                    setMessage(response.message)
                }
            } catch (error) {
                setError(error.message)
            }
        }

        serverConnect()
    }, [])

    return (
        <div>
            {error ? (
                <div className='error-cont'>
                    <h2>{error}</h2>
                </div>
            ) : (
                <div className='message-cont'>
                    <h2>{message}</h2>
                </div>
            )}
        </div>
    )
}