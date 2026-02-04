/**
 * Global Configuration for Path Pilot
 */
window.API_BASE_URL = 'http://localhost:5000/api';

/**
 * Shared API call utility
 */
window.apiCall = async function (endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${window.API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error(`API Call failed [${endpoint}]:`, error);
        throw error;
    }
};
