import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuickStart.css';

const QuickStart: React.FC = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/main');
    };

    return (
        <div className="text-card">
            {/* Title & Subheading */}
            <h1 className="main-heading">Quickstart Guide!</h1>
            <p className="sub-heading">Follow these simple steps to track your stress levels while listening to music.</p>

            {/* Static Text */}
            <div className="static-text">
                <span>Track Stress</span>
                <span>|</span>
                <span>Listen to Music</span>
                <span>|</span>
                <span>Analyze Results</span>
            </div>

            {/* Steps in Cards */}
            <div className="cards-container">
                <div className="card">
                    <h2>Step 1</h2>
                    <p>Insert your fingers into the GSR box to measure your stress levels.</p>
                </div>

                <div className="card">
                    <h2>Step 2</h2>
                    <p>Choose your favorite music and start listening.</p>
                </div>

                <div className="card">
                    <h2>Step 3</h2>
                    <p>Analyze the data to see how your stress levels respond to different songs.</p>
                </div>
            </div>

            {/* Start Button */}
            <button onClick={handleGetStarted} className="start-button">
                Get Started ✔️
            </button>
        </div>
    );
};

export default QuickStart;