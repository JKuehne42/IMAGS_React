import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        // Get the token from the URL hash
        const hash = window.location.hash;
        let _token = window.localStorage.getItem('spotify_token');

        if (!_token && hash) {
            _token = new URLSearchParams(hash.substring(1)).get('access_token');
            window.location.hash = '';
            if (_token) {
                window.localStorage.setItem('spotify_token', _token);
                setToken(_token);
            }
        } else {
            setToken(_token);
        }
    }, []);

    useEffect(() => {
        // Fetch Spotify user profile data once token is available
        if (token) {
            axios
                .get('https://api.spotify.com/v1/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((response) => {
                    setUserData(response.data);
                })
                .catch((error) => console.error('Error fetching user data:', error));
        }
    }, [token]);

    const handleLogin = () => {
        window.location.href = loginUrl;
    };

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        <div>
                            <h1>Spotify Web API + React</h1>
                            {!token ? (
                                <button onClick={handleLogin}>Login with Spotify</button>
                            ) : (
                                <>
                                    <p>Logged in with token: {token}</p>
                                    {userData ? (
                                        <div>
                                            <h2>User Profile</h2>
                                            <p>Name: {userData.display_name}</p>
                                            <p>Email: {userData.email}</p>
                                            <img src={userData.images[0]?.url} alt="Profile" />
                                        </div>
                                    ) : (
                                        <p>Loading user data...</p>
                                    )}
                                </>
                            )}
                        </div>
                    }
                />
                <Route path="/callback" element={<Callback />} />
            </Routes>
        </Router>
    );
}

const Callback = () => {
    return <h2>Redirecting...</h2>;
};

export default App;

