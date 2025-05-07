// Global configuration file for SAVE-CAM
const SAVE_CAM_CONFIG = {
    // Authentication settings (DO NOT share this file publicly)
    auth: {
        useServerAuth: true, // If true, uses server-side authentication
        // Local fallback authentication (only used if server auth fails or is disabled)
        localUser: 'admin',
        localPass: 'Change_this_password_immediately!'
    },
    
    // Network settings
    network: {
        // Replace with your ESP32-CAM IP or hostname
        // Use window.location.hostname to automatically detect when running on the device
        baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://192.168.1.100' // Development fallback
            : window.location.origin, // Production setting (uses current hostname)
        
        // Endpoints
        endpoints: {
            stream: '/stream',
            login: '/api/login',
            logout: '/api/logout',
            fileList: '/api/list-files',
            fileAccess: '/sd',
            snapshot: '/api/snapshot',
            settings: '/api/settings'
        }
    },
    
    // Camera default settings
    camera: {
        defaultResolution: 'medium', // low, medium, high
        defaultFps: 15,
        defaultImageFormat: 'jpg',
        defaultVideoFormat: 'mp4'
    },
    
    // Storage settings
    storage: {
        sessionTokenName: 'saveCamAuthToken'
    },
    
    // Get the full URL for an endpoint
    getUrl: function(endpoint) {
        return `${this.network.baseUrl}${this.network.endpoints[endpoint]}`;
    },
    
    // Get the stream URL with optional parameters
    getStreamUrl: function(resolution = this.camera.defaultResolution) {
        return `${this.getUrl('stream')}?resolution=${resolution}`;
    }
};

// Export configuration for use in other files
window.SAVE_CAM_CONFIG = SAVE_CAM_CONFIG;