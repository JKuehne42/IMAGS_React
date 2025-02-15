import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SerialDataComponent from './SerialDataComponent';

const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const SpotifyApp = ({ token }) => {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [isPaused, setIsPaused] = useState(true);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [userData, setUserData] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [playlistTracks, setPlaylistTracks] = useState([]);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedTrack, setSelectedTrack] = useState(null);
    const [searchedTracks, setSearchedTracks] = useState([]);


    // Search box handler function
const searchBoxHandler = () => {
    const searchBoxElement = document.getElementById("searchBoxText");
    const currentSearchText = searchBoxElement ? (searchBoxElement as HTMLInputElement).value : '';
    
    if (currentSearchText.trim() === '') {
        setSearchedTracks([]);
        return;
    }

    axios.get(`https://api.spotify.com/v1/search?q=${currentSearchText}&type=track&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then((response) => setSearchedTracks(response.data.tracks.items))
    .catch((error) => console.error('Error fetching searched tracks:', error));
};

// Play searched song
const playSearchedTrack = async (track) => {
    if (!deviceId) return;
    
    try {
        await axios.put(
            'https://api.spotify.com/v1/me/player',
            { device_ids: [deviceId], play: true },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        await axios.put(
            'https://api.spotify.com/v1/me/player/play',
            { uris: [track.uri] },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        setSelectedTrack(track);
        setDuration(track.duration_ms);
        setProgress(0);
        setSearchedTracks([]); // Clear search results
        const searchBoxElement = document.getElementById("searchBoxText");
        if (searchBoxElement) (searchBoxElement as HTMLInputElement).value = ''; // Clear search box
    } catch (error) {
        console.error('Error playing searched track:', error);
    }
};
    // Fetch user data and playlists
    useEffect(() => {
        if (token) {
            axios.get('https://api.spotify.com/v1/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => setUserData(response.data))
                .catch(error => console.error('Error fetching user data:', error));

            axios.get('https://api.spotify.com/v1/me/playlists?limit=20', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => setPlaylists(response.data.items))
                .catch(error => console.error('Error fetching playlists:', error));
        }
    }, [token]);

    // Fetch playlist tracks when selected
    useEffect(() => {
        if (selectedPlaylist && token) {
            // Reset tracks before fetching new ones
            setPlaylistTracks([]);
            setSelectedTrack(null);

            axios.get(`https://api.spotify.com/v1/playlists/${selectedPlaylist.id}/tracks`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => setPlaylistTracks(response.data.items))
                .catch(error => console.error('Error fetching playlist tracks:', error));
        }
    }, [selectedPlaylist, token]);

    // Initialize Spotify Player
    useEffect(() => {
        if (!token) return;

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'IMAGS: Music and Pain Analysis',
                getOAuthToken: (cb) => { cb(token); },
                volume: 0.5
            });

            player.addListener('ready', ({ device_id }) => {
                console.log('Player ready with Device ID:', device_id);
                setDeviceId(device_id);
            });

            player.addListener('player_state_changed', (state) => {
                if (!state) return;
                setCurrentTrack(state.track_window.current_track);
                setIsPaused(state.paused);
                setProgress(state.position);
                setDuration(state.track_window.current_track.duration_ms);
            });

            player.connect().then(success => {
                if (success) setPlayer(player);
            });
        };

        return () => {
            document.body.removeChild(script);
        };
    }, [token]);

    // Play selected track
    const playTrack = async (track) => {
        if (!deviceId) return;
        
        try {
            await axios.put(
                'https://api.spotify.com/v1/me/player',
                { device_ids: [deviceId], play: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await axios.put(
                'https://api.spotify.com/v1/me/player/play',
                { uris: [track.uri] },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSelectedTrack(track);
            setDuration(track.duration_ms);
            setProgress(0);
        } catch (error) {
            console.error('Error playing track:', error);
        }
    };

    // Navigate to previous or next track in the playlist
    const navigateTrack = (direction) => {
        if (!selectedPlaylist || !selectedTrack || playlistTracks.length === 0) return;

        // Find the current track's index in the playlist
        const currentIndex = playlistTracks.findIndex(item => 
            item.track.id === selectedTrack.id
        );

        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % playlistTracks.length;
        } else {
            newIndex = (currentIndex - 1 + playlistTracks.length) % playlistTracks.length;
        }

        const nextTrack = playlistTracks[newIndex].track;
        playTrack(nextTrack);
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

    // Update progress bar every second
    useEffect(() => {
        if (!isPaused && duration > 0) {
            const interval = setInterval(() => {
                setProgress(prev => (prev + 1000 >= duration ? duration : prev + 1000));
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isPaused, duration]);

    // Seek handler for progress bar
    const handleSeek = async (e) => {
        if (!currentTrack) return;

        try {
            const progressBar = e.currentTarget;
            const rect = progressBar.getBoundingClientRect();
            const clickPosition = e.clientX - rect.left;
            const clickPercentage = (clickPosition / rect.width) * 100;
            const newTime = (clickPercentage / 100) * duration;

            await axios.put(
                'https://api.spotify.com/v1/me/player/seek',
                { position_ms: Math.floor(newTime) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProgress(Math.floor(newTime));
        } catch (error) {
            console.error('Error seeking:', error);
        }
    };

    return (
        <div className="app-container">
                <header className="header-bar">
    <h1 className="header-title">IMAGS: Music and Pain Analysis</h1>
    <div className="search-container" style={{ position: 'relative', width: '300px' }}>
        <input 
            id="searchBoxText" 
            onChange={searchBoxHandler} 
            type="text" 
            className="search-bar" 
            placeholder="Search for songs..." 
            style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '20px',
                border: '1px solid #ccc',
                outline: 'none'
            }}
        />
        {searchedTracks.length > 0 && (
            <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                {searchedTracks.map((track) => (
                    <div 
                        key={track.id} 
                        onClick={() => playSearchedTrack(track)}
                        style={{
                            display: 'flex',
                            padding: '8px',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            gap: '10px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgb(122, 213, 122)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <img 
                            src={track.album.images[0]?.url || "/api/placeholder/40/40"} 
                            alt="Album Art" 
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '4px'
                            }}
                        />
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{track.name}</div>
                            <div style={{ fontSize: '0.9em', color: '#666' }}>
                                {track.artists.map(artist => artist.name).join(', ')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
    <div className="username">{userData?.display_name}</div>
</header>
            

            <div className="main-content">
                {/* Playlists Panel */}
                <div className="panel library-panel">
                    <h2>Your Playlists</h2>
                    <div className="playlist-container">
                        {playlists.map(playlist => (
                            <div 
                                key={playlist.id} 
                                className="playlist-item" 
                                onClick={() => {
                                    setSelectedPlaylist(playlist);
                                    setSelectedTrack(null);
                                }}
                            >
                                <img 
                                    width="300" height="300" src={playlistImageUrlHandler(playlist)}
                                    alt={playlist.name} 
                                    className="playlist-image" 
                                />
                                <span>{playlist.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Now Playing Panel */}
                <div className="panel now-playing-panel">
                    <h2>{selectedPlaylist?.name || "Now Playing"}</h2>

                    {selectedPlaylist && !selectedTrack && (
                        <div className="playlist-tracks-container">
                            {playlistTracks.map(item => (
                                <div 
                                    key={item.track.id} 
                                    className="playlist-track-item" 
                                    onClick={() => playTrack(item.track)}
                                >
                                    <img 
                                        src={item.track.album.images[0]?.url || "/api/placeholder/40/40"} 
                                        alt={item.track.name} 
                                        className="track-image" 
                                    />
                                    <div className="track-details">
                                        <span className="track-title">{item.track.name}</span>
                                        <span className="track-artist">
                                            {item.track.artists.map(artist => artist.name).join(', ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedTrack && (
                        <div className="album-container">
                            <img 
                                src={selectedTrack.album.images[0]?.url || "/api/placeholder/300/300"} 
                                alt={selectedTrack.name} 
                                className="album-art active"
                            />
                            <div className="track-info">
                                <div className="track-name">{selectedTrack.name}</div>
                                <div className="artist-name">
                                    {selectedTrack.artists.map(artist => artist.name).join(', ')}
                                </div>
                                
                                {/* Enhanced Progress Bar */}
                                {currentTrack && (
                                    <div 
                                        className="progress-container"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            width: '100%',
                                            marginTop: '1rem'
                                        }}
                                    >
                                        {/* Time Elapsed */}
                                        <div 
                                            className="time-elapsed" 
                                            style={{ 
                                                color: 'black', 
                                                fontSize: '1rem', 
                                                width: '40px', 
                                                textAlign: 'right' 
                                            }}
                                        >
                                            {formatTime(progress)}
                                        </div>

                                        {/* Progress Bar */}
                                        <div 
                                            className="time-check" 
                                            onClick={handleSeek}
                                            style={{
                                                flex: 1,
                                                height: '6px',
                                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                borderRadius: '3px',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {/* Progress Track */}
                                            <div 
                                                className="progress-track" 
                                                style={{ 
                                                    width: `${(progress / duration) * 100}%`,
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    height: '100%',
                                                    backgroundColor: '#1DB954',
                                                    borderRadius: '3px'
                                                }}
                                            >
                                                {/* Progress Thumb */}
                                                <div 
                                                    className="progress-thumb"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '100%',
                                                        width: '16px',
                                                        height: '16px',
                                                        backgroundColor: '#1DB954',
                                                        borderRadius: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Total Duration */}
                                        <div 
                                            className="time-total" 
                                            style={{ 
                                                color: 'black', 
                                                fontSize: '1rem', 
                                                width: '40px' 
                                            }}
                                        >
                                            {formatTime(duration)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Real-time Panel */}
                <div className="panel real-time-panel">
                    <h2>Real-Time Data</h2>
                    <SerialDataComponent />
                </div>
            </div>

            {/* Playback Controls */}
            <div className="control-bar">
                <button 
                    className="control-button" 
                    onClick={() => navigateTrack('previous')}
                    disabled={!selectedPlaylist || !selectedTrack}
                >
                    ⏮️ Previous
                </button>
                <button className="control-button" onClick={() => player?.togglePlay()}>
                    {isPaused ? '▶️ Play' : '⏸️ Pause'}
                </button>
                <button 
                    className="control-button" 
                    onClick={() => navigateTrack('next')}
                    disabled={!selectedPlaylist || !selectedTrack}
                >
                    ⏭️ Next
                </button>
            </div>
        </div>
    );
};

export default SpotifyApp;