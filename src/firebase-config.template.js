/**
 * Firebase configuration file TEMPLATE
 * IMPORTANT: Copy this file to firebase-config.js and replace with your own values
 * DO NOT commit the actual firebase-config.js file with real API keys to git
 */

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

/**
 * For greater security in a production environment:
 * 1. Consider using Firebase App Check: https://firebase.google.com/docs/app-check
 * 2. Set up proper Firebase Security Rules in firestore.rules
 * 3. Deploy Cloud Functions to handle sensitive operations server-side
 * 4. Use Firebase Authentication to control access
 */

try {
    // Log initialization without exposing API key
    console.log("Initializing Firebase with config:", { 
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        apiKey: "[REDACTED]" 
    });
    
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Initialize Firestore with settings
    const db = firebase.firestore();
    
    // Enable Firestore offline persistence if desired
    // db.enablePersistence().catch(err => {
    //     console.error("Error enabling persistence:", err);
    // });

    // Initialize Auth
    const auth = firebase.auth();

    console.log("Firebase services initialized:", {
        firestore: !!db,
        auth: !!auth
    });

    // Export the initialized services
    window.db = db;
    window.auth = auth;
    window.firebase = firebase;
    
    console.log("Firebase successfully initialized");
} catch (error) {
    console.error("Firebase initialization error:", error);
    // Display visible error on page
    document.addEventListener('DOMContentLoaded', () => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center';
        errorDiv.textContent = `Firebase Error: ${error.message}. Check console for details.`;
        document.body.prepend(errorDiv);
    });
} 