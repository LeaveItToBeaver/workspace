/**
 * Application constants and configuration values
 */

const constants = {
  // API Response Messages
  MESSAGES: {
    USER_CREATED: "User created successfully",
    USER_UPDATED: "User updated successfully",
    USER_DELETED: "User deleted successfully",
    USER_NOT_FOUND: "User not found",
    INVALID_ZIP_CODE: "Invalid zip code format. Must be 5 digits.",
    LOCATION_REFRESHED: "Location data refreshed successfully",
    NO_USERS_FOUND: "No users found",
    VALIDATION_FAILED: "Validation failed",
    SERVER_ERROR: "An error occurred while processing your request",
  },

  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Validation Rules
  VALIDATION: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    ZIP_CODE_LENGTH: 5,
    ZIP_CODE_PATTERN: /^\d{5}$/,
    NAME_PATTERN: /^[a-zA-Z\s'-]+$/,
  },

  // API Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // ~15 minutes
    MAX_REQUESTS: 100,
    MESSAGE: "Too many requests from this IP, please try again later.",
  },

  // Cache Settings
  CACHE: {
    TTL_SECONDS: 3600, // 1 hour
    MAX_KEYS: 100,
  },

  // Pagination Defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // US States Mapping
  // Since this information doesn't change often, it's fine to hardcode it here
  // However for zip codes, we fetch from the Geocoding API through OpenWeather - https://openweathermap.org/api/geocoding-api
  US_STATES: {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    DC: "District of Columbia",
  },
};

module.exports = constants;
