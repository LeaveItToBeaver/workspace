const axios = require('axios');
const config = require('../config/environment');

class GeolocationService {
    constructor() {
        this.apiKey = config.OPENWEATHER_API_KEY;
        this.baseUrl = config.OPENWEATHER_BASE_URL;
    }

    /**
     * Fetch geolocation data from OpenWeather API
     * @param {string} zipCode - 5-digit US zip code
     * @returns {Object} Location data including latitude, longitude, and timezone
     */
    async fetchLocationData(zipCode) {
        try {
            if (!this.isValidZipCode(zipCode)) {
                throw new Error('Invalid zip code format. Must be 5 digits.');
            }

            // Make API request to Current Weather API with zip code
            const response = await axios.get(this.baseUrl, {
                params: {
                    zip: `${zipCode},US`,
                    appid: this.apiKey,
                    units: 'imperial',
                },
                timeout: 5000,
            });

            // Extract required data according to readme requirements
            const { coord, timezone, name, sys, weather } = response.data;

            return {
                latitude: coord.lat,
                longitude: coord.lon,
                timezone: timezone,
                timezoneOffset: this.formatTimezoneOffset(timezone),
                city: name,
                country: sys && sys.country ? sys.country : null,
                state: this.getStateFromResponse(sys),
                weather: Array.isArray(weather) && weather[0] && weather[0].description ? weather[0].description : null,
            };
        } catch (error) {
            // Handle specific error cases
            if (error.response) {
                switch (error.response.status) {
                    case 404:
                        throw new Error(`Zip code ${zipCode} not found`);
                    case 401:
                        throw new Error('Invalid API key configuration');
                    case 429:
                        throw new Error('API rate limit exceeded. Please try again later.');
                    default:
                        throw new Error(`OpenWeather API error: ${error.response.data.message || 'Unknown error'}`);
                }
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout - OpenWeather API is not responding');
            } else {
                throw new Error(`Failed to fetch location data: ${error.message}`);
            }
        }
    }

    /**
     * Validate US zip code format
     * @param {string} zipCode - Zip code to validate
     * @returns {boolean} True if valid
     */
    isValidZipCode(zipCode) {
        // Check if it's exactly 5 digits
        return /^\d{5}$/.test(zipCode);
    }

    /**
     * Format timezone offset to readable format
     * @param {number} offset - Timezone offset in seconds
     * @returns {string} Formatted timezone (e.g., "UTC-5")
     */
    formatTimezoneOffset(offset) {
        if (!offset && offset !== 0) return 'UTC';

        const hours = Math.floor(Math.abs(offset) / 3600);
        const sign = offset >= 0 ? '+' : '-';
        return `UTC${sign}${hours}`;
    }

    /**
     * Batch fetch location data for multiple zip codes
     * @param {string[]} zipCodes - Array of zip codes
     * @returns {Object[]} Array of location data
     */
    async batchFetchLocationData(zipCodes) {
        const results = await Promise.allSettled(
            zipCodes.map(zip => this.fetchLocationData(zip))
        );

        return results.map((result, index) => ({
            zipCode: zipCodes[index],
            status: result.status,
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason.message : null,
        }));
    }

    /**
     * Extract US state from OpenWeather response if available.
     * Not implemented (tests expect null for now).
     * @param {object} sys
     * @returns {string|null}
     */
    getStateFromResponse(sys) {
        // OpenWeather current weather API typically does not include state; return null.
        return null;
    }
}

module.exports = new GeolocationService();