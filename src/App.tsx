
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; // Assuming you have this file for styling
import SerialDataComponent from './SerialDataComponent'; // Importing the Arduino GSR component

// Configuration for Spotify authentication
const CLIENT_ID = 'bad35e9a5e774d3584043c601889c7ec'; // Your Spotify client ID 
const REDIRECT_URI = 'http://localhost:5173/callback'; // Your app's redirect URI
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming', // Required for Web Playback SDK
].join('%20');

// Build the Spotify login URL
const loginUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&show_dialog=true&scope=${SCOPES}`;

function App() {
    const [token, setToken] = useState<string | null>(null);
    const [player, setPlayer] = useState<any>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null); // Track the device ID
    const [isPaused, setIsPaused] = useState(true);
    const [isPlayerConnected, setIsPlayerConnected] = useState(false); // Track player connection status
    const [currentTrack, setCurrentTrack] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
    const [searchedTracks, setSearchedTracks] = useState<any[]>([]);

    // Get the Spotify access token from the URL after login
    useEffect(() => {
        let urlReturnedToken = null; //assume the url hasn't returned a token (until we find it)
        let hash = window.location.hash; //does the URL have any hash info (where we would find the token)?
        if(hash) {
            urlReturnedToken = new URLSearchParams(hash.substring(1)).get('access_token'); //find the token within the url
        }
        if(urlReturnedToken){
            setToken(urlReturnedToken);
        }
    }, []);

    // Fetch user data and playlists
    useEffect(() => {
        if (token) {
            axios.get('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => setUserData(response.data))
                .catch((error) => console.error('Error fetching user data:', error));

            axios.get('https://api.spotify.com/v1/me/playlists?limit=7', { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => setPlaylists(response.data.items))
                .catch((error) => console.error('Error fetching playlists:', error));
        }
    }, [token]);

    // Load the Spotify Web Playback SDK and initialize the player
    useEffect(() => {
        if (token) {
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            document.body.appendChild(script);

            window.onSpotifyWebPlaybackSDKReady = () => {
                const player = new window.Spotify.Player({
                    name: 'React Web Player',
                    getOAuthToken: (cb: any) => { cb(token); },
                    volume: 0.5
                });

                // Error handling
                player.addListener('initialization_error', ({ message }: any) => { console.error('Initialization error:', message); });
                player.addListener('authentication_error', ({ message }: any) => { console.error('Authentication error:', message); });
                player.addListener('account_error', ({ message }: any) => { console.error('Account error:', message); });
                player.addListener('playback_error', ({ message }: any) => { console.error('Playback error:', message); });

                // Playback status updates
                player.addListener('player_state_changed', (state: any) => {
                    if (!state) return;
                    setCurrentTrack(state.track_window.current_track);
                    setIsPaused(state.paused);
                });

                // Player is ready
                player.addListener('ready', async ({ device_id }: any) => {
                    console.log('Player is ready with Device ID:', device_id);
                    setDeviceId(device_id);
                    setIsPlayerConnected(true); // Mark player as connected

                    // Transfer playback to the Web Player
                    await transferPlaybackToDevice(device_id);
                });

                // Player not ready (disconnected)
                player.addListener('not_ready', ({ device_id }: any) => {
                    console.error('Player has disconnected, Device ID:', device_id);
                    setIsPlayerConnected(false); // Mark player as disconnected
                });

                // Connect the player
                player.connect().then((success: boolean) => {
                    if (success) {
                        console.log('Spotify Player successfully connected.');
                        setPlayer(player); // Save player instance
                    } else {
                        console.error('Failed to connect Spotify Player.');
                    }
                });
            };

            return () => {
                document.body.removeChild(script);
            };
        }
    }, [token]);

    // Transfer playback to the Web Player device
    const transferPlaybackToDevice = async (device_id: string) => {
        if (!token) return;

        try {
            await axios({
                method: 'PUT',
                url: 'https://api.spotify.com/v1/me/player',
                data: {
                    device_ids: [device_id],
                    play: false, // Don't auto-start playback
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log(`Playback transferred to device ${device_id}`);
        } catch (error) {
            console.error('Error transferring playback:', error);
        }
    };

    // Handle play/pause toggle
    const handlePlayPause = async () => {
        if (!player) {
            console.error('Player is not initialized.');
            return;
        }

        if (!isPlayerConnected) {
            console.error('Player is not connected.');
            return;
        }

        const state = await player.getCurrentState();

        if (!state) {
            console.error('Player is not connected to a device.');
            return;
        }

        if (state.paused) {
            await player.resume();
        } else {
            await player.pause();
        }

        setIsPaused(!state.paused);
    };

    const handlePrevious = async () => {
        if (!player) {
            console.error('Player is not initialized.');
            return;
        }

        if (!isPlayerConnected) {
            console.error('Player is not connected.');
            return;
        }

        const state = await player.getCurrentState();

        if (!state) {
            console.error('Player is not connected to a device.');
            return;
        }

        await player.previousTrack();
    };

    const handleNext = async () => {
        if (!player) {
            console.error('Player is not initialized.');
            return;
        }

        if (!isPlayerConnected) {
            console.error('Player is not connected.');
            return;
        }

        const state = await player.getCurrentState();

        if (!state) {
            console.error('Player is not connected to a device.');
            return;
        }

        await player.nextTrack();
    };

    // Fetch playlist tracks when a playlist is selected
    useEffect(() => {
        if (selectedPlaylist && token) {
            axios.get(`https://api.spotify.com/v1/playlists/${selectedPlaylist.id}/tracks`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((response) => setPlaylistTracks(response.data.items))
                .catch((error) => console.error('Error fetching playlist tracks:', error));
        }
    }, [selectedPlaylist, token]);

    // Play the selected playlist
    const handlePlayPlaylist = async () => {
        if (playlistTracks.length > 0 && deviceId && token) {
            const uris = playlistTracks.map((track: any) => track.track.uri);
            try {
                await axios.put(
                    `https://api.spotify.com/v1/me/player/play`,
                    {
                        uris: uris,
                        device_id: deviceId,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                console.log('Playlist started');
            } catch (error) {
                console.error('Error starting playlist:', error);
            }
        } else {
            console.error('No playlist selected or no tracks available.');
        }
    };

    //If the playlist fetched from the API has no image, use a default image (question mark icon)
    const playlistImageUrlHandler = (playlist: any): string => {
        if(playlist.images != null) {
            return playlist.images[0]!.url
        }
        else {
            return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNdkNnSDVHSI8bYmY4EAtVBOeKyQBih6vuUg&s"
        }
    }

    //search box handler function, called on update of search box
    const searchBoxHandler = () => {
        //Makes sure value is not null
        const searchBoxElement = document.getElementById("searchBoxText") as HTMLInputElement | null;
        const currentSearchText = searchBoxElement ? searchBoxElement.value : '';
        console.log(currentSearchText)

        axios.get(`https://api.spotify.com/v1/search?q=${currentSearchText}&type=track&limit=20`, {
            headers: { 
                Authorization: `Bearer ${token}` 
            }
        })
        //Gets response from get request and stores array of tracks in searchedTracks variable
        .then((response) => setSearchedTracks(response.data.tracks.items))
        .catch((error) => console.error('Error fetching searched tracks:', error));
        console.log(searchedTracks)
        //Is then displayed in the Main Content portion of the UI for selecting
    }

    const setSearchedSong = async (track: any) => {
        setCurrentTrack(track);
        const uris = new Array<any>();
        uris[0] = track.uri
        await axios.put(
            `https://api.spotify.com/v1/me/player/play`,
            {
                uris: uris,
                device_id: deviceId,
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
    }

    // If no token, show login button
    if (!token) {
        return (
            <div>
                <h1>Login to Spotify</h1>
                <a href={loginUrl}>Login with Spotify</a>
            </div>
        );
    }

    // If authenticated, render the UI
    return (
        <div className="spotify-layout">
            {/* Top Bar */}
            <div className="top-bar">
                <div className="top-left">
                    <img src="/spotify-logo.png" alt="Spotify Logo" className="spotify-logo" />
                </div>
                <div className="top-center">
                    <button className="home-button">Home</button>
                    <input id="searchBoxText" onChange={() => searchBoxHandler()} type="text" className="search-bar" placeholder="What do you want to play?" />
                </div>
                <div className="top-right">
                    {userData && <p>{userData.display_name}</p>}
                </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar">
                <h2>Your Library</h2>
                {playlists.length > 0 && (
                    <div className="playlists">
                        <h3>Your Playlists</h3>
                        <ul>
                            {playlists.map((playlist) => (
                                <li key={playlist.id} onClick={() => setSelectedPlaylist(playlist)}>
                                    <img width="300" height="300" src={playlistImageUrlHandler(playlist)} alt={playlist.name} className="playlist-image" />
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
                        <img src={currentTrack.album.images[0]?.url} alt="Album Art" width={100} />
                    </div>
                )}
                {searchedTracks.length > 0 && (
                    <div>
                        <h2>Searched Tracks</h2>
                        {searchedTracks.slice(0, 20).map((track: any) => (
                            <div key={track.id} onClick={async () => await setSearchedSong(track)} style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                                <img src={track.album.images[0]?.url} alt="Album Art" width={50} />
                                <p>{track.name} by {track.artists.map((artist: any) => artist.name).join(', ')}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer (Bottom Player Controls) */}
            {currentTrack && (
                <div className="bottom-player">
                    <div className="controls">
                        <button onClick={handlePlayPause}>{isPaused ? 'Play' : 'Pause'}</button>
                        <button onClick={handlePrevious}>Previous</button>
                        <button onClick={handleNext}>Next</button>
                    </div>
                </div>
            )}

            {/* Arduino Serial Data Component */}
            <SerialDataComponent />
        </div>
    );
}

export default App;