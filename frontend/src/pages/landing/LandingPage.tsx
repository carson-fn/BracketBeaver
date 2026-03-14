import React, { useState } from 'react'
import { callHelloAPI } from '../../api/helloApi.ts'
import './styles/landingStyles.css'

function LandingPage() {
    const [message, setMessage] = useState("")

    const handleClick = async ()=> {
        setMessage(await callHelloAPI());
    }

    return (
        <div className='landing-page'>
            <h1 className='landing-title'>Bracket Beaver</h1>
            <h3 className='landing-subtitle'>Your go-to tournament generator!</h3>

            <button className='landing-button' onClick={handleClick}>
                Call Hello API
            </button>

            <p className='landing-message'>{message}</p>
        </div>
    )
}

export default LandingPage