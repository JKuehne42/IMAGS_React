import { useEffect, useState } from 'react';
import axios from 'axios';
import { loginUrl } from './spotifyAuth';
import './App.css';

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [currentTrack, setCurrentTrack] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Token retrieval and simulated login handling
    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const token = new URLSearchParams(hash.substring(1)).get('access_token');
            setToken(token);
            setIsLoggedIn(!!token);
            window.location.hash = '';
        }
    }, []);

    // Fetch user data if token is available
    useEffect(() => {
        if (token) {
            // Fetch user data
            axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((response) => {
                    setUserData(response.data);
                })
                .catch((error) => console.error('Error fetching user data:', error));

            // Fetch user's playlists
            axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
                .then((response) => {
                    setPlaylists(response.data.items);
                })
                .catch((error) => console.error('Error fetching playlists:', error));
        }
    }, [token]);

    // Login button when user is not logged in
    const loginButton = (
        <div className="auth-buttons">
            <a href={loginUrl} className="signup-button">Sign up</a>
            <a href={loginUrl} className="login-button">Log in</a>
        </div>
    );

    return (
        <div className="spotify-layout">
            {/* Top Bar */}
            <div className="top-bar">
                <div className="top-left">
                    <img src="/spotify-logo.png" alt="Spotify Logo" className="spotify-logo" />
                </div>
                <div className="top-center">
                    <button className="home-button">Home</button>
                    <input type="text" className="search-bar" placeholder="What do you want to play?" />
                </div>
                <div className="top-right">
                    {!isLoggedIn ? loginButton : <p>{userData?.display_name}</p>}
                </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar">
                <h2>Your Library</h2>
                {isLoggedIn && playlists.length > 0 && (
                    <div className="playlists">
                        <h3>Your Playlists</h3>
                        <ul>
                            {playlists.map((playlist) => (
                                <li key={playlist.id}>
                                    <img src={playlist.images[0]?.url} alt={playlist.name} className="playlist-image" />
                                    {playlist.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Footer (bottom bar for music player) */}
            {isLoggedIn && currentTrack && (
                <div className="bottom-player">
                    <div className="controls">
                        <button>Shuffle</button>
                        <button>Previous</button>
                        <button>Play/Pause</button>
                        <button>Next</button>
                        <button>Repeat</button>
                    </div>
                    <div className="queue-and-volume">
                        <button>Queue</button>
                        <button>Connect to Device</button>
                        <button>Volume</button>
                        <button>Fullscreen</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
