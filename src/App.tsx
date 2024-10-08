import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { loginUrl } from './spotifyAuth';
import './App.css'; // Assuming you have this file for styling
import SerialDataComponent from './SerialDataComponent'; // Importing the new Serial Data component

function App() {
    // Spotify-related state variables
    const [token, setToken] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Dynamically load Spotify Web Playback SDK
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Token retrieval and simulated login handling
    useEffect(() => {
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
        setIsLoggedIn(!!_token);
    }, []);

    // Fetch Spotify user data and playlists
    useEffect(() => {
        if (token) {
            axios
                .get('https://api.spotify.com/v1/me', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((response) => setUserData(response.data))
                .catch((error) => console.error('Error fetching user data:', error));

            axios
                .get('https://api.spotify.com/v1/me/playlists', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((response) => setPlaylists(response.data.items))
                .catch((error) => console.error('Error fetching playlists:', error));
        }
    }, [token]);

    // Fetch tracks for the selected playlist
    useEffect(() => {
        if (selectedPlaylist && token) {
            axios
                .get(`https://api.spotify.com/v1/playlists/${selectedPlaylist.id}/tracks`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((response) => setPlaylistTracks(response.data.items))
                .catch((error) => console.error('Error fetching playlist tracks:', error));
        }
    }, [selectedPlaylist, token]);

    // Transfer playback to the correct device
    const transferPlaybackToDevice = (device_id: string) => {
        if (token && device_id) {
            axios
                .put(
                    'https://api.spotify.com/v1/me/player',
                    {
                        device_ids: [device_id],
                        play: true,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                )
                .then(() => {
                    console.log(`Transferred playback to device ${device_id}`);
                })
                .catch((error) => {
                    console.error('Error transferring playback:', error);
                });
        }
    };

    // Initialize Spotify Web Playback SDK and transfer playback to this device
    useEffect(() => {
        if (token) {
            window.onSpotifyWebPlaybackSDKReady = () => {
                const player = new window.Spotify.Player({
                    name: 'React Web Player',
                    getOAuthToken: (cb: any) => cb(token),
                    volume: 0.5,
                });

                player.on('player_state_changed', (state: any) => {
                    if (!state) return;
                    setCurrentTrack(state.track_window.current_track);
                    setIsPaused(state.paused);
                });

                player.on('ready', ({ device_id }: any) => {
                    setDeviceId(device_id);
                    transferPlaybackToDevice(device_id); // Transfer playback to Web Player
                });

                player.connect().then((success: boolean) => {
                    if (success) console.log('Web Playback SDK connected to Spotify');
                });

                setPlayer(player);
            };
        }
    }, [token]);

    // Function to handle play/pause functionality
    const handlePlayPause = () => {
        if (player) {
            if (isPaused) {
                player.resume().then(() => setIsPaused(false));
            } else {
                player.pause().then(() => setIsPaused(true));
            }
        }
    };

    // Function to play the selected playlist
    const handlePlayPlaylist = () => {
        if (playlistTracks.length > 0 && deviceId && token) {
            const uris = playlistTracks.map((track: any) => track.track.uri);
            axios.put(
                `https://api.spotify.com/v1/me/player/play`,
                {
                    uris: [uris[0]], // Modify to play the whole playlist
                    device_id: deviceId, // Ensure playback happens on the Web Player
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
                .then(() => {
                    console.log('Playback started on Web Player');
                })
                .catch((error) => console.error('Error starting playback:', error));
        }
    };

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
                    {!isLoggedIn ? (
                        <div className="auth-buttons">
                            <a href={loginUrl} className="signup-button">Sign up</a>
                            <a href={loginUrl} className="login-button">Log in</a>
                        </div>
                    ) : (
                        <p>{userData?.display_name}</p>
                    )}
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
                                <li key={playlist.id} onClick={() => setSelectedPlaylist(playlist)}>
                                    <img src={playlist.images[0]?.url} alt={playlist.name} className="playlist-image" />
                                    {playlist.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="main-content">
                {selectedPlaylist && (
                    <div>
                        <h2>Selected Playlist: {selectedPlaylist.name}</h2>
                        <button onClick={handlePlayPlaylist}>Play Playlist</button>
                    </div>
                )}

                {currentTrack && (
                    <div>
                        <h2>Now Playing</h2>
                        <p>{currentTrack.name} by {currentTrack.artists.map((artist: any) => artist.name).join(', ')}</p>
                        <img src={currentTrack.album.images[0].url} alt="Album Art" width={100} />
                        <button onClick={handlePlayPause}>
                            {isPaused ? 'Play' : 'Pause'}
                        </button>
                    </div>
                )}
            </div>

            {/* Arduino Serial Data Component */}
            <SerialDataComponent />

            {/* Footer (bottom bar for music player) */}
            {isLoggedIn && currentTrack && (
                <div className="bottom-player">
                    <div className="controls">
                        <button>Shuffle</button>
                        <button>Previous</button>
                        <button onClick={handlePlayPause}>{isPaused ? 'Play' : 'Pause'}</button>
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




