// App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import SerialDataComponent from './SerialDataComponent';
import Login from './Login';
import QuickStart from './quickstart';
import SpotifyApp from './SpotifyApp';

// Spotify Authentication Config
const CLIENT_ID = 'bad35e9a5e774d3584043c601889c7ec';
const REDIRECT_URI = 'http://localhost:5173/callback';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES = encodeURIComponent([
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming'
].join(' '));

const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&show_dialog=true&scope=${SCOPES}&state=force_redirect`;

function App() {
    const [token, setToken] = useState<string | null>(() => {
        const hash = window.location.hash;
        const storedToken = sessionStorage.getItem('spotify_token');
        const urlToken = new URLSearchParams(hash.substring(1)).get('access_token');
        return urlToken || storedToken;
    });

    useEffect(() => {
        const hash = window.location.hash;
        const urlToken = new URLSearchParams(hash.substring(1)).get('access_token');
        
        if (urlToken) {
            setToken(urlToken);
            sessionStorage.setItem('spotify_token', urlToken);
            window.location.hash = '';
        }
    }, []);

    return (
        <Router>
            <Routes>
                <Route 
                    path="/" 
                    element={
                        token ? (
                            <Navigate to="/quickstart" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } 
                />
                <Route 
                    path="/login" 
                    element={
                        token ? (
                            <Navigate to="/quickstart" replace />
                        ) : (
                            <Login loginUrl={loginUrl} />
                        )
                    } 
                />
                <Route 
                    path="/quickstart" 
                    element={
                        token ? (
                            <QuickStart />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } 
                />
                <Route 
                    path="/main" 
                    element={
                        token ? (
                            <SpotifyApp token={token} />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } 
                />
                <Route 
                    path="/callback" 
                    element={<Navigate to="/quickstart" replace />} 
                />
            </Routes>
        </Router>
    );
}

export default App;