const clientId = 'bad35e9a5e774d3584043c601889c7ec'; // Replace with your actual Spotify client ID
const redirectUri = 'http://localhost:5173/callback';
const scopes = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming', // This is crucial for Web Playback SDK
].join('%20');

export const loginUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
    redirectUri
)}&scope=${scopes}`;
