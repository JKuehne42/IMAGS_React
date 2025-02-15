const clientId = '50f7cd52f2f2430d9aa8b5afb016d21c'; // Replace with your actual Spotify client ID
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
