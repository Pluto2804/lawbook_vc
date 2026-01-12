// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Convert HTTP to WebSocket protocol
const WS_URL = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');

export { API_URL, WS_URL };