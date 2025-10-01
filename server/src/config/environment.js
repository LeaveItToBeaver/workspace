require("dotenv").config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Firebase Configuration
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,

  // OpenWeather API Configuration
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  OPENWEATHER_BASE_URL: "https://api.openweathermap.org/data/2.5/weather",

  // Service Account - Handle both file and environment variable
  getServiceAccount: function () {
    if (process.env.SERVICE_ACCOUNT_KEY) {
      try {
        return JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
      } catch (error) {
        console.error("Failed to parse SERVICE_ACCOUNT_KEY from environment");
        throw error;
      }
    }

    try {
      return require("../../serviceAccountKey.json");
    } catch (error) {
      console.error("No service account credentials found");
      throw new Error("Firebase service account credentials not configured");
    }
  },
};

// Validate required configuration
const requiredConfig = ["FIREBASE_DATABASE_URL", "OPENWEATHER_API_KEY"];
const missingConfig = requiredConfig.filter((key) => !config[key]);

if (missingConfig.length > 0) {
  console.error(`Missing required configuration: ${missingConfig.join(", ")}`);
  console.error("Please check your .env file");
  process.exit(1);
}

// Log configuration (without sensitive data)
console.log("Configuration loaded:", {
  PORT: config.PORT,
  NODE_ENV: config.NODE_ENV,
  FIREBASE_URL: config.FIREBASE_DATABASE_URL ? "Configured" : "Missing",
  API_KEY: config.OPENWEATHER_API_KEY ? "Configured" : "Missing",
  SERVICE_ACCOUNT: (() => {
    try {
      config.getServiceAccount();
      return "Configured";
    } catch {
      return "Missing";
    }
  })(),
});

module.exports = config;
