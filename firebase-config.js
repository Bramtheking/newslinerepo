// Firebase configuration - Central config file
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0PL5FkUqtF2C8pqJv3tv0jcLouiC95us",
  authDomain: "aidetectorweb.firebaseapp.com",
  projectId: "aidetectorweb",
  storageBucket: "aidetectorweb.firebasestorage.app",
  messagingSenderId: "240607522462",
  appId: "1:240607522462:web:ea53903530e3d97e61158f",
  measurementId: "G-LP3GPF26QQ"
};

// Initialize Firebase (using compat SDK for browser compatibility)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const analytics = firebase.analytics();

// Make available globally
window.firebaseDb = db;
window.firebaseAnalytics = analytics;