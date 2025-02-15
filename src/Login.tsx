import React from 'react';
import './Login.css';

interface LoginProps {
    loginUrl: string;
}

const Login: React.FC<LoginProps> = ({ loginUrl }) => {
    return (
        <div className="login-page">
            <div className="background-animation"></div>

            <div className="content-container">
                <h1 className="main-heading">Visualize Your GSR Data</h1>
                <p className="sub-heading">See how your emotions sync with your favorite music in real-time.</p>

                <div className="login-container">
                    <div className="login-box">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg" 
                            alt="Spotify Logo" 
                            className="spotify-logo" 
                        />
                        <h2 className="login-heading">Login to Connect with Spotify</h2>
                        <p>Unlock your GSR-based music analytics and discover how your body reacts to sound.</p>
                        <a href={loginUrl} className="login-button">Login with Spotify</a>

                        <div className="animated-text">
                            <span>🎵 Sync your music with emotions.</span>
                            <span>📊 Track GSR responses in real-time.</span>
                            <span>💡 Gain insights from your body's reaction.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;