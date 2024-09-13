import { useEffect, useState } from 'react';
import axios from 'axios';
import { loginUrl } from './spotifyAuth'; // Assuming you have this in another file

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [playlists, setPlaylists] = useState<any[]>([]); // Store playlists
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null); // Store selected playlist object
    const [playlistTracks, setPlaylistTracks] = useState<any[]>([]); // Store tracks of the selected playlist

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

    // Retrieve token from URL hash or localStorage
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
    }, []);

    // Fetch Spotify user profile data and playlists once token is available
    useEffect(() => {
        if (token) {
            // Fetch user profile data
            axios
                .get('https://api.spotify.com/v1/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((response) => {
                    setUserData(response.data);
                    console.log('User data fetched:', response.data); // Debug log for user data
                })
                .catch((error) => {
                    console.error('Error fetching user data:', error);
                    window.localStorage.removeItem('spotify_token'); // Clear token if error occurs
                    window.location.href = loginUrl; // Redirect to login again
                });

            // Fetch user's playlists
            axios
                .get('https://api.spotify.com/v1/me/playlists', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((response) => {
                    setPlaylists(response.data.items); // Store playlists
                    console.log('User playlists fetched:', response.data.items); // Debug log for playlists
                })
                .catch((error) => {
                    console.error('Error fetching playlists:', error);
                });
        }
    }, [token]);

    // Fetch tracks of the selected playlist
    useEffect(() => {
        if (selectedPlaylist && token) {
            axios
                .get(`https://api.spotify.com/v1/playlists/${selectedPlaylist.id}/tracks`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((response) => {
                    setPlaylistTracks(response.data.items); // Store playlist tracks
                    console.log('Playlist tracks fetched:', response.data.items); // Debug log for tracks
                })
                .catch((error) => {
                    console.error('Error fetching playlist tracks:', error);
                });
        }
    }, [selectedPlaylist, token]);

    // Initialize Spotify Web Playback SDK and transfer playback to this device
    useEffect(() => {
        if (token) {
            window.onSpotifyWebPlaybackSDKReady = () => {
                const player = new window.Spotify.Player({
                    name: 'React Web Player',
                    getOAuthToken: (cb: any) => {
                        cb(token);
                    },
                    volume: 0.5,
                });

                // Playback state listeners
                player.on('player_state_changed', (state: any) => {
                    if (!state) return;
                    console.log('Player state changed:', state); // Debug log for player state changes
                    setCurrentTrack(state.track_window.current_track);
                    setIsPaused(state.paused);
                });

                // Error handling
                player.on('initialization_error', ({ message }: any) => {
                    console.error('Initialization error:', message);
                });
                player.on('authentication_error', ({ message }: any) => {
                    console.error('Authentication error:', message);
                    window.localStorage.removeItem('spotify_token'); // Clear token on authentication error
                    window.location.href = loginUrl; // Redirect to login again
                });
                player.on('account_error', ({ message }: any) => {
                    console.error('Account error:', message);
                });
                player.on('playback_error', ({ message }: any) => {
                    console.error('Playback error:', message);
                });

                // When the player is ready, set the device ID and transfer playback
                player.on('ready', ({ device_id }: any) => {
                    console.log('Player is ready with device ID', device_id);
                    setDeviceId(device_id);
                });

                // Connect the player
                player.connect().then((success: boolean) => {
                    if (success) {
                        console.log('The Web Playback SDK successfully connected to Spotify!');
                    }
                });

                setPlayer(player);
            };
        }
    }, [token]);

    // Function to handle play/pause functionality
    const handlePlayPause = () => {
        if (player) {
            if (isPaused) {
                player.resume().then(() => {
                    console.log('Playback resumed');
                    setIsPaused(false); // Update state to reflect playback resumed
                });
            } else {
                player.pause().then(() => {
                    console.log('Playback paused');
                    setIsPaused(true); // Update state to reflect playback paused
                });
            }
        }
    };

    // Function to play the first track of the selected playlist
    const handlePlayPlaylist = () => {
        if (playlistTracks.length > 0 && deviceId && token) {
            const uris = playlistTracks.map((track: any) => track.track.uri); // Get URIs of all tracks

            // Ensure playback is transferred to the web player device
            axios
                .put(
                    `https://api.spotify.com/v1/me/player`,
                    {
                        device_ids: [deviceId], // Transfer playback to this device
                        play: true, // Start playback immediately
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
                .then(() => {
                    // Play the first track of the selected playlist
                    axios
                        .put(
                            `https://api.spotify.com/v1/me/player/play`,
                            {
                                uris: [uris[0]], // Play the first track
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        )
                        .then(() => {
                            console.log('Playing first track of selected playlist');
                        })
                        .catch((error) => console.error('Error starting playback:', error));
                })
                .catch((error) => console.error('Error transferring playback:', error));
        }
    };

    return (
        <div>
            <h1>Spotify Web API + React</h1>
            {!token ? (
                <button onClick={() => (window.location.href = loginUrl)}>
                    Login with Spotify
                </button>
            ) : (
                <>
                    <p>Logged in with token: {token}</p>
                    {userData && (
                        <div>
                            <h2>User Profile</h2>
                            <p>Name: {userData.display_name}</p>
                            <p>Email: {userData.email}</p>
                            {userData.images[0] && <img src={userData.images[0].url} alt="Profile" />}
                        </div>
                    )}

                    {playlists.length > 0 ? (
                        <div>
                            <h2>Your Playlists</h2>
                            <ul>
                                {playlists.map((playlist) => (
                                    <li
                                        key={playlist.id}
                                        onClick={() => setSelectedPlaylist(playlist)} // Set selected playlist object
                                    >
                                        <p>{playlist.name}</p>
                                        <img
                                            src={playlist.images[0]?.url}
                                            alt="Playlist cover"
                                            width={100}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>No playlists found</p>
                    )}

                    {selectedPlaylist && (
                        <div>
                            <h2>Selected Playlist: {selectedPlaylist.name}</h2>
                            <button onClick={handlePlayPlaylist}>Play Playlist</button>
                        </div>
                    )}

                    {currentTrack ? (
                        <div>
                            <h2>Now Playing</h2>
                            <p>
                                {currentTrack.name} by{' '}
                                {currentTrack.artists.map((artist: any) => artist.name).join(', ')}
                            </p>
                            <img
                                src={currentTrack.album.images[0].url}
                                alt="Album Art"
                                width={100}
                            />
                            <button onClick={handlePlayPause}>
                                {isPaused ? 'Play' : 'Pause'}
                            </button>
                        </div>
                    ) : (
                        <p>No track is currently playing</p>
                    )}
                </>
            )}
        </div>
    );
}

export default App;