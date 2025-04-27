/**
 * Firebase configuration file
 * This contains the Firebase project settings
 */

// Your web app's Firebase configuration
// IMPORTANT: In production, these values should be stored in environment variables
// or fetched from a secure backend API
const firebaseConfig = {
    apiKey: "AIzaSyBW3i4OtbX1IIEXt_EA8ulvDUtykthe6ak",
    authDomain: "resource-booking-a560b.firebaseapp.com",
    projectId: "resource-booking-a560b",
    storageBucket: "resource-booking-a560b.firebasestorage.app",
    messagingSenderId: "571113864517",
    appId: "1:571113864517:web:e1f6ed4cd97e4495b5122c",
    measurementId: "G-ZFDXFSTW8M"
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