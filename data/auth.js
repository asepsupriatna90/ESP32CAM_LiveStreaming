// Authentication management for SAVE-CAM
const SAVE_CAM_AUTH = {
    isLoggedIn: false,
    authToken: '',
    
    // Initialize authentication on page load
    init: function() {
        this.authToken = localStorage.getItem(SAVE_CAM_CONFIG.storage.sessionTokenName);
        this.isLoggedIn = !!this.authToken;
        
        // Redirect to login if not logged in and not already on login page
        if (!this.isLoggedIn && !window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
            return false;
        }
        
        return this.isLoggedIn;
    },
    
    // Perform login
    login: async function(username, password) {
        try {
            // First try server-side authentication
            if (SAVE_CAM_CONFIG.auth.useServerAuth) {
                const response = await fetch(SAVE_CAM_CONFIG.getUrl('login'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                            });
                        }
                    } catch (error) {
                        console.error('Login failed:', error);
                    }
                }