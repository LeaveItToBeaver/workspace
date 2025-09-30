const admin = require('firebase-admin');
const config = require('./environment');

class Database {
    constructor() {
        this.db = null;
        this.usersRef = null;
    }

    async initialize() {
        try {
            const serviceAccount = config.getServiceAccount();

            // Initialize Firebase Admin SDK
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: config.FIREBASE_DATABASE_URL,
            });

            // Get database reference
            this.db = admin.database();
            this.usersRef = this.db.ref('users');

            console.log('Firebase Realtime Database initialized successfully');
            return this.db;
        } catch (error) {
            console.error('Failed to initialize database:', error.message);
            throw error;
        }
    }

    getDatabase() {
        if (!this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    getUsersRef() {
        if (!this.usersRef) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.usersRef;
    }

    // Utility method to generate server timestamp
    getServerTimestamp() {
        return admin.database.ServerValue.TIMESTAMP;
    }
}

// Export singleton instance
module.exports = new Database();